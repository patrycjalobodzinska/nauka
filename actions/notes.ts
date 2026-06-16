"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notes, type NoteContent } from "@/db/schema";

/** Debounced autosave target — called from the editor every ~1.5s of idle. */
export async function saveNote(
  noteId: string,
  data: { title?: string; content?: NoteContent }
) {
  await db
    .update(notes)
    .set({
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      updatedAt: new Date(),
    })
    .where(eq(notes.id, noteId));
  return { ok: true, savedAt: new Date().toISOString() };
}
