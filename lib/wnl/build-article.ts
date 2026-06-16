/**
 * Konwerter: surowy JSON `content_blocks_structure/slideshows/<id>` (z WNL)
 * → model artykułu gotowy do wyrenderowania.
 *
 * Czysta funkcja (bez React/DOM) — działa i na serwerze, i w skrypcie.
 * Obsługuje: drzewo sekcji → poziomy nagłówków, wyróżnienia kolorami (inline
 * #HEX → klasy t1–t5), oraz ryciny: `<b-interlink data-id=X>` w treści → przez
 * mapę `interlinks` → `media_containers` (slajdy × języki pl/la/en × bez podpisów).
 * Odnośniki nie-medialne (Annotation/galeria) są pomijane.
 */
export type Slide = {
  files: { pl?: string; la?: string; en?: string };
  withoutMarkings?: string;
  name: { pl?: string; la?: string; en?: string };
};

export type ArticleNode =
  | { kind: "heading"; level: 2 | 3 | 4; text: string }
  | { kind: "html"; html: string }
  | { kind: "media"; name: string; slides: Slide[] };

export type Article = { title: string; nodes: ArticleNode[] };

const COLOR_CLASS: Record<string, string> = {
  FF8C00: "t1", // pomarańczowy
  "800080": "t2", // fioletowy
  "008080": "t3", // morski
  B22222: "t4", // czerwony
  FFC300: "t5", // bursztynowy (uwaga)
};

function sanitizeHtml(html: string): string {
  let h = html;
  // słowniczek: <span class="b-glossary" data-def-description="…">LH</span> → <abbr title="…">LH</abbr>
  h = h.replace(/<span\b([^>]*\bclass="b-glossary"[^>]*)>([\s\S]*?)<\/span>/gi, (_m, attrs, inner) => {
    const def = attrs.match(/data-def-description="([^"]*)"/)?.[1];
    return def ? `<abbr title="${def.replace(/"/g, "&quot;")}">${inner}</abbr>` : inner;
  });
  // wyróżnienia: inline kolor → klasa t1–t5 (nieznane kolory: usuń styl)
  h = h.replace(/style="color:\s*#([0-9a-fA-F]{6})[^"]*"/g, (_m, hex) => {
    const cls = COLOR_CLASS[hex.toUpperCase()];
    return cls ? `class="${cls}"` : "";
  });
  // usuń wszelkie tagi własne Vue (b-glossary, resztki b-interlink itp.) — zachowaj tekst
  h = h.replace(/<\/?b-[a-z-]+\b[^>]*>/gi, "");
  // usuń pozostałe atrybuty style/data-*
  h = h.replace(/\s(?:style|data-[a-z-]+)="[^"]*"/gi, "");
  // posprzątaj puste węzły po wyciętych osadzeniach
  h = h.replace(/<(p|span)>\s*<\/\1>/gi, "").replace(/<p>(?:\s|&nbsp;)*<\/p>/gi, "");
  return h.trim();
}

function mediaFromContainer(c: any): ArticleNode | null {
  const slides: Slide[] = [];
  for (const mi of c?.main_items ?? []) {
    for (const si of mi?.sub_items ?? []) {
      const v = si?.variants?.[0];
      if (!v) continue;
      slides.push({
        files: v.files ?? {},
        withoutMarkings: v.file_without_markings ?? undefined,
        name: v.name ?? {},
      });
    }
  }
  return slides.length ? { kind: "media", name: c.name ?? "", slides } : null;
}

export function buildArticle(json: any): Article {
  const interlinks: Record<string, any> = json?.interlinks ?? {};
  const containers = new Map<string, any>((json?.media_containers ?? []).map((c: any) => [c.id, c]));

  const containerForDataId = (dataId: string): any | null => {
    const il = interlinks[dataId];
    if (il?.interlink_target_type === "media_manager:media_record_embed") {
      return containers.get(il.interlink_target_uuid) ?? null;
    }
    return null; // Annotation / galeria / nieznane → pomijamy
  };

  const nodes: ArticleNode[] = [];

  const pushContent = (content: string) => {
    if (!content) return;
    const re = /<b-interlink\b[^>]*?data-id="([^"]+)"[^>]*?>(?:\s*<\/b-interlink>)?/gi;
    let last = 0;
    let m: RegExpExecArray | null;
    const flushHtml = (raw: string) => {
      const clean = sanitizeHtml(raw);
      if (clean) nodes.push({ kind: "html", html: clean });
    };
    while ((m = re.exec(content))) {
      const container = containerForDataId(m[1]);
      if (!container) continue; // odnośnik nie-medialny — zostaw w HTML (sanitize go wytnie)
      flushHtml(content.slice(last, m.index));
      const media = mediaFromContainer(container);
      if (media) nodes.push(media);
      last = re.lastIndex;
    }
    flushHtml(content.slice(last));
  };

  const walkBlocks = (blocks: any[]) => {
    for (const b of blocks ?? []) {
      pushContent(b?.content ?? "");
      if (b?.blocks?.length) walkBlocks(b.blocks);
    }
  };

  const walkSections = (sections: any[], depth: number) => {
    for (const s of sections ?? []) {
      if (s?.name) nodes.push({ kind: "heading", level: Math.min(depth + 2, 4) as 2 | 3 | 4, text: s.name });
      walkBlocks(s?.contentBlocks ?? []);
      if (s?.children?.length) walkSections(s.children, depth + 1);
    }
  };

  walkSections(json?.content_blocks_structure ?? [], 0);
  return { title: json?.content_blocks_structure_name ?? "Artykuł", nodes };
}
