import { useEffect, type RefObject } from "react";
import type { CameraStore } from "./camera";

/*
 * Отсечение по экрану. Холст огромный, а браузер на каждом кадре перелёта пересчитывал стили,
 * раскладку и слои для всех блоков сразу — на слабых ноутбуках и iPad это давало подвисания.
 * Здесь всё, что далеко за кадром, получает .is-culled (content-visibility: hidden): браузер
 * пропускает такой блок целиком, но сам элемент и его состояние в React остаются на месте.
 *
 * Область, где блоки рисуются: кадр с запасом + упреждение по направлению движения камеры
 * + место назначения перелёта по меню. Прячем с запасом побольше, чтобы на границе не мигало.
 * Видео в спрятанных блоках ставятся на паузу и продолжают, когда блок снова рядом.
 */

type Rect = { x: number; y: number; w: number; h: number };
type Item = Rect & { el: HTMLElement; culled: boolean };

// запас вокруг кадра: показать — уже на подлёте, спрятать — только когда ушёл далеко
const SHOW_MARGIN = 0.45;
const HIDE_MARGIN = 0.9;
// на сколько секунд вперёд по скорости камеры готовим блоки
const LOOKAHEAD = 0.45;

let flightTarget: Rect | null = null;
/** куда летит камера: блоки там начинают рисоваться сразу, на старте перелёта */
export const setCullTarget = (r: Rect | null) => {
  flightTarget = r;
};

const SELECTOR = ":scope > [data-frame], :scope > .st-island, :scope > .st-deco, .st-city__block";

function rectOf(el: HTMLElement): Rect | null {
  const s = el.style;
  const k = parseFloat(s.zoom) || 1;
  let x = parseFloat(s.left);
  let y = parseFloat(s.top);
  const w = parseFloat(s.width) || el.offsetWidth;
  const h = parseFloat(s.height) || el.offsetHeight;
  if (!Number.isFinite(x) || !Number.isFinite(y) || !w || !h) return null;
  x *= k;
  y *= k;
  // кварталы и развязки стоят внутри слоя города — добавляем его сдвиг
  const p = el.parentElement;
  if (p && !p.classList.contains("st-world")) {
    x += parseFloat(p.style.left) || 0;
    y += parseFloat(p.style.top) || 0;
  }
  return { x, y, w: w * k, h: h * k };
}

const hits = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const grow = (r: Rect, m: number): Rect => ({ x: r.x - r.w * m, y: r.y - r.h * m, w: r.w * (1 + 2 * m), h: r.h * (1 + 2 * m) });

function setCulled(it: Item, on: boolean) {
  it.culled = on;
  it.el.classList.toggle("is-culled", on);
  for (const v of it.el.querySelectorAll("video")) {
    if (on) v.pause();
    else if (v.autoplay) v.play().catch(() => {});
  }
}

export function useCulling(
  worldRef: RefObject<HTMLDivElement | null>,
  camera: CameraStore,
  vpSize: () => { w: number; h: number },
) {
  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    let items: Item[] = [];
    const scan = () => {
      const old = new Map(items.map((i) => [i.el, i]));
      items = [];
      for (const el of world.querySelectorAll<HTMLElement>(SELECTOR)) {
        const r = rectOf(el);
        if (!r) continue;
        items.push({ ...r, el, culled: old.get(el)?.culled ?? el.classList.contains("is-culled") });
      }
      apply();
    };

    let last = { cx: 0, cy: 0, t: 0 };
    const vel = { x: 0, y: 0 };
    const apply = () => {
      const { x, y, z } = camera.get();
      const { w, h } = vpSize();
      const view = { x: -x / z, y: -y / z, w: w / z, h: h / z };
      // скорость центра кадра в единицах холста — сглаженная
      const now = performance.now();
      const cx = view.x + view.w / 2;
      const cy = view.y + view.h / 2;
      const dt = (now - last.t) / 1000;
      if (last.t && dt > 0 && dt < 0.25) {
        vel.x += ((cx - last.cx) / dt - vel.x) * 0.3;
        vel.y += ((cy - last.cy) / dt - vel.y) * 0.3;
      } else {
        vel.x = vel.y = 0;
      }
      last = { cx, cy, t: now };
      const show = [grow(view, SHOW_MARGIN), grow({ ...view, x: view.x + vel.x * LOOKAHEAD, y: view.y + vel.y * LOOKAHEAD }, SHOW_MARGIN)];
      if (flightTarget) show.push(grow(flightTarget, SHOW_MARGIN));
      const keep = grow(view, HIDE_MARGIN);
      for (const it of items) {
        if (it.culled) {
          if (show.some((r) => hits(it, r))) setCulled(it, false);
        } else if (!hits(it, keep) && !show.some((r) => hits(it, r))) {
          setCulled(it, true);
        }
      }
    };

    // новые блоки (кейсы подгружаются позже, город — на старте машинки) — пересобираем список
    const mo = new MutationObserver(scan);
    mo.observe(world, { childList: true });
    const offCam = camera.subscribe(apply);
    // в покое скорость затухает — догоняем раз в полсекунды, чтобы упреждение не висело
    const idle = setInterval(apply, 500);
    scan();
    return () => {
      mo.disconnect();
      offCam();
      clearInterval(idle);
      for (const it of items) if (it.culled) setCulled(it, false);
    };
  }, [worldRef, camera, vpSize]);
}
