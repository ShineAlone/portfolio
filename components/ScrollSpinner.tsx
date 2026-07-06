"use client";

import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 16;
// пикселей прокрутки на один кадр: меньше — быстрее вращение
const PX_PER_FRAME = 50;

const frames = Array.from(
  { length: FRAME_COUNT },
  (_, i) => `/images/scroll/frame-${String(i + 1).padStart(2, "0")}.png`
);

export function ScrollSpinner() {
  const [frame, setFrame] = useState(0);
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      setProgress(max > 0 ? y / max : 0);
      setFrame(
        ((Math.round(y / PX_PER_FRAME) % FRAME_COUNT) + FRAME_COUNT) %
          FRAME_COUNT
      );
    };
    const onScroll = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const thumbH = e.currentTarget.offsetHeight;
    const track = window.innerHeight - thumbH;
    const ratio = Math.min(1, Math.max(0, (e.clientY - thumbH / 2) / track));
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: ratio * max, behavior: "instant" });
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <div
      className="scroll-spinner"
      style={{ top: `calc(${progress} * (100vh - 90px))` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="scrollbar"
      aria-controls="main"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {frames.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt="" className={i === frame ? "active" : ""} draggable={false} />
      ))}
    </div>
  );
}
