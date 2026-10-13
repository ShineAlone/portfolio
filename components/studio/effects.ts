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
 * Трещина: лучи расходятся от точки удара вглубь блока (вдоль +x, потом поворот на angle),
 * у каждого луча — изломы и редкие ответвления. Через несколько секунд трещина «зарастает».
 */
export function makeCrack(x: number, y: number, angle: number, power: number) {
  const S = 320;
  const c = S / 2;
  const rays = 4 + Math.round(power * 4);
  let d = "";
  for (let i = 0; i < rays; i++) {
    let a = (i / (rays - 1) - 0.5) * 2.4 + (Math.random() - 0.5) * 0.4;
    const len = (40 + Math.random() * 60) * (0.55 + power * 0.9);
    const segs = 3 + Math.floor(Math.random() * 3);
    let px = c;
    let py = c;
    d += `M${c} ${c}`;
    let branches = "";
    for (let s = 0; s < segs; s++) {
      a += (Math.random() - 0.5) * 0.8;
      const l = (len / segs) * (0.7 + Math.random() * 0.6);
      px += Math.cos(a) * l;
      py += Math.sin(a) * l;
      d += `L${px.toFixed(1)} ${py.toFixed(1)}`;
      if (s > 0 && Math.random() < 0.45) {
        const ba = a + (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.5);
        const bl = l * (0.5 + Math.random() * 0.6);
        branches += `M${px.toFixed(1)} ${py.toFixed(1)}L${(px + Math.cos(ba) * bl).toFixed(1)} ${(py + Math.sin(ba) * bl).toFixed(1)}`;
      }
    }
    d += branches;
  }
  const el = document.createElement("div");
  el.className = "st-crack";
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
  el.innerHTML =
    `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
    `<circle cx="${c}" cy="${c}" r="${(7 + power * 9).toFixed(1)}" fill="rgba(0,0,0,.16)" stroke="none"/>` +
    `<path d="${d}" stroke="rgba(255,255,255,.85)" stroke-width="4.5"/>` +
    `<path d="${d}" stroke="#1E1E1E" stroke-width="1.8"/>` +
    `</svg>`;
  setTimeout(() => el.remove(), 5200);
  return el;
}
