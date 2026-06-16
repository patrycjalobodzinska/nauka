/**
 * Dociąga URL-e obrazków frontów dla JUŻ pobranej talii fiszek.
 * Tylko GET-y (brak POST/sesji/CSRF) — nie rusza postępu nauki.
 *   front <b-interlink> → GET /flashcards/<id>/interlinks → GET media_record_embeds/<uuid> → URL
 *
 * Uruchom (Node 22!):
 *   npm run scrape:flashcards-images -- 1341            # cała talia (wznawialne)
 *   npm run scrape:flashcards-images -- 1341 --max=100  # tylko 100 brakujących (np. test)
 *
 * Wznawialne: pomija fiszki, które już mają `image`. Zapisuje co 50 sztuk.
 */
import { chromium, type Page } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.env.SCRAPE_BASE_URL ?? "https://anatomia.wiecejnizlek.pl";
const STATE = path.join("scripts", "scrape", ".auth", "state.json");
const OUT = path.join("scripts", "scrape", process.env.SCRAPE_DATA_DIR ?? "_data");
const THROTTLE_MS = Number(process.env.SCRAPE_THROTTLE_MS) || 700;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function apiGet(page: Page, p: string): Promise<any> {
  return page.evaluate(async (u) => {
    try {
      const res = await fetch(u, { headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" }, credentials: "include" });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, BASE_URL + p);
}

function firstFileUrl(embed: any): string | null {
  let url: string | null = null;
  (function w(n: any) {
    if (url) return;
    if (Array.isArray(n)) return n.forEach(w);
    if (n && typeof n === "object") {
      if (n.files && typeof n.files === "object") {
        const v = Object.values(n.files).find((x) => typeof x === "string");
        if (v) { url = v as string; return; }
      }
      for (const v of Object.values(n)) w(v);
    }
  })(embed);
  return url;
}

async function main() {
  const args = process.argv.slice(2);
  const setId = args.find((a) => /^\d+$/.test(a));
  const max = Number(args.find((a) => a.startsWith("--max="))?.slice(6) ?? "0") || Infinity;
  if (!setId) {
    console.error("Użycie: npm run scrape:flashcards-images -- <setId> [--max=N]");
    process.exit(1);
  }
  const file = path.join(OUT, `flashcards-${setId}.json`);
  if (!existsSync(file)) {
    console.error(`Brak ${file}. Najpierw pobierz talię.`);
    process.exit(1);
  }
  if (!existsSync(STATE)) {
    console.error(`Brak sesji (${STATE}). Uruchom: npm run scrape:auth`);
    process.exit(1);
  }

  const deck = JSON.parse(await readFile(file, "utf8"));
  const todo = deck.cards.filter((c: any) => !c.image && /<b-interlink/i.test(c.front || ""));
  console.log(`Talia ${setId} „${deck.set?.name}": ${deck.cards.length} fiszek, do dociągnięcia: ${todo.length}` + (max !== Infinity ? ` (limit ${max})` : ""));
  if (!todo.length) {
    console.log("Wszystkie obrazki już są.");
    return;
  }
  console.log(`Szacunkowo ~${Math.min(todo.length, max) * 2} zapytań, ~${Math.ceil((Math.min(todo.length, max) * 2 * THROTTLE_MS) / 60000)} min. Ctrl-C aby przerwać.`);

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

  const save = () => writeFile(file, JSON.stringify(deck, null, 2));
  let done = 0;
  let resolved = 0;
  for (const card of todo) {
    if (done >= max) break;
    done++;
    const il = await apiGet(page, `/papi/v2/flashcards/${card.id}/interlinks`);
    const front = (Array.isArray(il) ? il : []).find(
      (x) => x.interlink_source_field === "front" && x.interlink_target_type === "media_manager:media_record_embed"
    );
    if (front?.interlink_target_uuid) {
      await sleep(THROTTLE_MS);
      const embed = await apiGet(page, `/papi/v2/media_containers/media_record_embeds/${front.interlink_target_uuid}`);
      const url = embed && firstFileUrl(embed);
      if (url) {
        card.image = url;
        resolved++;
      }
    }
    if (done % 50 === 0) {
      await save();
      console.log(`  ${done}/${Math.min(todo.length, max)} (rozwiązano ${resolved})`);
    }
    await sleep(THROTTLE_MS);
  }
  await save();
  try { await context.storageState({ path: STATE }); } catch {}
  await browser.close();
  console.log(`\nGotowe: rozwiązano ${resolved} obrazków (${done} fiszek przetworzonych) → ${file}`);
}

main().catch((e) => (console.error(e), process.exit(1)));
