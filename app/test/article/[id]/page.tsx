import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/wnl/article-view";

export const metadata: Metadata = { title: "Artykuł WNL" };

export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
      <Link href="/test/article" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Wszystkie lekcje
      </Link>
      <article className="article-prose">
        <Suspense fallback={<p className="text-muted-foreground">Ładowanie…</p>}>
          <ArticleBody params={params} />
        </Suspense>
      </article>
    </main>
  );
}

async function ArticleBody({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  return <ArticleView id={Number(id)} />;
}
