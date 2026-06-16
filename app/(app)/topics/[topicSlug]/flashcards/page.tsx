import Link from "next/link";
import { notFound } from "next/navigation";
import { GraduationCap, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeckImportDialog } from "@/components/flashcards/deck-import-dialog";
import { DeleteDeckButton } from "@/components/flashcards/delete-deck-button";
import { getCurrentUser } from "@/lib/current-user";
import { getTopicBySlug } from "@/lib/topics";
import { getDecksWithStats } from "@/lib/flashcards";

export const metadata = { title: "Fiszki" };

export default async function FlashcardsPage({
  params,
}: {
  params: Promise<{ topicSlug: string }>;
}) {
  const { topicSlug } = await params;
  const user = await getCurrentUser();
  const topic = await getTopicBySlug(user.id, topicSlug);
  if (!topic) notFound();

  const decks = await getDecksWithStats(topic.id);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">
          {topic.emoji ? `${topic.emoji} ` : ""}
          {topic.title} — fiszki
        </h1>
        <DeckImportDialog topicId={topic.id} />
      </div>

      {decks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <Layers className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            Brak talii — zaimportuj fiszki w formacie{" "}
            <code className="rounded bg-muted px-1 text-xs">
              Pytanie | Odpowiedź
            </code>
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <Card key={deck.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-start justify-between gap-2 text-base">
                  <span className="truncate">{deck.title}</span>
                  <DeleteDeckButton deckId={deck.id} title={deck.title} />
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-auto space-y-3">
                <div className="flex gap-2">
                  <Badge variant="secondary">{deck.total} fiszek</Badge>
                  {deck.due > 0 && (
                    <Badge className="bg-primary/15 text-primary">
                      {deck.due} do powtórki
                    </Badge>
                  )}
                </div>
                <Button asChild className="min-h-11 w-full">
                  <Link
                    href={`/topics/${topicSlug}/flashcards/${deck.id}/study`}
                  >
                    <GraduationCap className="size-4" />
                    {deck.due > 0 ? `Powtórz (${deck.due})` : "Ucz się"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
