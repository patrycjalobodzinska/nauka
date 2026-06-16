/**
 * Pobieracz po ID — ściąga PEŁNY JSON lekcji (jeden endpoint = cała treść +
 * wszystkie warianty zdjęć: slajdy × języki pl/la/en × wersja bez podpisów).
 *
 * Uruchom (Node 22!):
 *   npm run scrape:fetch -- 1338
 *   npm run scrape:fetch -- 1338 1340 1342
 *   npm run scrape:fetch -- "https://anatomia.wiecejnizlek.pl/app/courses/1/lessons/1174/10499/83?articleOverlay=1338"
 *
 * Autoryzacja: cookie z sesji zapisanej przez `npm run scrape:auth`. API używa
 * Laravel Sanctum (uwierzytelnianie po cookie tylko dla żądań z domeny apki),
 * więc fetch wykonujemy Z WNĘTRZA zalogowanej strony /app — wtedy przeglądarka
 * dokłada cookie + Origin/Referer dokładnie tak jak prawdziwy SPA.
 * Zapisuje do scripts/scrape/_data/slideshow-<id>.json
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.env.SCRAPE_BASE_URL ?? "https://anatomia.wiecejnizlek.pl";
const STATE = path.join("scripts", "scrape", ".auth", "state.json");
const OUT = path.join("scripts", "scrape", process.env.SCRAPE_DATA_DIR ?? "_data");

/** Akceptuje czyste ID (liczba) albo URL lekcji z ?articleOverlay= / /slideshows/<id>. */
function parseId(arg: string): string | null {
  if (/^\d+$/.test(arg.trim())) return arg.trim();
  const m = arg.match(/articleOverlay=(\d+)/) ?? arg.match(/slideshows\/(\d+)/);
  return m?.[1] ?? null;
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error("Użycie: npm run scrape:fetch -- <slideshowId | URL-lekcji> [...]");
    process.exit(1);
  }
  if (!existsSync(STATE)) {
    console.error(`Brak zapisanej sesji (${STATE}). Uruchom najpierw: npm run scrape:auth`);
    process.exit(1);
  }
  const ids = [...new Set(args.map(parseId))];
  if (ids.includes(null)) console.error(`✗ Pominę argumenty bez rozpoznanego ID.`);
  const valid = ids.filter((x): x is string => !!x);
  if (!valid.length) process.exit(1);

  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STATE });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/app`, { waitUntil: "commit", timeout: 60_000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(1000);
  if (page.url().includes("/login")) {
    console.error("✗ Sesja wygasła (przekierowano na /login). Odśwież ją: npm run scrape:auth");
    await browser.close();
    process.exit(1);
  }

  let ok = 0;
  for (const id of valid) {
    process.stdout.write(`→ slideshow ${id} … `);
    const url = `${BASE_URL}/papi/v2/content_blocks_structure/slideshows/${id}`;
    const r = await page.evaluate(async (u) => {
      try {
        const res = await fetch(u, {
          headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
          credentials: "include",
        });
        return { status: res.status, ok: res.ok, body: res.ok ? await res.text() : "" };
      } catch (e) {
        return { status: 0, ok: false, body: "", err: String(e) };
      }
    }, url);

    if (!r.ok) {
      const hint = r.status === 401 || r.status === 419 ? "sesja wygasła → npm run scrape:auth" : "sprawdź ID";
      console.log(`BŁĄD HTTP ${r.status} (${hint})`);
      continue;
    }
    let json: any;
    try {
      json = JSON.parse(r.body);
    } catch {
      console.log("odpowiedź to nie JSON — odśwież sesję: npm run scrape:auth");
      continue;
    }

    const file = path.join(OUT, `slideshow-${id}.json`);
    await writeFile(file, JSON.stringify(json, null, 2));

    const cbs: any[] = Array.isArray(json.content_blocks_structure) ? json.content_blocks_structure : [];
    let blocks = 0;
    (function w(ns: any[]) {
      for (const n of ns) {
        blocks += n.contentBlocks?.length ?? 0;
        if (n.children?.length) w(n.children);
      }
    })(cbs);
    const mc = json.media_containers?.length ?? 0;
    const variants = (JSON.stringify(json.media_containers ?? []).match(/file_without_markings/g) ?? []).length;
    console.log(
      `OK → ${path.relative(process.cwd(), file)}  ` +
        `[${json.content_blocks_structure_name ?? "?"}] sekcje:${cbs.length} bloki:${blocks} ryciny:${mc} (${variants} slajdo-wariantów)`
    );
    ok++;
  }

  // odśwież sesję na dysku (cookie mogło zostać odnowione)
  try { await context.storageState({ path: STATE }); } catch {}
  await browser.close();
  console.log(`\nGotowe: ${ok}/${valid.length}.`);
}

main().catch((e) => (console.error(e), process.exit(1)));
