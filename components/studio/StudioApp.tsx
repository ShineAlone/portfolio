"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { LINKS } from "@/lib/content";
import { MAX_Z, MIN_Z, clamp, createCameraStore, type Cam } from "./camera";
import {
  DECK_SLIDES,
  FRAMES,
  ISLANDS,
  TOOLS,
  WORLD,
  frameById,
  islandById,
  type Rect,
  type ToolId,
} from "./data";
import { ToolGlyph } from "./glyphs";
import { HERO_CHARS, World } from "./World";

const BASE_BG = "#ECEAE4";
const BRAND = ["#FEFE78", "#86DDFF", "#FFB6E1", "#ACF9A2", "#C791FF", "#FFC7B6"];

type Shape = { id: number; x: number; y: number; size: number; color: string; points: string; rot: number };
type GenCard = { id: number; name: string; x: number; y: number; date: string };
type Agent = { x: number; y: number; visible: boolean; bubble: string | null };
type Pattern = { url: string; size: number; bg: string };

const pad = (r: Rect, p: number): Rect => ({ x: r.x - p, y: r.y - p, w: r.w + p * 2, h: r.h + p * 2 });

function makeShapePoints() {
  const n = 5 + Math.floor(Math.random() * 4);
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
    const r = 26 + Math.random() * 22;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(" ");
}

// Генератор фирменного паттерна: случайная плитка из фигур палитры тегов.
function makePattern(): Pattern {
  const [c1, c2] = [...BRAND].sort(() => Math.random() - 0.5);
  const kind = Math.floor(Math.random() * 5);
  const t = 120;
  const body = [
    `<circle cx="30" cy="30" r="12" fill="${c1}"/><circle cx="90" cy="90" r="20" fill="${c2}"/>`,
    `<rect x="8" y="20" width="64" height="26" rx="13" fill="${c1}" transform="rotate(-18 40 33)"/><rect x="58" y="74" width="52" height="22" rx="11" fill="${c2}" transform="rotate(14 84 85)"/>`,
    `<path d="M30 14v32M14 30h32" stroke="${c1}" stroke-width="10" stroke-linecap="round"/><path d="M90 74v32M74 90h32" stroke="${c2}" stroke-width="10" stroke-linecap="round"/>`,
    `<path d="M0 40q30-28 60 0t60 0" fill="none" stroke="${c1}" stroke-width="10"/><path d="M0 98q30-28 60 0t60 0" fill="none" stroke="${c2}" stroke-width="10"/>`,
    `<path d="M30 12l20 34H10z" fill="${c1}"/><path d="M90 70l20 34H70z" fill="${c2}"/>`,
  ][kind];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${t}" height="${t}" viewBox="0 0 ${t} ${t}">${body}</svg>`;
  return { url: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, size: t, bg: "#F4F2ED" };
}

const CHECKS: [ok: boolean, text: string][] = [
  [true, "Все фреймы названы"],
  [true, "Отступы выровнены"],
  [true, "Тексты — в стилях"],
  [true, "Контраст в норме"],
  [false, "2 пустых слота — ждут новых плагинов"],
];

