import { GRID, ISLANDS, type Rect } from "./data";

/*
 * Город вокруг островов — появляется, когда садишься в машинку.
 * Промежутки между островами становятся улицами, вокруг — кольцевая дорога и два пояса
 * кварталов. Город стоит на острове: за последней улицей — набережная, пляж и море,
 * поэтому уехать из него нельзя — машинку, заплывшую далеко, возвращает катер.
 * Чтобы город не выглядел клетчатым полем, соседние кварталы иногда сливаются
 * в большие (стадион, парк с озером, промзона), на перекрёстках встречаются кольца,
 * а по нижнему краю течёт река с мостами. Районы разные: высотки у центра, дворы-колодцы,
 * коттеджи с бассейнами, площади с фонтанами, спортплощадки, склады, стройка с краном.
 * Всё считается один раз и детерминированно, поэтому город всегда «сходится» с островами.
 */

export type Surface = "road" | "tile" | "grass" | "dirt" | "water" | "sand" | "sea";
export type BlockKind =
  | "downtown"
  | "courtyard"
  | "cottages"
  | "industrial"
  | "park"
  | "parking"
  | "lot"
  | "stadium"
  | "plaza"
  | "sports";

export type Building = Rect & {
  id: string;
  roof: string;
  tall: number;
  /** ступени высотки: каждая следующая меньше предыдущей */
  tiers: number;
  style: "flat" | "solar" | "helipad" | "garden" | "ribs" | "gable" | "container";
  vents: Rect[];
};
export type Ellipse = { cx: number; cy: number; rx: number; ry: number };
export type Pond = Ellipse & { d: string; lilies: { x: number; y: number; r: number }[] };
export type Tree = { x: number; y: number; r: number; c: string };
export type Parked = Rect & { c: string };
export type Line = { x1: number; y1: number; x2: number; y2: number };
export type Court = Rect & { type: "tennis" | "basket" | "play" };
export type Dot = { x: number; y: number; r: number; c: string };
export type Block = Rect & {
  kind: BlockKind;
  d: number;
  buildings: Building[];
  ponds: Pond[];
  pools: Rect[];
  greens: Rect[];
  fields: Ellipse[];
  paths: string[];
  trees: Tree[];
  curbTrees: Tree[];
  parked: Parked[];
  mounds: Ellipse[];
  stripes: Line[];
  fences: Line[];
  courts: Court[];
  beds: Dot[];
  umbrellas: Dot[];
  tanks: Dot[];
  fountain?: { cx: number; cy: number; r: number };
  crane?: { x: number; y: number; a: number; len: number };
};
export type Zebra = Line & { w: number };

const ROAD = GRID.GAP;
const BLOCK = 1000;
const BELTS = 2;
// тротуар по краю квартала
export const CURB = 36;
// ширина беговой дорожки стадиона
export const TRACK = 90;
// берег вокруг города: полоса травы, за ней пляж, дальше море
export const SHORE = { grass: 150, sand: 130 };
// радиусы кольцевой развязки: асфальт и клумба
export const RING = { road: 172, isle: 62 };
// как далеко можно заплыть, прежде чем машинку заберёт катер
export const SEA_LIMIT = 260;

const PASTEL = ["#FEFE78", "#86DDFF", "#FFB6E1", "#ACF9A2", "#C791FF", "#FFC7B6"];
const ROOFS = [...PASTEL, "#F4F1EA", "#E4E0D8", "#F4F1EA", "#EADFCB", "#D8DEE6"];
const LEAVES = ["#6FB453", "#5FA347", "#86C25A", "#79B85A"];
const CARS = [...PASTEL, "#F4F1EA", "#2B2B30"];
const BOXES = ["#E07A5F", "#3D7EA6", "#F2CC8F", "#81B29A", "#C791FF"];
const FLOWERS = ["#FFB6E1", "#FEFE78", "#C791FF", "#FF8FA3", "#fff"];

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

