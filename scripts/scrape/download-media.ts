/**
 * Pobieranie obrazków do public/wnl-media/<bucket>/ — „po ludzku": nagłówki przeglądarki,
 * losowe opóźnienia, mała równoległość (nie wygląda na masowy scraping). Dedup po URL.
 * Pisze mapę url→plik (_map.json) i — heurystycznie po nazwie — odkłada KANDYDATÓW na tabele
 * do _candidate-tables.json (ich NIE pobiera; nazwa to słaby sygnał, do późniejszej weryfikacji wzrokowej).
 *
 * Uruchom (Node 22!):
 *   npm run scrape:media -- atlas      # atlas anatomii (_data/atlas.json)
 */
import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const DATA = path.join("scripts", "scrape", "_data");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const REFERER = "https://anatomia.wiecejnizlek.pl/";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (a: number, b: number) => a + Math.floor(Math.random() * (b - a));
const hashName = (url: string) => createHash("sha1").update(url).digest("hex").slice(0, 16);

/** słaby, NAZWOWY filtr „to chyba tabela" — tylko do wydzielenia kandydatów, nie do pewnej klasyfikacji */
const TABLE_RE = /tabela|tabel[ae]|zestawieni|klasyfikacj|podzia[łl]\b/i;

async function fetchImage(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "Accept-Language": "pl-PL,pl;q=0.9,en;q=0.8",
      Referer: REFERER,
      "Sec-Fetch-Dest": "image",
      "Sec-Fetch-Mode": "no-cors",
      "Sec-Fetch-Site": "cross-site",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

type Job = { url: string; name: string };

/** oryginał GCS → gumlet w wersji webowej (mniejsze pliki, bez pobierania 4000×4000) */
function cdn(url: string, w: number): string {
  const m = url.match(/storage\.googleapis\.com\/media-manager\/(.+)$/);
  return m ? `https://media-manager.gumlet.io/${m[1].split("?")[0]}?format=auto&w=${w}` : url;
}

async function run(
  bucket: string,
  jobs: Job[],
  tables: { url: string; name: string }[],
  transform: (u: string) => string = (u) => u
) {
  const out = path.join("public", "wnl-media", bucket);
  await mkdir(out, { recursive: true });
  if (tables.length) await writeFile(path.join(out, "_candidate-tables.json"), JSON.stringify(tables, null, 2));

  const uniq = [...new Map(jobs.map((j) => [j.url, j])).values()];
  console.log(`Pobieranie: ${uniq.length} obrazków → ${out}/  (kandydaci-tabele odłożeni: ${tables.length})`);

  // SCAL z istniejącą mapą (nie nadpisuj — w buckecie są już PL/wm/schematy)
  const mapFile = path.join(out, "_map.json");
  const map: Record<string, string> = existsSync(mapFile) ? JSON.parse(await readFile(mapFile, "utf8")) : {};
  let done = 0, failed = 0, bytes = 0;
  const CONCURRENCY = 3;
  let i = 0;
  const worker = async () => {
    while (i < uniq.length) {
      const job = uniq[i++];
      const fname = hashName(job.url) + ".jpg";
      const file = path.join(out, fname);
      try {
        if (existsSync(file)) {
          bytes += (await stat(file)).size;
        } else {
          await sleep(jitter(250, 750)); // ludzkie tempo
          const buf = await fetchImage(transform(job.url));
          await writeFile(file, buf);
          bytes += buf.length;
        }
        map[job.url] = fname;
        if (++done % 50 === 0) console.log(`  …${done}/${uniq.length}  (${(bytes / 1e6).toFixed(0)} MB)`);
      } catch (e) {
        failed++;
        if (failed <= 5) console.log(`  ✗ ${job.name}: ${(e as Error).message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  await writeFile(path.join(out, "_map.json"), JSON.stringify(map, null, 2));
  console.log(`\nGotowe: ${done} pobranych, ${failed} błędów, ${tables.length} kandydatów-tabel pominięto.`);
  console.log(`Rozmiar: ${(bytes / 1e6).toFixed(1)} MB → ${out}/`);
}

async function main() {
  const mode = process.argv[2] ?? "atlas";
  if (mode === "atlas") {
    const atlas = JSON.parse(await readFile(path.join(DATA, "atlas.json"), "utf8"));
    const jobs: Job[] = [];
    const tables: { url: string; name: string }[] = [];
    for (const it of atlas.items ?? []) {
      const urls: string[] = it.images?.length ? it.images : it.image ? [it.image] : [];
      if (TABLE_RE.test(it.name ?? "")) {
        urls.forEach((u) => tables.push({ url: u, name: it.name }));
        continue;
      }
      urls.forEach((u) => jobs.push({ url: u, name: it.name }));
    }
    await run("anatomia-atlas", jobs, tables);
  } else if (mode === "articles") {
    const m = JSON.parse(await readFile(path.join(DATA, "_manifest.json"), "utf8"));
    const ids = new Set<number>();
    for (const l of m.lessons) if (/Anatomii/i.test(l.course ?? "")) for (const s of l.slideshowIds) ids.add(s);
    const jobs: Job[] = [];
    const tables: { url: string; name: string }[] = [];
    for (const id of ids) {
      let j: any;
      try {
        j = JSON.parse(await readFile(path.join(DATA, `slideshow-${id}.json`), "utf8"));
      } catch {
        continue;
      }
      for (const c of j.media_containers ?? [])
        for (const mi of c.main_items ?? [])
          for (const si of mi.sub_items ?? []) {
            const v = (si.variants ?? [])[0];
            if (!v) continue;
            const name = v.name?.pl ?? "";
            const urls = [v.files?.pl, v.file_without_markings].filter(Boolean) as string[];
            if (TABLE_RE.test(name)) urls.forEach((u) => tables.push({ url: u, name }));
            else urls.forEach((u) => jobs.push({ url: u, name }));
          }
    }
    await run("anatomia-artykuly", jobs, tables);
  } else if (mode === "articles-langs") {
    // ŁAC + EN rycin artykułów anatomii (przez gumlet, web-res). Pomija 3 prawdziwe tabele.
    const m = JSON.parse(await readFile(path.join(DATA, "_manifest.json"), "utf8"));
    const ids = new Set<number>();
    for (const l of m.lessons) if (/Anatomii/i.test(l.course ?? "")) for (const s of l.slideshowIds) ids.add(s);
    let tableNames = new Set<string>();
    try {
      const t = JSON.parse(await readFile(path.join("public", "wnl-media", "anatomia-artykuly", "_tables.json"), "utf8"));
      tableNames = new Set((t as { name: string }[]).map((x) => x.name));
    } catch {
      /* brak pliku tabel = nic nie pomijamy */
    }
    const jobs: Job[] = [];
    for (const id of ids) {
      let j: any;
      try {
        j = JSON.parse(await readFile(path.join(DATA, `slideshow-${id}.json`), "utf8"));
      } catch {
        continue;
      }
      for (const c of j.media_containers ?? [])
        for (const mi of c.main_items ?? [])
          for (const si of mi.sub_items ?? []) {
            const v = (si.variants ?? [])[0];
            if (!v) continue;
            const name = v.name?.pl ?? "";
            if (tableNames.has(name)) continue; // prawdziwa tabela — pomijamy też ŁAC/EN
            for (const u of [v.files?.la, v.files?.en]) if (u) jobs.push({ url: u, name });
          }
    }
    await run("anatomia-artykuly", jobs, [], (u) => cdn(u, 1400));
  } else {
    console.error(`Nieznany tryb: ${mode} (dostępne: atlas, articles, articles-langs)`);
    process.exit(1);
  }
}

main().catch((e) => (console.error(e), process.exit(1)));
