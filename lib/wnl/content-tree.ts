import "server-only";
import { readContentJson } from "@/lib/wnl/content-store";

/**
 * Drzewo nawigacji budowane LOKALNIE z manifestów (scripts/scrape/<dataDir>/_manifest.json),
 * bez bazy danych. Kurs (dziedzina) → Region (dział) → Lekcja (zagadnienie, ze slideshowId).
 * Slugi są deterministyczne (stała kolejność kursów + kolejność z manifestu), więc URL-e są stabilne.
 */
export type ContentNode = {
  slug: string;
  title: string;
  emoji: string | null;
  slideshowId: number | null;
  /** katalog danych kursu (np. "_data-fizjologia") — id slideshowów kolidują między kursami,
   *  więc artykuł trzeba czytać z WŁAŚCIWEGO katalogu, nie globalnie. */
  dataDir: string;
  children: ContentNode[];
};

type CourseCfg = { slug: string; title: string; emoji: string; dataDir: string; match?: RegExp };

/** match = filtr po nazwie kursu, gdy dataDir wspólny (_data: anatomia + histologia). */
export const COURSES: CourseCfg[] = [
  // Wiedza podstawowa (przedkliniczna)
  { slug: "anatomia", title: "Anatomia", emoji: "🦴", dataDir: "_data", match: /Anatomii/i },
  { slug: "histologia", title: "Histologia", emoji: "🔬", dataDir: "_data", match: /Histologii/i },
  { slug: "fizjologia", title: "Fizjologia", emoji: "🫁", dataDir: "_data-fizjologia" },
  { slug: "patofizjologia", title: "Patofizjologia", emoji: "🔥", dataDir: "_data-patofizjologia" },
  { slug: "biochemia", title: "Biochemia", emoji: "🧪", dataDir: "_data-biochemia" },
  { slug: "mikrobiologia", title: "Mikrobiologia", emoji: "🦠", dataDir: "_data-mikrobiologia" },
  { slug: "farmakologia", title: "Farmakologia", emoji: "💊", dataDir: "_data-farmakologia" },
  { slug: "genetyka", title: "Genetyka", emoji: "🧬", dataDir: "_data-genetyka" },
  // Wiedza kliniczna (bez stomatologii)
  { slug: "chirurgia", title: "Chirurgia", emoji: "🔪", dataDir: "_data-chirurgia" },
  { slug: "interna", title: "Interna", emoji: "🩺", dataDir: "_data-interna" },
  { slug: "pediatria", title: "Pediatria", emoji: "👶", dataDir: "_data-pediatria" },
  { slug: "ginekologia", title: "Ginekologia i położnictwo", emoji: "🤰", dataDir: "_data-ginekologia" },
  { slug: "psychiatria", title: "Psychiatria", emoji: "🧠", dataDir: "_data-psychiatria" },
  { slug: "onkologia", title: "Onkologia", emoji: "🎗️", dataDir: "_data-onkologia" },
  { slug: "medycyna-ratunkowa", title: "Medycyna ratunkowa", emoji: "🚑", dataDir: "_data-ratunkowa" },
  { slug: "snk", title: "SNK", emoji: "🏥", dataDir: "_data-snk" },
];

type ManifestLesson = { id: number; name: string; slideshowIds: number[]; course?: string; region?: string };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replaceAll("ł", "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function loadLessons(cfg: CourseCfg): Promise<ManifestLesson[]> {
  const json = await readContentJson<{ lessons?: ManifestLesson[] }>(
    `${cfg.dataDir}/_manifest.json`
  );
  const all = json?.lessons ?? [];
  const ours = cfg.match ? all.filter((l) => cfg.match!.test(l.course ?? "")) : all;
  return ours.filter((l) => l.slideshowIds?.length);
}

type Built = {
  tree: ContentNode[];
  bySlug: Map<string, ContentNode>;
  parentBySlug: Map<string, ContentNode>;
};

let cache: Promise<Built> | null = null;

function build(): Promise<Built> {
  if (cache) return cache;
  cache = buildOnce();
  return cache;
}

