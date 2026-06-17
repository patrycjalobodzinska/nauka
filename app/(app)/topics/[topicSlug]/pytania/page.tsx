import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { QuestionCard, type Question } from "@/components/wnl/question-card";
import { courseExtras } from "@/lib/wnl/course-extras";
import { readContentJson } from "@/lib/wnl/content-store";

const PER_PAGE = 15;

async function loadQuestions(extras: { questions?: string; dataDir?: string }): Promise<Question[]> {
  if (!extras.questions) return [];
  const json = await readContentJson<Question[] | { questions?: Question[] }>(
    `${extras.dataDir ?? "_data"}/${extras.questions}`
  );
  if (!json) return [];
  return Array.isArray(json) ? json : (json.questions ?? []);
}

export default function QuestionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <p className="mx-auto w-full max-w-3xl text-sm text-muted-foreground">
          Ładowanie pytań…
        </p>
      }
    >
      <QuestionsBody params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function QuestionsBody({
  params,
  searchParams,
}: {
  params: Promise<{ topicSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { topicSlug } = await params;
  const { page } = await searchParams;
  const extras = courseExtras(topicSlug);
  if (!extras?.questions) notFound();

  const all = await loadQuestions(extras);
  if (!all.length) notFound();

  const pages = Math.ceil(all.length / PER_PAGE);
  const current = Math.min(Math.max(1, Number(page) || 1), pages);
  const slice = all.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const pager = (
    <div className="flex items-center justify-between gap-2">
      <Button asChild variant="outline" size="sm" className={current <= 1 ? "pointer-events-none opacity-50" : ""}>
        <Link href={`/topics/${topicSlug}/pytania?page=${current - 1}`} aria-disabled={current <= 1}>← Poprzednie</Link>
      </Button>
      <span className="text-sm text-muted-foreground">
        Strona {current}/{pages} · {all.length} pytań
      </span>
      <Button asChild variant="outline" size="sm" className={current >= pages ? "pointer-events-none opacity-50" : ""}>
        <Link href={`/topics/${topicSlug}/pytania?page=${current + 1}`} aria-disabled={current >= pages}>Następne →</Link>
      </Button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Pytania</h1>
      {pager}
      <div className="space-y-3">
        {slice.map((q, i) => (
          <QuestionCard key={q.id} question={q} index={(current - 1) * PER_PAGE + i + 1} />
        ))}
      </div>
      {pager}
    </div>
  );
}
