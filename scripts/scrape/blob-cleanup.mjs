/**
 * Usuwa WSZYSTKIE bloby ze store (zwalnia darmowy limit 1GB po nieudanej próbie).
 * Uruchom: node --env-file=.env.local scripts/scrape/blob-cleanup.mjs
 */
import { list, del } from "@vercel/blob";

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error("❌ Brak BLOB_READ_WRITE_TOKEN");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function delWithRetry(urls) {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      await del(urls, { token });
      return;
    } catch (e) {
      const wait = (e?.retryAfter ?? 5) * 1000;
      console.log(`  ⏳ rate limit — czekam ${wait / 1000}s…`);
      await sleep(wait + 500);
    }
  }
  throw new Error("del: przekroczono próby");
}

let cursor;
let total = 0;
do {
  const res = await list({ token, cursor, limit: 1000 });
  for (let i = 0; i < res.blobs.length; i += 100) {
    const chunk = res.blobs.slice(i, i + 100).map((b) => b.url);
    await delWithRetry(chunk);
    total += chunk.length;
    console.log(`  usunięto ${total}…`);
    await sleep(400);
  }
  cursor = res.cursor;
} while (cursor);

console.log(`✅ Usunięto ${total} blobów. Limit zwolniony.`);
