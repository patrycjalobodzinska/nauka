"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createTopic } from "@/actions/topics";
import type { WnlRef } from "@/lib/constants";

export function NewTopicDialog({
  parentId,
  parentWnl,
  parentTitle,
  triggerLabel,
  open,
  onOpenChange,
}: {
  parentId?: string;
  /** Rodzic = węzeł scrapowany (np. region WNL). */
  parentWnl?: WnlRef;
  parentTitle?: string;
  /** Gdy podane, wyzwalacz to przycisk z etykietą zamiast ikony „+". */
  triggerLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const res = await createTopic({
        title,
        emoji: emoji || null,
        parentId: parentId ?? null,
        parentWnl: parentWnl ?? null,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(`Dodano temat „${res.topic.title}"`);
      setTitle("");
      setEmoji("");
      setOpen(false);
      router.push(`/topics/${res.topic.slug}`);
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {triggerLabel ? (
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="size-4" />
              {triggerLabel}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              aria-label="Dodaj temat"
            >
              <Plus className="size-4" />
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {parentTitle ? `Nowy podtemat w „${parentTitle}"` : "Nowy temat"}
          </DialogTitle>
          <DialogDescription>
            Temat dostanie sekcje: Teoria, Zadania i Rozszerzenie medyczne.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex gap-2"
        >
          <Input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="🧬"
            className="w-16 text-center"
            maxLength={4}
          />
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="np. Układ krążenia"
            autoFocus
          />
        </form>
        <DialogFooter>
          <Button onClick={submit} disabled={pending || !title.trim()}>
            {pending ? "Dodawanie…" : "Dodaj temat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
