"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Check, CloudUpload, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { saveNote } from "@/actions/notes";
import { cn } from "@/lib/utils";
import type { NoteContent } from "@/db/schema";

// tldraw is browser-only — load lazily, never on the server.
const CanvasBoard = dynamic(() => import("./canvas-board"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-xl" />,
});

type SaveState = "saved" | "pending" | "saving";

export function NoteEditor({
  noteId,
  initialTitle,
  initialContent,
  className,
}: {
  noteId: string;
  initialTitle: string;
  initialContent: NoteContent | null;
  className?: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const latest = useRef<{ title: string; canvas: unknown | null }>({
    title: initialTitle,
    canvas: initialContent?.canvas ?? null,
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    setSaveState("saving");
    const res = await saveNote(noteId, {
      title: latest.current.title,
      content: { blocks: [], canvas: latest.current.canvas },
    });
    setSaveState("saved");
    if ("savedAt" in res) {
      setSavedAt(
        new Date(res.savedAt).toLocaleTimeString("pl-PL", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
  }, [noteId]);

  // Debounced autosave: 1.5s after the last keystroke / pen stroke.
  const scheduleSave = useCallback(() => {
    setSaveState("pending");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 1500);
  }, [flush]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-3">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            latest.current.title = e.target.value;
            scheduleSave();
          }}
          placeholder="Tytuł notatki…"
          className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-muted-foreground/60"
        />
        <AutosaveIndicator state={saveState} savedAt={savedAt} />
      </div>

      <div className="relative flex-1 overflow-hidden rounded-xl border">
        <CanvasBoard
          initialSnapshot={initialContent?.canvas ?? null}
          onSnapshotChange={(snapshot) => {
            latest.current.canvas = snapshot;
            scheduleSave();
          }}
        />
      </div>
    </div>
  );
}

function AutosaveIndicator({
  state,
  savedAt,
}: {
  state: SaveState;
  savedAt: string | null;
}) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
      {state === "saving" && (
        <>
          <Loader2 className="size-3.5 animate-spin" /> Zapisywanie…
        </>
      )}
      {state === "pending" && (
        <>
          <CloudUpload className="size-3.5" /> Zmiany…
        </>
      )}
      {state === "saved" && (
        <>
          <Check className="size-3.5 text-primary" />
          {savedAt ? `Zapisano ${savedAt}` : "Zapisano"}
        </>
      )}
    </span>
  );
}