async function buildOnce(): Promise<Built> {
  const lessonsByCourse = await Promise.all(COURSES.map((cfg) => loadLessons(cfg)));
  const used = new Set<string>();
  const uniq = (base: string) => {
    const s = slugify(base) || "temat";
    let cand = s;
    for (let i = 2; used.has(cand); i++) cand = `${s}-${i}`;
    used.add(cand);
    return cand;
  };
  const bySlug = new Map<string, ContentNode>();
  const reg = (n: ContentNode) => (bySlug.set(n.slug, n), n);

  const tree: ContentNode[] = [];
  for (let ci = 0; ci < COURSES.length; ci++) {
    const cfg = COURSES[ci];
    const lessons = lessonsByCourse[ci];
    if (!lessons.length) continue;

    const regions: string[] = [];
    for (const l of lessons) {
      const r = l.region || "Inne";
      if (!regions.includes(r)) regions.push(r);
    }

    const courseNode: ContentNode = { slug: uniq(cfg.slug), title: cfg.title, emoji: cfg.emoji, slideshowId: null, dataDir: cfg.dataDir, children: [] };
    for (const region of regions) {
      const regionNode: ContentNode = {
        slug: uniq(`${cfg.slug}-${region}`),
        title: region,
        emoji: "📂",
        slideshowId: null,
        dataDir: cfg.dataDir,
        children: lessons
          .filter((l) => (l.region || "Inne") === region)
          .map((l) =>
            reg({ slug: uniq(l.name), title: l.name, emoji: "📄", slideshowId: l.slideshowIds[0] ?? null, dataDir: cfg.dataDir, children: [] })
          ),
      };
      courseNode.children.push(reg(regionNode));
    }
    // kurs z jednym sztucznym regionem "Inne" → spłaszcz (lekcje wprost pod kursem)
    if (courseNode.children.length === 1 && courseNode.children[0].title === "Inne") {
      courseNode.children = courseNode.children[0].children;
    }
    tree.push(reg(courseNode));
  }

  const parentBySlug = new Map<string, ContentNode>();
  const walk = (nodes: ContentNode[], parent: ContentNode | null) => {
    for (const n of nodes) {
      if (parent) parentBySlug.set(n.slug, parent);
      walk(n.children, n);
    }
  };
  walk(tree, null);

  return { tree, bySlug, parentBySlug };
}

export async function getContentTree(): Promise<ContentNode[]> {
  return (await build()).tree;
}

export async function getContentNode(slug: string): Promise<ContentNode | undefined> {
  return (await build()).bySlug.get(slug);
}

/** Czy slug należy do treści scrapowanej? Używane przy nadawaniu slugów węzłom
 *  użytkownika, by nie kolidowały z istniejącymi URL-ami tematów WNL. */
export async function isContentSlug(slug: string): Promise<boolean> {
  return (await build()).bySlug.has(slug);
}

export type NavRef = { slug: string; title: string };

/**
 * Nawigacja artykułu: rodzic (nadrzędna kategoria) oraz poprzedni/następny
 * artykuł wśród rodzeństwa-liści tego samego rodzica.
 */
export async function getContentNav(slug: string): Promise<{
  parent: { slug: string; title: string; emoji: string | null } | null;
  prev: NavRef | null;
  next: NavRef | null;
} | null> {
  const b = await build();
  const node = b.bySlug.get(slug);
  if (!node) return null;

  const parent = b.parentBySlug.get(slug) ?? null;
  const siblings = parent ? parent.children : b.tree;
  // przechodzimy tylko między artykułami (liśćmi ze slideshowId)
  const leaves = siblings.filter((s) => s.slideshowId != null);
  const idx = leaves.findIndex((s) => s.slug === slug);
  const prev = idx > 0 ? leaves[idx - 1] : null;
  const next = idx >= 0 && idx < leaves.length - 1 ? leaves[idx + 1] : null;

  return {
    parent: parent
      ? { slug: parent.slug, title: parent.title, emoji: parent.emoji }
      : null,
    prev: prev ? { slug: prev.slug, title: prev.title } : null,
    next: next ? { slug: next.slug, title: next.title } : null,
  };
}
