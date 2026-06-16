/**
 * Renderer atlasu → dokument HTML do druku (Playwright page.pdf()).
 * Jedna KATEGORIA = jeden dokument: siatka zdjęć (flex-wrap) z podpisami.
 */
export type AtlasItem = { id: string; name: string; image: string; images?: string[]; category?: string };

function esc(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Ujednolica szerokość obrazka z gumlet (mniejszy PDF). */
function img(url: string, w = 900): string {
  const m = url.match(/gumlet\.io\/([^?]+)/);
  return m ? `https://media-manager.gumlet.io/${m[1]}?format=auto&w=${w}` : url;
}

const CSS = `
*{box-sizing:border-box}
html{font-size:10pt}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#1a1a1a}
h1{font-size:1.5rem;margin:0 0 .15em}
.lead{color:#777;font-size:.82rem;margin:0 0 1.2em}
.grid{display:flex;flex-wrap:wrap;gap:5mm;align-items:flex-start;justify-content:flex-start}
figure{flex:1 1 30%;max-width:56mm;margin:0;break-inside:avoid;text-align:center}
figure img{width:100%;height:auto;border:1px solid #e2e2e2;border-radius:4px;background:#fafafa}
figcaption{margin-top:.3em;font-size:.72rem;line-height:1.25;color:#333}
`;

export type AtlasRenderOptions = { subtitle?: string };

/** Jedna kategoria atlasu → kompletny dokument HTML (siatka obok siebie). */
export function atlasCategoryToHtml(category: string, items: AtlasItem[], opts: AtlasRenderOptions = {}): string {
  const figs = items
    .filter((it) => it.image)
    .map((it) => `<figure><img src="${img(it.image)}" loading="eager"><figcaption>${esc(it.name)}</figcaption></figure>`)
    .join("\n");
  const sub = [opts.subtitle, `${items.length} rycin`].filter(Boolean).join(" · ");
  return `<!doctype html>
<html lang="pl">
<head><meta charset="utf-8"><title>${esc(category)}</title><style>${CSS}</style></head>
<body>
<h1>${esc(category)}</h1>
<p class="lead">${esc(sub)}</p>
<div class="grid">${figs}</div>
</body>
</html>`;
}
