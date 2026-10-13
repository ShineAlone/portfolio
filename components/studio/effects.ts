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
 * Блок разлетается на осколки: копии блока, обрезанные клиньями от точки удара.
 * mode "out" — осколки разлетаются и гаснут, "in" — слетаются обратно на место.
 * Возвращает длительность анимации в мс.
 */
export function shatter(el: HTMLElement, w: number, h: number, ix: number, iy: number, mode: "out" | "in") {
  const parent = el.parentElement;
  if (!parent) return 0;
  // точку чуть сдвигаем к центру, иначе клинья у самого края получаются нулевыми
  const px = ix + (w / 2 - ix) * 0.25;
  const py = iy + (h / 2 - iy) * 0.25;
  const n = 11;
  const base = Math.random() * Math.PI * 2;
  const angles = Array.from({ length: n + 1 }, (_, i) => base + ((i + (i < n ? (Math.random() - 0.5) * 0.6 : 0)) * Math.PI * 2) / n);
  const edge = (a: number): [number, number] => {
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let t = Infinity;
    if (dx > 1e-6) t = Math.min(t, (w - px) / dx);
    if (dx < -1e-6) t = Math.min(t, -px / dx);
    if (dy > 1e-6) t = Math.min(t, (h - py) / dy);
    if (dy < -1e-6) t = Math.min(t, -py / dy);
    return [px + dx * t, py + dy * t];
  };
  const corners: [number, number][] = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];
  const norm = (a: number) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  let longest = 0;
  for (let i = 0; i < n; i++) {
    const a1 = angles[i];
    const a2 = angles[i + 1];
    const pts: [number, number][] = [[px, py], edge(a1)];
    // углы блока, попавшие внутрь клина, — по порядку обхода
    corners
      .map((c) => ({ c, d: norm(Math.atan2(c[1] - py, c[0] - px) - a1) }))
      .filter((c) => c.d > 0 && c.d < a2 - a1)
      .sort((p, q) => p.d - q.d)
      .forEach((c) => pts.push(c.c));
    pts.push(edge(a2));

    const shard = el.cloneNode(true) as HTMLElement;
    shard.removeAttribute("data-frame");
    shard.classList.remove("is-hit", "is-selected");
    shard.classList.add("st-shard");
    shard.querySelectorAll("video").forEach((v) => v.remove());
    shard.style.clipPath = `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(",")})`;
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    shard.style.transformOrigin = `${cx}px ${cy}px`;
    parent.appendChild(shard);

    const am = (a1 + a2) / 2;
    const dist = 180 + Math.random() * 420;
    const away = `translate(${(Math.cos(am) * dist).toFixed(0)}px, ${(Math.sin(am) * dist).toFixed(0)}px) rotate(${((Math.random() - 0.5) * 160).toFixed(0)}deg) scale(${(0.45 + Math.random() * 0.3).toFixed(2)})`;
    const dur = 750 + Math.random() * 550;
    const delay = mode === "in" ? i * 35 : Math.random() * 60;
    longest = Math.max(longest, dur + delay);
    const frames =
      mode === "out"
        ? [
            { transform: "none", opacity: 1, filter: "brightness(1)" },
            { transform: away, opacity: 0, filter: "brightness(0.8)" },
          ]
        : [
            { transform: away, opacity: 0 },
            { transform: "none", opacity: 1 },
          ];
    shard.animate(frames, {
      duration: dur,
      delay,
      easing: mode === "out" ? "cubic-bezier(.15,.75,.3,1)" : "cubic-bezier(.5,0,.25,1.25)",
      fill: "both",
    });
    // убираем по таймеру: в фоновой вкладке анимации стоят, а осколки не должны копиться
    setTimeout(() => shard.remove(), dur + delay + 40);
  }
  return longest;
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
