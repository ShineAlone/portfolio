"use client";

import { useEffect, useRef } from "react";
import { frameById, narrowWallpapers, wideWallpapers } from "./data";
import { Frame } from "./Frame";

/* eslint-disable @next/next/no-img-element */

/*
 * Обои: поле карточек в глубину. Камера медленно летит вперёд — дальние обои видны мелкой россыпью
 * по всему блоку, ближние вырастают, собираются в плотную группу в центре и пролетают мимо.
 * Карточка, ушедшая за камеру, возвращается в самую глубину на новое место, поэтому полёт бесконечный.
 * Порядок перекрытия даёт сам браузер: карточки стоят в общем 3D-пространстве.
 */

const PERSPECTIVE = 1200;
const FAR = 5200; // глубина, на которой карточка появляется
const NEAR = -330; // здесь она уже «за плечом» камеры и переносится назад
const SPEED = 130; // единиц глубины в секунду
const COUNT = 132;

// детерминированный генератор — раскладка одинаковая при каждой загрузке
function mulberry(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Card = { src: string; wide: boolean; x: number; y: number; z: number; core: boolean };

const CARDS: Card[] = (() => {
  const rnd = mulberry(7);
  const out: Card[] = [];
  for (let i = 0; i < COUNT; i++) {
    // каждая пятая — горизонтальные обои для ПК, остальные — для телефона
    const wide = i % 5 === 0;
    const list = wide ? wideWallpapers : narrowWallpapers;
    // треть карточек летит близко к оси — из них складывается плотная группа в центре
    const core = i % 3 === 0;
    out.push({
      src: list[i % list.length],
      wide,
      core,
      x: (rnd() - 0.5) * (core ? 760 : 6400),
      y: (rnd() - 0.5) * (core ? 940 : 8000),
      z: NEAR + ((i + rnd()) / COUNT) * (FAR - NEAR),
    });
  }
  return out;
})();

export function WallField({ selected, onPick }: { selected: boolean; onPick: () => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = [...world.current!.children] as HTMLElement[];
    const rnd = mulberry(99);
    const cards = CARDS.map((c) => ({ ...c }));
    let raf = 0;
    let last = 0;
    let visible = false;

    const place = (dt: number) => {
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        c.z -= SPEED * dt;
        if (c.z < NEAR) {
          c.z += FAR - NEAR;
          c.x = (rnd() - 0.5) * (c.core ? 760 : 6400);
          c.y = (rnd() - 0.5) * (c.core ? 940 : 8000);
        }
        // проявляется из глубины и тает, пролетая мимо камеры
        const o = Math.min(1, (FAR - c.z) / 700, (c.z - NEAR) / 220);
        els[i].style.transform = `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, ${(-c.z).toFixed(1)}px)`;
        els[i].style.opacity = o.toFixed(3);
      }
    };
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      place(dt);
      if (visible) raf = requestAnimationFrame(frame);
    };
    place(0);

    // пока блок не в кадре — поле стоит
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !visible) {
        visible = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!e.isIntersecting) {
        visible = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(stage.current!);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Frame meta={frameById("wall")} selected={selected} className="st-free st-field">
      <div ref={stage} className="st-field__stage" style={{ perspective: PERSPECTIVE }}>
        <div ref={world} className="st-field__world">
          {CARDS.map((c, i) => (
            <button
              key={i}
              type="button"
              data-ui
              className={`st-field__card${c.wide ? " is-wide" : ""}`}
              onClick={(e) => {
                // клик «подбрасывает» карточку и засчитывает достижение
                const img = e.currentTarget.firstElementChild as HTMLElement;
                img.classList.remove("is-pop");
                void img.offsetWidth;
                img.classList.add("is-pop");
                onPick();
              }}
            >
              <img src={c.src} alt="" loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
      </div>
      <span className="st-orbit__caption st-field__caption">Каждый месяц — новые обои</span>
    </Frame>
  );
}
