import type { Cam } from "./camera";

/*
 * Эффекты езды: следы колёс и частицы (дым, пыль, брызги) рисуются на одном холсте
 * размером с экран, трещины — небольшими SVG прямо на блоке, в который врезались.
 */

export type Mark = { x1: number; y1: number; x2: number; y2: number; t: number; rgb: string; a: number; w: number };
export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  life: number;
  r0: number;
  r1: number;
  rgb: string;
  a: number;
  ring?: boolean;
};

export const MARK_LIFE = 3.6;
const MAX_PARTS = 700;

export function addParticle(parts: Particle[], p: Particle) {
  if (parts.length >= MAX_PARTS) parts.shift();
  parts.push(p);
}

export function drawFx(
  ctx: CanvasRenderingContext2D,
  marks: Mark[],
  parts: Particle[],
  now: number,
  cam: Cam,
  w: number,
  h: number,
  dpr: number
) {
  const { x: ox, y: oy, z } = cam;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // старые следы в начале массива — срезаем их, пока не дойдём до свежих
  let cut = 0;
  while (cut < marks.length && now - marks[cut].t > MARK_LIFE) cut++;
  if (cut) marks.splice(0, cut);

  // плоские концы: круглые накладывались бы на стыках отрезков и след шёл бы «бусами»
  ctx.lineCap = "butt";
  for (const m of marks) {
    const age = now - m.t;
    // первую половину жизни след держится, потом тает
    const k = Math.min(1, (MARK_LIFE - age) / (MARK_LIFE * 0.5));
    ctx.strokeStyle = `rgba(${m.rgb},${(m.a * k).toFixed(3)})`;
    ctx.lineWidth = m.w * z;
    ctx.beginPath();
    ctx.moveTo(m.x1 * z + ox, m.y1 * z + oy);
    ctx.lineTo(m.x2 * z + ox, m.y2 * z + oy);
    ctx.stroke();
  }

  let alive = 0;
  for (const p of parts) {
    const age = now - p.t;
    if (age > p.life) continue;
    parts[alive++] = p;
    const k = age / p.life;
    // частицы тормозятся воздухом
    const drift = (1 - Math.exp(-2.5 * age)) / 2.5;
    const x = (p.x + p.vx * drift) * z + ox;
    const y = (p.y + p.vy * drift) * z + oy;
    const r = (p.r0 + (p.r1 - p.r0) * (1 - (1 - k) * (1 - k))) * z;
    if (x < -r || y < -r || x > w + r || y > h + r) continue;
    const a = p.a * (1 - k);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
    if (p.ring) {
      ctx.strokeStyle = `rgba(${p.rgb},${a.toFixed(3)})`;
      ctx.lineWidth = 3 * z;
      ctx.stroke();
    } else {
      ctx.fillStyle = `rgba(${p.rgb},${a.toFixed(3)})`;
      ctx.fill();
    }
  }
  parts.length = alive;
}

/*
 * Трещина: короткие изломанные лучи расходятся от точки удара вглубь объекта
 * (вдоль +x, потом поворот на angle) и «бегут» за доли секунды. Лежит в обёртке,
 * обрезанной по форме объекта, — за его края не вылезает. Через несколько секунд тает.
 */
export function makeCrack(
  host: HTMLElement,
  x: number,
  y: number,
  angle: number,
  power: number,
  maxLen: number,
  radius: string
) {
  let clip = host.querySelector<HTMLElement>(":scope > .st-crack-clip");
  if (!clip) {
    clip = document.createElement("div");
    clip.className = "st-crack-clip";
    clip.style.borderRadius = radius;
    host.appendChild(clip);
  }
  const S = 260;
  const c = S / 2;
  const rays = 3 + Math.round(power * 4);
  const reach = Math.min(maxLen, 30 + power * 80);
  const paths: string[] = [];
  for (let i = 0; i < rays; i++) {
    let a = (i / Math.max(1, rays - 1) - 0.5) * 2.2 + (Math.random() - 0.5) * 0.5;
    const len = reach * (0.45 + Math.random() * 0.55);
    const segs = 3 + Math.floor(Math.random() * 2);
    let px = c;
    let py = c;
    let d = `M${c} ${c}`;
    for (let s = 0; s < segs; s++) {
      a += (Math.random() - 0.5) * 0.9;
      const l = (len / segs) * (0.7 + Math.random() * 0.6);
      px += Math.cos(a) * l;
      py += Math.sin(a) * l;
      d += `L${px.toFixed(1)} ${py.toFixed(1)}`;
    }
    paths.push(d);
    // редкая веточка от середины луча
    if (Math.random() < 0.4) {
      const ba = a + (Math.random() < 0.5 ? -1 : 1) * (0.7 + Math.random() * 0.5);
      const bl = len * 0.3;
      paths.push(`M${px.toFixed(1)} ${py.toFixed(1)}l${(Math.cos(ba) * bl).toFixed(1)} ${(Math.sin(ba) * bl).toFixed(1)}`);
    }
  }
  const lines = (stroke: string, w: number, dx: number) =>
    paths
      .map(
        (d, i) =>
          `<path d="${d}" pathLength="1" transform="translate(${dx} ${dx})" stroke="${stroke}" stroke-width="${w}" style="animation-delay:${(i * 0.02).toFixed(2)}s"/>`
      )
      .join("");
  const el = document.createElement("div");
  el.className = "st-crack";
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
  // светлая грань со сдвигом на пиксель и тёмная щель — трещина выглядит вдавленной, а не нарисованной сверху
  el.innerHTML =
    `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
    `<circle cx="${c}" cy="${c}" r="${(6 + power * 8).toFixed(1)}" fill="rgba(0,0,0,.12)" stroke="none"/>` +
    lines("rgba(255,255,255,.55)", 1.4, 1.2) +
    lines("rgba(20,20,20,.7)", 1.6, 0) +
    `</svg>`;
  clip.appendChild(el);
  setTimeout(() => el.remove(), 5200);
}
