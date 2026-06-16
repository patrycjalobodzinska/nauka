"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteDeck } from "@/actions/flashcards";

export function DeleteDeckButton({
  deckId,
  title,
}: {
  deckId: string;
  title: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
      disabled={pending}
      aria-label={`Usuń talię ${title}`}
      onClick={() => {
        if (!window.confirm(`Usunąć talię „${title}" ze wszystkimi fiszkami?`))
          return;
        startTransition(async () => {
          await deleteDeck(deckId);
          toast.success("Talia usunięta");
          router.refresh();
        });
      }}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}
    </Button>
  );
}
