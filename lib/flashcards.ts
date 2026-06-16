import { and, asc, eq, lte, count } from "drizzle-orm";
import { db } from "@/db";
import { decks, flashcards } from "@/db/schema";

export type DeckWithStats = {
  id: string;
  title: string;
  createdAt: Date;
  total: number;
  due: number;
};

export async function getDecksWithStats(
  topicId: string
): Promise<DeckWithStats[]> {
  const rows = await db.query.decks.findMany({
    where: eq(decks.topicId, topicId),
    with: { cards: { columns: { id: true, dueAt: true, suspended: true } } },
  });
  const now = new Date();
  return rows.map((d) => ({
    id: d.id,
    title: d.title,
    createdAt: d.createdAt,
    total: d.cards.length,
    due: d.cards.filter((c) => !c.suspended && c.dueAt <= now).length,
  }));
}

export async function getDeck(deckId: string) {
  return db.query.decks.findFirst({
    where: eq(decks.id, deckId),
    with: { topic: true },
  });
}

/** Due cards first; if nothing is due, fall back to the whole deck (cram mode). */
export async function getStudyQueue(deckId: string) {
  const due = await db.query.flashcards.findMany({
    where: and(
      eq(flashcards.deckId, deckId),
      eq(flashcards.suspended, false),
      lte(flashcards.dueAt, new Date())
    ),
    orderBy: [asc(flashcards.dueAt)],
  });
  if (due.length > 0) return { cards: due, cram: false };

  const all = await db.query.flashcards.findMany({
    where: and(
      eq(flashcards.deckId, deckId),
      eq(flashcards.suspended, false)
    ),
    orderBy: [asc(flashcards.createdAt)],
  });
  return { cards: all, cram: true };
}

export async function getTotalDueCount(): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(flashcards)
    .where(
      and(eq(flashcards.suspended, false), lte(flashcards.dueAt, new Date()))
    );
  return row?.value ?? 0;
}
