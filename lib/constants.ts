import type { Section } from "@/db/schema";

/**
 * Lekki wskaźnik na węzeł scrapowanej treści (offline content-tree). Przekazywany
 * z serwera do klienta, by leniwie utworzyć „kotwicę" (anchor topic) przy
 * pierwszym dodaniu materiału / podtematu do tematu WNL.
 */
export type WnlRef = {
  slug: string;
  title: string;
  emoji: string | null;
  slideshowId: number | null;
};

export const SECTIONS: {
  value: Section;
  slug: string;
  label: string;
  /** Section accent — carried through tabs, tree badges, card borders */
  color: string;
  dot: string;
}[] = [
  {
    value: "theory",
    slug: "theory",
    label: "Teoria",
    color:
      "text-sky-600 dark:text-sky-400 border-sky-500/40 data-[state=active]:bg-sky-500/10",
    dot: "bg-sky-500 dark:bg-sky-400",
  },
  {
    value: "practice",
    slug: "practice",
    label: "Zadania",
    color:
      "text-amber-600 dark:text-amber-400 border-amber-500/40 data-[state=active]:bg-amber-500/10",
    dot: "bg-amber-500 dark:bg-amber-400",
  },
  {
    value: "medical_extension",
    slug: "medical-extension",
    label: "Rozszerzenie medyczne",
    color:
      "text-rose-600 dark:text-rose-400 border-rose-500/40 data-[state=active]:bg-rose-500/10",
    dot: "bg-rose-500 dark:bg-rose-400",
  },
];

export function sectionFromSlug(slug: string) {
  return SECTIONS.find((s) => s.slug === slug);
}

/** Leitner box → days until next review */
export const LEITNER_INTERVALS_DAYS: Record<number, number> = {
  1: 0, // same day
  2: 1,
  3: 3,
  4: 7,
  5: 21,
};

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
export const ALLOWED_UPLOAD_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/svg+xml",
];
