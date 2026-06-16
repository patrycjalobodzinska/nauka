/**
 * Krok B — rekonesans: nagraj CAŁY ruch sieciowy jednej lekcji.
 *
 * Uruchom (Node 22!):
 *   npm run scrape:inspect -- "https://anatomia.wiecejnizlek.pl/<adres-lekcji>"
 * (URL można pominąć — wtedy startuje od strony głównej i klikasz sam).
 *
 * Otworzy się przeglądarka z Twoją sesją. Wejdź w lekcję, przełącz na widok
 * "artykuł", a potem RĘCZNIE: przesuń każdy slider przez wszystkie slajdy i
 * kliknij raz PL/EN oraz "ukryj podpisy" na kilku rycinach. Wszystko, co
 * przeglądarka pobierze, ląduje w scripts/scrape/_capture/:
 *   • api/*.json   — odpowiedzi JSON (tu szukamy danych lekcji + URL-i wariantów)
 *   • images.txt   — wszystkie URL-e obrazków, jakie się pojawiły (unikalne)
 *   • requests.log — log wszystkich żądań (method status url)
 *   • page.html    — HTML strony w momencie zakończenia
 *   • page.png     — zrzut ekranu
 *   • summary.json — podsumowanie
 * Gdy skończysz, wróć do terminala i naciśnij Enter.
 */
import { chromium, type Response } from "playwright";
import { mkdir, writeFile, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";

const BASE_URL = process.env.SCRAPE_BASE_URL ?? "https://anatomia.wiecejnizlek.pl";
const RAW_ARGS = process.argv.slice(2);
// --out=NAZWA → zapis do podfolderu _capture/NAZWA (nie nadpisuje poprzednich)
const OUT_SUB = RAW_ARGS.find((a) => a.startsWith("--out="))?.slice("--out=".length) ?? "";
const START_URL = RAW_ARGS.find((a) => !a.startsWith("--")) ?? BASE_URL;
const STATE = path.join("scripts", "scrape", ".auth", "state.json");
const OUT = path.join("scripts", "scrape", "_capture", OUT_SUB);
const API_DIR = path.join(OUT, "api");

const IMG_RE = /\.(jpe?g|png|webp|gif|avif|svg)(\?|$)/i;
const imageUrls = new Set<string>();
const apiFiles: string[] = [];
let apiCount = 0;
let imgCount = 0;

function safeName(url: string) {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9.\-]+/gi, "_")
    .slice(0, 120);
}

function waitForEnter(prompt: string) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise<void>((res) => rl.question(prompt, () => (rl.close(), res())));
}

async function onResponse(res: Response) {
  const url = res.url();
  const ct = (res.headers()["content-type"] ?? "").toLowerCase();
  const type = res.request().resourceType();

  // log everything (cheap, helps find the API)
  const method = res.request().method();
  appendFile(path.join(OUT, "requests.log"), `${method} ${res.status()} ${url}\n`).catch(() => {});

  // zapisz CIAŁO żądań zmieniających stan (POST/PUT/PATCH) do /papi/ — np. body sesji fiszek
  if (method !== "GET" && /\/papi\//.test(url)) {
    const post = res.request().postData() ?? "";
    appendFile(path.join(OUT, "posts.log"), `${method} ${url}\n${post}\n---\n`).catch(() => {});
  }

  // collect image URLs (incl. gumlet) — what we ultimately want to download
  if (type === "image" || ct.startsWith("image/") || IMG_RE.test(url)) {
    if (!imageUrls.has(url)) {
      imageUrls.add(url);
      imgCount++;
      if (imgCount % 10 === 0) console.log(`  …${imgCount} URL-i obrazków`);
    }
    return;
  }

  // save JSON bodies — the lesson/slideshow data lives here
  const looksJson = ct.includes("json") || /\/api\/|graphql|\.json(\?|$)/i.test(url);
  if (!looksJson) return;
  try {
    const body = await res.text();
    if (!body.trim()) return;
    let pretty = body;
    try { pretty = JSON.stringify(JSON.parse(body), null, 2); } catch {}
    const file = path.join(API_DIR, `${String(++apiCount).padStart(3, "0")}-${safeName(url)}.json`);
    await writeFile(file, pretty);
    apiFiles.push(path.relative(OUT, file));
    console.log(`  [api] ${path.basename(file)}  (${(body.length / 1024).toFixed(1)} kB)`);
  } catch {
    /* redirects / no body */
  }
}

async function main() {
  await mkdir(API_DIR, { recursive: true });
  await writeFile(path.join(OUT, "requests.log"), "");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: existsSync(STATE) ? STATE : undefined,
  });
  if (!existsSync(STATE)) {
    console.log("⚠ Brak zapisanej sesji (scripts/scrape/.auth/state.json).");
    console.log("  Możesz zalogować się ręcznie w oknie, które się otworzy — sesja zapisze się na końcu.");
  }

  const page = await context.newPage();
  page.on("response", onResponse);

  console.log(`Node ${process.version}`);
  console.log(`→ Start URL: ${START_URL}`);

  // Nie blokujemy się na goto — okno ma być od razu używalne, a ewentualny
  // błąd nawigacji ma być WIDOCZNY (kiedyś połykałem go po cichu → about:blank).
  page
    .goto(START_URL, { waitUntil: "commit", timeout: 60_000 })
    .then(() => console.log(`✓ Otworzono: ${START_URL}`))
    .catch((e) =>
      console.log(
        `⚠ Auto-nawigacja nieudana (${e.message}).\n` +
          `  Wklej adres lekcji ręcznie w pasku przeglądarki — nagrywanie i tak działa.`
      )
    );

  console.log(`\n→ Nagrywam ruch sieciowy. Wejdź w lekcję, przełącz na "artykuł",`);
  console.log(`  przewiń slidery i przełącz PL/EN + podpisy na kilku rycinach.`);
  await waitForEnter("→ Gdy skończysz, naciśnij Enter, aby zapisać i zamknąć… ");

  // dump artefacts
  try { await writeFile(path.join(OUT, "page.html"), await page.content()); } catch {}
  try { await page.screenshot({ path: path.join(OUT, "page.png"), fullPage: true }); }
  catch { try { await page.screenshot({ path: path.join(OUT, "page.png") }); } catch {} }
  await writeFile(path.join(OUT, "images.txt"), [...imageUrls].sort().join("\n") + "\n");
  await writeFile(
    path.join(OUT, "summary.json"),
    JSON.stringify(
      { startUrl: START_URL, finalUrl: page.url(), apiResponses: apiFiles, imageCount: imageUrls.size },
      null, 2
    )
  );
  // refresh session for next runs
  try { await mkdir(path.dirname(STATE), { recursive: true }); await context.storageState({ path: STATE }); } catch {}

  console.log(`\n✓ Gotowe. ${apiCount} odpowiedzi JSON, ${imageUrls.size} URL-i obrazków → ${OUT}/`);
  await browser.close();
}

main().catch((e) => (console.error(e), process.exit(1)));
