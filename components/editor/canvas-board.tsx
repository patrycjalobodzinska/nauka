"use client";

import { useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import { Tldraw, getSnapshot, type Editor, type TLEditorSnapshot } from "tldraw";
import "tldraw/tldraw.css";

/**
 * tldraw canvas: text + freehand stylus drawing (Apple Pencil pressure
 * works out of the box). Emits a fresh snapshot on every user change;
 * the parent owns debouncing and persistence.
 */
export default function CanvasBoard({
  initialSnapshot,
  onSnapshotChange,
}: {
  initialSnapshot: unknown | null;
  onSnapshotChange: (snapshot: unknown) => void;
}) {
  const { resolvedTheme } = useTheme();
  const cleanup = useRef<(() => void) | null>(null);

  const handleMount = useCallback(
    (editor: Editor) => {
      cleanup.current?.();
      cleanup.current = editor.store.listen(
        () => onSnapshotChange(getSnapshot(editor.store)),
        { scope: "document", source: "user" }
      );
    },
    [onSnapshotChange]
  );

  return (
    <div className="absolute inset-0">
      <Tldraw
        snapshot={(initialSnapshot as TLEditorSnapshot) ?? undefined}
        onMount={handleMount}
        colorScheme={resolvedTheme === "light" ? "light" : "dark"}
      />
    </div>
  );
}
