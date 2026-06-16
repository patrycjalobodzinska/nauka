import { and, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { notes, attachments, type Section } from "@/db/schema";

/** Each (topic, section) pair owns one note — created lazily on first visit. */
export async function getOrCreateNote(topicId: string, section: Section) {
  const existing = await db.query.notes.findFirst({
    where: and(eq(notes.topicId, topicId), eq(notes.section, section)),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(notes)
    .values({ topicId, section, content: { blocks: [], canvas: null } })
    .returning();
  return created;
}

export async function getNoteById(noteId: string) {
  return db.query.notes.findFirst({
    where: eq(notes.id, noteId),
    with: { topic: true },
  });
}

export async function getNoteAttachments(noteId: string) {
  return db.query.attachments.findMany({
    where: eq(attachments.noteId, noteId),
    orderBy: [desc(attachments.createdAt)],
  });
}

/** Materiały (pliki) podpięte bezpośrednio pod temat. */
export async function getTopicAttachments(topicId: string) {
  return db.query.attachments.findMany({
    where: eq(attachments.topicId, topicId),
    orderBy: [desc(attachments.createdAt)],
  });
}

export async function getRecentNotes(limit = 6) {
  return db.query.notes.findMany({
    orderBy: [desc(notes.updatedAt)],
    limit,
    with: { topic: true },
  });
}
