/**
 * Krok D — render do PDF. Czyta pobrane JSON-y (scripts/scrape/_data/slideshow-*.json),
 * buduje artykuł (lib/wnl/build-article) → HTML (lib/wnl/render-html) → drukuje
 * przez Playwright `page.pdf()`. Obrazki dociągają się przed wydrukiem, więc są
 * WBUDOWANE w PDF (offline). NIE drukujemy SPA kursu, więc nie ma problemu z
 * ucinaniem przez wewnętrzny scroll — treść płynie i sama dzieli się na strony A4.
 *
 * Uruchom (Node 22!):
 *   npm run scrape:pdf                 # wszystko z _data; grupuje po lekcjach jeśli jest _manifest.json
 *   npm run scrape:pdf -- 1338 1340    # tylko wskazane slideshowy
 *   npm run scrape:pdf -- --per-slideshow   # po jednym PDF na slideshow (ignoruj manifest)
 *   npm run scrape:pdf -- --force      # nadpisz istniejące PDF-y
 *   npm run scrape:pdf -- --out=anatomia --lessons=1198,1199   # do podfolderu, wybrane lekcje
 *   npm run scrape:pdf -- --out=anatomia --course=Anatomii     # cały kurs (filtr po nazwie z manifestu)
 *   npm run scrape:pdf -- --en-appendix   # + aneks z rycinami EN na końcu (anatomia; histologia nie ma EN)
 *
 * Obrazki: pobierane w node (z retry) i wbudowywane jako data-URI — page.pdf NIE
 * zależy od sieci ani cold-genu gumleta, a identyczne ryciny są deduplikowane.
 * Wynik: scripts/scrape/_pdf/[<podfolder>/]<nazwa>.pdf
 */
import { chromium, type Page } from "playwright";
import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { buildArticle, type Article } from "../../lib/wnl/build-article";
import { articleToHtml } from "../../lib/wnl/render-html";

const DATA = path.join("scripts", "scrape", process.env.SCRAPE_DATA_DIR ?? "_data");
let OUT = path.join("scripts", "scrape", "_pdf"); // może zostać podmienione przez --out=
let EN_APPENDIX = false; // --en-appendix → aneks z rycinami EN na końcu
let IMG_WIDTH: number | undefined; // --img-width=<px> → mniejsze ryciny (domyślnie 1000)
const MANIFEST = path.join(DATA, "_manifest.json");

type Manifest = {
  lessons: {
    id: number;
    name: string;
    slideshowIds: number[];
    course?: string;
    region?: string;
  }[];
};
type Group = { name: string; file: string; slideshowIds: number[] };

function slug(s: string): string {
  return (s || "bez-nazwy")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // diakrytyki
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "bez-nazwy";
}

async function dataFileExists(id: number): Promise<boolean> {
  return existsSync(path.join(DATA, `slideshow-${id}.json`));
}

async function loadSlideshow(id: number): Promise<any | null> {
  try {
    return JSON.parse(await readFile(path.join(DATA, `slideshow-${id}.json`), "utf8"));
  } catch {
    return null;
  }
}

/** Wszystkie slideshowId, które mamy zapisane lokalnie. */
async function localSlideshowIds(): Promise<number[]> {
  const files = await readdir(DATA).catch(() => [] as string[]);
  return files
    .map((f) => f.match(/^slideshow-(\d+)\.json$/)?.[1])
    .filter((x): x is string => !!x)
    .map(Number);
}

async function loadManifest(): Promise<Manifest | null> {
  if (!existsSync(MANIFEST)) return null;
  try {
    return JSON.parse(await readFile(MANIFEST, "utf8"));
  } catch {
    return null;
  }
}

/** Buduje listę grup (= przyszłych PDF-ów) z wybranych slideshowId.
 *  lessonFilter (opcjonalny) ogranicza do lekcji o danych id z manifestu. */
