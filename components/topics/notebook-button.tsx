"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { NotebookPen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { openNotebook } from "@/actions/topics";
import type { WnlRef } from "@/lib/constants";

/** Otwiera/tworzy notatnik (tldraw) dla danego węzła i przechodzi w tryb skupienia. */
export function NotebookButton({
  topicId,
  wnl,
}: {
  topicId?: string | null;
  wnl?: WnlRef | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await openNotebook({
            topicId: topicId ?? null,
            wnl: wnl ?? null,
          });
          if ("error" in res) {
            toast.error(res.error);
            return;
          }
          router.push(`/focus/${res.noteId}`);
        })
      }
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <NotebookPen className="size-4" />
      )}
      Notatnik
    </Button>
  );
}
