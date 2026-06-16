"use server";

import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { attachments } from "@/db/schema";

/**
 * Called from the client after a successful direct-to-Blob upload.
 * (onUploadCompleted callbacks don't fire on localhost, so the client
 * records the row itself once `upload()` resolves.)
 */
export async function recordAttachment(input: {
  topicId?: string | null;
  noteId?: string | null;
  blobUrl: string;
  pathname: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const [row] = await db
    .insert(attachments)
    .values({
      topicId: input.topicId ?? null,
      noteId: input.noteId ?? null,
      blobUrl: input.blobUrl,
      pathname: input.pathname,
      filename: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    })
    .returning();
  return { attachment: row };
}

export async function removeAttachment(id: string) {
  const row = await db.query.attachments.findFirst({
    where: eq(attachments.id, id),
  });
  if (!row) return { error: "Nie znaleziono pliku" };

  await del(row.blobUrl); // remove from Vercel Blob
  await db.delete(attachments).where(eq(attachments.id, id));
  return { ok: true };
}
