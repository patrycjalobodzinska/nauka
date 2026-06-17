/**
 * Renderer: model `Article` (z build-article.ts) → samodzielny dokument HTML
 * gotowy do wydruku przez Playwright `page.pdf()`.
 *
 * Czysta funkcja (bez React/DOM) — `articleToHtml()` zwraca KOMPLETNY <html>
 * z wbudowanym <style>. Obrazki zostają jako <img src="…gumlet…">; Playwright
 * dociąga je przed `pdf()`, więc trafiają do PDF jako wbudowane bitmapy
 * (PDF nie trzyma URL-i). Brak wewnętrznego scrolla apki = brak ucinania:
 * treść płynie naturalnie i sama dzieli się na strony A4.
 */
import type { Article, ArticleNode, Slide } from "./build-article";

/** Kolory wyróżnień (te same hexy co COLOR_CLASS w build-article.ts). t5 (bursztyn)
 *  przyciemniony, bo oryginalny #FFC300 jest nieczytelny na białym tle. */
const HIGHLIGHT_CSS = `
.t1{color:#FF8C00;font-weight:600}   /* pomarańczowy */
.t2{color:#800080;font-weight:600}   /* fioletowy */
.t3{color:#008080;font-weight:600}   /* morski */
.t4{color:#B22222;font-weight:600}   /* czerwony */
.t5{color:#946200;font-weight:600}   /* bursztyn / uwaga (przyciemniony) */
`;

const BASE_CSS = `
*{box-sizing:border-box}
html{font-size:11pt}
body{margin:0;font-family:Georgia,"Times New Roman",serif;line-height:1.55;color:#1a1a1a}
h1{font-size:1.9rem;line-height:1.2;margin:0 0 .6em;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
h2{font-size:1.45rem;margin:1.4em 0 .4em;padding-bottom:.15em;border-bottom:2px solid #e2e2e2;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;break-after:avoid}
h3{font-size:1.2rem;margin:1.1em 0 .35em;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;break-after:avoid}
h4{font-size:1.05rem;margin:.9em 0 .3em;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;break-after:avoid}
p{margin:0 0 .7em;orphans:3;widows:3}
ul,ol{margin:0 0 .7em;padding-left:1.4em}
li{margin:.15em 0}
strong,b{font-weight:700}
abbr{text-decoration:underline dotted;cursor:help}
sup,sub{font-size:.75em}
table{border-collapse:collapse;width:100%;margin:.6em 0;font-size:.92em;break-inside:avoid}
th,td{border:1px solid #cfcfcf;padding:.3em .5em;text-align:left;vertical-align:top}
th{background:#f3f3f3}
figure{margin:1em 0;break-inside:avoid;text-align:center}
figure img{max-width:100%;max-height:230mm;height:auto;border:1px solid #e5e5e5;border-radius:4px}
figure figcaption{margin-top:.35em;font-size:.85em;color:#555;font-style:italic;font-family:system-ui,sans-serif}
.figrow{display:flex;flex-wrap:wrap;gap:.6em;justify-content:center;align-items:flex-start}
.figrow .slide{flex:1 1 30%;min-width:0}
.figrow .slide img{max-height:150mm}
.embed-link{margin:.9em 0;padding:.55em .8em;border:1px solid #cdd6e0;border-radius:6px;background:#f5f8fb;font-family:system-ui,-apple-system,sans-serif;font-size:.95em;break-inside:avoid}
.embed-link a{color:#0b6bcb;text-decoration:underline;word-break:break-all}
.lead{color:#666;font-size:.9rem;margin:0 0 1.4em;font-family:system-ui,sans-serif}
.article{break-before:page}
.article:first-of-type{break-before:auto}
.appendix{break-before:page}
.appendix h1{font-size:1.5rem;margin:0 0 1.2rem}
.appendix-grid .slide{flex:1 1 45%}
.appendix-grid .slide img{max-height:120mm}
${HIGHLIGHT_CSS}
`;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Iframe (podcast/wideo) nie działa w PDF — zamieniamy go na klikalny link.
 * Etykieta z atrybutu title="…"; typ rozpoznajemy po hoście (Podbean → „Podkast",
 * YouTube/Vimeo → „Wideo"). W PDF link jest klikalny (Chromium zapisuje adnotację).
 */
function embedsToLinks(html: string): string {
  return html.replace(
    /<iframe\b([^>]*?)\s*(?:\/>|>(?:[\s\S]*?<\/iframe>)?)/gi,
    (_full, attrs: string) => {
      const src = attrs.match(/\bsrc="([^"]+)"/i)?.[1];
      if (!src) return "";
      const title = attrs.match(/\btitle="([^"]*)"/i)?.[1]?.trim();
      const isPodcast = /podbean|podcast|soundcloud|spotify|anchor\.fm|buzzsprout/i.test(src);
      const isVideo = /youtube|youtu\.be|vimeo/i.test(src);
      const kind = isPodcast ? "Podkast" : isVideo ? "Wideo" : "Materiał";
      const icon = isPodcast ? "🎧" : isVideo ? "🎬" : "🔗";
      const href = esc(src.replace(/&amp;/g, "&"));
      const label = esc(title || kind);
      return `<p class="embed-link">${icon} ${kind}: <a href="${href}">${label}</a></p>`;
    }
  );
}

