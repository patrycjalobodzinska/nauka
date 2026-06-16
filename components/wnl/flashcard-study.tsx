"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Deck } from "@/lib/wnl/build-flashcards";

export function FlashcardStudy({ deck }: { deck: Deck }) {
  const cards = deck.cards;
  const n = cards.length;
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const go = useCallback(
    (d: number) => {
      setRevealed(false);
      setI((p) => (p + d + n) % n);
    },
    [n]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setRevealed((r) => (r ? (go(1), false) : true));
      } else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (!n) return <p className="text-muted-foreground">Talia jest pusta.</p>;
  const card = cards[i];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="tabular-nums">
          {i + 1} / {n}
        </span>
        {card.tags[0] && <span className="rounded-full border px-2 py-0.5 text-xs">{card.tags[0]}</span>}
      </div>

      {/* Karta */}
      <div className="overflow-hidden rounded-2xl border bg-card">
        {/* Przód */}
        <div className="flex min-h-[280px] items-center justify-center p-4">
          {card.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.image} alt="" className="max-h-[420px] w-auto rounded-lg" />
          ) : card.frontHtml ? (
            <div className="article-prose text-center" dangerouslySetInnerHTML={{ __html: card.frontHtml }} />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageOff className="size-8" />
              <span className="text-xs">obrazek niepobrany — uruchom pobieracz fiszek</span>
            </div>
          )}
        </div>

        {/* Tył */}
        {revealed ? (
          <div className="border-t bg-background/40 p-4">
            <div className="article-prose text-center" dangerouslySetInnerHTML={{ __html: card.back }} />
            {card.hint && <p className="mt-2 text-center text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: card.hint }} />}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="flex w-full items-center justify-center gap-2 border-t py-3 text-sm font-medium transition hover:bg-accent"
          >
            <Eye className="size-4" /> Pokaż odpowiedź <kbd className="ml-1 rounded border px-1 text-xs">spacja</kbd>
          </button>
        )}
      </div>

      {/* Nawigacja */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(-1)}
          className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm transition hover:bg-accent"
        >
          <ChevronLeft className="size-4" /> Wstecz
        </button>
        <button
          type="button"
          onClick={() => (revealed ? go(1) : setRevealed(true))}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm transition",
            revealed ? "border hover:bg-accent" : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {revealed ? (
            <>
              Następna <ChevronRight className="size-4" />
            </>
          ) : (
            "Pokaż odpowiedź"
          )}
        </button>
      </div>
    </div>
  );
}
