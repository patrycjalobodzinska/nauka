import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const metadata: Metadata = { title: "Talie fiszek WNL" };

async function listDecks() {
  const dir = path.join(process.cwd(), "scripts/scrape/_data");
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((f) => /^flashcards-\d+\.json$/.test(f));
  } catch {
    /* brak katalogu */
  }
  const items = await Promise.all(
    files.map(async (f) => {
      const id = Number(f.match(/(\d+)/)![1]);
      let name = "?";
      let count = 0;
      try {
        const j = JSON.parse(await readFile(path.join(dir, f), "utf8"));
        name = j.set?.name ?? "?";
        count = j.set?.count ?? j.cards?.length ?? 0;
      } catch {
        /* uszkodzony */
      }
      return { id, name, count };
    })
  );
  return items.sort((a, b) => a.id - b.id);
}

export default function DecksIndexPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Talie fiszek WNL</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Zawartość <code>scripts/scrape/_data/flashcards-*.json</code>.
      </p>
      <Suspense fallback={<p className="text-muted-foreground">Ładowanie…</p>}>
        <DeckList />
      </Suspense>
    </main>
  );
}

async function DeckList() {
  const items = await listDecks();
  if (!items.length) {
    return <p className="text-muted-foreground">Brak pobranych talii.</p>;
  }
  return (
    <ul className="divide-y rounded-xl border">
      {items.map((d) => (
        <li key={d.id}>
          <Link href={`/test/flashcards/${d.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-accent">
            <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground">{d.id}</span>
            <span className="flex-1 text-sm">{d.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{d.count} fiszek</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
