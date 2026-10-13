import { GRID, ISLANDS, type Rect } from "./data";

/*
 * Город вокруг островов — появляется, когда садишься в машинку.
 * Промежутки между островами становятся улицами, вокруг — кольцевая дорога
 * и два пояса кварталов: дома, парки с прудами, парковки, пустыри.
 * Всё считается один раз по сетке островов, поэтому город всегда «сходится» с ними.
 */

export type Surface = "road" | "tile" | "grass" | "dirt" | "water" | "field";
export type BlockKind = "houses" | "park" | "parking" | "lot";

export type Building = Rect & { id: string; roof: string; tall: number; style: number; vents: Rect[] };
export type Pond = { cx: number; cy: number; rx: number; ry: number };
export type Tree = { x: number; y: number; r: number; c: string };
export type Parked = Rect & { c: string };
export type Line = { x1: number; y1: number; x2: number; y2: number };
export type Block = Rect & {
  kind: BlockKind;
  d: number;
  buildings: Building[];
  ponds: Pond[];
  trees: Tree[];
  parked: Parked[];
  mounds: Pond[];
  stripes: Line[];
};

const ROAD = GRID.GAP;
const BLOCK = 1000;
const BELTS = 2;
// тротуар по краю квартала
export const CURB = 36;

const ROOFS = ["#FEFE78", "#86DDFF", "#FFB6E1", "#ACF9A2", "#C791FF", "#FFC7B6", "#F4F1EA", "#E4E0D8", "#F4F1EA"];
const LEAVES = ["#6FB453", "#5FA347", "#86C25A", "#79B85A"];
const CARS = ["#FEFE78", "#86DDFF", "#FFB6E1", "#ACF9A2", "#C791FF", "#FFC7B6", "#F4F1EA", "#2B2B30"];

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

