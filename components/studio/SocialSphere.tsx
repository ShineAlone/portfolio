"use client";

import { useEffect, useRef } from "react";
import { SOCIAL_LAYOUT, frameById } from "./data";
import { Frame } from "./Frame";
import { isStudioBusy, onStudioActivity } from "./drive";
import { useOffscreen } from "./offscreen";

/* eslint-disable @next/next/no-img-element */

/*
 * Соцсети: сфера из постов. Медленно вращается сама, её можно крутить мышкой (с инерцией),
 * а пост под курсором выдвигается вперёд. Никаких кнопок — всё делается перетаскиванием.
 * Посты стоят кольцами по широтам; вращение — один transform на всю сферу каждый кадр.
 */

const R = 900;
// Пост вписан в квадрат TILE×TILE. Шаг между кольцами — 24° (≈377 px по сфере), поэтому
// ни один пост не выше 320 px: соседние ряды не заходят друг в друга, плоские карточки не пересекаются.
const TILE = 320;
// кольца: [широта в градусах, сколько постов]
const RINGS: [number, number][] = [
  [-60, 6],
  [-36, 9],
  [-12, 9],
  [12, 9],
  [36, 9],
  [60, 6],
];
const RAD = Math.PI / 180;

const TILES = (() => {
  const posts = SOCIAL_LAYOUT.posts;
  const out: { src: string; lat: number; lon: number; w: number; h: number }[] = [];
  let n = 0;
  RINGS.forEach(([lat, count], r) => {
    for (let i = 0; i < count && n < posts.length; i++, n++) {
      const p = posts[n];
      // соседние кольца сдвинуты на полшага — посты стоят в шахматном порядке
      // пропорции поста сохраняются целиком: высокие посты и сторис уже, но не выше квадрата
      const aspect = p.h / p.w;
      const w = aspect > 1 ? TILE / aspect : TILE;
      out.push({ src: p.src, lat, lon: ((i + (r % 2) * 0.5) / count) * 360, w, h: w * aspect });
    }
  });
  return out;
})();

