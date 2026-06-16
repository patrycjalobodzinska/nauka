/**
 * Pobiera ATLAS anatomiczny (media_browser). Obrazki to pojedyncze pliki
 * (URL-e inline w odpowiedzi — bez dociągania per sztuka). Tylko odczyt.
 *
 * Przepływ: filtersDetails (drzewo kategorii, taksonomia 36) → per kategoria
 * (z podkategoriami) stronicowany mediaContainers → dedup po id, tag kategorią.
 *
 * Uruchom (Node 22!):  npm run scrape:atlas
 * Zapis: scripts/scrape/_data/atlas.json
 */
import { chromium, type Page } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.env.SCRAPE_BASE_URL ?? "https://anatomia.wiecejnizlek.pl";
const STATE = path.join("scripts", "scrape", ".auth", "state.json");
const OUT = path.join("scripts", "scrape", process.env.SCRAPE_DATA_DIR ?? "_data");
// taksonomię atlasu wykrywamy dynamicznie z filtersDetails (różni się między kursami)
const TAXONOMY_OVERRIDE = Number(process.env.SCRAPE_ATLAS_TAXONOMY ?? "") || null;
const PER_PAGE = 60;
const THROTTLE_MS = Number(process.env.SCRAPE_THROTTLE_MS) || 1200;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function cdn(url: string, w = 1000): string {
  const m = url.match(/storage\.googleapis\.com\/media-manager\/(.+)$/);
  return m ? `https://media-manager.gumlet.io/${m[1]}?format=auto&w=${w}` : url;
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

/** Zbiera term id węzła + wszystkich potomków. */
function subtreeIds(node: any): number[] {
  const ids: number[] = [];
  (function w(n: any) {
    const v = n?.value ?? n?.id;
    if (v != null && /^\d+$/.test(String(v))) ids.push(+v);
    for (const c of n?.items ?? []) w(c);
  })(node);
  return ids;
}

/** Z kontenera media → rekord {id, name, image, images[]}. */
function containerRecord(c: any): { id: string; name: string; image: string; images: string[] } | null {
  const slides: { name: string; image: string }[] = [];
  for (const mi of c?.main_items ?? []) {
    for (const si of mi?.sub_items ?? []) {
      const v = si?.variants?.[0];
      const url = v?.files ? (Object.values(v.files).find((x) => typeof x === "string") as string | undefined) : undefined;
      if (url) slides.push({ name: v.name?.pl ?? v.name?.[""] ?? si.name ?? "", image: cdn(url) });
    }
  }
  if (!slides.length) return null;
  return { id: String(c.id), name: c.name || slides[0].name || "", image: slides[0].image, images: slides.map((s) => s.image) };
}

function mcBody(termIds: number[], page: number, taxonomyId: number) {
  return {
    context_filter: { name: "media_browser-taxonomy_terms", parameters: termIds, config: { taxonomy_id: taxonomyId } },
    filters: [],
    page,
    per_page: PER_PAGE,
  };
}

async function main() {
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

  // 1) drzewo kategorii (taksonomia 36)
  const fd = await apiPost(page, `/papi/v2/media_browser/filtersDetails`, {});
  const taxFilters = (fd.json?.details ?? []).filter(
    (f: any) => f?.name === "media_browser-taxonomy_terms" && Array.isArray(f.items) && f.items.length
  );
  const taxFilter = TAXONOMY_OVERRIDE
    ? taxFilters.find((f: any) => f?.config?.taxonomy_id === TAXONOMY_OVERRIDE)
    : taxFilters.sort((a: any, b: any) => b.items.length - a.items.length)[0];
  const taxonomyId: number | undefined = taxFilter?.config?.taxonomy_id;
  const topNodes: any[] = taxFilter?.items ?? [];
  if (!topNodes.length || !taxonomyId) {
    console.error(
      "✗ Nie znalazłem kategorii atlasu. Dostępne taksonomie: " +
        taxFilters.map((f: any) => `${f?.config?.taxonomy_id}(${f.items.length})`).join(", ")
    );
    await browser.close();
    process.exit(1);
  }
  console.log(`Atlas: taksonomia ${taxonomyId}, kategorii: ${topNodes.length}`);

  // 2) per kategoria → stronicowany mediaContainers, dedup po id
  const seen = new Set<string>();
  const items: any[] = [];
  const categories: string[] = [];
  for (const node of topNodes) {
    const catName = node.name ?? node.display_name ?? `Kategoria ${node.value ?? node.id}`;
    categories.push(catName);
    const termIds = subtreeIds(node);
    const first = await apiPost(page, `/papi/v2/media_browser/mediaContainers`, mcBody(termIds, 1, taxonomyId));
    if (first.status !== 200 || !first.json) {
      const hint = first.status === 419 ? "token CSRF → npm run scrape:auth" : "";
      console.log(`✗ „${catName}": HTTP ${first.status} ${hint}`);
      continue;
    }
    const lastPage = first.json.last_page ?? 1;
    let added = 0;
    const ingest = (j: any) => {
      for (const c of j?.data ?? []) {
        const rec = containerRecord(c);
        if (!rec || seen.has(rec.id)) continue;
        seen.add(rec.id);
        items.push({ ...rec, category: catName });
        added++;
      }
    };
    ingest(first.json);
    for (let p = 2; p <= lastPage; p++) {
      await sleep(THROTTLE_MS);
      const res = await apiPost(page, `/papi/v2/media_browser/mediaContainers`, mcBody(termIds, p, taxonomyId));
      if (res.status === 200 && res.json) ingest(res.json);
    }
    console.log(`• „${catName}": +${added} (łącznie ${items.length})`);
    await sleep(THROTTLE_MS);
  }

  await writeFile(path.join(OUT, "atlas.json"), JSON.stringify({ total: items.length, categories, items }, null, 2));
  try { await context.storageState({ path: STATE }); } catch {}
  await browser.close();
  console.log(`\nGotowe: ${items.length} obrazków atlasu → ${path.relative(process.cwd(), path.join(OUT, "atlas.json"))}`);
}

main().catch((e) => (console.error(e), process.exit(1)));
