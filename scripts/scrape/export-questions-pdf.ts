/**
 * Render bazy pytań → PDF. Czyta _data[-kurs]/questions-*.json (każdy plik = jedna
 * KATEGORIA, tak jak była pobierana) i robi 1 PDF na kategorię. Poprawna odpowiedź
 * ma dyskretną fajkę przy prawej krawędzi (zob. render-questions-html.ts).
 *
 * Uruchom (Node 22!):
 *   SCRAPE_DATA_DIR=_data-zachowawcza npm run scrape:questions-pdf -- --out=zachowawcza
 *   npm run scrape:questions-pdf -- 29                 # tylko grupa 29
 * Wynik: scripts/scrape/_pdf/<out>/pytania-<kategoria>.pdf
 */
import { chromium, type Page } from "playwright";
import { mkdir, readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { questionsToHtml } from "../../lib/wnl/render-questions-html";

const DATA = path.join("scripts", "scrape", process.env.SCRAPE_DATA_DIR ?? "_data");
let OUT = path.join("scripts", "scrape", "_pdf");

function slug(s: string): string {
  return (
    (s || "kategoria")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/ł/g, "l")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "kategoria"
  );
}

const FOOTER = `<div style="width:100%;font-size:8px;color:#999;text-align:center;font-family:sans-serif;padding:0 16mm;">
  <span class="title"></span> &nbsp;·&nbsp; <span class="pageNumber"></span>/<span class="totalPages"></span>
</div>`;

async function main() {
  const raw = process.argv.slice(2);
  const force = raw.includes("--force");
  const onlyIds = new Set(raw.filter((a) => /^\d+$/.test(a)).map(Number));
  const outSub = raw.find((a) => a.startsWith("--out="))?.slice("--out=".length);
  if (outSub) OUT = path.join("scripts", "scrape", "_pdf", outSub);

  if (!existsSync(DATA)) {
    console.error(`Brak ${DATA}/. Najpierw pobierz pytania: npm run scrape:questions`);
    process.exit(1);
  }
  const files = (await readdir(DATA)).filter((f) => /^questions-\d+\.json$/.test(f));
  const picked = onlyIds.size ? files.filter((f) => onlyIds.has(Number(f.match(/\d+/)![0]))) : files;
  if (!picked.length) {
    console.error(`Brak plików questions-*.json w ${DATA}/.`);
    process.exit(1);
  }
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page: Page = await browser.newContext({ viewport: { width: 1240, height: 1754 } }).then((c) => c.newPage());

  let ok = 0;
  for (const f of picked) {
    const { group, questions } = JSON.parse(await readFile(path.join(DATA, f), "utf8"));
    if (!questions?.length) {
      console.log(`→ ${f} … brak pytań, pomijam`);
      continue;
    }
    const outPath = path.join(OUT, `pytania-${slug(group?.name ?? f)}.pdf`);
    if (!force && existsSync(outPath)) {
      console.log(`→ ${path.basename(outPath)} … pomijam (już jest; --force)`);
      ok++;
      continue;
    }
    const html = questionsToHtml(group ?? { id: 0, name: f }, questions, { subtitle: outSub });
    await page.setContent(html, { waitUntil: "load", timeout: 60_000 });
    await page.pdf({
      path: outPath,
      format: "A4",
      printBackground: true,
      margin: { top: "14mm", bottom: "14mm", left: "14mm", right: "12mm" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: FOOTER,
    });
    const withCorrect = questions.filter((q: any) => q.answers?.some((a: any) => a.is_correct)).length;
    console.log(`✓ ${path.basename(outPath)}  (${questions.length} pytań, ${withCorrect} z poprawną)`);
    ok++;
  }

  await browser.close();
  console.log(`\nGotowe: ${ok}/${picked.length} PDF-ów → ${OUT}/`);
}

main().catch((e) => (console.error(e), process.exit(1)));
