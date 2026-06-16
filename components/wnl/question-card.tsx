"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type QAnswer = { id: number; text: string; is_correct: boolean; explanation?: string };
export type Question = { id: number; text: string; explanation?: string; answers: QAnswer[] };

const LETTERS = "ABCDEFGH";

/** Pojedyncze pytanie: wybór odpowiedzi → odsłonięcie poprawnej + wyjaśnień. */
export function QuestionCard({ question, index }: { question: Question; index: number }) {
  const [picked, setPicked] = useState<number | null>(null);
  const revealed = picked !== null;

  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex gap-2">
        <span className="shrink-0 text-sm font-semibold text-muted-foreground">{index}.</span>
        <div
          className="article-prose flex-1 [&_p]:m-0"
          dangerouslySetInnerHTML={{ __html: question.text }}
        />
      </div>

      <ul className="space-y-1.5">
        {question.answers.map((a, i) => {
          const isPicked = picked === a.id;
          const state = !revealed
            ? "idle"
            : a.is_correct
              ? "correct"
              : isPicked
                ? "wrong"
                : "idle";
          return (
            <li key={a.id}>
              <button
                type="button"
                disabled={revealed}
                onClick={() => setPicked(a.id)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors",
                  state === "idle" && "hover:bg-muted/60",
                  state === "correct" && "border-emerald-500/50 bg-emerald-500/10",
                  state === "wrong" && "border-rose-500/50 bg-rose-500/10",
                  revealed && "cursor-default"
                )}
              >
                <span className="mt-0.5 font-semibold text-muted-foreground">{LETTERS[i] ?? "•"}</span>
                <span className="flex-1" dangerouslySetInnerHTML={{ __html: a.text }} />
                {state === "correct" && <Check className="size-4 shrink-0 text-emerald-600" />}
                {state === "wrong" && <X className="size-4 shrink-0 text-rose-600" />}
              </button>
              {revealed && a.explanation && (
                <div
                  className="article-prose mt-1 rounded-md bg-muted/50 p-2 pl-3 text-xs [&_p]:m-0"
                  dangerouslySetInnerHTML={{ __html: a.explanation }}
                />
              )}
            </li>
          );
        })}
      </ul>

      {revealed && question.explanation && (
        <div
          className="article-prose mt-3 rounded-md border-l-2 border-primary/50 bg-muted/40 p-3 text-sm [&_p]:m-0"
          dangerouslySetInnerHTML={{ __html: question.explanation }}
        />
      )}

      {!revealed && (
        <p className="mt-3 text-xs text-muted-foreground">Wybierz odpowiedź, aby zobaczyć rozwiązanie.</p>
      )}
    </article>
  );
}
