import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/wnl/article-view";

export const metadata: Metadata = { title: "Artykuł WNL" };

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
      <Link href="/test/article" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Wszystkie lekcje
      </Link>
      <article className="article-prose">
        <Suspense fallback={<p className="text-muted-foreground">Ładowanie…</p>}>
          <ArticleView id={Number(id)} />
        </Suspense>
      </article>
    </main>
  );
}
