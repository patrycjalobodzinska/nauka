/**
 * Skaluje pobrane obrazki w miejscu do max <W>px (sharp), JPEG q80. Tylko zmniejsza.
 * Lokalnie (bez sieci). Uruchom (Node 22!):
 *   npx tsx scripts/scrape/resize-media.ts public/wnl-media/anatomia-artykuly 1400
 */
import sharp from "sharp";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

async function main() {
  const dir = process.argv[2];
  const W = Number(process.argv[3] || 1400);
  if (!dir) {
    console.error("Użycie: resize-media.ts <katalog> [maxPx=1400]");
    process.exit(1);
  }
  const files = (await readdir(dir)).filter((f) => /\.jpg$/i.test(f));
  console.log(`Skaluję ${files.length} obrazków w ${dir} → max ${W}px (q80)…`);

  let i = 0, done = 0, skipped = 0, before = 0, after = 0;
  const worker = async () => {
    while (i < files.length) {
      const fp = path.join(dir, files[i++]);
      try {
        const buf = await readFile(fp);
        before += buf.length;
        const meta = await sharp(buf).metadata();
        if ((meta.width ?? 0) <= W && (meta.height ?? 0) <= W) {
          after += buf.length;
          skipped++;
        } else {
          const out = await sharp(buf).resize(W, W, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
          await writeFile(fp, out);
          after += out.length;
        }
      } catch (e) {
        console.log("✗", path.basename(fp), (e as Error).message);
      }
      if (++done % 500 === 0) console.log(`  …${done}/${files.length}`);
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  console.log(`Gotowe: ${(before / 1e6).toFixed(0)} MB → ${(after / 1e6).toFixed(0)} MB  (już-małe pominięte: ${skipped})`);
}

main().catch((e) => (console.error(e), process.exit(1)));
