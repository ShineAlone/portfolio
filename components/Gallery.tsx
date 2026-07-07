"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Оборачивает любую галерею: клик по <img> внутри открывает лайтбокс
// с листанием по всем картинкам этой галереи.
export function Gallery({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [index, setIndex] = useState<number | null>(null);

  const open = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== "IMG" || !ref.current) return;
    const imgs = [...ref.current.querySelectorAll("img")].map((i) => i.src);
    setImages(imgs);
    setIndex(imgs.indexOf((target as HTMLImageElement).src));
  };

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (dir: number) =>
      setIndex((i) =>
        i === null ? i : (i + dir + images.length) % images.length
      ),
    [images.length]
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, close, step]);

  return (
    <>
      <div ref={ref} className={`gallery ${className ?? ""}`} onClick={open}>
        {children}
      </div>
      {index !== null && (
        <div
          className="lightbox"
          onClick={(e) => {
            if (!(e.target as HTMLElement).closest(".lightbox__img, .lightbox__arrow"))
              close();
          }}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="lightbox__arrow lightbox__arrow--prev"
            onClick={() => step(-1)}
            aria-label="Предыдущее фото"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/chevron.svg" alt="" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="lightbox__img" src={images[index]} alt="" />
          <button
            type="button"
            className="lightbox__arrow lightbox__arrow--next"
            onClick={() => step(1)}
            aria-label="Следующее фото"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/chevron.svg" alt="" />
          </button>
          <button
            type="button"
            className="lightbox__close"
            onClick={close}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
