"use server";

import { updateTag } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { topics } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { getOrCreateNote } from "@/lib/notes";
import { slugify } from "@/lib/utils";
import { isContentSlug } from "@/lib/wnl/content-tree";
import type { WnlRef } from "@/lib/constants";

/**
 * Kotwica = ukryty wiersz tematu powiązany z węzłem scrapowanym (wnlSlug).
 * Tworzona leniwie przy pierwszym dodaniu materiału/podtematu do tematu WNL.
 * Nie pojawia się w drzewie — służy tylko jako rodzic dla treści użytkownika.
 */
async function ensureAnchorTopic(userId: string, wnl: WnlRef) {
  const existing = await db.query.topics.findFirst({
    where: and(eq(topics.userId, userId), eq(topics.wnlSlug, wnl.slug)),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(topics)
    .values({
      userId,
      parentId: null,
      slug: wnl.slug, // slug kotwicy = slug WNL (unikalny, nie koliduje z węzłami użytkownika)
      title: wnl.title,
      emoji: wnl.emoji ?? null,
      slideshowId: wnl.slideshowId ?? null,
      wnlSlug: wnl.slug,
    })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  // wyścig: kotwica powstała równolegle
  const after = await db.query.topics.findFirst({
    where: and(eq(topics.userId, userId), eq(topics.wnlSlug, wnl.slug)),
  });
  if (!after) throw new Error("Nie udało się utworzyć kotwicy tematu");
  return after;
}

export async function createTopic(input: {
  title: string;
  emoji?: string | null;
  /** Rodzic = istniejący temat użytkownika. */
  parentId?: string | null;
  /** Rodzic = węzeł scrapowany (np. region „Embriologia") — utworzymy kotwicę. */
  parentWnl?: WnlRef | null;
}) {
  const user = await getCurrentUser();
  const title = input.title.trim();
  if (!title) return { error: "Tytuł nie może być pusty" };

  let parentId = input.parentId ?? null;
  if (!parentId && input.parentWnl) {
    const anchor = await ensureAnchorTopic(user.id, input.parentWnl);
    parentId = anchor.id;
  }

  // Slug unikalny per użytkownik ORAZ nie kolidujący z treścią WNL: "mitoza", "mitoza-2", …
  const base = slugify(title) || "temat";
  let slug = base;
  for (let i = 2; ; i++) {
    const clash = await db.query.topics.findFirst({
      where: and(eq(topics.userId, user.id), eq(topics.slug, slug)),
      columns: { id: true },
    });
    if (!clash && !(await isContentSlug(slug))) break;
    slug = `${base}-${i}`;
  }

  const [created] = await db
    .insert(topics)
    .values({
      userId: user.id,
      parentId,
      title,
      slug,
      emoji: input.emoji?.trim() || null,
    })
    .returning();

  updateTag("topic-tree");
  return { topic: created };
}

export async function renameTopic(id: string, title: string) {
  const trimmed = title.trim();
  if (!trimmed) return { error: "Tytuł nie może być pusty" };
  await db.update(topics).set({ title: trimmed }).where(eq(topics.id, id));
  updateTag("topic-tree");
  return { ok: true };
}

export async function deleteTopic(id: string) {
  // Kaskada: tematy-dzieci, notatki, talie, wiersze załączników.
  await db.delete(topics).where(eq(topics.id, id));
  updateTag("topic-tree");
  return { ok: true };
}

/**
 * Zwraca id tematu, do którego podpiąć materiał. Dla węzła użytkownika to jego
 * id; dla węzła scrapowanego tworzy (lub znajduje) kotwicę. Wołane z klienta
 * tuż przed wysłaniem pliku.
 */
export async function resolveTopicId(input: {
  topicId?: string | null;
  wnl?: WnlRef | null;
}) {
  const user = await getCurrentUser();
  if (input.topicId) return { topicId: input.topicId };
  if (input.wnl) {
    const anchor = await ensureAnchorTopic(user.id, input.wnl);
    return { topicId: anchor.id };
  }
  return { error: "Brak węzła docelowego" };
}

/** Otwórz/utwórz notatnik (jedna notatka „theory" na temat) i zwróć jej id. */
export async function openNotebook(input: {
  topicId?: string | null;
  wnl?: WnlRef | null;
}) {
  const user = await getCurrentUser();
  let topicId = input.topicId ?? null;
  if (!topicId && input.wnl) {
    const anchor = await ensureAnchorTopic(user.id, input.wnl);
    topicId = anchor.id;
  }
  if (!topicId) return { error: "Brak węzła docelowego" };

  const note = await getOrCreateNote(topicId, "theory");
  return { noteId: note.id };
}
