"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { decks, flashcards } from "@/db/schema";
import { LEITNER_INTERVALS_DAYS } from "@/lib/constants";
import type { ParsedCard } from "@/lib/utils";

export async function importDeck(input: {
  topicId: string;
  title: string;
  cards: ParsedCard[];
}) {
  const title = input.title.trim();
  if (!title) return { error: "Nazwa talii nie może być pusta" };
  if (input.cards.length === 0) return { error: "Brak fiszek do importu" };

  const [deck] = await db
    .insert(decks)
    .values({ topicId: input.topicId, title })
    .returning();

  await db.insert(flashcards).values(
    input.cards.map((c) => ({
      deckId: deck.id,
      question: c.question,
      answer: c.answer,
      hint: c.hint ?? null,
    }))
  );

  return { deckId: deck.id, count: input.cards.length };
}

/** Leitner advance: known → next box (+interval); unknown → back to box 1, due now. */
export async function reviewCard(cardId: string, known: boolean) {
  const card = await db.query.flashcards.findFirst({
    where: eq(flashcards.id, cardId),
  });
  if (!card) return { error: "Nie znaleziono fiszki" };

  if (known) {
    const box = Math.min(card.box + 1, 5);
    const days = LEITNER_INTERVALS_DAYS[box] ?? 1;
    await db
      .update(flashcards)
      .set({
        box,
        dueAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      })
      .where(eq(flashcards.id, cardId));
  } else {
    await db
      .update(flashcards)
      .set({ box: 1, lapses: card.lapses + 1, dueAt: new Date() })
      .where(eq(flashcards.id, cardId));
  }
  return { ok: true };
}

export async function deleteDeck(deckId: string) {
  await db.delete(decks).where(eq(decks.id, deckId));
  return { ok: true };
}