async function planGroups(targetIds: number[], perSlideshow: boolean, lessonFilter?: Set<number>): Promise<Group[]> {
  const target = new Set(targetIds);
  const groups: Group[] = [];
  const claimed = new Set<number>();

  const manifest = perSlideshow ? null : await loadManifest();
  if (manifest) {
    for (const lesson of manifest.lessons) {
      if (lessonFilter && !lessonFilter.has(lesson.id)) continue;
      const ids = lesson.slideshowIds.filter((id) => target.has(id));
      // tylko te, dla których faktycznie mamy plik JSON
      const have: number[] = [];
      for (const id of ids) if (await dataFileExists(id)) have.push(id);
      if (!have.length) continue;
      have.forEach((id) => claimed.add(id));
      groups.push({ name: lesson.name, file: `${lesson.id}-${slug(lesson.name)}.pdf`, slideshowIds: have });
    }
  }

  // slideshowy spoza manifestu (albo tryb --per-slideshow) → po jednym PDF
  for (const id of targetIds) {
    if (claimed.has(id)) continue;
    if (!(await dataFileExists(id))) continue;
    const j = await loadSlideshow(id);
    const title = j?.content_blocks_structure_name ?? `Slideshow ${id}`;
    groups.push({ name: title, file: `slideshow-${id}-${slug(title)}.pdf`, slideshowIds: [id] });
  }
  return groups;
}

const FOOTER = `<div style="width:100%;font-size:8px;color:#999;text-align:center;font-family:sans-serif;padding:0 16mm;">
  <span class="title"></span> &nbsp;·&nbsp; <span class="pageNumber"></span>/<span class="totalPages"></span>
</div>`;

/** Pobiera obrazek i zwraca data-URI (z retry + timeout — gumlet „na zimno"
 *  bywa wolny/zawodny; bez timeoutu jedno zawieszone żądanie blokowałoby worker). */
