"use client";

import { useEffect, useRef } from "react";
import { frameById, narrowWallpapers, wideWallpapers } from "./data";
import { Frame } from "./Frame";
import { isStudioBusy, onStudioActivity } from "./drive";

/* eslint-disable @next/next/no-img-element */

/*
 * Обои: поле мелких карточек по всему блоку. Курсор работает как линза с притяжением:
 * обои рядом с ним вырастают и стягиваются к нему в плотную перекрывающуюся группу,
 * остальные остаются мелкой россыпью. Уводишь мышку — группа распадается и собирается в новом месте.
 */

const COUNT = 132;
// радиус, в котором курсор «достаёт» до карточек (в единицах холста)
const REACH = 820;
// какую долю пути до курсора проходит карточка под ним
const PULL = 0.42;

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

// hx/hy — «дом» карточки в долях блока, base — её размер в покое, top — размер под курсором
type Card = { src: string; wide: boolean; hx: number; hy: number; base: number; top: number; phase: number };

const CARDS: Card[] = (() => {
  const rnd = mulberry(11);
  // расставляем по неровной сетке, чтобы россыпь была равномерной, без дыр и слипшихся куч
  const cols = 11;
  const rows = COUNT / cols;
  return Array.from({ length: COUNT }, (_, i) => {
    const wide = i % 5 === 0;
    const list = wide ? wideWallpapers : narrowWallpapers;
    return {
      src: list[i % list.length],
      wide,
      hx: ((i % cols) + 0.15 + rnd() * 0.7) / cols,
      hy: (Math.floor(i / cols) + 0.15 + rnd() * 0.7) / rows,
      base: 0.14 + rnd() * 0.16,
      top: 0.85 + rnd() * 0.5,
      phase: rnd() * Math.PI * 2,
    };
  });
})();

export function WallField({ selected, onPick }: { selected: boolean; onPick: () => void }) {
  const meta = frameById("wall");
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stage.current!;
    const els = [...el.children] as HTMLElement[];
    const W = meta.w;
    const H = meta.h;
    // текущее состояние каждой карточки — оно плавно догоняет цель
    const cur = CARDS.map((c) => ({ x: c.hx * W, y: c.hy * H, s: c.base, z: 0 }));
    const mouse = { x: 0, y: 0, on: false, k: 0 };
    let raf = 0;
    let last = 0;
    let visible = false;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      // сила линзы плавно нарастает, когда курсор входит в блок, и спадает, когда уходит
      mouse.k += ((mouse.on ? 1 : 0) - mouse.k) * Math.min(1, dt * 5);
      const ease = Math.min(1, dt * 7);
      const t = now / 1000;
      for (let i = 0; i < CARDS.length; i++) {
        const c = CARDS[i];
        const p = cur[i];
        // в покое карточки едва заметно покачиваются
        const hx = c.hx * W + Math.sin(t * 0.35 + c.phase) * 10;
        const hy = c.hy * H + Math.cos(t * 0.3 + c.phase) * 10;
        const d = Math.hypot(mouse.x - hx, mouse.y - hy);
        let f = Math.max(0, 1 - d / REACH);
        f = f * f * (3 - 2 * f) * mouse.k;
        const tx = hx + (mouse.x - hx) * f * PULL;
        const ty = hy + (mouse.y - hy) * f * PULL;
        const ts = c.base + (c.top - c.base) * f;
        p.x += (tx - p.x) * ease;
        p.y += (ty - p.y) * ease;
        p.s += (ts - p.s) * ease;
        els[i].style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, -50%) scale(${p.s.toFixed(3)})`;
        // крупные карточки лежат поверх мелких
        const z = Math.round(p.s * 100);
        if (z !== p.z) {
          p.z = z;
          els[i].style.zIndex = String(z);
        }
      }
      if (visible) raf = requestAnimationFrame(frame);
    };

    // курсор — в координатах блока: холст масштабируется, поэтому пересчитываем через рамку
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width) * W;
      mouse.y = ((e.clientY - r.top) / r.height) * H;
      mouse.on = true;
    };
    const leave = () => (mouse.on = false);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);

    // пока блок не в кадре — поле стоит
    let seen = false;
    const sync = () => {
      // за рулём поле стоит
      const on = seen && !isStudioBusy();
      if (on && !visible) {
        visible = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!on) {
        visible = false;
        cancelAnimationFrame(raf);
      }
    };
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      sync();
    });
    io.observe(el);
    const offDrive = onStudioActivity(sync);
    return () => {
      io.disconnect();
      offDrive();
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [meta.w, meta.h]);

  return (
    <Frame meta={meta} selected={selected} className="st-free st-field">
      <div ref={stage} className="st-field__stage">
        {CARDS.map((c, i) => (
          <button key={i} type="button" data-ui className={`st-field__card${c.wide ? " is-wide" : ""}`} onClick={onPick}>
            <img src={c.src} alt="" loading="lazy" draggable={false} />
          </button>
        ))}
      </div>
    </Frame>
  );
}
