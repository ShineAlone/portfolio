import { GRID, ISLANDS, type Rect } from "./data";

/*
 * Город вокруг островов — появляется, когда садишься в машинку.
 * Промежутки между островами становятся улицами, вокруг — кольцевая дорога и два пояса
 * кварталов. Чтобы город не выглядел клетчатым полем, соседние кварталы иногда сливаются
 * в большие (стадион, парк с озером, промзона), на перекрёстках встречаются кольца,
 * а по самому краю течёт река с мостами. Районы разные: высотки у центра, дворы-колодцы,
 * коттеджи с бассейнами, склады с контейнерами, стройка с краном.
 * Всё считается один раз и детерминированно, поэтому город всегда «сходится» с островами.
 */

export type Surface = "road" | "tile" | "grass" | "dirt" | "water" | "field";
export type BlockKind =
  | "downtown"
  | "courtyard"
  | "cottages"
  | "industrial"
  | "park"
  | "parking"
  | "lot"
  | "stadium";

export type Building = Rect & {
  id: string;
  roof: string;
  tall: number;
  style: "flat" | "solar" | "helipad" | "garden" | "ribs" | "gable" | "container";
  vents: Rect[];
};
export type Ellipse = { cx: number; cy: number; rx: number; ry: number };
export type Tree = { x: number; y: number; r: number; c: string };
export type Parked = Rect & { c: string };
export type Line = { x1: number; y1: number; x2: number; y2: number };
export type Block = Rect & {
  kind: BlockKind;
  d: number;
  buildings: Building[];
  ponds: Ellipse[];
  pools: Rect[];
  greens: Rect[];
  fields: Ellipse[];
  paths: string[];
  trees: Tree[];
  parked: Parked[];
  mounds: Ellipse[];
  stripes: Line[];
  crane?: { x: number; y: number; a: number; len: number };
};

const ROAD = GRID.GAP;
const BLOCK = 1000;
const BELTS = 2;
// тротуар по краю квартала
export const CURB = 36;
// ширина беговой дорожки стадиона
export const TRACK = 90;

const PASTEL = ["#FEFE78", "#86DDFF", "#FFB6E1", "#ACF9A2", "#C791FF", "#FFC7B6"];
const ROOFS = [...PASTEL, "#F4F1EA", "#E4E0D8", "#F4F1EA"];
const LEAVES = ["#6FB453", "#5FA347", "#86C25A", "#79B85A"];
const CARS = [...PASTEL, "#F4F1EA", "#2B2B30"];
const BOXES = ["#E07A5F", "#3D7EA6", "#F2CC8F", "#81B29A", "#C791FF"];