async function fetchAsDataUri(url: string, tries = 5): Promise<string | null> {
  for (let t = 0; t < tries; t++) {
    try {
      // Accept bez webp/avif → gumlet (format=auto) serwuje JPEG, pewny do osadzenia w PDF.
      const r = await fetch(url, {
        headers: { Accept: "image/jpeg,image/png;q=0.9,*/*;q=0.8" },
        signal: AbortSignal.timeout(25_000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      if (!buf.length) throw new Error("pusty");
      const ct = r.headers.get("content-type") || "image/jpeg";
      return `data:${ct};base64,${buf.toString("base64")}`;
    } catch {
      await new Promise((res) => setTimeout(res, 1500 * (t + 1)));
    }
  }
  return null;
}

/** Zamienia wszystkie <img src="…gumlet…"> na data-URI — page.pdf nie zależy wtedy od sieci. */
async function embedImages(html: string): Promise<{ html: string; total: number; failed: number }> {
  const urls = [...new Set([...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map((m) => m[1]))];
  const map = new Map<string, string>();
  let idx = 0;
  let failed = 0;
  const worker = async () => {
    while (idx < urls.length) {
      const u = urls[idx++];
      const d = await fetchAsDataUri(u);
      if (d) map.set(u, d);
      else failed++;
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  const out = html.replace(
    /(<img\b[^>]*\bsrc=")([^"]+)(")/g,
    (m, a, u, b) => (map.has(u) ? a + map.get(u) + b : m),
  );
  return { html: out, total: urls.length, failed };
}

async function renderGroup(page: Page, g: Group, force: boolean): Promise<boolean> {
  const outPath = path.join(OUT, g.file);
  if (!force && existsSync(outPath)) {
    console.log(`→ ${g.file} … pomijam (już jest; --force aby nadpisać)`);
    return true;
  }

  const articles: Article[] = [];
  for (const id of g.slideshowIds) {
    const j = await loadSlideshow(id);
    if (j) articles.push(buildArticle(j));
  }
  if (!articles.length) {
    console.log(`→ ${g.file} … brak danych, pomijam`);
    return false;
  }

  const html = articleToHtml(articles, {
    title: g.name,
    enAppendix: EN_APPENDIX,
    imgWidth: IMG_WIDTH,
  });
  // Pewna metoda: pobieramy obrazki w node (z retry) i wbudowujemy jako data-URI.
  // Dzięki temu page.pdf NIE zależy od sieci ani od cold-genu gumleta — zero zgubionych rycin.
  const { html: embedded, total, failed } = await embedImages(html);
  await page.setContent(embedded, { waitUntil: "load", timeout: 60_000 }).catch(() => {});

  // Poczekaj aż obrazki się załadują i (krótko) zdekodują — inaczej page.pdf()
  // łapie je „w połowie". KAŻDE oczekiwanie ma twardy limit, by pojedyncza
  // wadliwa rycina nie zawiesiła całego biegu (zdarzyło się: decode bez limitu).
  await page
    .waitForFunction(() => Array.from(document.images).every((i) => i.complete), {
      timeout: 20_000,
    })
    .catch(() => {});
  await page
    .evaluate(async () => {
      const imgs = Array.from(document.images);
      const decodeAll = Promise.allSettled(
        imgs.map((i) => (i.decode ? i.decode() : Promise.resolve()))
      );
      const cap = new Promise((res) => setTimeout(res, 8000));
      await Promise.race([decodeAll, cap]); // dekodowanie max 8s
    })
    .catch(() => {});
  await page.waitForTimeout(200); // bufor na ostateczny layout przed drukiem

  const broken = failed;
  await Promise.race([
    page.pdf({
      path: outPath,
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: FOOTER,
    }),
    new Promise((_, rej) => setTimeout(() => rej(new Error("page.pdf przekroczył 90s")), 90_000)),
  ]);

  console.log(`✓ ${g.file}  (${articles.length} art., ${total} rycin${broken ? `, ⚠ ${broken} nie pobrano` : ""})`);
  return true;
}

async function main() {
  const raw = process.argv.slice(2);
  const force = raw.includes("--force");
  const perSlideshow = raw.includes("--per-slideshow");
  EN_APPENDIX = raw.includes("--en-appendix");
  const widthArg = raw.find((a) => a.startsWith("--img-width="))?.slice("--img-width=".length);
  if (widthArg && Number.isFinite(Number(widthArg))) IMG_WIDTH = Number(widthArg);
  const idArgs = raw.filter((a) => !a.startsWith("--")).map(Number).filter((n) => Number.isFinite(n));

  // --out=<podfolder> → PDF-y do _pdf/<podfolder>/ (oddziela kursy/regiony)
  const outSub = raw.find((a) => a.startsWith("--out="))?.slice("--out=".length);
  if (outSub) OUT = path.join("scripts", "scrape", "_pdf", outSub);
  // --lessons=<id,id,...> → tylko te lekcje;  --course=<fragment> → cały kurs (po nazwie z manifestu)
  const lessonsArg = raw.find((a) => a.startsWith("--lessons="))?.slice("--lessons=".length);
  const courseArg = raw.find((a) => a.startsWith("--course="))?.slice("--course=".length);

  const manifest = perSlideshow ? null : await loadManifest();
  let lessonFilter: Set<number> | undefined;
  if (lessonsArg) {
    lessonFilter = new Set(lessonsArg.split(/[,\s]+/).map(Number).filter((n) => Number.isFinite(n)));
  } else if (courseArg && manifest) {
    const q = courseArg.toLowerCase();
    lessonFilter = new Set(
      manifest.lessons.filter((l) => (l.course ?? "").toLowerCase().includes(q)).map((l) => l.id),
    );
  }

  // Bez podanych ID: jeśli jest manifest (_data wspólne dla wielu kursów),
  // renderuj TYLKO lekcje z filtra/manifestu, a nie wszystko co leży w _data.
  // Wprost podane ID zawsze mają pierwszeństwo.
  let targetIds: number[];
  if (idArgs.length) targetIds = idArgs;
  else if (lessonFilter && manifest)
    targetIds = [...new Set(manifest.lessons.filter((l) => lessonFilter.has(l.id)).flatMap((l) => l.slideshowIds))];
  else if (manifest) targetIds = [...new Set(manifest.lessons.flatMap((l) => l.slideshowIds))];
  else targetIds = await localSlideshowIds();

  if (!targetIds.length) {
    console.error(`Brak danych w ${DATA}/ (slideshow-*.json). Najpierw: npm run scrape:harvest -- --course`);
    process.exit(1);
  }

  await mkdir(OUT, { recursive: true });
  const groups = await planGroups(targetIds, perSlideshow, lessonFilter);
  if (!groups.length) {
    console.error("Nie udało się zaplanować żadnego PDF (brak pasujących plików JSON).");
    process.exit(1);
  }
  console.log(`== Do wyrenderowania: ${groups.length} PDF-ów (${targetIds.length} slideshowów) ==\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext({ viewport: { width: 1240, height: 1754 } }).then((c) => c.newPage());

  let ok = 0;
  for (const g of groups) {
    try {
      if (await renderGroup(page, g, force)) ok++;
    } catch (e) {
      console.log(`✗ ${g.file} … błąd: ${(e as Error).message}`);
    }
  }

  await browser.close();
  console.log(`\nGotowe: ${ok}/${groups.length} PDF-ów → ${OUT}/`);
}

main().catch((e) => (console.error(e), process.exit(1)));
