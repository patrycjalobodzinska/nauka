/**
 * Konwerter talii fiszek: surowy zrzut zestawu (_data/flashcards-<set>.json)
 * → model gotowy do nauki. front to zwykle obrazek (rozwiązany URL w polu
 * `image`), back to HTML z odpowiedzią (PL/ŁAC/EN + termin).
 */
export type Flashcard = {
  id: number;
  image: string | null; // rozwiązany URL frontu (obrazek), jeśli mamy
  frontHtml: string | null; // gdy front jest tekstem, a nie obrazkiem
  back: string; // oczyszczony HTML odpowiedzi
  hint: string;
  tags: string[];
};
export type Deck = { set: { id: number; name: string; count: number }; cards: Flashcard[] };

/** Oryginał GCS → CDN gumlet z autoskalowaniem. */
export function cdnUrl(url: string, w = 1000): string {
  const m = url.match(/storage\.googleapis\.com\/media-manager\/(.+)$/);
  return m ? `https://media-manager.gumlet.io/${m[1]}?format=auto&w=${w}` : url;
}

/** Lekkie czyszczenie HTML fiszki: usuwa tagi własne, style/klasy/data-*. */
function clean(html: string): string {
  return (html || "")
    .replace(/<\/?b-[a-z-]+\b[^>]*>/gi, "")
    .replace(/\s(?:style|class|data-[a-z-]+)="[^"]*"/gi, "")
    .replace(/<(p|span)>\s*<\/\1>/gi, "")
    .trim();
}

export function buildDeck(raw: any): Deck {
  const cards: Flashcard[] = (raw?.cards ?? []).map((c: any) => {
    const frontIsImage = /<b-interlink/i.test(c.front || "");
    return {
      id: c.id,
      image: c.image ? cdnUrl(c.image) : null,
      frontHtml: frontIsImage ? null : clean(c.front || ""),
      back: clean(c.back || ""),
      hint: clean(c.hint || ""),
      tags: Array.isArray(c.tags) ? c.tags : [],
    };
  });
  return { set: raw?.set ?? { id: 0, name: "?", count: cards.length }, cards };
}
