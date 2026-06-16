/**
 * Render atlasu → PDF. Czyta _data[-kurs]/atlas.json i robi 1 PDF na KATEGORIę
 * (siatka zdjęć obok siebie z podpisami). Obrazki wbudowane (limit 8 s/szt.).
 *
 * Uruchom (Node 22!):
 *   SCRAPE_DATA_DIR=_data npm run scrape:atlas-pdf -- --out=anatomia
 * Wynik: scripts/scrape/_pdf/<out>/atlas-<kategoria>.pdf
 */
import { chromium, type Page } from "playwright";
import { mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { atlasCategoryToHtml, type AtlasItem } from "../../lib/wnl/render-atlas-html";

const DATA = path.join("scripts", "scrape", process.env.SCRAPE_DATA_DIR ?? "_data");
let OUT = path.join("scripts", "scrape", "_pdf");

function slug(s: string): string {
  return (
    (s || "kategoria").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "kategoria"
  );
}

const FOOTER = `<div style="width:100%;font-size:8px;color:#999;text-align:center;font-family:sans-serif;padding:0 16mm;">
  <span class="title"></span> &nbsp;·&nbsp; <span class="pageNumber"></span>/<span class="totalPages"></span></div>`;

async function renderPdf(page: Page, file: string, html: string) {
  await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page
    .evaluate(async () => {
      await Promise.all(
        Array.from(document.images).map(
          (i) =>
            i.complete ||
            new Promise<void>((res) => {
              const d = () => res();
              i.addEventListener("load", d, { once: true });
              i.addEventListener("error", d, { once: true });
              setTimeout(d, 20000);
            }),
        ),
      );
    })
    .catch(() => {});
  await page.waitForTimeout(200);
  await page.pdf({
    path: file,
    format: "A4",
    printBackground: true,
    margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" },
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: FOOTER,
  });
}

async function main() {
  const raw = process.argv.slice(2);
  const force = raw.includes("--force");
  const outSub = raw.find((a) => a.startsWith("--out="))?.slice("--out=".length);
  if (outSub) OUT = path.join("scripts", "scrape", "_pdf", outSub);

  const atlasFile = path.join(DATA, "atlas.json");
  if (!existsSync(atlasFile)) {
    console.error(`Brak ${atlasFile}. Najpierw: npm run scrape:atlas`);
    process.exit(1);
  }
  const atlas = JSON.parse(await readFile(atlasFile, "utf8")) as { categories?: string[]; items: AtlasItem[] };
  const byCat = new Map<string, AtlasItem[]>();
  for (const it of atlas.items ?? []) {
    const c = it.category ?? "Atlas";
    (byCat.get(c) ?? byCat.set(c, []).get(c)!).push(it);
  }
  const cats = atlas.categories?.length ? atlas.categories : [...byCat.keys()];
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page: Page = await browser.newContext({ viewport: { width: 1240, height: 1754 } }).then((c) => c.newPage());

  let ok = 0;
  for (const cat of cats) {
    const items = byCat.get(cat) ?? [];
    if (!items.length) continue;
    const outPath = path.join(OUT, `atlas-${slug(cat)}.pdf`);
    if (!force && existsSync(outPath)) {
      console.log(`→ ${path.basename(outPath)} … pomijam (już jest; --force)`);
      ok++;
      continue;
    }
    await renderPdf(page, outPath, atlasCategoryToHtml(cat, items, { subtitle: outSub }));
    console.log(`✓ ${path.basename(outPath)}  (${items.length} rycin)`);
    ok++;
  }

  await browser.close();
  console.log(`\nGotowe: ${ok}/${cats.length} PDF-ów atlasu → ${OUT}/`);
}

main().catch((e) => (console.error(e), process.exit(1)));
