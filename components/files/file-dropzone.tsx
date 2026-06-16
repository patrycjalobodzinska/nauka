"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { CloudUpload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { recordAttachment } from "@/actions/attachments";
import { resolveTopicId } from "@/actions/topics";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  type WnlRef,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export function FileDropzone({
  noteId,
  topicId,
  wnl,
}: {
  noteId?: string;
  topicId?: string;
  /** Węzeł scrapowany — gdy brak topicId, utworzymy kotwicę przy pierwszym pliku. */
  wnl?: WnlRef;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    try {
      // Ustal temat docelowy (dla węzła WNL leniwie tworzy kotwicę).
      let targetTopicId = topicId ?? null;
      if (!targetTopicId && wnl) {
        const res = await resolveTopicId({ wnl });
        if ("error" in res) {
          toast.error(res.error);
          return;
        }
        targetTopicId = res.topicId;
      }
      for (const file of list) {
        if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
          toast.error(`${file.name}: nieobsługiwany typ pliku`);
          continue;
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          toast.error(`${file.name}: plik większy niż 50 MB`);
          continue;
        }
        // Direct browser→Blob upload (token from our route handler)…
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
        });
        // …then record the attachment row.
        await recordAttachment({
          noteId: noteId ?? null,
          topicId: targetTopicId,
          blobUrl: blob.url,
          pathname: blob.pathname,
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        });
        toast.success(`Dodano ${file.name}`);
      }
      router.refresh();
    } catch (e) {
      toast.error(`Błąd wysyłania: ${(e as Error).message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex min-h-20 cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed p-4 text-sm transition-colors",
        dragging
          ? "border-primary bg-primary/5 text-primary"
          : "border-border text-muted-foreground hover:border-primary/40"
      )}
    >
      {uploading ? (
        <>
          <Loader2 className="size-5 animate-spin" /> Wysyłanie…
        </>
      ) : (
        <>
          <CloudUpload className="size-5" />
          Upuść PDF lub obraz, albo dotknij aby wybrać
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED_UPLOAD_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
