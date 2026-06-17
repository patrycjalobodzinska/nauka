/**
 * Wgrywa treść offline (JSON kursów + obrazy) do Vercel Blob, żeby aplikacja
 * hostowana na Vercel miała z czego renderować (lokalne pliki są .gitignore i
 * NIE trafiają na Vercel). Pliki na dysku zostają nietknięte.
 *
 * Układ na Blob:
 *   content/<dir>/<plik>.json     (np. content/_data/_manifest.json)
 *   wnl-media/<bucket>/<plik>      (obrazy)
 *
 * Przy wgrywaniu JSON-y mają PRZEPISANE URL-e obrazów (gumlet/GCS → Blob), więc
 * na prod `localImage` jest przezroczyste (zwraca URL Blob osadzony w treści).
 *
 * Uruchom (Node 22, z .env.local dla BLOB_READ_WRITE_TOKEN):
 *   node --env-file=.env.local scripts/scrape/upload-blob.mjs            # pełny wgryw
 *   node --env-file=.env.local scripts/scrape/upload-blob.mjs --resume   # pomiń istniejące
 */
import { put, head } from "@vercel/blob";
import { readFile } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error("❌ Brak BLOB_READ_WRITE_TOKEN — uruchom z: node --env-file=.env.local …");
  process.exit(1);
}

const resume = process.argv.includes("--resume");
const ROOT = process.cwd();
const SCRAPE = path.join(ROOT, "scripts", "scrape");
const MEDIA = path.join(ROOT, "public", "wnl-media");
const CONCURRENCY = 16;

const CT = {
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".heic": "image/heic",
};

function listFiles(dir, keep) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (!keep || keep(p)) out.push(p);
    }
  };
  if (existsSync(dir)) walk(dir);
  return out;
}

async function pool(items, worker) {
  let i = 0;
  let done = 0;
  const run = async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        await worker(items[idx]);
      } catch (e) {
        console.error(`  ⚠️  ${items[idx]}: ${e.message}`);
      }
      if (++done % 200 === 0) console.log(`  …${done}/${items.length}`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length || 1) }, run));
}

const toPosix = (p) => p.split(path.sep).join("/");
const contentDirs = existsSync(SCRAPE)
  ? readdirSync(SCRAPE, { withFileTypes: true })
      .filter((d) => d.isDirectory() && (d.name === "_data" || d.name.startsWith("_data-")))
      .map((d) => d.name)
  : [];
const contentFiles = contentDirs.flatMap((d) =>
  listFiles(path.join(SCRAPE, d), (p) => p.endsWith(".json"))
);
const imageFiles = listFiles(MEDIA, (p) => !p.endsWith("_map.json"));

console.log(`Treść JSON: ${contentFiles.length} | obrazy: ${imageFiles.length}`);

// 1) baza Blob (origin) z markera
const marker = await put("content/_base.txt", "ok", {
  access: "public",
  token,
  addRandomSuffix: false,
  allowOverwrite: true,
  contentType: "text/plain",
});
const BASE = new URL(marker.url).origin;
console.log(`BLOB_BASE = ${BASE}`);

// 2) mapa online→blob z _map.json (deterministyczne ścieżki Blob)
const onlineToBlob = new Map();
for (const bucket of existsSync(MEDIA) ? readdirSync(MEDIA) : []) {
  const mf = path.join(MEDIA, bucket, "_map.json");
  if (!existsSync(mf)) continue;
  const entries = JSON.parse(await readFile(mf, "utf8"));
  for (const [url, file] of Object.entries(entries)) {
    onlineToBlob.set(url, `${BASE}/wnl-media/${bucket}/${file}`);
  }
}
console.log(`Mapa obrazów: ${onlineToBlob.size} URL-i`);
const URL_RE = /https:\/\/(?:media-manager\.gumlet\.io|storage\.googleapis\.com)\/[^"\\\s]+/g;
const rewrite = (t) => t.replace(URL_RE, (m) => onlineToBlob.get(m) ?? m);

async function alreadyThere(pathname) {
  try {
    await head(`${BASE}/${pathname}`, { token });
    return true;
  } catch {
    return false;
  }
}

console.log("⬆️  Obrazy…");
await pool(imageFiles, async (abs) => {
  const pathname = `wnl-media/${toPosix(path.relative(MEDIA, abs))}`;
  if (resume && (await alreadyThere(pathname))) return;
  await put(pathname, await readFile(abs), {
    access: "public",
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: CT[path.extname(abs).toLowerCase()] ?? "application/octet-stream",
  });
});

console.log("⬆️  Treść JSON (z przepisanymi URL-ami obrazów)…");
await pool(contentFiles, async (abs) => {
  const pathname = `content/${toPosix(path.relative(SCRAPE, abs))}`;
  if (resume && (await alreadyThere(pathname))) return;
  await put(pathname, rewrite(await readFile(abs, "utf8")), {
    access: "public",
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
});

console.log(`\n✅ Gotowe.`);
console.log(`   Ustaw w .env.local oraz w Vercel:  BLOB_BASE_URL=${BASE}`);
