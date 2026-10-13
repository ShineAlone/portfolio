"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { LINKS } from "@/lib/content";
import { MAX_Z, MIN_Z, clamp, createCameraStore, type Cam, type CameraStore } from "./camera";
import {
  ACHIEVEMENTS,
  DECKS,
  FRAMES,
  ISLANDS,
  SECRET_DISCOUNT,
  SECRET_WORD,
  WORLD,
  frameById,
  islandById,
  type AchievementId,
  type Rect,
} from "./data";
import { Glyph } from "./glyphs";
import { CHAT, NAME_CHARS, SpinFigure, World } from "./World";

const BASE_BG = "#ECEAE4";
const STORAGE_KEY = "ak-achievements";
const MAP_W = 172;

type Agent = { x: number; y: number; visible: boolean; bubble: string | null };
type Toast = { text: string; id?: AchievementId };

const pad = (r: Rect, p: number): Rect => ({ x: r.x - p, y: r.y - p, w: r.w + p * 2, h: r.h + p * 2 });

function ZoomLabel({ camera }: { camera: CameraStore }) {
  const z = useSyncExternalStore(
    camera.subscribe,
    () => Math.round(camera.get().z * 100),
    () => 100
  );
  return <b>{z}%</b>;
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 140 }, (_, i) => ({
        left: Math.random() * 100,
        color: ["#FEFE78", "#86DDFF", "#FFB6E1", "#ACF9A2", "#C791FF", "#FFC7B6"][i % 6],
        delay: Math.random() * 0.6,
        dur: 1.8 + Math.random() * 1.4,
        size: 8 + Math.random() * 10,
        round: i % 3 === 0,
      })),
    []
  );
  return (
    <div className="st-confetti" aria-hidden>
      {pieces.map((p, i) => (
        <i
          key={i}
          style={{
            left: `${p.left}%`,
            background: p.color,
            width: p.size,
            height: p.round ? p.size : p.size * 0.5,
            borderRadius: p.round ? "50%" : 2,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

export function StudioApp() {
  const camera = useMemo(createCameraStore, []);
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorLabelRef = useRef<HTMLSpanElement>(null);
  const miniViewRef = useRef<HTMLDivElement>(null);
  const animRef = useRef(0);
  const farRef = useRef(false);
  const introTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [ready, setReady] = useState(false);
  const [intro, setIntro] = useState(0);
  const [typed, setTyped] = useState(0);
  const [chatStep, setChatStep] = useState(0);
  const [agent, setAgent] = useState<Agent>(() => {
    const h = frameById("hero");
    return { x: h.x + h.w + 220, y: h.y + h.h, visible: false, bubble: null };
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [spread, setSpread] = useState(false);
  const [deck, setDeck] = useState(0);
  const [slide, setSlide] = useState(0);
  const [slideDir, setSlideDir] = useState<"next" | "prev">("next");
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [tour, setTour] = useState(-1);
  const [toast, setToast] = useState<Toast | null>(null);
  const [activeIsland, setActiveIsland] = useState("about");
  const [earned, setEarned] = useState<AchievementId[]>([]);
  const [openAch, setOpenAch] = useState<AchievementId | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const introDone = intro >= 6;
  const tourRef = useRef(tour);
  tourRef.current = tour;
  const spaceRef = useRef(spaceHeld);
  spaceRef.current = spaceHeld;
  const activeRef = useRef(activeIsland);
  activeRef.current = activeIsland;
  const introDoneRef = useRef(introDone);
  introDoneRef.current = introDone;

  /* ---------- камера ---------- */

  const vpSize = useCallback(() => {
    const r = viewportRef.current!.getBoundingClientRect();
    return { w: r.width, h: r.height };
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
      // Дуга «отъехать и приехать»: на середине длинного перелёта камера чуть отдаляется.
      const dip = clamp(Math.hypot(tc.x - fc.x, tc.y - fc.y) / 4000, 0, 0.45);
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

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 3000);
  }, []);

  /* ---------- достижения ---------- */

  useEffect(() => {
    // ?win — сразу показать награду, ?reset — сбросить прогресс (для проверки)
    const params = new URLSearchParams(window.location.search);
    if (params.has("win")) setTimeout(() => setCelebrate(true), 1200);
    try {
      if (params.has("reset")) localStorage.removeItem(STORAGE_KEY);
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const ids = (JSON.parse(raw) as string[]).filter((id): id is AchievementId =>
          ACHIEVEMENTS.some((a) => a.id === id)
        );
        setEarned(ids);
      }
    } catch {
      // хранилище недоступно — просто начинаем с нуля
    }
  }, []);

  const earnedRef = useRef(earned);
  earnedRef.current = earned;
  const earn = useCallback(
    (id: AchievementId) => {
      if (earnedRef.current.includes(id)) return;
      const next = [...earnedRef.current, id];
      earnedRef.current = next;
      setEarned(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // без сохранения прогресс просто не переживёт перезагрузку
      }
      const a = ACHIEVEMENTS.find((x) => x.id === id)!;
      showToast({ text: `Достижение «${a.name}»`, id });
      if (next.length === ACHIEVEMENTS.length) setTimeout(() => setCelebrate(true), 900);
    },
    [showToast]
  );
  const earnRef = useRef(earn);
  earnRef.current = earn;

  // Камера → DOM: трансформация мира, фон, дальний план, мини-карта, активный остров.
  useEffect(() => {
    const apply = () => {
      const { x, y, z } = camera.get();
      const w = worldRef.current;
      const v = viewportRef.current;
      if (!w || !v) return;
      w.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${z})`;
      w.style.setProperty("--z", String(z));

      v.style.backgroundColor = BASE_BG;
      v.style.backgroundImage = z < 0.35 ? "none" : "radial-gradient(rgba(0,0,0,.13) 1.1px, transparent 1.4px)";
      v.style.backgroundSize = `${28 * z}px ${28 * z}px`;
      v.style.backgroundPosition = `${x}px ${y}px`;

      if (!farRef.current && z < 0.26) {
        farRef.current = true;
        if (introDoneRef.current) earnRef.current("map");
      } else if (farRef.current && z > 0.3) farRef.current = false;
      w.classList.toggle("is-far", farRef.current);

      const r = v.getBoundingClientRect();
      const mv = miniViewRef.current;
      if (mv) {
        const s = MAP_W / WORLD.w;
        mv.style.left = `${(-x / z) * s}px`;
        mv.style.top = `${(-y / z) * s}px`;
        mv.style.width = `${(r.width / z) * s}px`;
        mv.style.height = `${(r.height / z) * s}px`;
      }

      const cx = (r.width / 2 - x) / z;
      const cy = (r.height / 2 - y) / z;
      const isl = ISLANDS.find((i) => cx >= i.x && cx <= i.x + i.w && cy >= i.y && cy <= i.y + i.h);
      if (isl) {
        setActiveIsland((cur) => (cur === isl.id ? cur : isl.id));
        if (isl.id === "proj" && z >= 0.95) earnRef.current("zoom");
      }
    };
    apply();
    return camera.subscribe(apply);
  }, [camera]);

  /* ---------- интро: Арсений собирает приветствие на глазах ---------- */

  const finishIntro = useCallback(() => {
    introTimers.current.forEach(clearTimeout);
    introTimers.current = [];
    setIntro(6);
    setTyped(NAME_CHARS);
    setAgent((a) => ({ ...a, visible: false, bubble: null }));
    flyTo(islandById("about"), 50);
  }, [flyTo]);

  useEffect(() => {
    const h = frameById("hero");
    camera.set(fit(pad(h, 120), 40));
    setReady(true);
    const to = (x: number, y: number, bubble: string | null = null) =>
      setAgent((a) => ({ ...a, x: h.x + x, y: h.y + y, bubble }));
    const steps: [number, () => void][] = [
      [250, () => setAgent((a) => ({ ...a, visible: true }))],
      [450, () => to(40, 40)],
      [1200, () => {
        setIntro(1);
        to(1150, 60);
      }],
      [2300, () => {
        setIntro(2);
        to(30, 270);
      }],
      [3500, () => {
        setIntro(3);
        to(880, 330);
      }],
      [4400, () => {
        setIntro(4);
        to(1180, 250);
      }],
      [5400, () => {
        setIntro(5);
        to(520, 500, "Привет! Дальше по пространству — мои работы. А внизу можно собрать достижения");
      }],
      [9200, () => finishIntro()],
    ];
    introTimers.current = steps.map(([t, fn]) => setTimeout(fn, t));
    return () => introTimers.current.forEach(clearTimeout);
    // Интро запускается один раз при открытии.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (intro !== 2) return;
    const id = setInterval(() => setTyped((t) => (t >= NAME_CHARS ? t : t + 1)), 62);
    return () => clearInterval(id);
  }, [intro]);

  // Переписка в «Обо мне» оживает после интро: вопросы приходят быстро, ответы — после «печатает…».
  useEffect(() => {
    if (!introDone || chatStep >= CHAT.length) return;
    const t = setTimeout(() => setChatStep((s) => s + 1), CHAT[chatStep].q ? 700 : 1600);
    return () => clearTimeout(t);
  }, [introDone, chatStep]);

  /* ---------- экскурсия ---------- */

  const tourStops = useMemo(
    () => [
      { rect: frameById("hero"), text: "Это я — дизайнер широкого профиля, в дизайне с 2021 года" },
      { rect: islandById("plugins"), text: "Плагины и сервисы, которые я сделал с помощью вайб-кодинга" },
      { rect: frameById("social"), text: "Больше 2000 постов. Разложил часть для тебя", arrive: () => setSpread(true) },
      { rect: islandById("wall"), text: "Ежемесячная рубрика обоев. Кликни по телефону — обои сменятся" },
      { rect: islandById("pres"), text: "Презентации — листай стрелками, по порядку" },
      { rect: islandById("proj"), text: "Лендинги целиком и айдентика «Кофе Культ»" },
      { rect: frameById("contact"), text: "А здесь можно написать мне. Буду рад твоей задаче!" },
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
      setAgent((a) => ({ ...a, bubble: "Это была экскурсия. Дальше — сам 🙂" }));
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

  /* ---------- интерактив работ ---------- */

  const toggleSpread = useCallback(() => {
    setSpread((s) => !s);
    earnRef.current("pile");
  }, []);
  const onSticker = useCallback(() => earnRef.current("sticker"), []);
  const onPhone = useCallback(() => earnRef.current("orbit"), []);

  const flipsRef = useRef(0);
  const deckRef = useRef(deck);
  deckRef.current = deck;
  const onSlide = useCallback((delta: number) => {
    const n = DECKS[deckRef.current].slides.length;
    setSlideDir(delta >= 0 ? "next" : "prev");
    setSlide((s) => (s + delta + n) % n);
    flipsRef.current += 1;
    if (flipsRef.current >= 5) earnRef.current("slides");
  }, []);
  const onDeck = useCallback((i: number) => {
    setDeck(i);
    setSlide(0);
    setSlideDir("next");
  }, []);

  const discuss = (name: string) => {
    const text = `Привет, Арсений! Пишу по поводу работы «${name}» с твоего сайта.`;
    navigator.clipboard?.writeText(text).catch(() => {});
    window.open(LINKS.telegram, "_blank", "noopener,noreferrer");
    showToast({ text: "Текст сообщения скопирован — вставь его в чат" });
  };

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
      if (activeRef.current === "pres" && (e.code === "ArrowRight" || e.code === "ArrowLeft")) {
        onSlide(e.code === "ArrowRight" ? 1 : -1);
        return;
      }
      if (e.code === "Escape") {
        setSelected(null);
        setOpenAch(null);
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
  }, [camera, onSlide, showAll, stopTour, zoomCenter]);

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
    const f = (e.target as HTMLElement).closest?.("[data-frame]") as HTMLElement | null;
    const label = f?.dataset.name ?? "Ты";
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
      if (!d.moved && !d.forcePan && !d.ui) setSelected(d.frameId);
      drag.current = null;
      viewportRef.current!.classList.remove("is-panning");
    }
  };

  const onMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const s = WORLD.w / MAP_W;
    const wx = (e.clientX - r.left) * s;
    const wy = (e.clientY - r.top) * s;
    const { w, h } = vpSize();
    const z = Math.max(camera.get().z, 0.45);
    stopTour();
    animateTo(clampCam({ z, x: w / 2 - wx * z, y: h / 2 - wy * z }), 800);
  };

  const sel = selected ? FRAMES.find((f) => f.id === selected) ?? null : null;
  const ach = openAch ? ACHIEVEMENTS.find((a) => a.id === openAch)! : null;
  const mapS = MAP_W / WORLD.w;

  return (
    <div className={`st-app${introDone ? " is-ready" : " is-intro"}`}>
      <main
        ref={viewportRef}
        className={`st-viewport${spaceHeld ? " is-hand" : ""}`}
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
            chatStep={chatStep}
            selected={selected}
            spread={spread}
            onToggleSpread={toggleSpread}
            onSticker={onSticker}
            onPhone={onPhone}
            deck={deck}
            slide={slide}
            slideDir={slideDir}
            onDeck={onDeck}
            onSlide={onSlide}
          />

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
                  {sel.link && (
                    <a className="st-btn st-btn--ghost" href={sel.link.href} target="_blank" rel="noopener noreferrer">
                      {sel.link.label} ↗
                    </a>
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
      </main>

      {/* ---------- шапка ---------- */}
      <div className="st-brand">
        <span className="st-brand__logo">АК</span>
        <span>
          <b>Арсений Кононов</b> дизайнер
        </span>
      </div>

      <nav className="st-chips" aria-label="Разделы">
        {ISLANDS.map((i) => (
          <button
            key={i.id}
            type="button"
            className={`${activeIsland === i.id ? "is-active" : ""}${i.dark ? " is-dark" : ""}`}
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

      {/* ---------- карта ---------- */}
      <div className="st-map">
        <div className="st-map__head">
          <span>Карта</span>
          <ZoomLabel camera={camera} />
        </div>
        <div className="st-map__area" style={{ height: WORLD.h * mapS }} onClick={onMapClick}>
          {ISLANDS.map((i) => (
            <button
              key={i.id}
              type="button"
              className={`st-map__isl${activeIsland === i.id ? " is-active" : ""}${i.dark ? " is-dark" : ""}`}
              style={
                {
                  left: i.x * mapS,
                  top: i.y * mapS,
                  width: i.w * mapS,
                  height: i.h * mapS,
                  "--c": i.color,
                } as React.CSSProperties
              }
              onClick={(e) => {
                e.stopPropagation();
                stopTour();
                flyTo(i, 50);
              }}
            >
              {i.name}
            </button>
          ))}
          <div ref={miniViewRef} className="st-map__view" />
        </div>
        <div className="st-map__ctrl">
          <button type="button" onClick={() => zoomCenter(camera.get().z / 1.3)} aria-label="Уменьшить">
            −
          </button>
          <button type="button" onClick={() => zoomCenter(camera.get().z * 1.3)} aria-label="Увеличить">
            +
          </button>
          <button type="button" className="is-wide" onClick={showAll}>
            Показать всё
          </button>
        </div>
      </div>

      {/* ---------- достижения ---------- */}
      {ach && !celebrate && (
        <div className="st-pop" style={{ "--c": ach.color } as React.CSSProperties}>
          <div className="st-pop__head">
            <span className={`st-pop__icon${earned.includes(ach.id) ? "" : " is-locked"}`}>
              <Glyph id={ach.id} size={20} />
            </span>
            <div>
              <small>достижение · {earned.length} из {ACHIEVEMENTS.length}</small>
              <b>{ach.name}</b>
            </div>
            <button type="button" className="st-pop__close" onClick={() => setOpenAch(null)} aria-label="Закрыть">
              ✕
            </button>
          </div>
          <p>{earned.includes(ach.id) ? "Получено! Осталось найти остальные." : ach.hint}</p>
          {!earned.includes(ach.id) && (
            <div className="st-pop__row">
              <button
                type="button"
                className="st-btn st-btn--small"
                onClick={() => {
                  stopTour();
                  flyTo(islandById(ach.island), 50);
                  setOpenAch(null);
                }}
              >
                Показать где
              </button>
            </div>
          )}
        </div>
      )}

      {celebrate && (
        <>
          <Confetti />
          <div className="st-win-backdrop" onClick={() => setCelebrate(false)} />
          <div className="st-pop st-pop--win" role="dialog" aria-modal="true">
            <SpinFigure className="st-win-figure" />
            <small className="st-win__kicker">
              {ACHIEVEMENTS.length} из {ACHIEVEMENTS.length} достижений
            </small>
            <b>Ты открыл все достижения!</b>
            <p>
              Раз ты задержался здесь так надолго — похоже, тебе нравятся мои работы. За это у меня есть
              подарок: секретное слово. Напиши его мне в Telegram — и получишь скидку {SECRET_DISCOUNT} на
              проект.
            </p>
            <div className="st-win__word">{SECRET_WORD}</div>
            <div className="st-pop__row">
              <button
                type="button"
                className="st-btn st-btn--small"
                onClick={() => {
                  navigator.clipboard?.writeText(SECRET_WORD).catch(() => {});
                  window.open(LINKS.telegram, "_blank", "noopener,noreferrer");
                  showToast({ text: "Слово скопировано — вставь его в чат" });
                }}
              >
                Скопировать и написать
              </button>
              <button type="button" className="st-btn st-btn--ghost" onClick={() => setCelebrate(false)}>
                Закрыть
              </button>
            </div>
          </div>
        </>
      )}

      <div className="st-dock" role="toolbar" aria-label="Экскурсия и достижения">
        <button
          type="button"
          className={`st-dock__tour${tour >= 0 ? " is-active" : ""}`}
          onClick={() => (tour >= 0 ? stopTour() : setTour(0))}
        >
          <Glyph id="tour" size={18} />
          {tour >= 0 ? "Стоп" : "Экскурсия"}
        </button>
        <span className="st-dock__sep" />
        <span className="st-dock__caption">
          Достижения
          <b>
            {earned.length}/{ACHIEVEMENTS.length}
          </b>
        </span>
        {ACHIEVEMENTS.map((a) => {
          const got = earned.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              className={`st-badge${got ? " is-earned" : ""}${openAch === a.id ? " is-open" : ""}`}
              style={{ "--c": a.color } as React.CSSProperties}
              onClick={() => setOpenAch((o) => (o === a.id ? null : a.id))}
              title={a.name}
            >
              <Glyph id={a.id} size={20} />
              {got && <i>✓</i>}
            </button>
          );
        })}
      </div>

      {!introDone && (
        <button type="button" className="st-skip" onClick={finishIntro}>
          Пропустить интро
        </button>
      )}

      {toast && (
        <div className="st-toast" style={toast.id ? ({ "--c": ACHIEVEMENTS.find((a) => a.id === toast.id)!.color } as React.CSSProperties) : undefined}>
          {toast.id && (
            <span className="st-toast__icon">
              <Glyph id={toast.id} size={16} />
            </span>
          )}
          {toast.text}
        </div>
      )}

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
