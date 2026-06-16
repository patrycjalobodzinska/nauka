"use client";

import { cn } from "@/lib/utils";

/**
 * 3D flip card — Tailwind v4 native 3D utilities
 * (perspective-distant / transform-3d / backface-hidden / rotate-y-180).
 * Tap anywhere (or Space) to flip.
 */
export function FlipCard({
  question,
  answer,
  hint,
  flipped,
  onFlip,
}: {
  question: string;
  answer: string;
  hint?: string | null;
  flipped: boolean;
  onFlip: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onFlip}
      className="perspective-distant block h-72 w-full max-w-xl cursor-pointer outline-none sm:h-80"
      aria-label={flipped ? "Pokaż pytanie" : "Pokaż odpowiedź"}
    >
      <div
        className={cn(
          "transform-3d relative h-full w-full transition-transform duration-500",
          flipped && "rotate-y-180"
        )}
      >
        {/* Front: question */}
        <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border bg-card p-8 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Pytanie
          </span>
          <p className="text-balance text-center text-xl font-medium leading-relaxed">
            {question}
          </p>
          {hint && (
            <p className="text-center text-sm text-muted-foreground">
              💡 {hint}
            </p>
          )}
        </div>

        {/* Back: answer */}
        <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border border-primary/40 bg-card p-8 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-widest text-primary">
            Odpowiedź
          </span>
          <p className="text-balance text-center text-xl leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </button>
  );
}
