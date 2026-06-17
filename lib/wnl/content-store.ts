import "server-only";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Dostęp do treści kursów. Lokalnie (offline na kompie) czyta z dysku
 * `scripts/scrape/<relPath>`. Na produkcji (Vercel), gdzie tych plików NIE ma,
 * pobiera z Vercel Blob spod `${BLOB_BASE_URL}/content/<relPath>`.
 *
 * relPath np.: "_data/_manifest.json", "_data-fizjologia/slideshow-1205.json",
 * "_data/atlas.json".
 */
const SCRAPE = path.join(process.cwd(), "scripts", "scrape");
const BLOB_BASE = process.env.BLOB_BASE_URL?.replace(/\/+$/, "");

export async function readContentText(relPath: string): Promise<string | null> {
  const local = path.join(SCRAPE, relPath);
  if (existsSync(local)) {
    try {
      return await readFile(local, "utf8");
    } catch {
      /* spróbuj Blob */
    }
  }
  if (BLOB_BASE) {
    try {
      const res = await fetch(`${BLOB_BASE}/content/${relPath}`, {
        cache: "force-cache", // treść jest niezmienna
      });
      if (res.ok) return await res.text();
    } catch {
      /* brak połączenia → null */
    }
  }
  return null;
}

export async function readContentJson<T = unknown>(
  relPath: string
): Promise<T | null> {
  const text = await readContentText(relPath);
  if (text == null) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
