import { notFound } from "next/navigation";
import { StudySession } from "@/components/flashcards/study-session";
import { getDeck, getStudyQueue } from "@/lib/flashcards";

export const metadata = { title: "Nauka fiszek" };

export default async function StudyPage({
  params,
}: {
  params: Promise<{ topicSlug: string; deckId: string }>;
}) {
  const { topicSlug, deckId } = await params;
  const deck = await getDeck(deckId);
  if (!deck || deck.topic.slug !== topicSlug) notFound();

  const { cards, cram } = await getStudyQueue(deckId);

  return (
    <StudySession
      cards={cards}
      cram={cram}
      deckTitle={deck.title}
      backHref={`/topics/${topicSlug}/flashcards`}
    />
  );
}
