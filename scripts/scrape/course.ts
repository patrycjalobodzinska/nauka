/**
 * Batch wielu kursów *.wiecejnizlek.pl jedną komendą.
 * Dla każdej subdomeny ustawia SCRAPE_BASE_URL + SCRAPE_DATA_DIR=_data-<kurs>
 * i odpala po kolei: harvest --course → questions → atlas (każdy w osobnym folderze).
 *
 * Najpierw zaloguj się RAZ (cookie działa na całej domenie *.wiecejnizlek.pl):
 *   npm run scrape:auth
 * Potem (Node 22!):
 *   npm run scrape:course -- biochemia fizjologia genetyka
 *   npm run scrape:course -- https://chirurgia.wiecejnizlek.pl/app/courses/1   # URL też zadziała
 *
 * Kurs bez dostępu/atlasu → krok zgłosi błąd i lecimy dalej (podsumowanie na końcu).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const STATE = path.join("scripts", "scrape", ".auth", "state.json");
// przerwa między kursami (spowalnia/rozkłada ruch); per-żądanie ustawiasz SCRAPE_THROTTLE_MS
const COURSE_PAUSE_MS = Number(process.env.SCRAPE_COURSE_PAUSE_MS) || 20000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const STEPS = [
  { name: "artykuły", script: "scrape:harvest", args: ["--course"] },
  { name: "pytania", script: "scrape:questions", args: [] as string[] },
  { name: "atlas", script: "scrape:atlas", args: [] as string[] },
];

/** Z tokenu (URL lub goła nazwa) wyciąga subdomenę kursu. */
function subdomainOf(tok: string): string | null {
  const t = tok.trim();
  if (!t || t.startsWith("-")) return null; // flagi (--pdf itp.) to nie subdomeny
  const m = t.match(/^(?:https?:\/\/)?([a-z0-9-]+)\.wiecejnizlek\.pl/i);
  if (m) return m[1].toLowerCase();
  if (/^[a-z0-9]+$/i.test(t)) return t.toLowerCase();
  return null;
}

function run(script: string, args: string[], env: NodeJS.ProcessEnv): boolean {
  const npmArgs = ["run", script, ...(args.length ? ["--", ...args] : [])];
  const r = spawnSync("npm", npmArgs, { env, stdio: "inherit" });
  return r.status === 0;
}

async function main() {
  const subs = [...new Set(process.argv.slice(2).map(subdomainOf).filter((s): s is string => !!s))];
  if (!subs.length) {
    console.error("Użycie: npm run scrape:course -- <subdomena|URL> [...]");
    console.error("np.: npm run scrape:course -- biochemia fizjologia genetyka");
    process.exit(1);
  }
  if (!existsSync(STATE)) {
    console.error(`Brak sesji (${STATE}). Najpierw: npm run scrape:auth (raz — cookie działa na *.wiecejnizlek.pl).`);
    process.exit(1);
  }

  const wantPdf = process.argv.slice(2).includes("--pdf"); // --pdf → też generuj PDF-y artykułów i pytań
  console.log(`Kursy do pobrania (${subs.length}): ${subs.join(", ")}${wantPdf ? "  [+PDF]" : ""}`);
  const summary: string[] = [];
  for (const sub of subs) {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      SCRAPE_BASE_URL: `https://${sub}.wiecejnizlek.pl`,
      SCRAPE_DATA_DIR: `_data-${sub}`,
    };
    const steps = [
      ...STEPS,
      ...(wantPdf
        ? [
            { name: "pdf-artykuły", script: "scrape:pdf", args: [`--out=${sub}`] },
            { name: "pdf-pytania", script: "scrape:questions-pdf", args: [`--out=${sub}`] },
          ]
        : []),
    ];
    console.log(`\n══════════ ${sub}  →  _data-${sub}/ ══════════`);
    const results: string[] = [];
    for (const step of steps) {
      console.log(`\n─── ${sub}: ${step.name} ───`);
      results.push(`${step.name}:${run(step.script, step.args, env) ? "✓" : "✗"}`);
    }
    summary.push(`${sub.padEnd(16)} ${results.join("  ")}`);
    if (sub !== subs[subs.length - 1]) await sleep(COURSE_PAUSE_MS);
  }
  console.log("\n════════════ PODSUMOWANIE ════════════");
  summary.forEach((s) => console.log("  " + s));
  console.log("\nUwaga: jeśli gdzieś wyszło ✗ przez wygasłą sesję — odśwież: npm run scrape:auth, i ponów dla tych kursów.");
}

main();