/** storage.googleapis.com / gumlet → gumlet z limitem szerokości (mniejszy PDF). */
export function toGumlet(url: string, width = 1000): string {
  if (!url) return url;
  const gci = url.match(/storage\.googleapis\.com\/media-manager\/(.+)$/i);
  const path = gci ? gci[1] : url.match(/gumlet\.io\/(.+)$/i)?.[1];
  if (!path) return url; // nieznany host — zostaw jak jest
  const clean = path.split("?")[0];
  return `https://media-manager.gumlet.io/${clean}?format=auto&w=${width}`;
}

/** Wybiera najlepszy URL dla slajdu: PL → EN → ŁAC → wersja bez podpisów. */
function pickUrl(s: Slide): string | undefined {
  return s.files.pl ?? s.files.en ?? s.files.la ?? s.withoutMarkings;
}

function slideCaption(s: Slide): string {
  const pl = s.name.pl?.trim();
  const la = s.name.la?.trim();
  if (pl && la && pl.toLowerCase() !== la.toLowerCase()) return `${pl} (${la})`;
  return pl || la || s.name.en?.trim() || "";
}

function renderMedia(node: Extract<ArticleNode, { kind: "media" }>, width: number): string {
  const slides = node.slides.filter((s) => pickUrl(s));
  if (!slides.length) return "";
  // Każdy slider (>1 slajd) → zdjęcia obok siebie na flex-wrap; pojedynczy → pełna szerokość.
  const multi = slides.length > 1;
  const figs = slides
    .map((s) => {
      const url = toGumlet(pickUrl(s)!, width);
      const cap = slideCaption(s);
      const capHtml = cap ? `<figcaption>${esc(cap)}</figcaption>` : "";
      return multi
        ? `<figure class="slide"><img src="${url}" loading="eager">${capHtml}</figure>`
        : `<figure><img src="${url}" loading="eager">${capHtml}</figure>`;
    })
    .join("\n");
  return multi ? `<div class="figrow">${figs}</div>` : figs;
}

function renderNode(node: ArticleNode, width: number): string {
  switch (node.kind) {
    case "heading":
      return `<h${node.level}>${esc(node.text)}</h${node.level}>`;
    case "html":
      return embedsToLinks(node.html); // iframe (podcast/wideo) → klikalny link
    case "media":
      return renderMedia(node, width);
  }
}

/** Aneks na końcu: wszystkie ryciny w wersji EN (tylko te, które mają wariant en). */
function renderEnAppendix(articles: Article[], width: number): string {
  const figs: string[] = [];
  for (const a of articles)
    for (const node of a.nodes) {
      if (node.kind !== "media") continue;
      for (const s of node.slides) {
        if (!s.files.en) continue;
        const cap = s.name.en?.trim() || s.name.pl?.trim() || "";
        const capHtml = cap ? `<figcaption>${esc(cap)}</figcaption>` : "";
        figs.push(`<figure class="slide"><img src="${toGumlet(s.files.en, width)}" loading="eager">${capHtml}</figure>`);
      }
    }
  if (!figs.length) return ""; // brak EN (np. histologia) → bez aneksu
  return `<section class="appendix"><h1>Aneks — ryciny po angielsku (${figs.length})</h1><div class="figrow appendix-grid">${figs.join("\n")}</div></section>`;
}

export type RenderOptions = {
  /** Tytuł dokumentu (np. nazwa lekcji). Domyślnie tytuł pierwszego artykułu. */
  title?: string;
  /** Podtytuł pod H1 (np. „Chirurgia stomatologiczna • Lekcja 12"). */
  subtitle?: string;
  /** Maks. szerokość obrazków w px (gumlet ?w=). Domyślnie 1000. */
  imgWidth?: number;
  /** Dołącz na końcu aneks z rycinami EN (jeśli istnieją). */
  enAppendix?: boolean;
  /** Szerokość obrazków w aneksie EN (domyślnie 900 — mniejsza, by plik nie urósł 2×). */
  appendixImgWidth?: number;
};

/** Jeden lub więcej artykułów (np. wszystkie slideshowy lekcji) → jeden dokument HTML. */
export function articleToHtml(articles: Article[], opts: RenderOptions = {}): string {
  const width = opts.imgWidth ?? 1000;
  const isMulti = articles.length > 1;
  const docTitle = opts.title ?? articles[0]?.title ?? "Artykuł";
  const sub = opts.subtitle ? `<p class="lead">${esc(opts.subtitle)}</p>` : "";

  // Tytuł dokumentu (lekcja) jako H1. Przy wielu artykułach każdy dostaje
  // własny tytuł zaczynający nową stronę; przy jednym — sam dokument-H1 wystarcza.
  const body = articles
    .map((a) => {
      const title = isMulti ? `<h1 class="art-title">${esc(a.title)}</h1>` : "";
      const inner = a.nodes.map((n) => renderNode(n, width)).join("\n");
      return `<article class="article">${title}${inner}</article>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<title>${esc(docTitle)}</title>
<style>${BASE_CSS}</style>
</head>
<body>
<h1>${esc(docTitle)}</h1>${sub}
${body}
${opts.enAppendix ? renderEnAppendix(articles, opts.appendixImgWidth ?? 900) : ""}
</body>
</html>`;
}
