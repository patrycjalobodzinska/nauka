import { readFile } from "node:fs/promises";
import { buildArticle, type ArticleNode } from "@/lib/wnl/build-article";
import { resolveSlideshowFile } from "@/lib/wnl/slideshow-path";
import { readContentText } from "@/lib/wnl/content-store";
import { localizeSlides } from "@/lib/wnl/media-map";
import { htmlOverride } from "@/lib/wnl/html-overrides";
import { MediaSlider } from "@/components/wnl/media-slider";

/**
 * Server component: renderuje artykuł ze slideshow-<id>.json. id slideshowów KOLIDUJĄ
 * między kursami, więc czytamy z konkretnego katalogu kursu (dataDir) — lokalnie
 * z dysku, na prod z Vercel Blob. Bez dataDir (np. /test) fallback = szukanie lokalne.
 */
export async function ArticleView({ id, dataDir }: { id: number; dataDir?: string }) {
  let raw: string | null = null;
  if (dataDir) {
    raw = await readContentText(`${dataDir}/slideshow-${id}.json`);
  } else {
    const file = resolveSlideshowFile(id);
    if (file) {
      try {
        raw = await readFile(file, "utf8");
      } catch {
        raw = null;
      }
    }
  }
  if (raw == null) return <NotDownloaded id={id} />;
  const { title, nodes } = buildArticle(JSON.parse(raw));
  return (
    <>
      <h1>{title}</h1>
      {nodes.map((node, i) => (
        <RenderNode key={i} node={node} />
      ))}
    </>
  );
}

function NotDownloaded({ id }: { id: number }) {
  return (
    <>
      <h1>Lekcja {id} nie jest pobrana</h1>
      <p>
        Brak pliku <code>scripts/scrape/_data/slideshow-{id}.json</code>. Pobierz ją:
      </p>
      <p>
        <code>npm run scrape:harvest -- {id}</code>
      </p>
    </>
  );
}

function RenderNode({ node }: { node: ArticleNode }) {
  if (node.kind === "media") {
    const ov = htmlOverride(node.slides);
    if (ov) return <div dangerouslySetInnerHTML={{ __html: ov }} />;
    return <MediaSlider name={node.name} slides={localizeSlides(node.slides)} />;
  }
  if (node.kind === "html") return <div dangerouslySetInnerHTML={{ __html: node.html }} />;
  if (node.level === 2) return <h2>{node.text}</h2>;
  if (node.level === 3) return <h3>{node.text}</h3>;
  return <h4>{node.text}</h4>;
}
