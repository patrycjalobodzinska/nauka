"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ZoomStage } from "@/components/wnl/zoom-stage";

export type AtlasImage = { id: string; name: string; src: string };

/**
 * Galeria rycin: na desktopie siatka, na mobile karuzela „po jednym zdjęciu".
 * Kliknięcie/dotknięcie otwiera pełnoekranowy viewer z zoomem (pinch / dwuklik /
 * kółko myszy) ograniczonym DO obszaru viewera (touch-action: none).
 */
export function AtlasGallery({ items }: { items: AtlasImage[] }) {
  const isMobile = useIsMobile();
  const [viewer, setViewer] = useState<number | null>(null);
  // Wspólny „bieżący" indeks — karuzela i podgląd są zsynchronizowane, więc po
  // zmianie zdjęcia w podglądzie i jego zamknięciu zostaje to samo zdjęcie.
  const [active, setActive] = useState(0);

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Brak rycin w tej kategorii.</p>
    );
  }

  const openAt = (i: number) => {
    setActive(i);
    setViewer(i);
  };

  return (
    <>
      {isMobile ? (
        <MobileCarousel
          items={items}
          active={active}
          onActiveChange={setActive}
          onOpen={openAt}
        />
      ) : (
        <DesktopGrid items={items} onOpen={openAt} />
      )}
      {viewer !== null && (
        <ZoomViewer
          items={items}
          index={viewer}
          onIndex={(i) => {
            setActive(i);
            setViewer(i);
          }}
          onClose={() => setViewer(null)}
        />
      )}
    </>
  );
}

function DesktopGrid({
  items,
  onOpen,
}: {
  items: AtlasImage[];
  onOpen: (i: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((it, idx) => (
        <figure
          key={it.id}
          className="flex flex-col overflow-hidden rounded-lg border bg-card"
        >
          <button
            type="button"
            onClick={() => onOpen(idx)}
            className="group relative cursor-zoom-in"
            aria-label={`Powiększ: ${it.name}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={it.src}
              alt={it.name}
              loading="lazy"
              className="aspect-square w-full bg-white object-contain"
            />
            <span className="absolute right-1.5 top-1.5 rounded-md bg-black/45 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn className="size-4" />
            </span>
          </button>
          <figcaption className="border-t p-2 text-xs leading-snug text-muted-foreground">
            {it.name}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function MobileCarousel({
  items,
  active,
  onActiveChange,
  onOpen,
}: {
  items: AtlasImage[];
  active: number;
  onActiveChange: (i: number) => void;
  onOpen: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastReported = useRef(active);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== lastReported.current) {
      lastReported.current = idx;
      onActiveChange(idx);
    }
  };

  // Indeks zmieniony z zewnątrz (np. nawigacja/zamknięcie podglądu) → przewiń tu.
  useEffect(() => {
    const el = ref.current;
    if (!el || active === lastReported.current) return;
    lastReported.current = active;
    el.scrollTo({ left: active * el.clientWidth });
  }, [active]);

  const go = (next: number) => {
    const el = ref.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(items.length - 1, next));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };

  const current = items[Math.min(active, items.length - 1)];

  return (
    <div className="space-y-2">
      <div
        ref={ref}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((it, idx) => (
          <div key={it.id} className="w-full shrink-0 snap-center">
            <button
              type="button"
              onClick={() => onOpen(idx)}
              className="relative block w-full cursor-zoom-in"
              aria-label={`Powiększ: ${it.name}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.src}
                alt={it.name}
                loading="lazy"
                className="aspect-square w-full rounded-lg border bg-white object-contain"
              />
              <span className="absolute right-2 top-2 rounded-md bg-black/45 p-1 text-white">
                <ZoomIn className="size-4" />
              </span>
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => go(active - 1)}
          disabled={active <= 0}
          aria-label="Poprzednia rycina"
          className="grid size-8 shrink-0 place-items-center rounded-full border disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="line-clamp-2 flex-1 text-center leading-snug">
          {current?.name}
        </span>
        <button
          type="button"
          onClick={() => go(active + 1)}
          disabled={active >= items.length - 1}
          aria-label="Następna rycina"
          className="grid size-8 shrink-0 place-items-center rounded-full border disabled:opacity-30"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <p className="text-center text-xs tabular-nums text-muted-foreground">
        {Math.min(active, items.length - 1) + 1} / {items.length}
      </p>
    </div>
  );
}

function ZoomViewer({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: AtlasImage[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const it = items[index];
  const [zoomed, setZoomed] = useState(false);

  // Blokada scrolla strony + skróty klawiszowe.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onIndex(Math.max(0, index - 1));
      else if (e.key === "ArrowRight") onIndex(Math.min(items.length - 1, index + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, items.length, onClose, onIndex]);

  const navigate = (dir: -1 | 1) => {
    const next = index + dir;
    if (next >= 0 && next < items.length) onIndex(next);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={it.name}
    >
      <div className="flex items-center justify-between gap-2 p-3 text-white">
        <span className="line-clamp-2 text-sm">{it.name}</span>
        <span className="shrink-0 text-xs tabular-nums text-white/70">
          {index + 1} / {items.length}
        </span>
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
          src={it.src}
          alt={it.name}
          onZoomChange={setZoomed}
          onSwipe={navigate}
          onTapClose={onClose}
        />
        {!zoomed && index > 0 && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Poprzednia rycina"
            className="absolute left-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}
        {!zoomed && index < items.length - 1 && (
          <button
            type="button"
            onClick={() => navigate(1)}
            aria-label="Następna rycina"
            className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>

      <p className="p-3 text-center text-xs text-white/60">
        {zoomed
          ? "Przeciągnij, aby przesuwać · dwuklik / szczypnij, aby oddalić"
          : "Szczypnij lub kliknij dwukrotnie, aby przybliżyć"}
      </p>
    </div>
  );
}