// Детерминированный генератор: город одинаковый при каждой поездке.
function mulberry(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const inside = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const inEllipse = (e: Ellipse, x: number, y: number) => ((x - e.cx) / e.rx) ** 2 + ((y - e.cy) / e.ry) ** 2 <= 1;
const overlaps = (a: Rect, b: Rect, m = 0) =>
  a.x < b.x + b.w + m && a.x + a.w + m > b.x && a.y < b.y + b.h + m && a.y + a.h + m > b.y;
const r1 = (v: number) => Math.round(v * 10) / 10;

function build() {
  const rnd = mulberry(20250521);
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
  const between = (a: number, b: number) => a + rnd() * (b - a);

  const core = {
    x: Math.min(...ISLANDS.map((i) => i.x)),
    y: Math.min(...ISLANDS.map((i) => i.y)),
    r: Math.max(...ISLANDS.map((i) => i.x + i.w)),
    b: Math.max(...ISLANDS.map((i) => i.y + i.h)),
  };
  const step = BLOCK + ROAD;
  const span = Array.from({ length: BELTS + 1 }, (_, k) => k * step);

  // левые/верхние края сквозных улиц: кольцо вокруг островов и два внешних пояса
  const fullX = [...span.map((s) => core.x - ROAD - s), ...span.map((s) => core.r + s)].sort((a, b) => a - b);
  const fullY = [...span.map((s) => core.y - ROAD - s), ...span.map((s) => core.b + s)].sort((a, b) => a - b);
  const bounds: Rect = {
    x: fullX[0],
    y: fullY[0],
    w: fullX[fullX.length - 1] + ROAD - fullX[0],
    h: fullY[fullY.length - 1] + ROAD - fullY[0],
  };

  // улицы, продолжающие промежутки между колонками и рядами островов
  const colStreets = Array.from({ length: 5 }, (_, i) => GRID.colX(i) + GRID.COL);
  const rowStreets = [
    ...GRID.rows.slice(0, -1).map((r) => r.y + r.h),
    ...GRID.rows.map((r) => Math.round(r.y + r.h / 2 - ROAD / 2)),
  ].sort((a, b) => a - b);
  const allX = [...fullX, ...colStreets].sort((a, b) => a - b);

  /* ---------- река по нижнему краю ---------- */

  const band: Rect = {
    x: bounds.x,
    y: fullY[fullY.length - 2] + ROAD,
    w: bounds.w,
    h: fullY[fullY.length - 1] - fullY[fullY.length - 2] - ROAD,
  };
  const riverY = (x: number) => band.y + band.h / 2 + 130 * Math.sin((x - bounds.x) / 650) + 40 * Math.sin(x / 260);
  const riverW = (x: number) => 125 + 25 * Math.sin(x / 400);
  const riverTop: string[] = [];
  const riverBottom: string[] = [];
  for (let x = band.x - 40; x <= band.x + band.w + 40; x += 60) {
    riverTop.push(`${x} ${r1(riverY(x) - riverW(x))}`);
    riverBottom.unshift(`${x} ${r1(riverY(x) + riverW(x))}`);
  }
  const river = `M${riverTop.join("L")}L${riverBottom.join("L")}Z`;
  // мосты — сквозные дороги поперёк реки
  const bridges: Rect[] = allX.map((x) => ({ x, y: band.y, w: ROAD, h: band.h }));
  const bankTrees: Tree[] = [];
  for (let k = 0; k < 140; k++) {
    const x = between(band.x + 40, band.x + band.w - 40);
    const y = between(band.y + 40, band.y + band.h - 40);
    if (bridges.some((b) => x > b.x - 50 && x < b.x + b.w + 50)) continue;
    if (Math.abs(y - riverY(x)) < riverW(x) + 55) continue;
    bankTrees.push({ x: r1(x), y: r1(y), r: r1(between(24, 46)), c: pick(LEAVES) });
  }

  /* ---------- разметка ---------- */

  const lines: Line[] = [];
  const v = (x: number, y1: number, y2: number) => lines.push({ x1: x + ROAD / 2, y1, x2: x + ROAD / 2, y2 });
  const h = (y: number, x1: number, x2: number) => lines.push({ x1, y1: y + ROAD / 2, x2, y2: y + ROAD / 2 });

  /* ---------- кварталы: сетка ячеек, часть сливается в большие ---------- */

  type Cell = Rect & { big?: boolean };
  // ячейки одного ряда (или столбца) — соседние сливаются через улицу между ними
  const lane = (cells: Cell[], horizontal: boolean) => {
    const out: Cell[] = [];
    for (let i = 0; i < cells.length; i++) {
      const a = cells[i];
      const b = cells[i + 1];
      if (b && rnd() < 0.3) {
        out.push(
          horizontal
            ? { x: a.x, y: a.y, w: b.x + b.w - a.x, h: a.h, big: true }
            : { x: a.x, y: a.y, w: a.w, h: b.y + b.h - a.y, big: true }
        );
        i++;
      } else out.push(a);
    }
    return out;
  };
  const row = (xs: number[], y0: number, y1: number) =>
    xs.slice(0, -1).map((x, i) => ({ x: x + ROAD, y: y0 + ROAD, w: xs[i + 1] - x - ROAD, h: y1 - y0 - ROAD }));
  const col = (x0: number, x1: number, ys: number[]) =>
    ys.slice(0, -1).map((y, i) => ({ x: x0 + ROAD, y: y + ROAD, w: x1 - x0 - ROAD, h: ys[i + 1] - y - ROAD }));

  const topY = fullY.filter((y) => y < core.y);
  const middleY = [core.y - ROAD, ...rowStreets, core.b];
  const leftX = fullX.filter((x) => x < core.x);
  const rightX = fullX.filter((x) => x >= core.r);
  const cells: Cell[] = [
    ...topY.slice(0, -1).flatMap((y, j) => lane(row(allX, y, topY[j + 1]), true)),
    ...lane(row(allX, core.b, fullY[fullY.length - 2]), true),
    ...leftX.slice(0, -1).flatMap((x, i) => lane(col(x, leftX[i + 1], middleY), false)),
    ...rightX.slice(0, -1).flatMap((x, i) => lane(col(x, rightX[i + 1], middleY), false)),
  ];

  // разметка только там, где улица не съедена слитым кварталом
  const blocked = (l: Line) =>
    cells.some((c) => c.big && inside(c, (l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2));
  const seg = (x1: number, y1: number, x2: number, y2: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const l = {
        x1: x1 + ((x2 - x1) * i) / n,
        y1: y1 + ((y2 - y1) * i) / n,
        x2: x1 + ((x2 - x1) * (i + 1)) / n,
        y2: y1 + ((y2 - y1) * (i + 1)) / n,
      };
      if (!blocked(l)) lines.push(l);
    }
  };
  fullX.forEach((x) => seg(x + ROAD / 2, bounds.y, x + ROAD / 2, bounds.y + bounds.h, 24));
  fullY.forEach((y) => seg(bounds.x, y + ROAD / 2, bounds.x + bounds.w, y + ROAD / 2, 24));
  colStreets.forEach((x) => {
    seg(x + ROAD / 2, bounds.y, x + ROAD / 2, core.y - ROAD, 6);
    seg(x + ROAD / 2, core.b + ROAD, x + ROAD / 2, bounds.y + bounds.h, 6);
  });
  rowStreets.forEach((y) => {
    seg(bounds.x, y + ROAD / 2, core.x - ROAD, y + ROAD / 2, 6);
    seg(core.r + ROAD, y + ROAD / 2, bounds.x + bounds.w, y + ROAD / 2, 6);
  });
  // улицы между самими островами
  for (const a of ISLANDS)
    for (const b of ISLANDS)
      if (b.y === a.y && b.x > a.x + a.w && b.x - (a.x + a.w) <= ROAD) v(a.x + a.w, a.y, a.y + a.h);
  GRID.rows.slice(0, -1).forEach((r) => h(r.y + r.h, core.x, core.r));

  /* ---------- кольцевые развязки на перекрёстках внешних поясов ---------- */

  const rings: { cx: number; cy: number }[] = [];
  for (const x of fullX.slice(1, -1))
    for (const y of fullY.slice(1, -2)) {
      const cx = x + ROAD / 2;
      const cy = y + ROAD / 2;
      const nearCore = cx > core.x - ROAD * 1.5 && cx < core.r + ROAD * 1.5 && cy > core.y - ROAD * 1.5 && cy < core.b + ROAD * 1.5;
      if (!nearCore && rnd() < 0.55 && !cells.some((c) => c.big && inside(c, cx, cy))) rings.push({ cx, cy });
    }
  const ringIsles: Ellipse[] = rings.map((r) => ({ cx: r.cx, cy: r.cy, rx: 62, ry: 62 }));

  /* ---------- наполнение кварталов ---------- */

  const cx0 = (core.x + core.r) / 2;
  const cy0 = (core.y + core.b) / 2;
  const nearKinds: BlockKind[] = ["downtown", "downtown", "downtown", "courtyard", "courtyard", "parking", "park"];
  const farKinds: BlockKind[] = ["cottages", "cottages", "cottages", "courtyard", "park", "industrial", "lot", "downtown"];
  const bigKinds: BlockKind[] = ["park", "stadium", "industrial", "courtyard", "parking", "park"];

  const blocks: Block[] = cells.map((r, n) => {
    const near =
      r.x + r.w >= core.x - ROAD * 2 && r.x <= core.r + ROAD * 2 && r.y + r.h >= core.y - ROAD * 2 && r.y <= core.b + ROAD * 2;
    const kind: BlockKind = pick(r.big ? bigKinds : near ? nearKinds : farKinds);
    const dist = Math.hypot(r.x + r.w / 2 - cx0, r.y + r.h / 2 - cy0);
    const b: Block = {
      x: r.x,
      y: r.y,
      w: r.w,
      h: r.h,
      kind,
      // кварталы вырастают волной от островов наружу
      d: Math.round((0.2 + dist / 7000) * 100) / 100,
      buildings: [],
      ponds: [],
      pools: [],
      greens: [],
      fields: [],
      paths: [],
      trees: [],
      parked: [],
      mounds: [],
      stripes: [],
    };
    const inner = { x: r.x + CURB, y: r.y + CURB, w: r.w - CURB * 2, h: r.h - CURB * 2 };
    let id = 0;
    const house = (x: number, y: number, w: number, hh: number, style: Building["style"], tall: number, roof = pick(ROOFS)) => {
      const vents: Rect[] =
        style === "flat" || style === "ribs"
          ? Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => {
              const s = between(16, 30);
              return { x: r1(x + 20 + rnd() * Math.max(1, w - 40 - s)), y: r1(y + 20 + rnd() * Math.max(1, hh - 40 - s)), w: r1(s), h: r1(s) };
            })
          : [];
      b.buildings.push({ id: `b${n}-${id++}`, x: r1(x), y: r1(y), w: r1(w), h: r1(hh), roof, tall, style, vents });
    };
    const tree = (x: number, y: number, rr = between(24, 44)) => b.trees.push({ x: r1(x), y: r1(y), r: r1(rr), c: pick(LEAVES) });
    const free = (x: number, y: number, m: number) => !b.buildings.some((q) => overlaps(q, { x, y, w: 0, h: 0 }, m));

    if (kind === "downtown") {
      // одна-две высотки с длинными тенями, по краю площади — деревья в кадках
      const long = inner.w > inner.h;
      const parts = Math.max(inner.w, inner.h) > 700 ? 2 : 1;
      for (let i = 0; i < parts; i++) {
        const pw = long ? (inner.w - (parts - 1) * 70) / parts : inner.w;
        const ph = long ? inner.h : (inner.h - (parts - 1) * 70) / parts;
        const px = inner.x + (long ? i * (pw + 70) : 0);
        const py = inner.y + (long ? 0 : i * (ph + 70));
        const m = between(60, 110);
        house(px + m, py + between(60, 110), pw - m - between(60, 110), ph - between(130, 220), pick(["helipad", "garden", "solar", "flat"]), between(1.6, 2.4));
      }
      for (let t = inner.x + 40; t < inner.x + inner.w - 20; t += 130) {
        if (free(t, inner.y + 30, 34)) tree(t, inner.y + 30, 22);
        if (free(t, inner.y + inner.h - 30, 34)) tree(t, inner.y + inner.h - 30, 22);
      }
    } else if (kind === "courtyard") {
      // дом-колодец: корпуса по периметру, внутри зелёный двор с площадкой
      const t = 120;
      const o = { x: inner.x + 24, y: inner.y + 24, w: inner.w - 48, h: inner.h - 48 };
      const roof = pick(ROOFS);
      const tall = between(0.9, 1.3);
      const wing = (x: number, y: number, w: number, hh: number, horizontal: boolean) => {
        // в одном из корпусов — арка-проезд во двор
        if (rnd() < 0.45) {
          const gap = 90;
          const at = between(0.3, 0.6);
          if (horizontal) {
            house(x, y, w * at, hh, "flat", tall, roof);
            house(x + w * at + gap, y, w - w * at - gap, hh, "flat", tall, roof);
          } else {
            house(x, y, w, hh * at, "flat", tall, roof);
            house(x, y + hh * at + gap, w, hh - hh * at - gap, "flat", tall, roof);
          }
        } else house(x, y, w, hh, "flat", tall, roof);
      };
      wing(o.x, o.y, o.w, t, true);
      wing(o.x, o.y + o.h - t, o.w, t, true);
      wing(o.x, o.y + t, t, o.h - t * 2, false);
      wing(o.x + o.w - t, o.y + t, t, o.h - t * 2, false);
      const yard = { x: o.x + t + 20, y: o.y + t + 20, w: o.w - t * 2 - 40, h: o.h - t * 2 - 40 };
      b.greens.push(yard);
      b.fields.push({ cx: yard.x + yard.w * 0.3, cy: yard.y + yard.h * 0.35, rx: 55, ry: 55 });
      for (let k = 0; k < 6; k++) tree(between(yard.x + 40, yard.x + yard.w - 40), between(yard.y + yard.h * 0.55, yard.y + yard.h - 40), between(22, 36));
    } else if (kind === "cottages") {
      // коттеджи на участках: двускатные крыши, сады, иногда бассейн
      b.greens.push(inner);
      const nx = Math.max(1, Math.round(inner.w / 240));
      const ny = Math.max(1, Math.round(inner.h / 240));
      const lw = inner.w / nx;
      const lh = inner.h / ny;
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < ny; j++) {
          const lx = inner.x + i * lw;
          const ly = inner.y + j * lh;
          const w = between(100, 140);
          const hh = between(90, 120);
          const hx = lx + between(20, lw - w - 20);
          const hy = ly + between(20, lh - hh - 20);
          house(hx, hy, w, hh, "gable", between(0.3, 0.5));
          if (rnd() < 0.35) {
            const px = hx + w + 14 < lx + lw - 70 ? hx + w + 14 : lx + 14;
            b.pools.push({ x: r1(px), y: r1(ly + lh - 64), w: 56, h: 40 });
          }
          if (rnd() < 0.8) tree(lx + between(30, lw - 30), ly + between(30, lh - 30), between(20, 32));
        }
      b.trees = b.trees.filter((t) => free(t.x, t.y, t.r * 0.6));
    } else if (kind === "industrial") {
      // склады с рёбрами на крыше и штабеля контейнеров
      const long = inner.w > inner.h;
      const wh = long ? { x: inner.x + 40, y: inner.y + 40, w: inner.w * 0.55, h: inner.h - 80 } : { x: inner.x + 40, y: inner.y + 40, w: inner.w - 80, h: inner.h * 0.55 };
      house(wh.x, wh.y, wh.w, wh.h, "ribs", between(0.8, 1.1), pick(["#D9D6CE", "#C8D3DA", "#E4E0D8"]));
      const yard = long
        ? { x: wh.x + wh.w + 60, y: inner.y + 60, w: inner.x + inner.w - wh.x - wh.w - 100, h: inner.h - 120 }
        : { x: inner.x + 60, y: wh.y + wh.h + 60, w: inner.w - 120, h: inner.y + inner.h - wh.y - wh.h - 100 };
      for (let y = yard.y; y + 50 <= yard.y + yard.h; y += 70)
        for (let x = yard.x; x + 130 <= yard.x + yard.w; x += 150) if (rnd() < 0.7) house(x, y, 130, 50, "container", between(0.2, 0.35), pick(BOXES));
    } else if (kind === "park") {
      // извилистая дорожка, пруд или озеро, деревья вокруг
      b.greens.push(inner);
      const horizontal = inner.w >= inner.h;
      const p0 = horizontal ? [inner.x, inner.y + inner.h * between(0.3, 0.7)] : [inner.x + inner.w * between(0.3, 0.7), inner.y];
      const p3 = horizontal ? [inner.x + inner.w, inner.y + inner.h * between(0.3, 0.7)] : [inner.x + inner.w * between(0.3, 0.7), inner.y + inner.h];
      const c1 = horizontal ? [inner.x + inner.w * 0.33, inner.y + inner.h * between(0, 1)] : [inner.x + inner.w * between(0, 1), inner.y + inner.h * 0.33];
      const c2 = horizontal ? [inner.x + inner.w * 0.66, inner.y + inner.h * between(0, 1)] : [inner.x + inner.w * between(0, 1), inner.y + inner.h * 0.66];
      const pt = (p: number[]) => p.map(r1).join(" ");
      b.paths.push(`M${pt(p0)} C${pt(c1)} ${pt(c2)} ${pt(p3)}`);
      const bez = (t: number) =>
        [0, 1].map((k) => (1 - t) ** 3 * p0[k] + 3 * (1 - t) ** 2 * t * c1[k] + 3 * (1 - t) * t * t * c2[k] + t ** 3 * p3[k]);
      const onPath = (x: number, y: number, m: number) =>
        Array.from({ length: 30 }, (_, i) => bez(i / 29)).some(([px, py]) => Math.hypot(px - x, py - y) < m);
      if (r.big || rnd() < 0.7) {
        const big = r.big ? 1.8 : 1;
        for (let k = 0; k < 8; k++) {
          const pond = {
            cx: inner.x + inner.w * between(0.25, 0.75),
            cy: inner.y + inner.h * between(0.25, 0.75),
            rx: Math.min(between(120, 200) * big, inner.w * 0.3),
            ry: Math.min(between(90, 160) * big, inner.h * 0.3),
          };
          if (!Array.from({ length: 24 }, (_, i) => bez(i / 23)).some(([px, py]) => inEllipse({ ...pond, rx: pond.rx + 40, ry: pond.ry + 40 }, px, py))) {
            b.ponds.push(pond);
            break;
          }
        }
      }
      const count = Math.floor((inner.w * inner.h) / 30000);
      for (let k = 0; k < count; k++) {
        const x = inner.x + 30 + rnd() * (inner.w - 60);
        const y = inner.y + 30 + rnd() * (inner.h - 60);
        if (onPath(x, y, 55)) continue;
        if (b.ponds.some((p) => inEllipse({ ...p, rx: p.rx + 50, ry: p.ry + 50 }, x, y))) continue;
        tree(x, y, between(24, 48));
      }
    } else if (kind === "stadium") {
      // беговая дорожка вокруг поля — можно нарезать круги по газону
      b.fields.push({ cx: inner.x + inner.w / 2, cy: inner.y + inner.h / 2, rx: inner.w * 0.33, ry: inner.h * 0.3 });
      for (let t = inner.x + 50; t < inner.x + inner.w - 30; t += 140) {
        tree(t, inner.y + 34, 24);
        tree(t, inner.y + inner.h - 34, 24);
      }
    } else if (kind === "parking") {
      const rows = Math.max(1, Math.floor(inner.h / 260));
      const rowH = inner.h / rows;
      for (let j = 0; j < rows; j++) {
        const y = inner.y + j * rowH + 30;
        const n2 = Math.floor((inner.w - 40) / 90);
        for (let i = 0; i <= n2; i++) {
          const x = inner.x + 20 + i * 90;
          b.stripes.push({ x1: x, y1: y, x2: x, y2: y + 130 });
          if (i < n2 && rnd() < 0.55) b.parked.push({ x: x + 17, y: y + 12, w: 56, h: 104, c: pick(CARS) });
        }
      }
    } else {
      // стройка: насыпи, бетонные плиты и башенный кран
      const n3 = 3 + Math.floor(rnd() * 3);
      for (let k = 0; k < n3; k++)
        b.mounds.push({ cx: inner.x + 80 + rnd() * (inner.w - 160), cy: inner.y + 80 + rnd() * (inner.h - 160), rx: between(50, 120), ry: between(40, 90) });
      house(inner.x + inner.w * 0.55, inner.y + inner.h * 0.55, inner.w * 0.3, inner.h * 0.28, "flat", 0.25, "#B9B5AC");
      b.crane = { x: inner.x + inner.w * 0.4, y: inner.y + inner.h * 0.4, a: between(0, Math.PI * 2), len: Math.min(inner.w, inner.h) * 0.55 };
    }
    return b;
  });

  return {
    bounds,
    lines,
    blocks,
    rings,
    ringIsles,
    band,
    river,
    riverY,
    riverW,
    bridges,
    bankTrees,
    buildings: blocks.flatMap((b) => b.buildings),
  };
}

