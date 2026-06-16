/**
 * Harvester z AUTO-MAPOWANIEM — sam wylicza slideshowId z API, więc nie musisz
 * dłubać w propsach/URL-ach. Pobiera widok ARTYKUŁU (content_blocks_structure).
 *
 * Uruchom (Node 22!):
 *   npm run scrape:harvest -- 1338                  # wprost slideshowId
 *   npm run scrape:harvest -- lesson:1174           # lekcja → wszystkie jej slideshowy
 *   npm run scrape:harvest -- "https://anatomia.wiecejnizlek.pl/app/courses/1/lessons/1174/10499/83"
 *   npm run scrape:harvest -- "...?articleOverlay=1338"   # URL z articleOverlay = wprost slideshow
 *   npm run scrape:harvest -- --course              # CAŁY bieżący kurs (wszystkie lekcje)
 *
 * Reguły rozpoznawania argumentu:
 *   • goła liczba  → slideshowId
 *   • lesson:<id> lub URL z /lessons/<id> (bez articleOverlay) → lekcja
 *   • URL z articleOverlay=<id> lub /slideshows/<id> → slideshow
 *   • --course → bieżący kurs (z course_structure_nodes/current)
 *
 * Sesja: cookie z `npm run scrape:auth` (Sanctum — fetch robimy z wnętrza /app).
 * Zapis: scripts/scrape/_data/slideshow-<id>.json  (pomija istniejące; --force nadpisuje)
 */
import { chromium, type Page } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.env.SCRAPE_BASE_URL ?? "https://anatomia.wiecejnizlek.pl";
const STATE = path.join("scripts", "scrape", ".auth", "state.json");
const OUT = path.join("scripts", "scrape", process.env.SCRAPE_DATA_DIR ?? "_data");
const LESSON_INCLUDE =
  "screens.sections.subsections.slides_count,screens.sections.slides_count,screens.screenables,screens.slideshows.slides_count";
const COURSE_INCLUDE = "groups,lessons.lesson_prerequisites,course,structurable";
const THROTTLE_MS = Number(process.env.SCRAPE_THROTTLE_MS) || 1200;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Task = { kind: "slideshow"; id: number } | { kind: "lesson"; id: number } | { kind: "course" };

function parseArg(arg: string): Task | null {
  const a = arg.trim();
  if (a === "--course" || a === "course") return { kind: "course" };
  let m: RegExpMatchArray | null;
  if ((m = a.match(/articleOverlay=(\d+)/))) return { kind: "slideshow", id: +m[1] };
  if ((m = a.match(/slideshows\/(\d+)/))) return { kind: "slideshow", id: +m[1] };
  if ((m = a.match(/^lesson[:=](\d+)$/i))) return { kind: "lesson", id: +m[1] };
  if ((m = a.match(/lessons\/(\d+)/))) return { kind: "lesson", id: +m[1] };
  if (/^\d+$/.test(a)) return { kind: "slideshow", id: +a };
  return null;
}

/** Authenticated in-page JSON GET (cookie Sanctum). */
async function apiGet(page: Page, pathWithQuery: string): Promise<{ status: number; json: any }> {
  return page.evaluate(async (u) => {
    try {
      const res = await fetch(u, {
        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
        credentials: "include",
      });
      const text = await res.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch {}
      return { status: res.status, json };
    } catch {
      return { status: 0, json: null };
    }
  }, BASE_URL + pathWithQuery);
}

/** Zbiera wszystkie slideshowId z dowolnego kształtu (klucze slideshow/slideshow_id/slideshows). */
function collectSlideshowIds(obj: any): number[] {
  const ids = new Set<number>();
  (function w(n: any) {
    if (Array.isArray(n)) return n.forEach(w);
    if (n && typeof n === "object") {
      for (const [k, v] of Object.entries(n)) {
        if (/^slideshow(_id)?$/i.test(k) && (typeof v === "number" || /^\d+$/.test(String(v)))) ids.add(+(v as any));
        if (/slideshows$/i.test(k)) {
          for (const x of Array.isArray(v) ? v : [v]) {
            if (typeof x === "number" || /^\d+$/.test(String(x))) ids.add(+(x as any));
            else if (x && typeof x === "object" && (x as any).id) ids.add(+(x as any).id);
          }
        }
        w(v);
      }
    }
  })(obj);
  return [...ids];
}

