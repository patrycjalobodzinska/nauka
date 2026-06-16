import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NoteEditor } from "@/components/editor/note-editor";
import { getNoteById } from "@/lib/notes";
import { SECTIONS } from "@/lib/constants";

export const metadata = { title: "Tryb skupienia" };

export default function FocusPage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="grid h-full place-items-center text-sm text-muted-foreground">
          Ładowanie…
        </div>
      }
    >
      <FocusBody params={params} />
    </Suspense>
  );
}

async function FocusBody({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;
  const note = await getNoteById(noteId);
  if (!note) notFound();

  const section = SECTIONS.find((s) => s.value === note.section)!;
  // Wyjście wraca do tematu (trasy per-sekcja nie istnieją). Dla kotwicy WNL
  // slug == wnlSlug, więc kieruje do właściwej strony tematu scrapowanego.
  const exitHref = `/topics/${note.topic.slug}`;

  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="truncate text-sm text-muted-foreground">
          {note.topic.emoji ?? ""} {note.topic.title} · {section.label}
        </p>
        <span className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="min-h-10">
            <Link href={exitHref}>
              <Minimize2 className="size-4" /> Wyjdź
            </Link>
          </Button>
        </span>
      </div>
      <NoteEditor
        noteId={note.id}
        initialTitle={note.title}
        initialContent={note.content}
        className="flex-1"
      />
    </div>
  );
}
