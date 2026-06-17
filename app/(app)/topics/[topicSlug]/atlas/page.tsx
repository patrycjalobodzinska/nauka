import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { courseExtras } from "@/lib/wnl/course-extras";
import { localImage } from "@/lib/wnl/media-map";
import { readContentJson } from "@/lib/wnl/content-store";
import { AtlasGallery } from "@/components/wnl/atlas-gallery";

type AtlasItem = { id: string; name: string; image: string; images?: string[]; category: string };
type Atlas = { total: number; categories: string[]; items: AtlasItem[] };

async function loadAtlas(extras: { atlas?: string; dataDir?: string }): Promise<Atlas | null> {
  if (!extras.atlas) return null;
  return readContentJson<Atlas>(`${extras.dataDir ?? "_data"}/${extras.atlas}`);
}

export default function AtlasPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicSlug: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  // Dane dynamiczne (params/searchParams) czytane wewnątrz Suspense — powłoka trasy.
  return (
    <Suspense
      fallback={
        <p className="mx-auto w-full max-w-5xl text-sm text-muted-foreground">
          Ładowanie atlasu…
        </p>
      }
    >
      <AtlasBody params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function AtlasBody({
  params,
  searchParams,
}: {
  params: Promise<{ topicSlug: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { topicSlug } = await params;
  const { cat } = await searchParams;
  const extras = courseExtras(topicSlug);
  if (!extras?.atlas) notFound();

  const atlas = await loadAtlas(extras);
  if (!atlas) notFound();

  const active = cat && atlas.categories.includes(cat) ? cat : atlas.categories[0];
  const items = atlas.items.filter((it) => it.category === active);
  const countByCat = (c: string) => atlas.items.filter((it) => it.category === c).length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Atlas</h1>
        <span className="text-sm text-muted-foreground">{atlas.total} rycin · {atlas.categories.length} kategorii</span>
      </div>

      {/* wybór kategorii — kafelki zawijają się do kolejnych wierszy (bez scrolla X) */}
      <nav className="flex flex-wrap gap-1.5">
        {atlas.categories.map((c) => (
          <Link
            key={c}
            href={`/topics/${topicSlug}/atlas?cat=${encodeURIComponent(c)}`}
            scroll={false}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm leading-snug break-words transition-colors",
              c === active
                ? "border-transparent bg-primary text-primary-foreground"
                : "hover:bg-muted/60 text-muted-foreground"
            )}
          >
            {c} <span className="opacity-60">{countByCat(c)}</span>
          </Link>
        ))}
      </nav>

      {/* ryciny wybranej kategorii: siatka (desktop) / karuzela (mobile) + viewer z zoomem */}
      <AtlasGallery
        key={active}
        items={items.map((it) => ({
          id: it.id,
          name: it.name,
          src: localImage(it.image) ?? it.image,
        }))}
      />
    </div>
  );
}
