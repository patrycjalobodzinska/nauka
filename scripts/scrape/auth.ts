/**
 * Krok A — logowanie raz, zapis sesji (bez hasła w kodzie).
 *
 * Uruchom (Node 22!):  npm run scrape:auth
 * Otworzy się okno przeglądarki na anatomia.wiecejnizlek.pl — zaloguj się
 * ręcznie, a potem wróć do terminala i naciśnij Enter. Sesja (cookies +
 * localStorage) zapisze się do scripts/scrape/.auth/state.json i będzie
 * używana przez krok B (inspect). Plik jest w .gitignore.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";

const BASE_URL = process.env.SCRAPE_BASE_URL ?? "https://anatomia.wiecejnizlek.pl";
const AUTH_DIR = path.join("scripts", "scrape", ".auth");
const STATE = path.join(AUTH_DIR, "state.json");

function waitForEnter(prompt: string) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise<void>((res) => rl.question(prompt, () => (rl.close(), res())));
}

async function main() {
  await mkdir(AUTH_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

  console.log("\n→ Zaloguj się w otwartym oknie przeglądarki.");
  await waitForEnter("→ Po zalogowaniu wróć tu i naciśnij Enter, aby zapisać sesję… ");

  await context.storageState({ path: STATE });
  console.log(`✓ Zapisano sesję do ${STATE}`);
  await browser.close();
}

main().catch((e) => (console.error(e), process.exit(1)));
