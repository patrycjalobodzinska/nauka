import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

// Indeks pobranych lekcji WNL z scripts/scrape/_data/. Dynamiczny — po
// `npm run scrape:harvest` od razu pokazuje nowe pliki. Otwórz: /test/article
export const metadata: Metadata = { title: "Pobrane lekcje WNL" };

async function listLessons() {
  const dir = path.join(process.cwd(), "scripts/scrape/_data");
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((f) => /^slideshow-\d+\.json$/.test(f));
  } catch {
    /* katalog jeszcze nie istnieje */
  }
  const items = await Promise.all(
    files.map(async (f) => {
      const id = Number(f.match(/(\d+)/)![1]);
      let name = "?";
      try {
        name = JSON.parse(await readFile(path.join(dir, f), "utf8")).content_blocks_structure_name ?? "?";
      } catch {
        /* uszkodzony plik */
      }
      return { id, name };
    })
  );
  return items.sort((a, b) => a.id - b.id);
}

export default function LessonsIndexPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Pobrane lekcje WNL</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Zawartość <code>scripts/scrape/_data/</code>. Dograj kolejne: <code>npm run scrape:harvest -- --course</code>
      </p>
      <Suspense fallback={<p className="text-muted-foreground">Ładowanie…</p>}>
        <LessonList />
      </Suspense>
    </main>
  );
}

async function LessonList() {
  const items = await listLessons();
  if (!items.length) {
    return (
      <p className="text-muted-foreground">
        Brak pobranych lekcji. Uruchom <code>npm run scrape:auth</code>, a potem{" "}
        <code>npm run scrape:harvest -- --course</code>.
      </p>
    );
  }
  return (
    <>
      <p className="mb-3 text-sm text-muted-foreground">{items.length} lekcji</p>
      <ul className="divide-y rounded-xl border">
        {items.map((l) => (
          <li key={l.id}>
            <Link
              href={`/test/article/${l.id}`}
              className="flex items-center gap-3 px-4 py-3 transition hover:bg-accent"
            >
              <span className="w-14 shrink-0 font-mono text-xs text-muted-foreground">{l.id}</span>
              <span className="text-sm">{l.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