/** Zbiera wszystkie lessonId ze struktury kursu (węzły z .lessons). */
function collectLessonIds(obj: any): number[] {
  const ids = new Set<number>();
  (function w(n: any) {
    if (Array.isArray(n)) return n.forEach(w);
    if (n && typeof n === "object") {
      if (Array.isArray(n.lessons))
        for (const l of n.lessons) {
          if (typeof l === "number" || /^\d+$/.test(String(l))) ids.add(+l);
          else if (l && (l as any).id) ids.add(+(l as any).id);
        }
      for (const v of Object.values(n)) w(v);
    }
  })(obj);
  return [...ids];
}

/** Wyłuskuje czytelną nazwę lekcji z różnych możliwych kształtów odpowiedzi. */
function pickLessonName(json: any, id: number): string {
  const cand =
    json?.name ?? json?.title ??
    json?.data?.name ?? json?.data?.title ??
    json?.data?.attributes?.name ?? json?.data?.attributes?.title ??
    json?.lesson?.name ?? json?.lesson?.title;
  return typeof cand === "string" && cand.trim() ? cand.trim() : `Lekcja ${id}`;
}

async function lessonSlideshows(page: Page, lessonId: number): Promise<{ name: string; ids: number[] }> {
  const { status, json } = await apiGet(page, `/papi/v2/lessons/${lessonId}?include=${LESSON_INCLUDE}`);
  if (status !== 200 || !json) {
    console.log(`   ✗ lekcja ${lessonId}: HTTP ${status}`);
    return { name: `Lekcja ${lessonId}`, ids: [] };
  }
  return { name: pickLessonName(json, lessonId), ids: collectSlideshowIds(json) };
}

type ManifestLesson = { id: number; name: string; slideshowIds: number[]; course?: string; region?: string };

/** Struktura kursu (group-aware): nazwa kursu + lekcje z przypisanym regionem (grupą). */
async function courseTree(page: Page): Promise<{ courseName: string; lessons: { id: number; region: string }[] } | null> {
  const { status, json } = await apiGet(page, `/papi/v2/course_structure_nodes/current?include=${COURSE_INCLUDE}`);
  if (status !== 200 || !json) {
    console.log(`  ✗ nie udało się pobrać struktury kursu (HTTP ${status})`);
    return null;
  }
  const courseName = (Object.values(json.included?.courses ?? {})[0] as any)?.name?.trim() ?? "";
  const groupNames: Record<string, string> = {};
  for (const [id, g] of Object.entries(json.included?.groups ?? {})) groupNames[id] = (g as any)?.name ?? "";
  const nodes = Object.entries(json).filter(([k]) => k !== "included").map(([, v]) => v as any);
  const childrenOf = new Map<number, any[]>();
  for (const n of nodes)
    if (n?.parent_id != null) (childrenOf.get(n.parent_id) ?? childrenOf.set(n.parent_id, []).get(n.parent_id)!).push(n);

  const lessons: { id: number; region: string }[] = [];
  const walk = (node: any, region: string) => {
    const isGroup = node?.structurable_type?.endsWith("Group");
    const here = isGroup ? groupNames[String(node.structurable_id)] || region : region;
    if (node?.structurable_type?.endsWith("Lesson"))
      for (const lid of node.lessons ?? []) lessons.push({ id: +lid, region });
    for (const ch of childrenOf.get(node.id) ?? []) walk(ch, here);
  };
  for (const n of nodes) if (n?.parent_id == null) walk(n, "");
  return { courseName, lessons };
}

/** Dokłada/aktualizuje wpisy lekcji w _data/_manifest.json (po id), zachowując resztę. */
async function mergeManifest(entries: ManifestLesson[]) {
  if (!entries.length) return;
  const file = path.join(OUT, "_manifest.json");
  let lessons: ManifestLesson[] = [];
  if (existsSync(file)) {
    try { lessons = JSON.parse(await (await import("node:fs/promises")).readFile(file, "utf8")).lessons ?? []; } catch {}
  }
  const byId = new Map(lessons.map((l) => [l.id, l]));
  for (const e of entries) byId.set(e.id, e);
  await writeFile(file, JSON.stringify({ lessons: [...byId.values()].sort((a, b) => a.id - b.id) }, null, 2));
  console.log(`• zapisano mapę lekcji → ${path.relative(process.cwd(), file)} (${byId.size} lekcji)`);
}