export function StudioApp() {
  const camera = useMemo(createCameraStore, []);
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorLabelRef = useRef<HTMLSpanElement>(null);
  const miniViewRef = useRef<HTMLDivElement>(null);
  const animRef = useRef(0);
  const farRef = useRef(false);
  const patternRef = useRef<Pattern | null>(null);
  const applyRef = useRef<() => void>(() => {});
  const introTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [ready, setReady] = useState(false);
  const [intro, setIntro] = useState(0);
  const [typed, setTyped] = useState(0);
  const [agent, setAgent] = useState<Agent>(() => {
    const h = frameById("hero");
    return { x: h.x + h.w + 260, y: h.y + h.h + 140, visible: false, bubble: null };
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [spread, setSpread] = useState(false);
  const [deckOrder, setDeckOrder] = useState(() => DECK_SLIDES.map((_, i) => i));
  const [deckFlying, setDeckFlying] = useState<number | null>(null);
  const [tool, setTool] = useState<ToolId | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [cards, setCards] = useState<GenCard[]>([]);
  const [cardName, setCardName] = useState("");
  const [hasPattern, setHasPattern] = useState(false);
  const [tour, setTour] = useState(-1);
  const [checkStep, setCheckStep] = useState(-1);
  const [toast, setToast] = useState<string | null>(null);
  const [activeIsland, setActiveIsland] = useState("about");

  const introDone = intro >= 6;
  const toolRef = useRef(tool);
  toolRef.current = tool;
  const tourRef = useRef(tour);
  tourRef.current = tour;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const spaceRef = useRef(spaceHeld);
  spaceRef.current = spaceHeld;

  /* ---------- камера ---------- */

  const vpSize = useCallback(() => {
    const r = viewportRef.current!.getBoundingClientRect();
    return { w: r.width, h: r.height, left: r.left, top: r.top };
  }, []);

  const clampCam = useCallback(
    (c: Cam): Cam => {
      const { w, h } = vpSize();
      const m = 160;
      const z = clamp(c.z, MIN_Z, MAX_Z);
      return {
        z,
        x: clamp(c.x, m - (WORLD.x + WORLD.w) * z, w - m - WORLD.x * z),
        y: clamp(c.y, m - (WORLD.y + WORLD.h) * z, h - m - WORLD.y * z),
      };
    },
    [vpSize]
  );

  const fit = useCallback(
    (r: Rect, p = 80, maxZ = 1): Cam => {
      const { w, h } = vpSize();
      const z = clamp(Math.min((w - p * 2) / r.w, (h - p * 2) / r.h), MIN_Z, maxZ);
      return { z, x: w / 2 - (r.x + r.w / 2) * z, y: h / 2 - (r.y + r.h / 2) * z };
    },
    [vpSize]
  );

  const animateTo = useCallback(
    (target: Cam, ms = 700) => {
      cancelAnimationFrame(animRef.current);
      const { w, h } = vpSize();
      const from = camera.get();
      const fc = { x: (w / 2 - from.x) / from.z, y: (h / 2 - from.y) / from.z };
      const tc = { x: (w / 2 - target.x) / target.z, y: (h / 2 - target.y) / target.z };
      // Дуга «отъехать и приехать», как перелёт камеры: на середине пути чуть отдаляемся.
      const dist = Math.hypot(tc.x - fc.x, tc.y - fc.y);
      const dip = clamp(dist / 4000, 0, 0.45);
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / ms);
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        const lz = Math.log(from.z) + (Math.log(target.z) - Math.log(from.z)) * e;
        const z = Math.exp(lz) * (1 - dip * Math.sin(Math.PI * p));
        const cx = fc.x + (tc.x - fc.x) * e;
        const cy = fc.y + (tc.y - fc.y) * e;
        camera.set({ z, x: w / 2 - cx * z, y: h / 2 - cy * z });
        if (p < 1) animRef.current = requestAnimationFrame(step);
      };
      animRef.current = requestAnimationFrame(step);
    },
    [camera, vpSize]
  );

  const zoomAt = useCallback(
    (nz: number, sx: number, sy: number) => {
      const c = camera.get();
      const z = clamp(nz, MIN_Z, MAX_Z);
      const wx = (sx - c.x) / c.z;
      const wy = (sy - c.y) / c.z;
      camera.set(clampCam({ z, x: sx - wx * z, y: sy - wy * z }));
    },
    [camera, clampCam]
  );

  const zoomCenter = useCallback(
    (nz: number) => {
      const { w, h } = vpSize();
      const c = camera.get();
      const z = clamp(nz, MIN_Z, MAX_Z);
      const wx = (w / 2 - c.x) / c.z;
      const wy = (h / 2 - c.y) / c.z;
      animateTo(clampCam({ z, x: w / 2 - wx * z, y: h / 2 - wy * z }), 280);
    },
    [animateTo, camera, clampCam, vpSize]
  );

  const flyTo = useCallback(
    (r: Rect, p = 80, maxZ = 1) => animateTo(clampCam(fit(r, p, maxZ)), 950),
    [animateTo, clampCam, fit]
  );
  const showAll = useCallback(() => animateTo(fit(WORLD, 30), 900), [animateTo, fit]);

  const showToast = useCallback((t: string) => {
    setToast(t);
    setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 3200);
  }, []);

  // Камера → DOM: трансформация мира, фон, «дальний» режим, мини-карта, активный остров.
  useEffect(() => {
    const apply = () => {
      const { x, y, z } = camera.get();
      const w = worldRef.current;
      const v = viewportRef.current;
      if (!w || !v) return;
      w.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${z})`;
      w.style.setProperty("--z", String(z));

      const pat = patternRef.current;
      if (pat) {
        v.style.backgroundColor = pat.bg;
        v.style.backgroundImage = pat.url;
        v.style.backgroundSize = `${pat.size * z}px ${pat.size * z}px`;
      } else {
        v.style.backgroundColor = BASE_BG;
        v.style.backgroundImage = z < 0.35 ? "none" : "radial-gradient(rgba(0,0,0,.13) 1.1px, transparent 1.4px)";
        v.style.backgroundSize = `${28 * z}px ${28 * z}px`;
      }
      v.style.backgroundPosition = `${x}px ${y}px`;

      if (!farRef.current && z < 0.26) farRef.current = true;
      else if (farRef.current && z > 0.3) farRef.current = false;
      w.classList.toggle("is-far", farRef.current);

      const r = v.getBoundingClientRect();
      const mv = miniViewRef.current;
      if (mv) {
        const s = 180 / WORLD.w;
        mv.style.left = `${(-x / z) * s}px`;
        mv.style.top = `${(-y / z) * s}px`;
        mv.style.width = `${(r.width / z) * s}px`;
        mv.style.height = `${(r.height / z) * s}px`;
      }

      const cx = (r.width / 2 - x) / z;
      const cy = (r.height / 2 - y) / z;
      const isl = ISLANDS.find((i) => cx >= i.x && cx <= i.x + i.w && cy >= i.y && cy <= i.y + i.h);
      if (isl) setActiveIsland((cur) => (cur === isl.id ? cur : isl.id));
    };
    applyRef.current = apply;
    apply();
    return camera.subscribe(apply);
  }, [camera]);

  /* ---------- интро: Арсений собирает первый экран на глазах ---------- */

  const finishIntro = useCallback(() => {
    introTimers.current.forEach(clearTimeout);
    introTimers.current = [];
    setIntro(6);
    setTyped(HERO_CHARS);
    setAgent((a) => ({ ...a, visible: false, bubble: null }));
    flyTo(islandById("about"), 50);
  }, [flyTo]);

  useEffect(() => {
    const h = frameById("hero");
    camera.set(fit(pad(h, 140), 40));
    setReady(true);
    const steps: [number, () => void][] = [
      [250, () => setAgent((a) => ({ ...a, visible: true }))],
      [450, () => setAgent((a) => ({ ...a, x: h.x, y: h.y }))],
      [1400, () => {
        setIntro(1);
        setAgent((a) => ({ ...a, x: h.x + h.w, y: h.y + h.h }));
      }],
      [2500, () => {
        setIntro(2);
        setAgent((a) => ({ ...a, x: h.x + 70, y: h.y + 150 }));
      }],
      [4300, () => {
        setIntro(3);
        setAgent((a) => ({ ...a, x: h.x + 960, y: h.y + 260 }));
      }],
      [5100, () => {
        setIntro(4);
        setAgent((a) => ({ ...a, x: h.x + 330, y: h.y + 640 }));
      }],
      [6000, () => {
        setIntro(5);
        setAgent((a) => ({
          ...a,
          x: h.x + 680,
          y: h.y + 300,
          bubble: "Готово! Осмотрись. А внизу — мои плагины, их можно попробовать",
        }));
      }],
      [9600, () => finishIntro()],
    ];
    introTimers.current = steps.map(([t, fn]) => setTimeout(fn, t));
    return () => introTimers.current.forEach(clearTimeout);
    // Интро запускается один раз при открытии.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (intro !== 2) return;
    const id = setInterval(() => setTyped((t) => (t >= HERO_CHARS ? t : t + 1)), 62);
    return () => clearInterval(id);
  }, [intro]);

  /* ---------- дайджест-экскурсия ---------- */

  const tourStops = useMemo(
    () => [
      { rect: frameById("hero"), text: "Это я — дизайнер широкого профиля, в дизайне с 2021 года" },
      { rect: islandById("plugins"), text: "Плагины, которые я сделал с помощью вайб-кодинга. Все шесть работают в доке внизу" },
      { rect: frameById("social"), text: "Больше 2000 постов. Разложил часть для тебя", arrive: () => setSpread(true) },
      { rect: islandById("pres"), text: "Презентации — от отчётов до сцены. Кликни по стопке слайдов" },
      { rect: islandById("proj"), text: "Сайты и брендинг. Наведи на окно браузера — страница пролистается" },
    ],
    []
  );

  const stopTour = useCallback(() => {
    if (tourRef.current < 0) return;
    setTour(-1);
    setAgent((a) => ({ ...a, visible: false, bubble: null }));
  }, []);

  useEffect(() => {
    if (tour < 0) return;
    if (tour >= tourStops.length) {
      setAgent((a) => ({ ...a, bubble: "Это был дайджест. Дальше — сам 🙂" }));
      const t = setTimeout(() => {
        setAgent((a) => ({ ...a, visible: false, bubble: null }));
        setTour(-1);
      }, 2600);
      return () => clearTimeout(t);
    }
    const s = tourStops[tour];
    flyTo(s.rect, 90, 0.9);
    setAgent({ visible: true, x: s.rect.x + s.rect.w * 0.45, y: s.rect.y + 80, bubble: s.text });
    s.arrive?.();
    const t = setTimeout(() => setTour((i) => i + 1), 4800);
    return () => clearTimeout(t);
  }, [tour, tourStops, flyTo]);

  /* ---------- плагины-инструменты ---------- */

  const onTry = useCallback(
    (t: ToolId) => {
      setTool(t);
      setCheckStep(-1);
    },
    []
  );

  const spawnShape = (wx: number, wy: number) => {
    const z = camera.get().z;
    setShapes((s) => [
      ...s.slice(-39),
      {
        id: Date.now() + Math.random(),
        x: wx,
        y: wy,
        size: (140 + Math.random() * 120) / z,
        color: BRAND[Math.floor(Math.random() * BRAND.length)],
        points: makeShapePoints(),
        rot: Math.random() * 360,
      },
    ]);
  };

  const createCard = () => {
    const name = cardName.trim().slice(0, 24);
    if (!name) return;
    const { w, h } = vpSize();
    const c = camera.get();
    const card: GenCard = {
      id: Date.now(),
      name,
      x: (w / 2 - c.x) / c.z - 220,
      y: (h / 2 - c.y) / c.z - 220,
      date: new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" }),
    };
    setCards((cs) => [...cs, card]);
    setCardName("");
    setTool(null);
    flyTo({ x: card.x, y: card.y, w: 440, h: 440 }, 120, 1);
  };

  const applyPattern = (p: Pattern | null) => {
    patternRef.current = p;
    setHasPattern(!!p);
    applyRef.current();
  };

  const discuss = (name: string) => {
    const text = `Привет, Арсений! Пишу по поводу работы «${name}» с твоего сайта.`;
    navigator.clipboard?.writeText(text).catch(() => {});
    window.open(LINKS.telegram, "_blank", "noopener,noreferrer");
    showToast("Текст сообщения скопирован — вставь его в чат");
  };

  const runCheck = () => {
    setCheckStep(0);
    CHECKS.forEach((_, i) => setTimeout(() => setCheckStep(i + 1), 1500 + i * 380));
  };

  const toggleSpread = useCallback(() => setSpread((s) => !s), []);
  const deckRef = useRef(deckOrder);
  deckRef.current = deckOrder;
  const flyingRef = useRef<number | null>(null);
  const deckNext = useCallback(() => {
    if (flyingRef.current !== null) return;
    const top = deckRef.current[0];
    flyingRef.current = top;
    setDeckFlying(top);
    setTimeout(() => {
      setDeckOrder((o) => [...o.slice(1), o[0]]);
      setDeckFlying(null);
      flyingRef.current = null;
    }, 420);
  }, []);

  /* ---------- колесо, клавиши ---------- */

  useEffect(() => {
    const v = viewportRef.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cancelAnimationFrame(animRef.current);
      stopTour();
      const k = e.deltaMode === 1 ? 16 : 1;
      const r = v.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        const d = clamp(e.deltaY * k, -60, 60);
        zoomAt(camera.get().z * Math.exp(-d * 0.012), e.clientX - r.left, e.clientY - r.top);
        return;
      }
      let dx = e.deltaX * k;
      let dy = e.deltaY * k;
      if (e.shiftKey && dx === 0) {
        dx = dy;
        dy = 0;
      }
      const c = camera.get();
      camera.set(clampCam({ ...c, x: c.x - dx, y: c.y - dy }));
    };
    v.addEventListener("wheel", onWheel, { passive: false });
    return () => v.removeEventListener("wheel", onWheel);
  }, [camera, clampCam, stopTour, zoomAt]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest("input, textarea")) return;
      if (e.code === "Space") {
        e.preventDefault();
        setSpaceHeld(true);
        return;
      }
      if (e.shiftKey && e.code === "Digit1") return showAll();
      if (e.shiftKey && e.code === "Digit0") return zoomCenter(1);
      const digit = /^Digit([1-6])$/.exec(e.code);
      if (digit && !e.shiftKey) {
        const id = TOOLS[Number(digit[1]) - 1].id;
        setTool((t) => (t === id ? null : id));
        setCheckStep(-1);
        return;
      }
      if (e.code === "Escape") {
        setSelected(null);
        setTool(null);
        stopTour();
      }
      if (e.code === "Equal" || e.code === "NumpadAdd") zoomCenter(camera.get().z * 1.3);
      if (e.code === "Minus" || e.code === "NumpadSubtract") zoomCenter(camera.get().z / 1.3);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceHeld(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [camera, showAll, stopTour, zoomCenter]);

  /* ---------- мышь, тач, щипок ---------- */

  const drag = useRef<{
    id: number;
    sx: number;
    sy: number;
    cam: Cam;
    moved: boolean;
    forcePan: boolean;
    frameId: string | null;
    ui: boolean;
  } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; mx: number; my: number; cam: Cam } | null>(null);

  const moveCursor = (e: React.PointerEvent) => {
    const c = cursorRef.current;
    if (!c || e.pointerType !== "mouse") return;
    c.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    c.classList.add("is-visible");
    const target = e.target as HTMLElement;
    const f = target.closest?.("[data-frame]") as HTMLElement | null;
    const label =
      toolRef.current === "geometry" && !f ? "+ фигура" : f?.dataset.name ?? "Ты";
    if (cursorLabelRef.current && cursorLabelRef.current.textContent !== label) {
      cursorLabelRef.current.textContent = label;
    }
    c.style.setProperty("--cc", f?.dataset.color ?? "#111");
    c.classList.toggle("is-on-frame", !!f);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    cancelAnimationFrame(animRef.current);
    stopTour();
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const r = viewportRef.current!.getBoundingClientRect();
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        mx: (a.x + b.x) / 2 - r.left,
        my: (a.y + b.y) / 2 - r.top,
        cam: camera.get(),
      };
      drag.current = null;
      return;
    }
    const target = e.target as HTMLElement;
    drag.current = {
      id: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      cam: camera.get(),
      moved: false,
      forcePan: e.button === 1 || spaceRef.current,
      frameId: target.closest("[data-frame]")?.getAttribute("data-frame") ?? null,
      ui: !!target.closest("[data-ui]"),
    };
    if (e.button === 1) e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    moveCursor(e);
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const p = pinch.current;
    if (p && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const r = viewportRef.current!.getBoundingClientRect();
      const z = clamp((p.cam.z * Math.hypot(a.x - b.x, a.y - b.y)) / p.dist, MIN_Z, MAX_Z);
      const mx = (a.x + b.x) / 2 - r.left;
      const my = (a.y + b.y) / 2 - r.top;
      const wx = (p.mx - p.cam.x) / p.cam.z;
      const wy = (p.my - p.cam.y) / p.cam.z;
      camera.set(clampCam({ z, x: mx - wx * z, y: my - wy * z }));
      return;
    }

    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) > 4) {
      d.moved = true;
      viewportRef.current!.setPointerCapture(e.pointerId);
      viewportRef.current!.classList.add("is-panning");
    }
    if (d.moved) camera.set(clampCam({ ...d.cam, x: d.cam.x + dx, y: d.cam.y + dy }));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    const d = drag.current;
    if (d && d.id === e.pointerId) {
      if (!d.moved && !d.forcePan && !d.ui) {
        if (toolRef.current === "geometry" && !d.frameId) {
          const r = viewportRef.current!.getBoundingClientRect();
          const c = camera.get();
          spawnShape((e.clientX - r.left - c.x) / c.z, (e.clientY - r.top - c.y) / c.z);
        } else {
          setSelected(d.frameId);
        }
      }
      drag.current = null;
      viewportRef.current!.classList.remove("is-panning");
    }
  };

  const onMiniClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const s = WORLD.w / 180;
    const wx = (e.clientX - r.left) * s;
    const wy = (e.clientY - r.top) * s;
    const { w, h } = vpSize();
    const z = Math.max(camera.get().z, 0.45);
    animateTo(clampCam({ z, x: w / 2 - wx * z, y: h / 2 - wy * z }), 800);
  };

  const sel = selected ? FRAMES.find((f) => f.id === selected) ?? null : null;
  const activeTool = TOOLS.find((t) => t.id === tool);

  return (
    <div className={`st-app${introDone ? " is-ready" : " is-intro"}`}>
      <main
        ref={viewportRef}
        className={`st-viewport${spaceHeld ? " is-hand" : ""}${tool === "geometry" ? " is-geometry" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => cursorRef.current?.classList.remove("is-visible")}
        onAuxClick={(e) => e.preventDefault()}
      >
        <div ref={worldRef} className={`st-world${ready ? " is-shown" : ""}`}>
          <World
            introStep={intro}
            typed={typed}
            selected={selected}
            spread={spread}
            onToggleSpread={toggleSpread}
            deckOrder={deckOrder}
            deckFlying={deckFlying}
            onDeckNext={deckNext}
            onTry={onTry}
          />

          {shapes.map((s) => (
            <svg
              key={s.id}
              className="st-shape"
              viewBox="0 0 100 100"
              style={{
                left: s.x - s.size / 2,
                top: s.y - s.size / 2,
                width: s.size,
                height: s.size,
                rotate: `${s.rot}deg`,
              }}
            >
              <polygon points={s.points} fill={s.color} />
            </svg>
          ))}

          {cards.map((c) => (
            <div key={c.id} className="st-gen" style={{ left: c.x, top: c.y }}>
              <span className="st-gen__badge">Новости мастерской</span>
              <div className="st-gen__text">
                <span>{c.name}</span> в гостях у Арсения
              </div>
              <div className="st-gen__foot">
                <span>{c.date}</span>
                <span>сверстано плагином</span>
              </div>
            </div>
          ))}

          {sel && (
            <div className="st-callout" data-ui style={{ left: sel.x + sel.w, top: sel.y }}>
              <div className="st-callout__card" style={{ "--c": islandById(sel.island).color } as React.CSSProperties}>
                <span className="st-callout__island">{islandById(sel.island).name}</span>
                <b>{sel.name}</b>
                <p>{sel.text}</p>
                {sel.tags && (
                  <div className="st-tags">
                    {sel.tags.map((t) => (
                      <span key={t} style={{ background: sel.tagColor ?? "var(--c)" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="st-callout__actions">
                  <button type="button" className="st-btn st-btn--small" onClick={() => discuss(sel.name)}>
                    Обсудить в Telegram
                  </button>
                  {sel.tool && (
                    <button type="button" className="st-btn st-btn--ghost" onClick={() => onTry(sel.tool!)}>
                      Попробовать
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={`st-agent${agent.visible ? " is-on" : ""}`} style={{ left: agent.x, top: agent.y }}>
            <svg width="26" height="28" viewBox="0 0 22 24" className="st-agent__arrow">
              <path d="M3 2.5l15 7.2-6.4 1.9-2.6 6.4L3 2.5z" fill="#8B4DFF" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            <span className="st-agent__label">Арсений</span>
            {agent.bubble && <div className="st-agent__bubble">{agent.bubble}</div>}
          </div>
        </div>

        {checkStep === 0 && <div className="st-scan" />}
      </main>

      {/* ---------- шапка ---------- */}
      <div className="st-brand">
        <span className="st-brand__logo">АК</span>
        <span>
          Мастерская <b>Арсения Кононова</b>
        </span>
      </div>

      <nav className="st-chips" aria-label="Разделы">
        {ISLANDS.map((i) => (
          <button
            key={i.id}
            type="button"
            className={activeIsland === i.id ? "is-active" : ""}
            style={{ "--c": i.color } as React.CSSProperties}
            onClick={() => {
              stopTour();
              flyTo(i, 50);
            }}
          >
            {i.name}
          </button>
        ))}
      </nav>

      <a className="st-contact" href={LINKS.telegram} target="_blank" rel="noopener noreferrer">
        <i />
        Написать
      </a>

      {/* ---------- масштаб и мини-карта ---------- */}
      <div className="st-zoom">
        <button type="button" onClick={() => zoomCenter(camera.get().z / 1.3)} aria-label="Уменьшить">
          −
        </button>
        <ZoomLabel camera={camera} />
        <button type="button" onClick={() => zoomCenter(camera.get().z * 1.3)} aria-label="Увеличить">
          +
        </button>
        <button type="button" className="st-zoom__all" onClick={showAll}>
          Вся мастерская
        </button>
      </div>

      <div className="st-mini" onClick={onMiniClick} aria-label="Мини-карта">
        {ISLANDS.map((i) => {
          const s = 180 / WORLD.w;
          return (
            <span
              key={i.id}
              style={{ left: i.x * s, top: i.y * s, width: i.w * s, height: i.h * s, background: i.color }}
            />
          );
        })}
        <div ref={miniViewRef} className="st-mini__view" />
      </div>

      {/* ---------- док с плагинами ---------- */}
      {activeTool && (
        <div className="st-pop" style={{ "--c": activeTool.color } as React.CSSProperties}>
          <div className="st-pop__head">
            <span className="st-pop__icon">
              <ToolGlyph id={activeTool.id} size={20} />
            </span>
            <div>
              <small>мой плагин</small>
              <b>{activeTool.plugin}</b>
            </div>
            <button type="button" className="st-pop__close" onClick={() => setTool(null)} aria-label="Закрыть">
              ✕
            </button>
          </div>
          <p>{activeTool.hint}</p>

          {tool === "geometry" && (
            <div className="st-pop__row">
              <span>Фигур на холсте: {shapes.length}</span>
              {shapes.length > 0 && (
                <button type="button" className="st-btn st-btn--ghost" onClick={() => setShapes([])}>
                  Очистить
                </button>
              )}
            </div>
          )}

          {tool === "digest" && (
            <div className="st-pop__row">
              {tour < 0 ? (
                <button type="button" className="st-btn" onClick={() => setTour(0)}>
                  Собрать дайджест
                </button>
              ) : (
                <button type="button" className="st-btn st-btn--ghost" onClick={stopTour}>
                  Остановить
                </button>
              )}
            </div>
          )}

          {tool === "card" && (
            <form
              className="st-pop__row"
              onSubmit={(e) => {
                e.preventDefault();
                createCard();
              }}
            >
              <input
                className="st-input"
                value={cardName}
                maxLength={24}
                placeholder="Как тебя зовут?"
                onChange={(e) => setCardName(e.target.value)}
              />
              <button type="submit" className="st-btn" disabled={!cardName.trim()}>
                Сверстать
              </button>
            </form>
          )}

          {tool === "pattern" && (
            <div className="st-pop__row">
              <button type="button" className="st-btn" onClick={() => applyPattern(makePattern())}>
                {hasPattern ? "Ещё вариант" : "Сгенерировать"}
              </button>
              {hasPattern && (
                <button type="button" className="st-btn st-btn--ghost" onClick={() => applyPattern(null)}>
                  Вернуть фон
                </button>
              )}
            </div>
          )}

          {tool === "telegram" && (
            <div className="st-pop__row">
              {sel ? (
                <button type="button" className="st-btn" onClick={() => discuss(sel.name)}>
                  Обсудить «{sel.name}»
                </button>
              ) : (
                <span className="st-pop__muted">Сначала кликни по любой работе</span>
              )}
            </div>
          )}

          {tool === "check" && (
            <>
              {checkStep < 0 ? (
                <div className="st-pop__row">
                  <button type="button" className="st-btn" onClick={runCheck}>
                    Проверить мастерскую
                  </button>
                </div>
              ) : (
                <ul className="st-checks">
                  {checkStep === 0 && <li className="is-wait">Сканирую холст…</li>}
                  {CHECKS.slice(0, Math.max(0, checkStep)).map(([ok, text]) => (
                    <li key={text} className={ok ? "is-ok" : "is-warn"}>
                      {text}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      <div className="st-dock" role="toolbar" aria-label="Плагины">
        <span className="st-dock__caption">Мои плагины</span>
        {TOOLS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            className={tool === t.id ? "is-active" : ""}
            style={{ "--c": t.color } as React.CSSProperties}
            onClick={() => {
              setTool((cur) => (cur === t.id ? null : t.id));
              setCheckStep(-1);
            }}
            title={`${t.plugin} (${i + 1})`}
          >
            <ToolGlyph id={t.id} />
            <span>{t.short}</span>
          </button>
        ))}
      </div>

      {!introDone && (
        <button type="button" className="st-skip" onClick={finishIntro}>
          Пропустить интро
        </button>
      )}

      {toast && <div className="st-toast">{toast}</div>}

      <div ref={cursorRef} className={`st-cursor${spaceHeld ? " is-hidden" : ""}`} aria-hidden>
        <svg width="22" height="24" viewBox="0 0 22 24">
          <path d="M3 2.5l15 7.2-6.4 1.9-2.6 6.4L3 2.5z" fill="#111" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        <span ref={cursorLabelRef} className="st-cursor__label">
          Ты
        </span>
      </div>
    </div>
  );
}

function ZoomLabel({ camera }: { camera: ReturnType<typeof createCameraStore> }) {
  const z = useSyncExternalStore(
    camera.subscribe,
    () => Math.round(camera.get().z * 100),
    () => 100
  );
  return <span className="st-zoom__val">{z}%</span>;
}
