/**
 * Renderer bazy pytań → samodzielny dokument HTML do druku (Playwright page.pdf()).
 * Pokazuje pytanie + odpowiedzi (A, B, C…). Poprawna odpowiedź ma DYSKRETNĄ fajkę
 * „✓" przy prawej krawędzi strony — jasnoszarą i z dala od tekstu, żeby przy
 * normalnym czytaniu nie rzucała się w oczy (do samosprawdzania), ale dało się ją
 * znaleźć po zerknięciu na margines. Bez podświetlania poprawnej odpowiedzi.
 */
export type QuizAnswer = { id: number; text: string; is_correct: boolean; explanation?: string };
export type QuizQuestion = { id: number; text: string; explanation?: string; answers: QuizAnswer[] };
export type QuizGroup = { id: number; name: string };

function esc(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Lekkie czyszczenie HTML pytania/odpowiedzi: tnie tagi własne i atrybuty, zostawia tekst i podstawowe formatowanie. */
function clean(html: string): string {
  return (html || "")
    .replace(/<\/?b-[a-z-]+\b[^>]*>/gi, "")
    .replace(/\s(?:style|class|data-[a-z-]+)="[^"]*"/gi, "")
    .replace(/<(p|span)>\s*<\/\1>/gi, "")
    .replace(/^\s*<p>([\s\S]*?)<\/p>\s*$/i, "$1") // pojedynczy <p> → bez opakowania (treść pytania w jednej linii)
    .trim();
}

const CSS = `
*{box-sizing:border-box}
html{font-size:10.5pt}
body{margin:0;font-family:Georgia,"Times New Roman",serif;line-height:1.5;color:#1a1a1a}
h1{font-size:1.6rem;margin:0 0 .2em;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
.lead{color:#777;font-size:.85rem;margin:0 0 1.4em;font-family:system-ui,sans-serif}
.q{break-inside:avoid;margin:0 0 11px;padding:0 0 9px;border-bottom:1px solid #eee}
.qnum{font-family:system-ui,sans-serif;font-size:.72rem;font-weight:700;color:#999}
.qtext{margin:.1em 0 .45em}
ol.ans{list-style:none;margin:0;padding:0;counter-reset:ans}
ol.ans li{position:relative;counter-increment:ans;padding:.18em 16mm .18em 1.8em}
ol.ans li::before{content:counter(ans,upper-alpha) ".";position:absolute;left:0;top:.18em;color:#555;font-weight:600;font-family:system-ui,sans-serif}
/* poprawna odpowiedź: tylko dyskretna fajka przy prawej krawędzi — bez podświetlenia */
.tick{position:absolute;right:0;top:.2em;color:#dcdcdc;font-size:.62rem;font-family:system-ui,sans-serif}
strong,b{font-weight:700}
sup,sub{font-size:.75em}
em,i{font-style:italic}
`;

const PAGE_BREAK = `<div style="break-after:page"></div>`;

export type QuestionsRenderOptions = { subtitle?: string };

/** Jedna grupa (kategoria) pytań → kompletny dokument HTML. */
export function questionsToHtml(group: QuizGroup, questions: QuizQuestion[], opts: QuestionsRenderOptions = {}): string {
  const body = questions
    .map((q, i) => {
      const answers = q.answers
        .map((a) => `<li>${clean(a.text)}<span class="tick">${a.is_correct ? "✓" : ""}</span></li>`)
        .join("");
      return `<div class="q"><div class="qnum">${i + 1}.</div><div class="qtext">${clean(q.text)}</div><ol class="ans">${answers}</ol></div>`;
    })
    .join("\n");

  const sub = [opts.subtitle, `${questions.length} pytań`].filter(Boolean).join(" · ");
  return `<!doctype html>
<html lang="pl">
<head><meta charset="utf-8"><title>${esc(group.name)}</title><style>${CSS}</style></head>
<body>
<h1>${esc(group.name)}</h1>
<p class="lead">${esc(sub)}</p>
${body}
</body>
</html>`;
}

export { PAGE_BREAK };
