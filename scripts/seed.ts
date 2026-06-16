/**
 * Seed drzewa tematów z pobranej treści WNL — WIEDZA PODSTAWOWA (przedkliniczna).
 * Buduje: Kurs (dziedzina) → Region (dział) → Lekcja (zagadnienie, z slideshowId).
 * Źródło: per kurs scripts/scrape/<dataDir>/_manifest.json (pole region per lekcja).
 *
 * UWAGA: ZASTĘPUJE istniejące tematy użytkownika (usuwa je wraz z notatkami/fiszkami).
 * Run: npm run db:seed
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });

/** Kursy „wiedzy podstawowej". match = filtr po nazwie kursu (gdy dataDir wspólny). */
type CourseCfg = { slug: string; title: string; emoji: string; dataDir: string; match?: RegExp };
const COURSES: CourseCfg[] = [
  { slug: "anatomia", title: "Anatomia", emoji: "🦴", dataDir: "_data", match: /Anatomii/i },
  { slug: "histologia", title: "Histologia", emoji: "🔬", dataDir: "_data", match: /Histologii/i },
  { slug: "fizjologia", title: "Fizjologia", emoji: "🫁", dataDir: "_data-fizjologia" },
  { slug: "patofizjologia", title: "Patofizjologia", emoji: "🔥", dataDir: "_data-patofizjologia" },
  { slug: "biochemia", title: "Biochemia", emoji: "🧪", dataDir: "_data-biochemia" },
  { slug: "mikrobiologia", title: "Mikrobiologia", emoji: "🦠", dataDir: "_data-mikrobiologia" },
  { slug: "farmakologia", title: "Farmakologia", emoji: "💊", dataDir: "_data-farmakologia" },
  { slug: "genetyka", title: "Genetyka", emoji: "🧬", dataDir: "_data-genetyka" },
];

type ManifestLesson = {
  id: number;
  name: string;
  slideshowIds: number[];
  course?: string;
  region?: string;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replaceAll("ł", "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function loadLessons(cfg: CourseCfg): ManifestLesson[] {
  const file = path.join("scripts", "scrape", cfg.dataDir, "_manifest.json");
  if (!existsSync(file)) return [];
  const all: ManifestLesson[] = JSON.parse(readFileSync(file, "utf8")).lessons ?? [];
  const ours = cfg.match ? all.filter((l) => cfg.match!.test(l.course ?? "")) : all;
  return ours.filter((l) => l.slideshowIds?.length);
}

async function main() {
  let user = await db.query.users.findFirst();
  if (!user) {
    [user] = await db
      .insert(schema.users)
      .values({ email: "patrycja.lobodzinska@cetuspro.com", name: "Patrycja" })
      .returning();
    console.log("✓ Utworzono użytkownika", user.email);
  }

  await db.delete(schema.topics).where(eq(schema.topics.userId, user.id));
  console.log("• Wyczyszczono poprzednie tematy.");

  const used = new Set<string>();
  const uniq = (base: string) => {
    const s = slugify(base) || "temat";
    let cand = s;
    for (let i = 2; used.has(cand); i++) cand = `${s}-${i}`;
    used.add(cand);
    return cand;
  };

  for (const [ci, cfg] of COURSES.entries()) {
    const lessons = loadLessons(cfg);
    if (!lessons.length) {
      console.log(`! ${cfg.title}: brak lekcji (${cfg.dataDir}/_manifest.json) — pomijam.`);
      continue;
    }

    const [courseTopic] = await db
      .insert(schema.topics)
      .values({ userId: user.id, title: cfg.title, slug: uniq(cfg.slug), emoji: cfg.emoji, position: ci })
      .returning();

    // regiony w kolejności pojawienia się w manifeście
    const regions: string[] = [];
    for (const l of lessons) {
      const r = l.region || "Inne";
      if (!regions.includes(r)) regions.push(r);
    }

    let lessonCount = 0;
    for (const [ri, region] of regions.entries()) {
      const [regionTopic] = await db
        .insert(schema.topics)
        .values({
          userId: user.id,
          parentId: courseTopic.id,
          title: region,
          slug: uniq(`${cfg.slug}-${region}`),
          emoji: "📂",
          position: ri,
        })
        .returning();

      const regionLessons = lessons.filter((l) => (l.region || "Inne") === region);
      await db.insert(schema.topics).values(
        regionLessons.map((l, li) => ({
          userId: user!.id,
          parentId: regionTopic.id,
          title: l.name,
          slug: uniq(l.name),
          emoji: "📄",
          slideshowId: l.slideshowIds[0] ?? null,
          position: li,
        }))
      );
      lessonCount += regionLessons.length;
    }
    const noRegion = regions.length === 1 && regions[0] === "Inne";
    console.log(`✓ ${cfg.emoji} ${cfg.title}: ${lessonCount} lekcji${noRegion ? " (bez regionów — manifest bez pola region)" : `, ${regions.length} regionów`}`);
  }

  console.log("Gotowe 🎉");
}

main().then(() => process.exit(0));
