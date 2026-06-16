import Link from "next/link";
import { ChevronLeft, ChevronRight, FolderUp } from "lucide-react";
import { cn } from "@/lib/utils";

type NavRef = { slug: string; title: string };

/**
 * Pasek nawigacji artykułu: powrót do nadrzędnej kategorii + poprzedni/następny
 * artykuł (rodzeństwo). Renderowany nad i pod treścią lekcji.
 */
export function ArticleNav({
  parent,
  prev,
  next,
  className,
}: {
  parent: { slug: string; title: string; emoji: string | null } | null;
  prev: NavRef | null;
  next: NavRef | null;
  className?: string;
}) {
  return (
    <nav className={cn("flex items-center justify-between gap-2 text-sm", className)}>
      {parent ? (
        <Link
          href={`/topics/${parent.slug}`}
          className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 transition-colors hover:bg-muted/60"
        >
          <FolderUp className="size-4 shrink-0" />
          <span className="truncate">
            {parent.emoji ? `${parent.emoji} ` : ""}
            {parent.title}
          </span>
        </Link>
      ) : (
        <span />
      )}

      <div className="flex shrink-0 items-center gap-1.5">
        {prev && (
          <Link
            href={`/topics/${prev.slug}`}
            title={prev.title}
            aria-label={`Poprzedni artykuł: ${prev.title}`}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 transition-colors hover:bg-muted/60"
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Poprzedni</span>
          </Link>
        )}
        {next && (
          <Link
            href={`/topics/${next.slug}`}
            title={next.title}
            aria-label={`Następny artykuł: ${next.title}`}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 transition-colors hover:bg-muted/60"
          >
            <span className="hidden sm:inline">Następny</span>
            <ChevronRight className="size-4" />
          </Link>
        )}
      </div>
    </nav>
  );
}
