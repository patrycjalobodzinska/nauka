import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export type GridNode = {
  slug: string;
  title: string;
  emoji: string | null;
  slideshowId: number | null;
  /** Węzeł dodany przez użytkownika (oznaczony jako „dodatkowy"). */
  custom?: boolean;
};

/** Siatka kafelków-podtematów (linki do /topics/<slug>). */
export function ChildrenGrid({ nodes }: { nodes: GridNode[] }) {
  if (nodes.length === 0) return null;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {nodes.map((c) => (
        <li key={c.slug}>
          <Link
            href={`/topics/${c.slug}`}
            className="flex min-h-12 items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
          >
            <span className="text-lg">
              {c.emoji ?? (c.slideshowId != null ? "📄" : "📁")}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">
              {c.title}
            </span>
            {c.custom && (
              <Badge variant="secondary" className="shrink-0">
                dodatkowy
              </Badge>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
