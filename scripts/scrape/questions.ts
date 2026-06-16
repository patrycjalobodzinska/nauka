/**
 * Pobiera BAZĘ PYTAŃ (quiz) — pytania + odpowiedzi z flagą poprawności + wyjaśnienia.
 * Tylko odczyt: stronicowany `POST /quiz_questions/.filter` (NIE wysyłamy odpowiedzi).
 *
 * Uruchom (Node 22!):
 *   npm run scrape:questions                # wszystkie grupy pytań kursu
 *   npm run scrape:questions -- 29          # konkretna grupa
 * Zapis: scripts/scrape/_data/questions-<groupId>.json
 */
import { chromium, type Page } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.env.SCRAPE_BASE_URL ?? "https://anatomia.wiecejnizlek.pl";
const STATE = path.join("scripts", "scrape", ".auth", "state.json");
const OUT = path.join("scripts", "scrape", process.env.SCRAPE_DATA_DIR ?? "_data");
const INCLUDE = "quiz_answers,quiz_answers.interlinks,interlinks";
const THROTTLE_MS = Number(process.env.SCRAPE_THROTTLE_MS) || 1200;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function apiGet(page: Page, p: string): Promise<any> {
  return page.evaluate(async (u) => {
    try {
      const r = await fetch(u, { headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" }, credentials: "include" });
      return r.ok ? await r.json() : null;
    } catch {
      return null;
    }
  }, BASE_URL + p);
}

async function apiPost(page: Page, p: string, body: any): Promise<{ status: number; json: any }> {
  return page.evaluate(async ({ u, b }) => {
    const xsrf = decodeURIComponent(document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1] ?? "");
    try {
      const r = await fetch(u, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json", "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", ...(xsrf ? { "X-XSRF-TOKEN": xsrf } : {}) },
        body: JSON.stringify(b),
      });
      const t = await r.text();
      let json: any = null;
      try { json = JSON.parse(t); } catch {}
      return { status: r.status, json };
    } catch {
      return { status: 0, json: null };
    }
  }, { u: BASE_URL + p, b: body });
}

function filterBody(groupId: number, page: number) {
  return {
    filters: [{ "quiz-quiz_question_groups": { quiz_question_group_id: groupId } }],
    include: INCLUDE,
    page,
    useSavedFilters: false,
    saveFilters: false,
  };
}

/** Z odpowiedzi .filter buduje listę pytań z rozwiązanymi odpowiedziami. */
function questionsFromPage(json: any): any[] {
  const data = json?.data ?? {};
  const answers = data.included?.quiz_answers ?? {};
  const out: any[] = [];
  for (const [k, q] of Object.entries<any>(data)) {
    if (k === "included" || !q || typeof q !== "object" || !q.id) continue;
    const ans = (q.quiz_answers ?? []).map((id: any) => {
      const a = answers[id] ?? answers[String(id)] ?? {};
      return { id: a.id ?? id, text: a.text ?? "", is_correct: !!a.is_correct, explanation: a.explanation ?? "" };
    });
    out.push({ id: q.id, text: q.text ?? "", explanation: q.explanation ?? "", answers: ans });
  }
  return out;
}

async function fetchGroup(page: Page, group: { id: number; name: string; count: number }) {
  const file = path.join(OUT, `questions-${group.id}.json`);
  const all: any[] = [];
  const first = await apiPost(page, `/papi/v2/quiz_questions/.filter`, filterBody(group.id, 1));
  if (first.status !== 200 || !first.json) {
    const hint = first.status === 419 ? "token CSRF → npm run scrape:auth" : first.status === 422 ? "body filtra do poprawy" : "";
    console.log(`✗ grupa ${group.id} „${group.name}": HTTP ${first.status} ${hint}`);
    return;
  }
  const lastPage = first.json.last_page ?? 1;
  all.push(...questionsFromPage(first.json));
  console.log(`• grupa ${group.id} „${group.name}": ${group.count} pytań, ${lastPage} stron`);
  for (let p = 2; p <= lastPage; p++) {
    await sleep(THROTTLE_MS);
    const res = await apiPost(page, `/papi/v2/quiz_questions/.filter`, filterBody(group.id, p));
    if (res.status === 200 && res.json) all.push(...questionsFromPage(res.json));
    else console.log(`   ✗ strona ${p}: HTTP ${res.status}`);
    if (p % 10 === 0) console.log(`   …${p}/${lastPage} (zebrano ${all.length})`);
  }
  await writeFile(file, JSON.stringify({ group, questions: all }, null, 2));
  const withCorrect = all.filter((q) => q.answers.some((a: any) => a.is_correct)).length;
  console.log(`→ zapisano ${all.length} pytań (${withCorrect} z oznaczoną poprawną) → ${path.relative(process.cwd(), file)}`);
}

async function main() {
  const args = process.argv.slice(2).filter((a) => /^\d+$/.test(a));
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

  // grupy: z argumentów albo z API
  let groups: { id: number; name: string; count: number }[];
  if (args.length) {
    groups = args.map((id) => ({ id: +id, name: `Grupa ${id}`, count: 0 }));
  } else {
    const g = await apiGet(page, `/papi/v2/quiz_question_groups?include=quizQuestionsCount`);
    const arr = Array.isArray(g) ? g : g?.data ? Object.values(g.data) : Object.values(g ?? {});
    groups = (arr as any[])
      .filter((x) => x && x.id)
      .map((x) => ({ id: x.id, name: x.name ?? `Grupa ${x.id}`, count: x.quiz_questions_count ?? x.quizQuestionsCount ?? x.count ?? 0 }));
  }
  console.log(`Grup pytań do pobrania: ${groups.length}`);

  for (const grp of groups) {
    await fetchGroup(page, grp);
    await sleep(THROTTLE_MS);
  }

  try { await context.storageState({ path: STATE }); } catch {}
  await browser.close();
  console.log("\nGotowe.");
}

main().catch((e) => (console.error(e), process.exit(1)));