export function SocialSphere({ selected, onSpin }: { selected: boolean; onSpin: () => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const ball = useRef<HTMLDivElement>(null);
  const spun = useRef(false);
  useOffscreen(stage);

  useEffect(() => {
    const el = stage.current!;
    const sphere = ball.current!;
    const tiles = [...sphere.children] as HTMLElement[];
    // rx/ry — углы сферы, vx/vy — скорость (градусов в секунду)
    const s = { rx: -12, ry: 0, vx: 0, vy: 9, drag: false, hover: false, px: 0, py: 0, moved: 0 };
    const AUTO = 9;
    let raf = 0;
    let last = 0;
    let visible = false;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      if (!s.drag) {
        // инерция затухает к спокойному вращению; над постом сфера почти замирает, чтобы в него попасть
        const target = s.hover ? 1.5 : AUTO;
        s.vy += (target - s.vy) * Math.min(1, dt * 1.6);
        s.vx += (0 - s.vx) * Math.min(1, dt * 1.6);
        s.ry += s.vy * dt;
        s.rx += s.vx * dt;
        // наклон мягко возвращается к лёгкому «виду сверху»
        s.rx += (-12 - s.rx) * Math.min(1, dt * 0.35);
      }
      s.rx = Math.max(-70, Math.min(70, s.rx));
      sphere.style.transform = `rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg)`;
      // посты на дальней стороне приглушаем и не даём им перехватывать курсор
      const sy = Math.sin(s.ry * RAD);
      const cy = Math.cos(s.ry * RAD);
      const sx = Math.sin(s.rx * RAD);
      const cx = Math.cos(s.rx * RAD);
      for (let i = 0; i < tiles.length; i++) {
        const t = TILES[i];
        const cl = Math.cos(t.lat * RAD);
        const x = cl * Math.sin(t.lon * RAD);
        const y = Math.sin(t.lat * RAD);
        const z = cl * Math.cos(t.lon * RAD);
        const depth = y * sx + (-x * sy + z * cy) * cx;
        const back = depth < -0.08;
        if (back !== (tiles[i].dataset.b === "1")) {
          tiles[i].dataset.b = back ? "1" : "0";
          tiles[i].classList.toggle("is-back", back);
        }
      }
      if (visible) raf = requestAnimationFrame(frame);
    };

    let seen = false;
    const sync = () => {
      // за рулём сфера замирает
      const on = seen && !isStudioBusy();
      if (on && !visible) {
        visible = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!on) {
        visible = false;
        // Камера улетела, а курсор над постом остался «висеть»: без сброса сфера по возвращении
        // крутилась со скоростью «прицеливания» (1,5° в секунду) и казалась остановившейся.
        s.hover = false;
        cancelAnimationFrame(raf);
      }
    };
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      sync();
    });
    io.observe(el);
    const offDrive = onStudioActivity(sync);

    // Сфера крутится, только когда на неё смотрят: на экране она не меньше трети и не больше экрана.
    // На общем плане она мелкая, а вплотную занимает весь экран — тогда перетаскивание двигает холст,
    // и сферу не провернуть случайно.
    const grabbable = () => {
      const d = el.getBoundingClientRect().width * 0.8;
      const side = Math.min(window.innerWidth, window.innerHeight);
      return d >= side * 0.3 && d <= side * 1.1;
    };

    const down = (e: PointerEvent) => {
      if (e.button !== 0 || !grabbable()) return;
      // перетаскивание крутит сферу, а не двигает холст
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      s.drag = true;
      s.px = e.clientX;
      s.py = e.clientY;
      s.vx = s.vy = 0;
      s.moved = 0;
      el.classList.add("is-drag");
    };
    let lastMove = 0;
    const move = (e: PointerEvent) => {
      s.hover = !!(e.target as HTMLElement).closest?.(".st-ball__tile");
      if (!s.drag) return;
      e.stopPropagation();
      const now = performance.now();
      const dt = Math.max(0.008, (now - lastMove) / 1000);
      lastMove = now;
      const dx = (e.clientX - s.px) * 0.28;
      const dy = (e.clientY - s.py) * 0.28;
      s.px = e.clientX;
      s.py = e.clientY;
      s.ry += dx;
      s.rx -= dy;
      // скорость для инерции после отпускания
      s.vy = s.vy * 0.6 + (dx / dt) * 0.4;
      s.vx = s.vx * 0.6 + (-dy / dt) * 0.4;
      s.moved += Math.abs(dx) + Math.abs(dy);
      if (!spun.current && s.moved > 40) {
        spun.current = true;
        onSpin();
      }
    };
    const up = (e: PointerEvent) => {
      if (!s.drag) return;
      e.stopPropagation();
      s.drag = false;
      s.vy = Math.max(-420, Math.min(420, s.vy));
      s.vx = Math.max(-260, Math.min(260, s.vx));
      el.classList.remove("is-drag");
    };
    const leave = () => (s.hover = false);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", leave);
    return () => {
      io.disconnect();
      offDrive();
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("pointerleave", leave);
    };
  }, [onSpin]);

  return (
    <Frame meta={frameById("social")} selected={selected} className="st-free st-social">
      <div ref={stage} className="st-ball" data-ui>
        <div className="st-ball__float">
          <div ref={ball} className="st-ball__sphere">
            {TILES.map((t) => (
              <div
                key={t.src}
                className="st-ball__tile"
                style={{
                  width: t.w,
                  height: t.h,
                  margin: `${-t.h / 2}px 0 0 ${-t.w / 2}px`,
                  transform: `rotateY(${t.lon}deg) rotateX(${-t.lat}deg) translateZ(${R}px)`,
                }}
              >
                <img src={t.src} alt="" loading="lazy" draggable={false} />
              </div>
            ))}
          </div>
        </div>
        <span className="st-ball__shadow" aria-hidden />
      </div>
    </Frame>
  );
}
