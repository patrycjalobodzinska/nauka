"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FlipCard } from "@/components/flashcards/flip-card";
import { reviewCard } from "@/actions/flashcards";
import type { Flashcard } from "@/db/schema";

export function StudySession({
  cards,
  cram,
  deckTitle,
  backHref,
}: {
  cards: Flashcard[];
  cram: boolean;
  deckTitle: string;
  backHref: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);

  const card = cards[index];
  const done = index >= cards.length;

  function grade(known: boolean) {
    if (!card) return;
    // Optimistic advance — the Leitner update happens in the background.
    startTransition(() => {
      reviewCard(card.id, known);
    });
    if (known) setKnownCount((c) => c + 1);
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  // Keyboard: Space = flip, ←/1 = again, →/2 = known
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done) return;
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && (e.key === "ArrowLeft" || e.key === "1")) {
        grade(false);
      } else if (flipped && (e.key === "ArrowRight" || e.key === "2")) {
        grade(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, done, index]);

  if (cards.length === 0) {
    return (
      <EmptyState backHref={backHref}>
        Ta talia nie ma jeszcze fiszek.
      </EmptyState>
    );
  }

  if (done) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
        <p className="text-5xl">🎉</p>
        <div>
          <h2 className="text-xl font-semibold">Sesja zakończona!</h2>
          <p className="text-muted-foreground">
            {knownCount}/{cards.length} fiszek opanowanych
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="min-h-11">
            <Link href={backHref}>
              <ArrowLeft className="size-4" /> Wróć do talii
            </Link>
          </Button>
          <Button onClick={() => router.refresh()} className="min-h-11">
            <RotateCcw className="size-4" /> Jeszcze raz
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-4 md:p-6">
      <div className="flex w-full max-w-xl items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="min-h-10">
          <Link href={backHref}>
            <ArrowLeft className="size-4" /> {deckTitle}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {cram && <Badge variant="secondary">Tryb powtórki całości</Badge>}
          <span className="text-sm tabular-nums text-muted-foreground">
            {index + 1} / {cards.length}
          </span>
        </div>
      </div>

      <Progress value={(index / cards.length) * 100} className="max-w-xl" />

      <FlipCard
        question={card.question}
        answer={card.answer}
        hint={card.hint}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
      />

      {flipped ? (
        <div className="flex w-full max-w-xl gap-3">
          <Button
            variant="outline"
            onClick={() => grade(false)}
            className="min-h-12 flex-1 border-rose-500/40 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
          >
            <ThumbsDown className="size-4" /> Powtórz
          </Button>
          <Button
            variant="outline"
            onClick={() => grade(true)}
            className="min-h-12 flex-1 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            <ThumbsUp className="size-4" /> Umiem
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Dotknij karty, aby zobaczyć odpowiedź
        </p>
      )}
    </div>
  );
}

function EmptyState({
  children,
  backHref,
}: {
  children: React.ReactNode;
  backHref: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-muted-foreground">{children}</p>
      <Button asChild variant="outline" className="min-h-11">
        <Link href={backHref}>
          <ArrowLeft className="size-4" /> Wróć
        </Link>
      </Button>
    </div>
  );
}
