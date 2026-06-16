"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Import } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { importDeck } from "@/actions/flashcards";
import { parseFlashcards } from "@/lib/utils";

const PLACEHOLDER = `# Format: Pytanie | Odpowiedź | Podpowiedź (opcjonalna)
Co to jest mozaika płynna? | Model błony komórkowej | Singer & Nicolson
Ile chromosomów ma człowiek? | 46 (23 pary)

# albo JSON:
# [{ "q": "...", "a": "..." }]`;

export function DeckImportDialog({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [raw, setRaw] = useState("");
  const [pending, startTransition] = useTransition();

  const parsed = useMemo(() => parseFlashcards(raw), [raw]);

  async function onFile(file: File) {
    const text = await file.text();
    setRaw(text);
    if (!title) setTitle(file.name.replace(/\.(txt|json|csv)$/i, ""));
  }

  function submit() {
    startTransition(async () => {
      const res = await importDeck({ topicId, title, cards: parsed.cards });
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Zaimportowano ${parsed.cards.length} fiszek`);
      setOpen(false);
      setTitle("");
      setRaw("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="min-h-11">
          <Import className="size-4" /> Importuj fiszki
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import fiszek</DialogTitle>
          <DialogDescription>
            Wklej tekst w formacie{" "}
            <code className="rounded bg-muted px-1">Pytanie | Odpowiedź</code>{" "}
            (lub JSON), albo upuść plik .txt / .json.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nazwa talii, np. Błony biologiczne"
          />

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) onFile(file);
            }}
          >
            <Textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={PLACEHOLDER}
              className="min-h-40 font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <FileUp className="size-4" />
              Wybierz plik
              <input
                type="file"
                accept=".txt,.json,.csv,text/plain,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFile(file);
                }}
              />
            </label>
            <p className="text-sm">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {parsed.cards.length} fiszek
              </span>
              {parsed.errors.length > 0 && (
                <span className="ml-2 font-medium text-rose-600 dark:text-rose-400">
                  {parsed.errors.length} błędów
                </span>
              )}
            </p>
          </div>

          {(parsed.cards.length > 0 || parsed.errors.length > 0) && (
            <ScrollArea className="h-40 rounded-md border">
              <div className="space-y-1 p-2 text-xs">
                {parsed.errors.map((err, i) => (
                  <p key={`e${i}`} className="text-rose-600 dark:text-rose-400">
                    Linia {err.line}: {err.reason} —{" "}
                    <span className="opacity-70">{err.raw}</span>
                  </p>
                ))}
                {parsed.cards.slice(0, 30).map((c, i) => (
                  <p key={i} className="truncate text-muted-foreground">
                    <span className="text-foreground">{c.question}</span> →{" "}
                    {c.answer}
                  </p>
                ))}
                {parsed.cards.length > 30 && (
                  <p className="italic">…i {parsed.cards.length - 30} więcej</p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={submit}
            disabled={pending || !title.trim() || parsed.cards.length === 0}
            className="min-h-11"
          >
            {pending
              ? "Importowanie…"
              : `Importuj ${parsed.cards.length} fiszek`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
