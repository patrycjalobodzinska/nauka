"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ZoomStage } from "@/components/wnl/zoom-stage";
import type { Slide } from "@/lib/wnl/build-article";

const LANGS = [
  { key: "pl", label: "PL" },
  { key: "la", label: "ŁAC" },
  { key: "en", label: "EN" },
] as const;
type Lang = (typeof LANGS)[number]["key"];

/** Oryginał z GCS → CDN gumlet z autoskalowaniem (zamiast ładować 4000×4000). */
function cdn(url: string, w = 1000): string {
  const m = url.match(/storage\.googleapis\.com\/media-manager\/(.+)$/);
  return m ? `https://media-manager.gumlet.io/${m[1]}?format=auto&w=${w}` : url;
}

export function MediaSlider({ name, slides }: { name: string; slides: Slide[] }) {
  const [i, setI] = useState(0);
  const langs = useMemo(() => LANGS.filter((l) => slides.some((s) => s.files[l.key])), [slides]);
  const [lang, setLang] = useState<Lang>(langs[0]?.key ?? "pl");
  const hasLabelsToggle = slides.some((s) => s.withoutMarkings);
  const [labels, setLabels] = useState(true);
  const [full, setFull] = useState(false);

  const n = slides.length;
  const s = slides[Math.min(i, n - 1)];
  const src = labels
    ? s.files[lang] ?? s.files.pl ?? s.withoutMarkings
    : s.withoutMarkings ?? s.files[lang] ?? s.files.pl;
  const caption = s.name[lang] ?? s.name.pl ?? name;

  const prev = () => setI((p) => (p - 1 + n) % n);
  const next = () => setI((p) => (p + 1) % n);

  // Te same kontrolki (język + podpisy) w widoku inline i w podglądzie — działają
  // na wspólnym stanie, bo to ten sam zestaw handlerów.
  const langToggle =
    langs.length > 1 ? (
      <div className="flex overflow-hidden rounded-md border">
        {langs.map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => setLang(l.key)}
            className={cn(
              "px-2 py-1 transition",
              lang === l.key ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            )}
          >
            {l.label}
          </button>
        ))}
      </div>
    ) : null;

  const labelsToggle = hasLabelsToggle ? (
    <button
      type="button"
      onClick={() => setLabels((v) => !v)}
      className="rounded-md border px-2 py-1 transition hover:bg-accent"
    >
      {labels ? "Ukryj podpisy" : "Pokaż podpisy"}
    </button>
  ) : null;

  return (
    <figure className="my-6 flex flex-col items-center gap-2">
      <div className="relative w-full max-w-[520px]">
        {src && (
          <button
            type="button"
            onClick={() => setFull(true)}
            aria-label="Powiększ rycinę"
            className="group block w-full cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cdn(src)}
              alt={caption ?? ""}
              loading="lazy"
              className="w-full rounded-xl border bg-card"
            />
            <span className="absolute right-2 top-2 rounded-md bg-black/45 p-1 text-white opacity-0 transition group-hover:opacity-100">
              <Maximize2 className="size-4" />
            </span>
          </button>
        )}
        {n > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Poprzedni slajd"
              className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border bg-background/80 backdrop-blur transition hover:bg-background"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Następny slajd"
              className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border bg-background/80 backdrop-blur transition hover:bg-background"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        {n > 1 && (
          <span className="tabular-nums text-muted-foreground">
            {Math.min(i, n - 1) + 1}/{n}
          </span>
        )}
        {langToggle}
        {labelsToggle}
      </div>

      {n > 1 && (
        <div className="flex gap-1.5">
          {slides.map((_, k) => (
            <button
              key={k}
              type="button"
              onClick={() => setI(k)}
              aria-label={`Slajd ${k + 1}`}
              className={cn(
                "size-2 rounded-full transition",
                k === Math.min(i, n - 1) ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      )}

      {caption && (
        <figcaption className="text-center text-sm text-muted-foreground">{caption}</figcaption>
      )}

      {full && src && (
        <MediaViewer
          src={cdn(src)}
          caption={caption ?? ""}
          i={Math.min(i, n - 1)}
          n={n}
          onPrev={prev}
          onNext={next}
          onClose={() => setFull(false)}
          controls={langToggle || labelsToggle ? (
            <>
              {langToggle}
              {labelsToggle}
            </>
          ) : null}
        />
      )}
    </figure>
  );
}

function MediaViewer({
  src,
  caption,
  i,
  n,
  onPrev,
  onNext,
  onClose,
  controls,
}: {
  src: string;
  caption: string;
  i: number;
  n: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  controls: ReactNode;
}) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, onPrev, onNext]);

  if (typeof document === "undefined") return null;

  // Portal do <body>, by uciec od stylów .article-prose nakładanych na <img>.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={caption}
    >
      <div className="flex items-center justify-between gap-2 p-3 text-white">
        <span className="line-clamp-2 text-sm">{caption}</span>
        {n > 1 && (
          <span className="shrink-0 text-xs tabular-nums text-white/70">
            {i + 1} / {n}
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij podgląd"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        <ZoomStage
          src={src}
          alt={caption}
          onZoomChange={setZoomed}
          onSwipe={(d) => (d > 0 ? onNext() : onPrev())}
          onTapClose={onClose}
        />
        {n > 1 && !zoomed && (
          <>
            <button
              type="button"
              onClick={onPrev}
              aria-label="Poprzedni slajd"
              className="absolute left-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Następny slajd"
              className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
      </div>

      {/* Kontrolki języka/podpisów na jasnym pasku, by zachowały czytelność. */}
      {controls && (
        <div className="flex justify-center p-3">
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg bg-background/95 px-2 py-1.5 text-xs">
            {controls}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
