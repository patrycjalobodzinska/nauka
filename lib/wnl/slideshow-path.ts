import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Slideshowy leżą w wielu katalogach (per kurs): scripts/scrape/_data oraz
 * _data-<kurs>. Id slideshowu jest globalnie unikalne, więc szukamy pliku
 * po kolei: najpierw _data (anatomia/histologia), potem _data-*.
 */
const SCRAPE = path.join(process.cwd(), "scripts/scrape");
let dirsCache: string[] | null = null;

function dataDirs(): string[] {
  if (dirsCache) return dirsCache;
  try {
    const dirs = readdirSync(SCRAPE, { withFileTypes: true })
      .filter((d) => d.isDirectory() && (d.name === "_data" || d.name.startsWith("_data-")))
      .map((d) => d.name)
      .sort((a, b) => (a === "_data" ? -1 : b === "_data" ? 1 : a.localeCompare(b)));
    dirsCache = dirs.length ? dirs : ["_data"];
  } catch {
    dirsCache = ["_data"];
  }
  return dirsCache;
}

export function resolveSlideshowFile(id: number): string | null {
  for (const d of dataDirs()) {
    const f = path.join(SCRAPE, d, `slideshow-${id}.json`);
    if (existsSync(f)) return f;
  }
  return null;
}