export type City = ReturnType<typeof build>;

let cache: City | null = null;
export const getCity = () => (cache ??= build());

const BLOCK_SURFACE: Record<BlockKind, Surface> = {
  downtown: "tile",
  courtyard: "tile",
  cottages: "grass",
  industrial: "road",
  park: "grass",
  parking: "road",
  lot: "dirt",
  stadium: "tile",
};

export function surfaceAt(city: City, x: number, y: number): Surface {
  for (const i of ISLANDS) if (inside(i, x, y)) return "tile";
  if (!inside(city.bounds, x, y)) return "field";
  if (inside(city.band, x, y)) {
    if (city.bridges.some((b) => inside(b, x, y))) return "road";
    return Math.abs(y - city.riverY(x)) < city.riverW(x) ? "water" : "grass";
  }
  for (const r of city.ringIsles) if (inEllipse(r, x, y)) return "grass";
  for (const b of city.blocks) {
    if (!inside(b, x, y)) continue;
    const inner = { x: b.x + CURB, y: b.y + CURB, w: b.w - CURB * 2, h: b.h - CURB * 2 };
    if (!inside(inner, x, y)) return "tile";
    if (b.ponds.some((p) => inEllipse(p, x, y))) return "water";
    // у стадиона внутри дорожки — газон
    if (b.kind === "stadium") {
      const f = b.fields[0];
      if (inEllipse(f, x, y)) return "grass";
      return inEllipse({ ...f, rx: f.rx + TRACK, ry: f.ry + TRACK }, x, y) ? "dirt" : "tile";
    }
    if (b.kind === "courtyard" && b.fields.some((f) => inEllipse(f, x, y))) return "dirt";
    if (b.greens.some((g) => inside(g, x, y))) return "grass";
    return BLOCK_SURFACE[b.kind];
  }
  return "road";
}

// Как поверхность держит машинку: потолок скорости, разгон и цвет следа (rgb без альфы).
export const SURFACES: Record<Surface, { name: string; max: number; accel: number; mark: string | null; markA: number }> = {
  road: { name: "Асфальт", max: 1, accel: 1, mark: "20,20,24", markA: 0.2 },
  tile: { name: "Плитка", max: 0.85, accel: 1, mark: "60,60,60", markA: 0.14 },
  grass: { name: "Трава", max: 0.55, accel: 0.7, mark: "62,104,40", markA: 0.45 },
  field: { name: "Поле", max: 0.55, accel: 0.7, mark: "62,104,40", markA: 0.45 },
  dirt: { name: "Грунт", max: 0.65, accel: 0.8, mark: "112,76,44", markA: 0.55 },
  water: { name: "Вода", max: 0.32, accel: 0.5, mark: null, markA: 0 },
};
