import { Suspense } from "react";
import {
  getContentNode,
  getContentNav,
  type ContentNode,
} from "@/lib/wnl/content-tree";
import { ArticleView } from "@/components/wnl/article-view";
import { ArticleNav } from "@/components/wnl/article-nav";
import { ChildrenGrid } from "@/components/topics/children-grid";
import { TopicExtras } from "@/components/topics/topic-extras";
import { UserTopicView } from "@/components/topics/user-topic-view";

function ExtrasFallback() {
  return (
    <p className="mt-10 border-t pt-6 text-sm text-muted-foreground">
      Ładowanie materiałów…
    </p>
  );
}

function ArticleLeaf({ node }: { node: ContentNode }) {
  const nav = getContentNav(node.slug);
  const hasNav = nav && (nav.parent || nav.prev || nav.next);
  return (
    <>
      {hasNav && (
        <ArticleNav
          parent={nav.parent}
          prev={nav.prev}
          next={nav.next}
          className="mb-4"
        />
      )}
      <article className="article-prose">
        <ArticleView id={node.slideshowId!} dataDir={node.dataDir} />
      </article>
      {hasNav && (
        <ArticleNav
          parent={nav.parent}
          prev={nav.prev}
          next={nav.next}
          className="mt-8"
        />
      )}
    </>
  );
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topicSlug: string }>;
}) {
  const { topicSlug } = await params;
  const scraped = getContentNode(topicSlug);

  // Węzeł utworzony przez użytkownika (wymaga DB) — całość w Suspense.
  if (!scraped) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <Suspense fallback={<ExtrasFallback />}>
          <UserTopicView slug={topicSlug} />
        </Suspense>
      </div>
    );
  }

  const wnl = {
    slug: scraped.slug,
    title: scraped.title,
    emoji: scraped.emoji,
    slideshowId: scraped.slideshowId,
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      {scraped.slideshowId != null ? (
        // Liść (lekcja) → artykuł WNL z nawigacją (powrót + poprzedni/następny).
        <ArticleLeaf node={scraped} />
      ) : (
        // Folder (kurs/region) → lista podtematów.
        <>
          <h1 className="mb-4 text-2xl font-semibold tracking-tight">
            {scraped.emoji ? `${scraped.emoji} ` : ""}
            {scraped.title}
          </h1>
          {scraped.children.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak podtematów.</p>
          ) : (
            <ChildrenGrid
              nodes={scraped.children.map((c) => ({
                slug: c.slug,
                title: c.title,
                emoji: c.emoji,
                slideshowId: c.slideshowId,
              }))}
            />
          )}
        </>
      )}

      {/* Materiały i tematy dodatkowe (z bazy) — strumieniowane po treści WNL. */}
      <Suspense fallback={<ExtrasFallback />}>
        <TopicExtras wnl={wnl} />
      </Suspense>
    </div>
  );
}
