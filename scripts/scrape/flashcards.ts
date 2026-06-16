/**
 * Pobiera TEKST talii fiszek (front/back/hint/tagi) — zapisuje w formacie
 * zgodnym z widokiem nauki i resolverem obrazków (scrape:flashcards-images).
 *
 * Przepływ (per zestaw): entrypoints (nazwa) → POST sesji (token CSRF) → GET sesji (karty).
 * POST tworzy sesję nauki, ale NIE wysyłamy odpowiedzi, więc statystyki SRS są nietknięte.
 *
 * Uruchom (Node 22!):
 *   npm run scrape:flashcards -- 1341                 # po id zestawu
 *   npm run scrape:flashcards -- lesson:4864          # lekcja → jej zestaw(y) fiszek
 *   npm run scrape:flashcards -- --szpilki            # 8 lekcji „Szpilki" (4863–4870)
 * Zapis: scripts/scrape/_data/flashcards-<set>.json (pomija istniejące; --force nadpisuje)
 * Potem dociągnij obrazki: npm run scrape:flashcards-images -- <set>
 */
import { chromium, type Page } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.env.SCRAPE_BASE_URL ?? "https://anatomia.wiecejnizlek.pl";
const STATE = path.join("scripts", "scrape", ".auth", "state.json");
const OUT = path.join("scripts", "scrape", process.env.SCRAPE_DATA_DIR ?? "_data");
const LESSON_INCLUDE = "screens.screenables";
const SZPILKI_LESSONS = [4863, 4864, 4865, 4866, 4867, 4868, 4869, 4870];
const THROTTLE_MS = Number(process.env.SCRAPE_THROTTLE_MS) || 1200;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function apiGet(page: Page, p: string): Promise<{ status: number; json: any }> {
  return page.evaluate(async (u) => {
    try {
      const res = await fetch(u, { headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" }, credentials: "include" });
      const t = await res.text();
      let json: any = null;
      try { json = JSON.parse(t); } catch {}
      return { status: res.status, json };
    } catch {
      return { status: 0, json: null };
    }
  }, BASE_URL + p);
}

async function apiPost(page: Page, p: string, body: any): Promise<{ status: number; json: any }> {
  return page.evaluate(async ({ u, b }) => {
    const xsrf = decodeURIComponent(document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1] ?? "");
    try {
      const res = await fetch(u, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...(xsrf ? { "X-XSRF-TOKEN": xsrf } : {}),
        },
        body: JSON.stringify(b ?? {}),
      });
      const t = await res.text();
      let json: any = null;
      try { json = JSON.parse(t); } catch {}
      return { status: res.status, json };
    } catch {
      return { status: 0, json: null };
    }
  }, { u: BASE_URL + p, b: body });
}

/** setIds z lekcji: screenables o typie flashcards:flashcards_set. */
function setIdsFromLesson(json: any): number[] {
  const ids = new Set<number>();
  (function w(n: any) {
    if (Array.isArray(n)) return n.forEach(w);
    if (n && typeof n === "object") {
      if (n.screenable_type === "flashcards:flashcards_set" && n.screenable_id) ids.add(+n.screenable_id);
      for (const v of Object.values(n)) w(v);
    }
  })(json);
  return [...ids];
}

async function fetchSet(page: Page, setId: number, force: boolean): Promise<boolean> {
  const file = path.join(OUT, `flashcards-${setId}.json`);
  if (!force && existsSync(file)) {
    console.log(`→ zestaw ${setId} … pomijam (już jest; --force aby nadpisać)`);
    return true;
  }
  // 1) metadane (nazwa, liczba)
  const meta = (await apiGet(page, `/papi/v2/flashcards/entrypoints?ids=${setId}&search_type=flashcardsSets`)).json;
  const info = Array.isArray(meta) ? meta[0] : meta;
  const name = info?.public_name ?? `Zestaw ${setId}`;
  // 2) utwórz sesję (CSRF)
  const post = await apiPost(page, `/papi/v2/flashcards_sets/${setId}/session`, {});
  const uuid = post.json?.flashcards_session_uuid ?? post.json?.session_uuid;
  if (!uuid) {
    const hint = post.status === 419 ? "token CSRF — odśwież sesję: npm run scrape:auth" : post.status === 422 ? "endpoint oczekuje innego ciała żądania" : "";
    console.log(`→ zestaw ${setId} „${name}" … BŁĄD sesji HTTP ${post.status} ${hint}`);
    return false;
  }
  // 3) pobierz karty z sesji
  const sess = await apiGet(page, `/papi/v2/flashcards/session/${uuid}?source_id=${setId}&source_type=flashcards-set`);
  const flashcards = sess.json?.flashcards;
  if (!Array.isArray(flashcards)) {
    console.log(`→ zestaw ${setId} „${name}" … BŁĄD sesji-GET HTTP ${sess.status}`);
    return false;
  }
  const deck = {
    set: { id: setId, name, count: flashcards.length },
    cards: flashcards.map((c: any) => ({ id: c.id, front: c.front ?? "", back: c.back ?? "", hint: c.hint ?? "", tags: c.tags ?? [], image: null })),
  };
  await writeFile(file, JSON.stringify(deck, null, 2));
  console.log(`→ zestaw ${setId} „${name}" … OK  ${flashcards.length} fiszek → ${path.relative(process.cwd(), file)}`);
  return true;
}

async function main() {
  const raw = process.argv.slice(2);
  const force = raw.includes("--force");
  const args = raw.filter((a) => a !== "--force");
  if (!args.length) {
    console.error("Użycie: npm run scrape:flashcards -- <setId | lesson:<id> | --szpilki> [...] [--force]");
    process.exit(1);
  }
  if (!existsSync(STATE)) {
    console.error(`Brak sesji (${STATE}). Uruchom: npm run scrape:auth`);
    process.exit(1);
  }
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STATE });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/app`, { waitUntil: "commit", timeout: 60_000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(1000);
  if (page.url().includes("/login")) {
    console.error("✗ Sesja wygasła. Odśwież: npm run scrape:auth");
    await browser.close();
    process.exit(1);
  }

  // Rozwiąż argumenty → zbiór setId
  const lessonIds: number[] = [];
  const setIds = new Set<number>();
  for (const a of args) {
    if (a === "--szpilki") lessonIds.push(...SZPILKI_LESSONS);
    else if (/^lesson[:=]\d+$/i.test(a)) lessonIds.push(+a.split(/[:=]/)[1]);
    else if (/^\d+$/.test(a)) setIds.add(+a);
    else console.error(`✗ Pomijam nierozpoznany argument: ${a}`);
  }
  for (const lid of lessonIds) {
    const { status, json } = await apiGet(page, `/papi/v2/lessons/${lid}?include=${LESSON_INCLUDE}`);
    const ids = status === 200 && json ? setIdsFromLesson(json) : [];
    console.log(`• lekcja ${lid} → zestawy fiszek: ${ids.join(", ") || "(brak)"}`);
    ids.forEach((x) => setIds.add(x));
    await sleep(THROTTLE_MS);
  }

  const all = [...setIds];
  console.log(`\n== Do pobrania: ${all.length} zestaw(ów) fiszek ==`);
  let ok = 0;
  for (const id of all) {
    if (await fetchSet(page, id, force)) ok++;
    await sleep(THROTTLE_MS);
  }

  try { await context.storageState({ path: STATE }); } catch {}
  await browser.close();
  console.log(`\nGotowe: ${ok}/${all.length}. Obrazki dociągnij: npm run scrape:flashcards-images -- <set>`);
}

main().catch((e) => (console.error(e), process.exit(1)));
