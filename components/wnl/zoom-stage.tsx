"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as RPointerEvent,
  type WheelEvent as RWheelEvent,
} from "react";
import { cn } from "@/lib/utils";

const MAX_SCALE = 5;
const ZOOM_STEP = 2.5;

type T = { s: number; x: number; y: number };

/**
 * Obszar obrazu z zoomem ograniczonym DO tego obszaru (touch-action: none):
 * pinch / dwuklik / kółko myszy + panoramowanie. Przy 1× poziomy swipe → onSwipe,
 * pojedyncze dotknięcie → onTapClose. Zoom resetuje się przy zmianie `src`.
 */
export function ZoomStage({
  src,
  alt,
  onSwipe,
  onTapClose,
  onZoomChange,
  className,
}: {
  src: string;
  alt: string;
  onSwipe?: (dir: -1 | 1) => void;
  onTapClose?: () => void;
  onZoomChange?: (zoomed: boolean) => void;
  className?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const tRef = useRef<T>({ s: 1, x: 0, y: 0 });
  const [, bump] = useState(0);

  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{ startDist: number; s0: number; ox: number; oy: number } | null>(null);
  const pan = useRef<{ x: number; y: number } | null>(null);
  const tap = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastTap = useRef(0);
  const wasZoomed = useRef(false);

  const setT = useCallback(
    (n: T) => {
      tRef.current = n;
      bump((v) => v + 1);
      const z = n.s > 1;
      if (z !== wasZoomed.current) {
        wasZoomed.current = z;
        onZoomChange?.(z);
      }
    },
    [onZoomChange]
  );

  // Reset zoomu przy zmianie obrazu (inny slajd / język / kategoria).
  useEffect(() => {
    tRef.current = { s: 1, x: 0, y: 0 };
    bump((v) => v + 1);
    if (wasZoomed.current) {
      wasZoomed.current = false;
      onZoomChange?.(false);
    }
  }, [src, onZoomChange]);

  const box = () => {
    const r = stageRef.current!.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
  };
  const clamp = (s: number, x: number, y: number): T => {
    const { w, h } = box();
    const mx = ((s - 1) * w) / 2;
    const my = ((s - 1) * h) / 2;
    return { s, x: Math.max(-mx, Math.min(mx, x)), y: Math.max(-my, Math.min(my, y)) };
  };
  const toggleZoom = (clientX: number, clientY: number) => {
    if (tRef.current.s > 1) {
      setT({ s: 1, x: 0, y: 0 });
    } else {
      const { cx, cy } = box();
      const s = ZOOM_STEP;
      setT(clamp(s, (clientX - cx) * (1 - s), (clientY - cy) * (1 - s)));
    }
  };

  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const { cx, cy } = box();
      const mx = (a.x + b.x) / 2 - cx;
      const my = (a.y + b.y) / 2 - cy;
      const { s, x, y } = tRef.current;
      pinch.current = { startDist: dist, s0: s, ox: (mx - x) / s, oy: (my - y) / s };
      pan.current = null;
      tap.current = null;
    } else if (pointers.current.size === 1) {
      pan.current = { x: e.clientX, y: e.clientY };
      tap.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    }
  };

  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const { cx, cy } = box();
      const mx = (a.x + b.x) / 2 - cx;
      const my = (a.y + b.y) / 2 - cy;
      const s = Math.max(1, Math.min(MAX_SCALE, pinch.current.s0 * (dist / pinch.current.startDist)));
      setT(clamp(s, mx - s * pinch.current.ox, my - s * pinch.current.oy));
      tap.current = null;
    } else if (pointers.current.size === 1 && pan.current && tRef.current.s > 1) {
      const dx = e.clientX - pan.current.x;
      const dy = e.clientY - pan.current.y;
      pan.current = { x: e.clientX, y: e.clientY };
      setT(clamp(tRef.current.s, tRef.current.x + dx, tRef.current.y + dy));
      if (Math.abs(dx) + Math.abs(dy) > 4) tap.current = null;
    }
  };

  const onPointerUp = (e: RPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 1) {
      const r = [...pointers.current.values()][0];
      pan.current = { x: r.x, y: r.y };
      return;
    }
    if (pointers.current.size > 0) return;

    const start = tap.current;
    pan.current = null;
    tap.current = null;
    if (!start) return;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dist = Math.hypot(dx, dy);
    const dt = Date.now() - start.t;

    if (dist < 10 && dt < 250) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        lastTap.current = 0;
        toggleZoom(e.clientX, e.clientY);
      } else {
        lastTap.current = now;
        if (tRef.current.s === 1) onTapClose?.();
      }
      return;
    }

    if (tRef.current.s === 1 && Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
      onSwipe?.(dx < 0 ? 1 : -1);
    }
  };

  const onWheel = (e: RWheelEvent<HTMLDivElement>) => {
    const { cx, cy } = box();
    const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
    const s = Math.max(1, Math.min(MAX_SCALE, tRef.current.s * factor));
    const ox = (e.clientX - cx - tRef.current.x) / tRef.current.s;
    const oy = (e.clientY - cy - tRef.current.y) / tRef.current.s;
    setT(clamp(s, e.clientX - cx - s * ox, e.clientY - cy - s * oy));
  };

  const t = tRef.current;
  const zoomed = t.s > 1;

  return (
    <div
      ref={stageRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      onDoubleClick={(e) => toggleZoom(e.clientX, e.clientY)}
      className={cn(
        "relative flex flex-1 touch-none select-none items-center justify-center overflow-hidden",
        zoomed ? "cursor-grab" : "cursor-zoom-in",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="max-h-full max-w-full object-contain"
        style={{
          transform: `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.s})`,
          transition: pointers.current.size === 0 ? "transform 0.15s ease-out" : "none",
        }}
      />
    </div>
  );
}
