"use client";

import { useState } from "react";

/* eslint-disable @next/next/no-img-element */

/*
 * Просмотрщик презентации в финальном борде кейса — один на все кейсы: большой слайд 16:9,
 * счётчик, стрелки и лента миниатюр. Может работать сам по себе или от внешнего индекса
 * (у HR-кейса слайды листаются ещё и стрелками клавиатуры с холста).
 */
export function CaseDeck({
  slides,
  thumbs,
  index,
  onGo,
}: {
  slides: string[];
  thumbs?: string[];
  index?: number;
  onGo?: (i: number) => void;
}) {
  const [own, setOwn] = useState(0);
  const n = slides.length;
  const i = ((index ?? own) + n) % n;
  const go = (k: number) => {
    const next = (k + n) % n;
    if (onGo) onGo(next);
    else setOwn(next);
  };
  return (
    <div className="cd">
      <div className="cd__screen">
        <img key={i} src={slides[i]} alt={`Слайд ${i + 1}`} loading="lazy" draggable={false} />
        <span className="cd__count">
          {i + 1} / {n}
        </span>
        <button type="button" data-ui className="cd__arrow is-prev" onClick={() => go(i - 1)} aria-label="Предыдущий слайд">
          <svg viewBox="0 0 24 24">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <button type="button" data-ui className="cd__arrow is-next" onClick={() => go(i + 1)} aria-label="Следующий слайд">
          <svg viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="cd__strip">
        {slides.map((src, k) => (
          <button key={src} type="button" data-ui className={k === i ? "is-on" : ""} onClick={() => go(k)}>
            <img src={thumbs?.[k] ?? src} alt="" loading="lazy" draggable={false} />
          </button>
        ))}
      </div>
    </div>
  );
}