// расстояние от точки до прямоугольника снаружи (0 — внутри)
const outside = (r: Rect, x: number, y: number) =>
  Math.hypot(Math.max(r.x - x, 0, x - (r.x + r.w)), Math.max(r.y - y, 0, y - (r.y + r.h)));

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
  // слой города шире самого города: вокруг — берег и пляж
  const pad = SHORE.grass + SHORE.sand + 160;
  const outer: Rect = { x: bounds.x - pad, y: bounds.y - pad, w: bounds.w + pad * 2, h: bounds.h + pad * 2 };

  /*
   * Улицы поясов продолжают настоящие промежутки между островами, а длинные отрезки между ними
   * делятся на кварталы примерно по километру — без гигантских и без крошечных блоков.
   */
  const cut = (a: number, b: number) => {
    const n = Math.max(1, Math.round((b - a + ROAD) / (BLOCK + ROAD)));
    const size = (b - a - (n - 1) * ROAD) / n;
    return Array.from({ length: n - 1 }, (_, i) => Math.round(a + (i + 1) * size + i * ROAD));
  };
  const streets = (from: number, to: number, gaps: number[]) => {
    const marks = [from - ROAD, ...gaps, to];
    return marks.slice(0, -1).flatMap((g, i) => [...(i ? [g] : []), ...cut(g + ROAD, marks[i + 1])]);
  };
  const gapsX = [...new Set(ISLANDS.map((i) => i.x + i.w).filter((x) => x < core.r))].sort((a, b) => a - b);
  const gapsY = GRID.rows.slice(0, -1).map((r) => r.y + r.h);
  const colStreets = streets(core.x, core.r, gapsX);
  const rowStreets = streets(core.y, core.b, gapsY);
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
  // река впадает в море с обеих сторон — тянется через берег и пляж
  for (let x = outer.x; x <= outer.x + outer.w; x += 60) {
    riverTop.push(`${x} ${r1(riverY(x) - riverW(x))}`);
    riverBottom.unshift(`${x} ${r1(riverY(x) + riverW(x))}`);
  }
  const river = `M${riverTop.join("L")}L${riverBottom.join("L")}Z`;
  // мосты — сквозные дороги поперёк реки
  const bridges: Rect[] = allX.map((x) => ({ x, y: band.y, w: ROAD, h: band.h }));
  const bankTrees: Tree[] = [];
  for (let k = 0; k < 170; k++) {
    const x = between(band.x + 40, band.x + band.w - 40);
    const y = between(band.y + 40, band.y + band.h - 40);
    if (bridges.some((b) => x > b.x - 50 && x < b.x + b.w + 50)) continue;
    if (Math.abs(y - riverY(x)) < riverW(x) + 55) continue;
    bankTrees.push({ x: r1(x), y: r1(y), r: r1(between(24, 46)), c: pick(LEAVES) });
  }

  /* ---------- кварталы: сетка ячеек, часть сливается в большие ---------- */

  type Cell = Rect & { big?: boolean };
  // ячейки одного ряда (или столбца) — соседние сливаются через улицу между ними
  const lane = (cells: Cell[], horizontal: boolean) => {
    const out: Cell[] = [];
    for (let i = 0; i < cells.length; i++) {
      const a = cells[i];
      const b = cells[i + 1];
      const merged = b && (horizontal ? b.x + b.w - a.x : b.y + b.h - a.y);
      if (b && merged && merged < 2500 && rnd() < 0.24) {
        out.push(horizontal ? { x: a.x, y: a.y, w: merged, h: a.h, big: true } : { x: a.x, y: a.y, w: a.w, h: merged, big: true });
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

  /* ---------- разметка ---------- */

  const lines: Line[] = [];
  // осевая только там, где действительно асфальт: не под слитым кварталом и не под островом
  const blocked = (l: Line) => {
    const mx = (l.x1 + l.x2) / 2;
    const my = (l.y1 + l.y2) / 2;
    return cells.some((c) => inside(c, mx, my)) || ISLANDS.some((i) => inside(i, mx, my));
  };
  const seg = (x1: number, y1: number, x2: number, y2: number) => {
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / 300));
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
  const bottom = bounds.y + bounds.h;
  const right = bounds.x + bounds.w;
  fullX.forEach((x) => seg(x + ROAD / 2, bounds.y, x + ROAD / 2, bottom));
  fullY.forEach((y) => seg(bounds.x, y + ROAD / 2, right, y + ROAD / 2));
  colStreets.forEach((x) => {
    seg(x + ROAD / 2, bounds.y, x + ROAD / 2, core.y - ROAD);
    seg(x + ROAD / 2, core.b + ROAD, x + ROAD / 2, bottom);
  });
  rowStreets.forEach((y) => {
    seg(bounds.x, y + ROAD / 2, core.x - ROAD, y + ROAD / 2);
    seg(core.r + ROAD, y + ROAD / 2, right, y + ROAD / 2);
  });
  // улицы между самими островами: там, где соседи стоят через промежуток
  for (const a of ISLANDS)
    for (const b of ISLANDS) {
      if (Math.abs(b.x - (a.x + a.w) - ROAD) < 1) {
        const y1 = Math.max(a.y, b.y);
        const y2 = Math.min(a.y + a.h, b.y + b.h);
        if (y2 > y1) lines.push({ x1: a.x + a.w + ROAD / 2, y1, x2: a.x + a.w + ROAD / 2, y2 });
      }
      if (Math.abs(b.y - (a.y + a.h) - ROAD) < 1) {
        const x1 = Math.max(a.x, b.x);
        const x2 = Math.min(a.x + a.w, b.x + b.w);
        if (x2 > x1) lines.push({ x1, y1: a.y + a.h + ROAD / 2, x2, y2: a.y + a.h + ROAD / 2 });
      }
    }

  /* ---------- кольцевые развязки на перекрёстках внешних поясов ---------- */

  const rings: { cx: number; cy: number }[] = [];
  for (const x of fullX.slice(1, -1))
    for (const y of fullY.slice(1, -2)) {
      const cx = x + ROAD / 2;
      const cy = y + ROAD / 2;
      const nearCore = cx > core.x - ROAD * 1.5 && cx < core.r + ROAD * 1.5 && cy > core.y - ROAD * 1.5 && cy < core.b + ROAD * 1.5;
      if (!nearCore && rnd() < 0.6 && !cells.some((c) => c.big && inside(c, cx, cy))) rings.push({ cx, cy });
    }

  /* ---------- пешеходные переходы у углов кварталов ---------- */

  const isRoad = (x: number, y: number) =>
    inside(bounds, x, y) && !inside(band, x, y) && !cells.some((c) => inside(c, x, y)) && !ISLANDS.some((i) => inside(i, x, y));
  const zebras: Zebra[] = [];
  const zebra = (z: Zebra) => {
    const mx = (z.x1 + z.x2) / 2;
    const my = (z.y1 + z.y2) / 2;
    if (!isRoad(mx, my)) return;
    if (rings.some((r) => Math.hypot(r.cx - mx, r.cy - my) < RING.road + 30)) return;
    zebras.push(z);
  };
  for (const c of cells) {
    // через улицу слева — у верхнего и нижнего угла, через улицу сверху — у левого и правого
    for (const y of [c.y + 52, c.y + c.h - 52]) zebra({ x1: c.x - ROAD + 18, y1: y, x2: c.x - 18, y2: y, w: 48 });
    for (const x of [c.x + 52, c.x + c.w - 52]) zebra({ x1: x, y1: c.y - ROAD + 18, x2: x, y2: c.y - 18, w: 48 });
  }

  /* ---------- наполнение кварталов ---------- */

  const cx0 = (core.x + core.r) / 2;
  const cy0 = (core.y + core.b) / 2;
  const nearKinds: BlockKind[] = ["downtown", "downtown", "downtown", "courtyard", "courtyard", "plaza", "parking", "park", "sports"];
  const farKinds: BlockKind[] = ["cottages", "cottages", "cottages", "courtyard", "park", "industrial", "lot", "downtown", "sports", "plaza"];
  const bigKinds: BlockKind[] = ["park", "stadium", "industrial", "courtyard", "park", "cottages"];

  // озеро неправильной формы: точки по эллипсу с разным радиусом, сглаженные кривыми
  const blob = (cx: number, cy: number, rx: number, ry: number) => {
    const n = 10;
    const pts = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const k = between(0.8, 1);
      return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
    });
    const mid = (p: number[], q: number[]) => `${r1((p[0] + q[0]) / 2)} ${r1((p[1] + q[1]) / 2)}`;
    let d = `M${mid(pts[n - 1], pts[0])}`;
    for (let i = 0; i < n; i++) d += `Q${r1(pts[i][0])} ${r1(pts[i][1])} ${mid(pts[i], pts[(i + 1) % n])}`;
    return `${d}Z`;
  };

  const blocks: Block[] = cells.map((r, n) => {
    const near =
      r.x + r.w >= core.x - ROAD * 2 && r.x <= core.r + ROAD * 2 && r.y + r.h >= core.y - ROAD * 2 && r.y <= core.b + ROAD * 2;
    const kind: BlockKind = pick(r.big ? bigKinds : near ? nearKinds : farKinds);
    const dist = outside({ x: core.x, y: core.y, w: core.r - core.x, h: core.b - core.y }, r.x + r.w / 2, r.y + r.h / 2);
    const b: Block = {
      x: r.x,
      y: r.y,
      w: r.w,
      h: r.h,
      kind,
      // кварталы вырастают волной от островов наружу
      d: Math.round((0.15 + dist / 3200 + Math.abs(r.x + r.w / 2 - cx0) / 60000 + Math.abs(r.y + r.h / 2 - cy0) / 60000) * 100) / 100,
      buildings: [],
      ponds: [],
      pools: [],
      greens: [],
      fields: [],
      paths: [],
      trees: [],
      curbTrees: [],
      parked: [],
      mounds: [],
      stripes: [],
      fences: [],
      courts: [],
      beds: [],
      umbrellas: [],
      tanks: [],
    };
    const inner = { x: r.x + CURB, y: r.y + CURB, w: r.w - CURB * 2, h: r.h - CURB * 2 };
    let id = 0;
    const house = (x: number, y: number, w: number, hh: number, style: Building["style"], tall: number, roof = pick(ROOFS), tiers = 1) => {
      // дом не может получиться вывернутым или вылезти за квартал
      w = Math.min(Math.max(40, w), inner.x + inner.w - x);
      hh = Math.min(Math.max(40, hh), inner.y + inner.h - y);
      if (w < 40 || hh < 40) return;
      const vents: Rect[] =
        style === "flat" || style === "ribs"
          ? Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => {
              const s = between(16, 30);
              return { x: r1(x + 20 + rnd() * Math.max(1, w - 40 - s)), y: r1(y + 20 + rnd() * Math.max(1, hh - 40 - s)), w: r1(s), h: r1(s) };
            })
          : [];
      b.buildings.push({ id: `b${n}-${id++}`, x: r1(x), y: r1(y), w: r1(w), h: r1(hh), roof, tall, tiers, style, vents });
    };
    const tree = (x: number, y: number, rr = between(24, 44)) => b.trees.push({ x: r1(x), y: r1(y), r: r1(rr), c: pick(LEAVES) });
    const free = (x: number, y: number, m: number) => !b.buildings.some((q) => overlaps(q, { x, y, w: 0, h: 0 }, m));

    // деревья вдоль тротуара — у жилых и общественных кварталов
    if (!["industrial", "parking", "lot"].includes(kind)) {
      const m = CURB / 2;
      for (let x = r.x + 110; x < r.x + r.w - 90; x += 210) {
        b.curbTrees.push({ x, y: r.y + m, r: 13, c: pick(LEAVES) }, { x: x + 70, y: r.y + r.h - m, r: 13, c: pick(LEAVES) });
      }
      for (let y = r.y + 110; y < r.y + r.h - 90; y += 210) {
        b.curbTrees.push({ x: r.x + m, y: y + 70, r: 13, c: pick(LEAVES) }, { x: r.x + r.w - m, y, r: 13, c: pick(LEAVES) });
      }
    }

    if (kind === "downtown") {
      // одна-две ступенчатые высотки с длинными тенями, по краю площади — деревья в кадках
      const long = inner.w > inner.h;
      const parts = Math.max(inner.w, inner.h) > 760 ? 2 : 1;
      for (let i = 0; i < parts; i++) {
        const pw = long ? (inner.w - (parts - 1) * 70) / parts : inner.w;
        const ph = long ? inner.h : (inner.h - (parts - 1) * 70) / parts;
        const px = inner.x + (long ? i * (pw + 70) : 0);
        const py = inner.y + (long ? 0 : i * (ph + 70));
        const mx = between(60, 100);
        const my = between(70, 110);
        const w = pw - mx * 2;
        const hh = ph - my * 2;
        house(px + mx, py + my, w, hh, pick(["helipad", "garden", "solar", "flat"]), between(1.6, 2.4), undefined, Math.min(w, hh) > 300 ? 3 : 2);
      }
      for (let t = inner.x + 40; t < inner.x + inner.w - 20; t += 130) {
        if (free(t, inner.y + 30, 34)) tree(t, inner.y + 30, 22);
        if (free(t, inner.y + inner.h - 30, 34)) tree(t, inner.y + inner.h - 30, 22);
      }
    } else if (kind === "courtyard") {
      // дом-колодец: корпуса по периметру, внутри зелёный двор с площадкой
      const t = Math.min(120, inner.w * 0.2, inner.h * 0.2);
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
      if (yard.w > 120 && yard.h > 120) {
        b.greens.push(yard);
        b.courts.push({ x: r1(yard.x + yard.w * 0.12), y: r1(yard.y + yard.h * 0.12), w: Math.min(150, yard.w * 0.4), h: Math.min(110, yard.h * 0.35), type: "play" });
        for (let k = 0; k < 6; k++) tree(between(yard.x + 40, yard.x + yard.w - 40), between(yard.y + yard.h * 0.55, yard.y + yard.h - 40), between(22, 36));
      }
    } else if (kind === "cottages") {
      // коттеджи на участках: двускатные крыши, заборы, сады, иногда бассейн
      b.greens.push(inner);
      const nx = Math.max(1, Math.round(inner.w / 240));
      const ny = Math.max(1, Math.round(inner.h / 240));
      const lw = inner.w / nx;
      const lh = inner.h / ny;
      for (let i = 1; i < nx; i++) b.fences.push({ x1: r1(inner.x + i * lw), y1: inner.y + 8, x2: r1(inner.x + i * lw), y2: inner.y + inner.h - 8 });
      for (let j = 1; j < ny; j++) b.fences.push({ x1: inner.x + 8, y1: r1(inner.y + j * lh), x2: inner.x + inner.w - 8, y2: r1(inner.y + j * lh) });
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < ny; j++) {
          const lx = inner.x + i * lw;
          const ly = inner.y + j * lh;
          const w = between(100, 140);
          const hh = between(90, 120);
          const hx = lx + between(20, Math.max(21, lw - w - 20));
          const hy = ly + between(20, Math.max(21, lh - hh - 20));
          house(hx, hy, w, hh, "gable", between(0.3, 0.5), pick(["#E07A5F", "#C96F53", "#8FA6B8", "#F2CC8F", "#B8876B", "#7FA387"]));
          if (rnd() < 0.35) {
            const px = hx + w + 14 < lx + lw - 70 ? hx + w + 14 : lx + 14;
            b.pools.push({ x: r1(px), y: r1(ly + lh - 64), w: 56, h: 40 });
          }
          if (rnd() < 0.8) tree(lx + between(30, lw - 30), ly + between(30, lh - 30), between(20, 32));
          if (rnd() < 0.5) b.beds.push({ x: r1(lx + between(24, lw - 24)), y: r1(ly + between(24, lh - 24)), r: r1(between(8, 14)), c: pick(FLOWERS) });
        }
      b.trees = b.trees.filter((t) => free(t.x, t.y, t.r * 0.6));
      b.beds = b.beds.filter((t) => free(t.x, t.y, t.r + 6) && !b.pools.some((p) => overlaps(p, { x: t.x, y: t.y, w: 0, h: 0 }, 16)));
    } else if (kind === "industrial") {
      // склады с рёбрами на крыше, резервуары и штабеля контейнеров
      const long = inner.w > inner.h;
      const wh = long ? { x: inner.x + 40, y: inner.y + 40, w: inner.w * 0.55, h: inner.h - 80 } : { x: inner.x + 40, y: inner.y + 40, w: inner.w - 80, h: inner.h * 0.55 };
      house(wh.x, wh.y, wh.w, wh.h, "ribs", between(0.8, 1.1), pick(["#D9D6CE", "#C8D3DA", "#E4E0D8"]));
      const yard = long
        ? { x: wh.x + wh.w + 60, y: inner.y + 60, w: inner.x + inner.w - wh.x - wh.w - 100, h: inner.h - 120 }
        : { x: inner.x + 60, y: wh.y + wh.h + 60, w: inner.w - 120, h: inner.y + inner.h - wh.y - wh.h - 100 };
      // резервуары в углу двора, остальное — контейнеры
      const tanks = Math.min(3, Math.floor(Math.min(yard.w, yard.h) / 130));
      for (let k = 0; k < tanks; k++) b.tanks.push({ x: r1(yard.x + 55 + k * 120), y: r1(yard.y + 55), r: 48, c: pick(["#F4F1EA", "#D8DEE6", "#EADFCB"]) });
      for (let y = yard.y + (tanks ? 140 : 0); y + 50 <= yard.y + yard.h; y += 70)
        for (let x = yard.x; x + 130 <= yard.x + yard.w; x += 150) if (rnd() < 0.7) house(x, y, 130, 50, "container", between(0.2, 0.35), pick(BOXES));
    } else if (kind === "park") {
      // извилистая дорожка, озеро неправильной формы, клумбы, деревья вокруг
      b.greens.push(inner);
      const horizontal = inner.w >= inner.h;
      const p0 = horizontal ? [inner.x, inner.y + inner.h * between(0.3, 0.7)] : [inner.x + inner.w * between(0.3, 0.7), inner.y];
      const p3 = horizontal ? [inner.x + inner.w, inner.y + inner.h * between(0.3, 0.7)] : [inner.x + inner.w * between(0.3, 0.7), inner.y + inner.h];
      const c1 = horizontal ? [inner.x + inner.w * 0.33, inner.y + inner.h * between(0.1, 0.9)] : [inner.x + inner.w * between(0.1, 0.9), inner.y + inner.h * 0.33];
      const c2 = horizontal ? [inner.x + inner.w * 0.66, inner.y + inner.h * between(0.1, 0.9)] : [inner.x + inner.w * between(0.1, 0.9), inner.y + inner.h * 0.66];
      const pt = (p: number[]) => p.map(r1).join(" ");
      b.paths.push(`M${pt(p0)} C${pt(c1)} ${pt(c2)} ${pt(p3)}`);
      const bez = (t: number) =>
        [0, 1].map((k) => (1 - t) ** 3 * p0[k] + 3 * (1 - t) ** 2 * t * c1[k] + 3 * (1 - t) * t * t * c2[k] + t ** 3 * p3[k]);
      const way = Array.from({ length: 30 }, (_, i) => bez(i / 29));
      const onPath = (x: number, y: number, m: number) => way.some(([px, py]) => Math.hypot(px - x, py - y) < m);
      if (r.big || rnd() < 0.75) {
        const big = r.big ? 1.8 : 1;
        // берег озера не ближе 50 px к тротуару: озеро целиком внутри парка
        const rx = Math.min(between(130, 210) * big, inner.w * 0.3);
        const ry = Math.min(between(100, 170) * big, inner.h * 0.3);
        for (let k = 0; k < 10; k++) {
          const pond = {
            cx: between(inner.x + rx + 50, inner.x + inner.w - rx - 50),
            cy: between(inner.y + ry + 50, inner.y + inner.h - ry - 50),
            rx,
            ry,
          };
          if (!way.some(([px, py]) => inEllipse({ ...pond, rx: rx + 44, ry: ry + 44 }, px, py))) {
            const lilies = Array.from({ length: 3 + Math.floor(rnd() * 4) }, () => {
              const a = rnd() * Math.PI * 2;
              const k2 = between(0.15, 0.6);
              return { x: r1(pond.cx + Math.cos(a) * rx * k2), y: r1(pond.cy + Math.sin(a) * ry * k2), r: r1(between(7, 12)) };
            });
            b.ponds.push({ ...pond, d: blob(pond.cx, pond.cy, rx, ry), lilies });
            break;
          }
        }
      }
      const clear = (x: number, y: number, m: number) =>
        !onPath(x, y, m) && !b.ponds.some((p) => inEllipse({ ...p, rx: p.rx + m, ry: p.ry + m }, x, y));
      const count = Math.floor((inner.w * inner.h) / 30000);
      for (let k = 0; k < count; k++) {
        const x = inner.x + 40 + rnd() * (inner.w - 80);
        const y = inner.y + 40 + rnd() * (inner.h - 80);
        if (clear(x, y, 55)) tree(x, y, between(24, 48));
      }
      // клумбы вдоль дорожки
      for (let k = 2; k < way.length - 2; k += 4) {
        const [px, py] = way[k];
        const x = px + (horizontal ? 0 : 46);
        const y = py + (horizontal ? 46 : 0);
        if (inside({ x: inner.x + 20, y: inner.y + 20, w: inner.w - 40, h: inner.h - 40 }, x, y) && !b.ponds.some((p) => inEllipse({ ...p, rx: p.rx + 30, ry: p.ry + 30 }, x, y)))
          b.beds.push({ x: r1(x), y: r1(y), r: 13, c: pick(FLOWERS) });
      }
      b.trees = b.trees.filter((t) => !b.beds.some((q) => Math.hypot(q.x - t.x, q.y - t.y) < t.r + 18));
    } else if (kind === "stadium") {
      // беговая дорожка вокруг поля — можно нарезать круги по газону
      b.fields.push({ cx: inner.x + inner.w / 2, cy: inner.y + inner.h / 2, rx: inner.w * 0.33, ry: inner.h * 0.3 });
      for (let t = inner.x + 50; t < inner.x + inner.w - 30; t += 140) {
        tree(t, inner.y + 34, 24);
        tree(t, inner.y + inner.h - 34, 24);
      }
    } else if (kind === "plaza") {
      // площадь: фонтан в центре, кольцо деревьев, кафе с зонтиками и киоск
      const cx = inner.x + inner.w / 2;
      const cy = inner.y + inner.h / 2;
      const rr = Math.min(inner.w, inner.h);
      b.fountain = { cx, cy, r: Math.min(90, rr * 0.14) };
      const ring = Math.min(rr * 0.36, 300);
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2 + 0.3;
        tree(cx + Math.cos(a) * ring, cy + Math.sin(a) * ring * Math.min(1, inner.h / inner.w + 0.2), 24);
      }
      const corner = { x: inner.x + 50, y: inner.y + 50 };
      if (rr > 420) {
        house(corner.x, corner.y, 120, 90, "flat", 0.4, pick(PASTEL));
        for (let k = 0; k < 5; k++)
          b.umbrellas.push({ x: r1(corner.x + 170 + (k % 3) * 74), y: r1(corner.y + 30 + Math.floor(k / 3) * 74), r: 28, c: pick(PASTEL) });
        b.trees = b.trees.filter((t) => free(t.x, t.y, t.r) && !b.umbrellas.some((u) => Math.hypot(u.x - t.x, u.y - t.y) < 60));
      }
    } else if (kind === "sports") {
      // спортивный квартал: корты и площадки на газоне, между ними деревья
      b.greens.push(inner);
      const sw = 300;
      const sh = 190;
      const nx = Math.max(1, Math.floor((inner.w - 40) / sw));
      const ny = Math.max(1, Math.floor((inner.h - 40) / sh));
      const ox = inner.x + (inner.w - nx * sw) / 2;
      const oy = inner.y + (inner.h - ny * sh) / 2;
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < ny; j++) {
          const x = ox + i * sw;
          const y = oy + j * sh;
          const roll = rnd();
          if (roll < 0.4) b.courts.push({ x: r1(x + 30), y: r1(y + 30), w: 240, h: 130, type: "tennis" });
          else if (roll < 0.65) b.courts.push({ x: r1(x + 50), y: r1(y + 30), w: 200, h: 130, type: "basket" });
          else {
            tree(x + between(70, 120), y + between(60, 130), between(26, 40));
            tree(x + between(180, 240), y + between(50, 140), between(24, 36));
          }
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
      for (let k = 0; k < n3; k++) {
        const rx = between(50, 110);
        const ry = between(40, 85);
        b.mounds.push({ cx: between(inner.x + rx + 20, inner.x + inner.w - rx - 20), cy: between(inner.y + ry + 20, inner.y + inner.h - ry - 20), rx, ry });
      }
      house(inner.x + inner.w * 0.55, inner.y + inner.h * 0.55, inner.w * 0.3, inner.h * 0.28, "flat", 0.25, "#B9B5AC");
      b.mounds = b.mounds.filter((m) => free(m.cx, m.cy, Math.max(m.rx, m.ry)));
      // стрела крана не длиннее, чем до ближайшего края квартала
      const crane = { x: inner.x + inner.w * 0.4, y: inner.y + inner.h * 0.4 };
      b.crane = { ...crane, a: between(0, Math.PI * 2), len: Math.min(crane.x - inner.x, crane.y - inner.y, inner.x + inner.w - crane.x, inner.y + inner.h - crane.y) - 20 };
    }
    return b;
  });

  /* ---------- берег: зонтики на пляже и лодки у берега ---------- */

  const beach: Dot[] = [];
  const boats: { x: number; y: number; a: number; c: string }[] = [];
  const perimeter = (bounds.w + bounds.h) * 2;
  // точка на прямоугольнике, отодвинутом от города на off
  const around = (t: number, off: number) => {
    const w = bounds.w;
    const h = bounds.h;
    let d = ((t % 1) + 1) % 1 * perimeter;
    if (d < w) return { x: bounds.x + d, y: bounds.y - off, a: 0 };
    d -= w;
    if (d < h) return { x: bounds.x + w + off, y: bounds.y + d, a: 90 };
    d -= h;
    if (d < w) return { x: bounds.x + w - d, y: bounds.y + h + off, a: 180 };
    d -= w;
    return { x: bounds.x - off, y: bounds.y + h - d, a: 270 };
  };
  const nearRiver = (x: number, y: number) => Math.abs(y - riverY(x)) < riverW(x) + 90 && (x < bounds.x || x > bounds.x + bounds.w);
  for (let k = 0; k < 90; k++) {
    const p = around(rnd(), SHORE.grass + between(30, SHORE.sand - 30));
    if (!nearRiver(p.x, p.y)) beach.push({ x: r1(p.x), y: r1(p.y), r: r1(between(20, 28)), c: pick(PASTEL) });
  }
  for (let k = 0; k < 14; k++) {
    const p = around((k + rnd() * 0.6) / 14, SHORE.grass + SHORE.sand + between(60, 130));
    if (!nearRiver(p.x, p.y)) boats.push({ x: r1(p.x), y: r1(p.y), a: p.a + between(-25, 25), c: pick(PASTEL) });
  }

  return {
    bounds,
    outer,
    lines,
    zebras,
    blocks,
    rings,
    band,
    river,
    riverY,
    riverW,
    bridges,
    bankTrees,
    beach,
    boats,
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
  plaza: "tile",
  sports: "grass",
};

