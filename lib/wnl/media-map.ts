import "server-only";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import type { Slide } from "./build-article";

/**
 * Mapuje URL obrazka (gumlet/GCS) na lokalną ścieżkę /wnl-media/BUCKET/PLIK,
 * jeśli pobrany lokalnie (z plików _map.json w public/wnl-media). Inaczej zwraca oryginał (hot-link).
 * Dzięki temu apka serwuje pobrane obrazki z dysku, a niepobrane warianty (np. ŁAC/EN) idą z sieci.
 */
// Cache na czas życia procesu — mapa zmienia się tylko przy pobieraniu obrazków
// (po nowym `scrape:media` zrestartuj dev-server). Obecnie 7331 URL-i (anatomia: PL/ŁAC/EN/bez-podpisów).
const MEDIA = path.join(process.cwd(), "public", "wnl-media");
let map: Map<string, string> | null = null;

function load(): Map<string, string> {
  if (map) return map;
  map = new Map();
  try {
    for (const bucket of readdirSync(MEDIA)) {
      const mf = path.join(MEDIA, bucket, "_map.json");
      if (!existsSync(mf)) continue;
      const entries = JSON.parse(readFileSync(mf, "utf8")) as Record<string, string>;
      for (const [url, file] of Object.entries(entries)) map.set(url, `/wnl-media/${bucket}/${file}`);
    }
  } catch {
    /* brak katalogu = wszystko hot-link */
  }
  return map;
}

export function localImage(url: string | undefined): string | undefined {
  if (!url) return url;
  return load().get(url) ?? url;
}

/** Podmienia URL-e w slajdach (pl/la/en + bez podpisów) na lokalne, gdy pobrane. */
export function localizeSlides(slides: Slide[]): Slide[] {
  return slides.map((s) => ({
    ...s,
    files: { pl: localImage(s.files.pl), la: localImage(s.files.la), en: localImage(s.files.en) },
    withoutMarkings: localImage(s.withoutMarkings),
  }));
}