async function fetchArticle(page: Page, id: number, force: boolean): Promise<boolean> {
  const file = path.join(OUT, `slideshow-${id}.json`);
  if (!force && existsSync(file)) {
    console.log(`→ slideshow ${id} … pomijam (już jest; --force aby nadpisać)`);
    return true;
  }
  const { status, json } = await apiGet(page, `/papi/v2/content_blocks_structure/slideshows/${id}`);
  if (status !== 200 || !json) {
    console.log(`→ slideshow ${id} … BŁĄD HTTP ${status}${status === 404 ? " (brak widoku artykułu?)" : ""}`);
    return false;
  }
  await writeFile(file, JSON.stringify(json, null, 2));
  const cbs: any[] = Array.isArray(json.content_blocks_structure) ? json.content_blocks_structure : [];
  const mc = json.media_containers?.length ?? 0;
  const variants = (JSON.stringify(json.media_containers ?? []).match(/file_without_markings/g) ?? []).length;
  console.log(`→ slideshow ${id} … OK  [${json.content_blocks_structure_name ?? "?"}] sekcje:${cbs.length} ryciny:${mc} (${variants} slajdo-wariantów)`);
  return true;
}

async function main() {
  const raw = process.argv.slice(2);
  const force = raw.includes("--force");
  const args = raw.filter((a) => a !== "--force");
  if (!args.length) {
    console.error("Użycie: npm run scrape:harvest -- <slideshowId | lesson:<id> | URL | --course> [...] [--force]");
    process.exit(1);
  }
  if (!existsSync(STATE)) {
    console.error(`Brak sesji (${STATE}). Uruchom: npm run scrape:auth`);
    process.exit(1);
  }
  const tasks = args.map(parseArg);
  if (tasks.some((t) => t === null)) console.error(`✗ Pominę nierozpoznane argumenty.`);

  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STATE });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/app`, { waitUntil: "commit", timeout: 60_000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(1000);
  if (page.url().includes("/login")) {
    console.error("✗ Sesja wygasła (przekierowano na /login). Odśwież: npm run scrape:auth");
    await browser.close();
    process.exit(1);
  }

  // 1) Rozwiąż zadania do zbioru slideshowId (równolegle budując mapę lekcja→slideshow)
  const slideshowIds = new Set<number>();
  const manifest: ManifestLesson[] = [];
  for (const t of tasks) {
    if (!t) continue;
    if (t.kind === "slideshow") slideshowIds.add(t.id);
    else if (t.kind === "lesson") {
      const { name, ids } = await lessonSlideshows(page, t.id);
      console.log(`• lekcja ${t.id} (${name}) → slideshowy: ${ids.join(", ") || "(brak)"}`);
      ids.forEach((x) => slideshowIds.add(x));
      if (ids.length) manifest.push({ id: t.id, name, slideshowIds: ids });
      await sleep(THROTTLE_MS);
    } else if (t.kind === "course") {
      console.log("• bieżący kurs → pobieram strukturę…");
      const tree = await courseTree(page);
      if (!tree) continue;
      console.log(`  kurs "${tree.courseName}" → lekcji: ${tree.lessons.length}. Mapuję na slideshowy…`);
      let i = 0;
      for (const { id: lid, region } of tree.lessons) {
        i++;
        const { name, ids } = await lessonSlideshows(page, lid);
        if (ids.length) console.log(`  [${i}/${tree.lessons.length}] [${region}] ${name} → ${ids.join(", ")}`);
        ids.forEach((x) => slideshowIds.add(x));
        if (ids.length) manifest.push({ id: lid, name, slideshowIds: ids, course: tree.courseName, region });
        await sleep(THROTTLE_MS);
      }
    }
  }
  await mergeManifest(manifest);

  const all = [...slideshowIds];
  console.log(`\n== Do pobrania: ${all.length} slideshowów ==`);

  // 2) Pobierz artykuły
  let ok = 0;
  for (const id of all) {
    if (await fetchArticle(page, id, force)) ok++;
    await sleep(THROTTLE_MS);
  }

  try { await context.storageState({ path: STATE }); } catch {}
  await browser.close();
  console.log(`\nGotowe: pobrano/zachowano ${ok}/${all.length} artykułów → ${OUT}/`);
}

main().catch((e) => (console.error(e), process.exit(1)));