// насколько точка ушла в море: 0 — на берегу или в городе
export const seaDepth = (city: City, x: number, y: number) =>
  Math.max(0, outside(city.bounds, x, y) - SHORE.grass - SHORE.sand);

export function surfaceAt(city: City, x: number, y: number): Surface {
  for (const i of ISLANDS) if (inside(i, x, y)) return "tile";
  const out = outside(city.bounds, x, y);
  const inRiver = y > city.band.y && y < city.band.y + city.band.h && Math.abs(y - city.riverY(x)) < city.riverW(x);
  if (out > 0) {
    // река дотекает до моря через берег и пляж
    if (inRiver) return "water";
    return out < SHORE.grass ? "grass" : out < SHORE.grass + SHORE.sand ? "sand" : "sea";
  }
  if (inside(city.band, x, y)) {
    if (city.bridges.some((b) => inside(b, x, y))) return "road";
    return inRiver ? "water" : "grass";
  }
  // кольцо шире улицы и срезает углы кварталов — проверяем его раньше кварталов
  for (const r of city.rings) {
    const d = Math.hypot(r.cx - x, r.cy - y);
    if (d < RING.isle) return "grass";
    if (d < RING.road) return "road";
  }
  for (const b of city.blocks) {
    if (!inside(b, x, y)) continue;
    const inner = { x: b.x + CURB, y: b.y + CURB, w: b.w - CURB * 2, h: b.h - CURB * 2 };
    if (!inside(inner, x, y)) return "tile";
    if (b.ponds.some((p) => inEllipse({ ...p, rx: p.rx * 0.9, ry: p.ry * 0.9 }, x, y))) return "water";
    if (b.fountain && Math.hypot(b.fountain.cx - x, b.fountain.cy - y) < b.fountain.r) return "water";
    // у стадиона внутри дорожки — газон
    if (b.kind === "stadium") {
      const f = b.fields[0];
      if (inEllipse(f, x, y)) return "grass";
      return inEllipse({ ...f, rx: f.rx + TRACK, ry: f.ry + TRACK }, x, y) ? "dirt" : "tile";
    }
    const court = b.courts.find((c) => inside(c, x, y));
    if (court) return court.type === "play" ? "dirt" : "tile";
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
  dirt: { name: "Грунт", max: 0.65, accel: 0.8, mark: "112,76,44", markA: 0.55 },
  sand: { name: "Песок", max: 0.5, accel: 0.65, mark: "168,128,74", markA: 0.5 },
  water: { name: "Вода", max: 0.32, accel: 0.5, mark: null, markA: 0 },
  sea: { name: "Море", max: 0.24, accel: 0.4, mark: null, markA: 0 },
};
