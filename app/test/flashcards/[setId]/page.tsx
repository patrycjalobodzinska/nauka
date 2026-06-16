import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildDeck } from "@/lib/wnl/build-flashcards";
import { FlashcardStudy } from "@/components/wnl/flashcard-study";

export const metadata: Metadata = { title: "Fiszki WNL" };

export default function FlashcardsPage({ params }: { params: Promise<{ setId: string }> }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8">
      <Link href="/test/flashcards" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Wszystkie talie
      </Link>
      <Suspense fallback={<p className="text-muted-foreground">Ładowanie…</p>}>
        <Deck params={params} />
      </Suspense>
    </main>
  );
}

async function Deck({ params }: { params: Promise<{ setId: string }> }) {
  const { setId: rawSetId } = await params;
  if (!/^\d+$/.test(rawSetId)) notFound();
  const setId = Number(rawSetId);
  const file = path.join(process.cwd(), "scripts/scrape/_data", `flashcards-${setId}.json`);
  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch {
    return (
      <div className="article-prose">
        <h1>Talia {setId} nie jest pobrana</h1>
        <p>
          Brak <code>scripts/scrape/_data/flashcards-{setId}.json</code>.
        </p>
      </div>
    );
  }
  const deck = buildDeck(JSON.parse(raw));
  const withImg = deck.cards.filter((c) => c.image).length;
  return (
    <>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">{deck.set.name}</h1>
        <p className="text-sm text-muted-foreground">
          {deck.set.count} fiszek{withImg < deck.cards.length ? ` · ${withImg} z obrazkiem (reszta do dociągnięcia)` : ""}
        </p>
      </header>
      <FlashcardStudy deck={deck} />
    </>
  );
}