function build() {
  const rnd = mulberry(20250521);
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

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

  const lines: Line[] = [];
  const v = (x: number, y1: number, y2: number) => lines.push({ x1: x + ROAD / 2, y1, x2: x + ROAD / 2, y2 });
  const h = (y: number, x1: number, x2: number) => lines.push({ x1, y1: y + ROAD / 2, x2, y2: y + ROAD / 2 });
  fullX.forEach((x) => v(x, bounds.y, bounds.y + bounds.h));
  fullY.forEach((y) => h(y, bounds.x, bounds.x + bounds.w));
  colStreets.forEach((x) => {
    v(x, bounds.y, core.y - ROAD);
    v(x, core.b + ROAD, bounds.y + bounds.h);
  });
  rowStreets.forEach((y) => {
    h(y, bounds.x, core.x - ROAD);
    h(y, core.r + ROAD, bounds.x + bounds.w);
  });
  // улицы между самими островами
  for (const a of ISLANDS) {
    for (const b of ISLANDS) {
      if (b.y === a.y && b.x > a.x + a.w && b.x - (a.x + a.w) <= ROAD) v(a.x + a.w, a.y, a.y + a.h);
    }
  }
  GRID.rows.slice(0, -1).forEach((r) => h(r.y + r.h, core.x, core.r));

  const cells = (xs: number[], ys: number[]) => {
    const out: Rect[] = [];
    for (let i = 0; i < xs.length - 1; i++)
      for (let j = 0; j < ys.length - 1; j++)
        out.push({ x: xs[i] + ROAD, y: ys[j] + ROAD, w: xs[i + 1] - xs[i] - ROAD, h: ys[j + 1] - ys[j] - ROAD });
    return out;
  };
  const allX = [...fullX, ...colStreets].sort((a, b) => a - b);
  const top = fullY.filter((y) => y < core.y);
  const bottom = fullY.filter((y) => y >= core.b);
  const middleY = [core.y - ROAD, ...rowStreets, core.b];
  const rects = [
    ...cells(allX, top),
    ...cells(allX, bottom),
    ...cells(fullX.filter((x) => x < core.x), middleY),
    ...cells(fullX.filter((x) => x >= core.r), middleY),
  ];

  const cx = (core.x + core.r) / 2;
  const cy = (core.y + core.b) / 2;
  const blocks: Block[] = [];

  const kinds: BlockKind[] = ["houses", "houses", "houses", "houses", "houses", "park", "park", "parking", "lot"];
  rects.forEach((r, n) => {
    // у самого кольца — чаще дома, чтобы острова сразу оказались «в городе»
    const near = r.x + r.w >= core.x - ROAD * 2 && r.x <= core.r + ROAD * 2 && r.y + r.h >= core.y - ROAD * 2 && r.y <= core.b + ROAD * 2;
    const kind: BlockKind = near && rnd() < 0.55 ? "houses" : pick(kinds);
    const dist = Math.hypot(r.x + r.w / 2 - cx, r.y + r.h / 2 - cy);
    const block: Block = {
      ...r,
      kind,
      // кварталы вырастают волной от островов наружу
      d: Math.round((0.25 + dist / 7000) * 100) / 100,
      buildings: [],
      ponds: [],
      trees: [],
      parked: [],
      mounds: [],
      stripes: [],
    };
    blocks.push(block);
    const { buildings, ponds, trees, parked, mounds, stripes } = block;
    const inner = { x: r.x + CURB, y: r.y + CURB, w: r.w - CURB * 2, h: r.h - CURB * 2 };

    if (kind === "houses") {
      const nx = Math.max(1, Math.round(inner.w / 300));
      const ny = Math.max(1, Math.round(inner.h / 300));
      const lw = inner.w / nx;
      const lh = inner.h / ny;
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < ny; j++) {
          const lx = inner.x + i * lw;
          const ly = inner.y + j * lh;
          if (rnd() < 0.12) {
            trees.push({ x: lx + lw / 2, y: ly + lh / 2, r: 34 + rnd() * 16, c: pick(LEAVES) });
            continue;
          }
          const m = () => 16 + rnd() * 34;
          const ml = m();
          const mt = m();
          const w = lw - ml - m();
          const hh = lh - mt - m();
          const vents: Rect[] = Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => {
            const s = 18 + rnd() * 18;
            return { x: lx + ml + 24 + rnd() * Math.max(1, w - 48 - s), y: ly + mt + 24 + rnd() * Math.max(1, hh - 48 - s), w: s, h: s };
          });
          buildings.push({
            id: `b${n}-${i}-${j}`,
            x: lx + ml,
            y: ly + mt,
            w,
            h: hh,
            roof: pick(ROOFS),
            tall: 0.4 + rnd() * 0.8,
            style: Math.floor(rnd() * 3),
            vents,
          });
        }
    } else if (kind === "park") {
      // дорожки крестом
      stripes.push({ x1: inner.x, y1: inner.y + inner.h / 2, x2: inner.x + inner.w, y2: inner.y + inner.h / 2 });
      stripes.push({ x1: inner.x + inner.w / 2, y1: inner.y, x2: inner.x + inner.w / 2, y2: inner.y + inner.h });
      let pond: Pond | null = null;
      if (rnd() < 0.6) {
        const rx = 110 + rnd() * 80;
        const ry = 80 + rnd() * 70;
        const qx = rnd() < 0.5 ? 0.27 : 0.73;
        const qy = rnd() < 0.5 ? 0.27 : 0.73;
        pond = { cx: inner.x + inner.w * qx, cy: inner.y + inner.h * qy, rx: Math.min(rx, inner.w * 0.22), ry: Math.min(ry, inner.h * 0.22) };
        ponds.push(pond);
      }
      const count = Math.floor((inner.w * inner.h) / 40000);
      for (let k = 0; k < count; k++) {
        const x = inner.x + 30 + rnd() * (inner.w - 60);
        const y = inner.y + 30 + rnd() * (inner.h - 60);
        if (Math.abs(x - (inner.x + inner.w / 2)) < 60 || Math.abs(y - (inner.y + inner.h / 2)) < 60) continue;
        if (pond && ((x - pond.cx) / (pond.rx + 50)) ** 2 + ((y - pond.cy) / (pond.ry + 50)) ** 2 < 1) continue;
        trees.push({ x, y, r: 26 + rnd() * 22, c: pick(LEAVES) });
      }
    } else if (kind === "parking") {
      const rows = Math.max(1, Math.floor(inner.h / 260));
      const rowH = inner.h / rows;
      for (let j = 0; j < rows; j++) {
        const y = inner.y + j * rowH + 30;
        const n2 = Math.floor((inner.w - 40) / 90);
        for (let i = 0; i <= n2; i++) {
          const x = inner.x + 20 + i * 90;
          stripes.push({ x1: x, y1: y, x2: x, y2: y + 130 });
          if (i < n2 && rnd() < 0.55) parked.push({ x: x + 17, y: y + 12, w: 56, h: 104, c: pick(CARS) });
        }
      }
    } else {
      const n3 = 3 + Math.floor(rnd() * 3);
      for (let k = 0; k < n3; k++)
        mounds.push({
          cx: inner.x + 80 + rnd() * (inner.w - 160),
          cy: inner.y + 80 + rnd() * (inner.h - 160),
          rx: 50 + rnd() * 70,
          ry: 40 + rnd() * 50,
        });
    }
  });

  return {
    bounds,
    lines,
    blocks,
    buildings: blocks.flatMap((b) => b.buildings),
    ponds: blocks.flatMap((b) => b.ponds),
  };
}

export type City = ReturnType<typeof build>;

let cache: City | null = null;
export const getCity = () => (cache ??= build());

const BLOCK_SURFACE: Record<BlockKind, Surface> = { houses: "tile", park: "grass", parking: "road", lot: "dirt" };

export function surfaceAt(city: City, x: number, y: number): Surface {
  for (const p of city.ponds) if (((x - p.cx) / p.rx) ** 2 + ((y - p.cy) / p.ry) ** 2 <= 1) return "water";
  for (const i of ISLANDS) if (inside(i, x, y)) return "tile";
  if (!inside(city.bounds, x, y)) return "field";
  for (const b of city.blocks) {
    if (!inside(b, x, y)) continue;
    const inner = { x: b.x + CURB, y: b.y + CURB, w: b.w - CURB * 2, h: b.h - CURB * 2 };
    return inside(inner, x, y) ? BLOCK_SURFACE[b.kind] : "tile";
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
