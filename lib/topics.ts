import { cacheLife, cacheTag } from "next/cache";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import { topics, type Topic } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { getContentTree, type ContentNode } from "@/lib/wnl/content-tree";

export type TopicNode = Topic & { children: TopicNode[] };

/**
 * Wszystkie tematy użytkownika (płasko) — hottest read w drzewie bocznym.
 * Cache'owane i unieważniane przez updateTag("topic-tree") z akcji na tematach.
 * Zawiera też wiersze-kotwice (wnlSlug != null).
 */
export async function getUserTopicsFlat(userId: string): Promise<Topic[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("topic-tree");

  return db.query.topics.findMany({
    where: eq(topics.userId, userId),
    orderBy: [asc(topics.position), asc(topics.createdAt)],
  });
}

export async function getTopicBySlug(userId: string, slug: string) {
  return db.query.topics.findFirst({
    where: and(eq(topics.userId, userId), eq(topics.slug, slug)),
  });
}

/** Kotwica dla węzła scrapowanego (po wnlSlug). null = brak — nie dodano jeszcze nic. */
export async function getAnchorByWnlSlug(userId: string, wnlSlug: string) {
  return db.query.topics.findFirst({
    where: and(eq(topics.userId, userId), eq(topics.wnlSlug, wnlSlug)),
  });
}

/** Bezpośrednie dzieci danego tematu użytkownika (po parentId). */
export async function getUserChildren(userId: string, parentId: string) {
  return db.query.topics.findMany({
    where: and(eq(topics.userId, userId), eq(topics.parentId, parentId)),
    orderBy: [asc(topics.position), asc(topics.createdAt)],
  });
}

/* ---------- Drzewo scalone: treść offline (WNL) + węzły użytkownika ---------- */

export type MergedNode = {
  slug: string;
  title: string;
  emoji: string | null;
  slideshowId: number | null;
  dataDir: string | null;
  /** true = węzeł utworzony przez użytkownika (można zmieniać nazwę / usuwać). */
  custom: boolean;
  /** id wiersza w DB — dla węzłów własnych; dla scrapowanych = id kotwicy (jeśli istnieje). */
  topicId: string | null;
  children: MergedNode[];
};

/**
 * Scal statyczne drzewo WNL z tematami użytkownika. Kotwice (wnlSlug) nie są
 * renderowane jako osobne węzły — ich dzieci są „doczepiane" pod właściwy węzeł
 * scrapowany. Tematy bez rodzica i bez wnlSlug to nowe kategorie najwyższego poziomu.
 */
export function mergeTrees(scraped: ContentNode[], flat: Topic[]): MergedNode[] {
  const mergedById = new Map<string, MergedNode>();
  for (const t of flat) {
    mergedById.set(t.id, {
      slug: t.slug,
      title: t.title,
      emoji: t.emoji,
      slideshowId: t.slideshowId,
      dataDir: null,
      custom: true,
      topicId: t.id,
      children: [],
    });
  }

  const roots: { row: Topic; node: MergedNode }[] = [];
  for (const t of flat) {
    const node = mergedById.get(t.id)!;
    if (t.parentId && mergedById.has(t.parentId)) {
      mergedById.get(t.parentId)!.children.push(node);
    } else {
      roots.push({ row: t, node });
    }
  }

  const anchorByWnl = new Map<string, MergedNode>();
  const newCategories: MergedNode[] = [];
  for (const { row, node } of roots) {
    if (row.wnlSlug) anchorByWnl.set(row.wnlSlug, node);
    else newCategories.push(node);
  }

  const convert = (c: ContentNode): MergedNode => {
    const anchor = anchorByWnl.get(c.slug);
    return {
      slug: c.slug,
      title: c.title,
      emoji: c.emoji,
      slideshowId: c.slideshowId,
      dataDir: c.dataDir,
      custom: false,
      topicId: anchor?.topicId ?? null,
      children: [...c.children.map(convert), ...(anchor?.children ?? [])],
    };
  };

  return [...scraped.map(convert), ...newCategories];
}

/**
 * Drzewo scalone dla aktualnego użytkownika. Odporne na brak DB: gdy zapytanie
 * zawiedzie (np. brak internetu), zwraca samą treść offline, więc nawigacja
 * po kursach nadal działa.
 */
export async function getMergedTreeSafe(): Promise<MergedNode[]> {
  const scraped = getContentTree();
  try {
    const user = await getCurrentUser();
    const flat = await getUserTopicsFlat(user.id);
    return mergeTrees(scraped, flat);
  } catch {
    return mergeTrees(scraped, []);
  }
}
