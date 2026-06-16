"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FileText, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { removeAttachment } from "@/actions/attachments";
import type { Attachment } from "@/db/schema";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentCard({ attachment }: { attachment: Attachment }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isImage = attachment.mimeType.startsWith("image/");

  return (
    <div className="group flex items-center gap-3 rounded-lg border bg-card p-2 pr-1">
      <a
        href={attachment.blobUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        {isImage ? (
          <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
            <Image
              src={attachment.blobUrl}
              alt={attachment.filename}
              fill
              sizes="48px"
              className="object-cover"
            />
          </span>
        ) : (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
            <FileText className="size-5 text-rose-600 dark:text-rose-400" />
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">
            {attachment.filename}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatSize(attachment.sizeBytes)}
          </span>
        </span>
      </a>
      <Button
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
        disabled={pending}
        aria-label={`Usuń ${attachment.filename}`}
        onClick={() => {
          if (!window.confirm(`Usunąć plik „${attachment.filename}"?`)) return;
          startTransition(async () => {
            const res = await removeAttachment(attachment.id);
            if ("error" in res && res.error) toast.error(res.error);
            else {
              toast.success("Plik usunięty");
              router.refresh();
            }
          });
        }}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4" />
        )}
      </Button>
    </div>
  );
}
