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
  CARS,
  COLLIDERS,
  frameById,
  islandById,
  type AchievementId,
  type Rect,
} from "./data";
import { Glyph } from "./glyphs";
import { CarSvg, CHAT, NAME_CHARS, SpinFigure, World } from "./World";

const BASE_BG = "#ECEAE4";
const DRIVE_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
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
  const [carId, setCarId] = useState(0);
  const [driving, setDriving] = useState(false);
  const drivingRef = useRef(driving);
  drivingRef.current = driving;
  const carElRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);
  const carState = useRef({ x: 0, y: 0, a: 0, v: 0 });
  const keysRef = useRef(new Set<string>());
  const hitAt = useRef(new Map<string, number>());

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

  // Размер окна кешируется: чтение getBoundingClientRect на каждом кадре заставляет браузер пересчитывать вёрстку.
  const vpRef = useRef({ w: 0, h: 0 });
  const vpSize = useCallback(() => {
    if (!vpRef.current.w && viewportRef.current) {
      const r = viewportRef.current.getBoundingClientRect();
      vpRef.current = { w: r.width, h: r.height };
    }
    return vpRef.current;
  }, []);
  useEffect(() => {
    const v = viewportRef.current;
    if (!v) return;
    const ro = new ResizeObserver(([e]) => {
      vpRef.current = { w: e.contentRect.width, h: e.contentRect.height };
    });
    ro.observe(v);
    return () => ro.disconnect();
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
    // Пишем в DOM только то, что реально поменялось: при панорамировании меняется лишь сдвиг,
    // а переустановка --z и фона заставляла браузер пересчитывать стили сотен элементов каждый кадр.
    let lastZ = -1;
    let lastIsland = "";
    const apply = () => {
      const { x, y, z } = camera.get();
      const w = worldRef.current;
      const v = viewportRef.current;
      if (!w || !v) return;
      w.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${z})`;
      v.style.backgroundPosition = `${x}px ${y}px`;

      if (z !== lastZ) {
        lastZ = z;
        w.style.setProperty("--z", String(z));
        v.style.backgroundColor = BASE_BG;
        v.style.backgroundImage = z < 0.35 ? "none" : "radial-gradient(rgba(0,0,0,.13) 1.1px, transparent 1.4px)";
        v.style.backgroundSize = `${28 * z}px ${28 * z}px`;

        if (!farRef.current && z < 0.26) {
          farRef.current = true;
          w.classList.add("is-far");
          if (introDoneRef.current) earnRef.current("map");
        } else if (farRef.current && z > 0.3) {
          farRef.current = false;
          w.classList.remove("is-far");
        }
      }

      const { w: vw, h: vh } = vpSize();
      const mv = miniViewRef.current;
      if (mv) {
        const s = MAP_W / WORLD.w;
        mv.style.transform = `translate(${(-x / z - WORLD.x) * s}px, ${(-y / z - WORLD.y) * s}px)`;
        mv.style.width = `${(vw / z) * s}px`;
        mv.style.height = `${(vh / z) * s}px`;
      }

      const cx = (vw / 2 - x) / z;
      const cy = (vh / 2 - y) / z;
      const isl = ISLANDS.find((i) => cx >= i.x && cx <= i.x + i.w && cy >= i.y && cy <= i.y + i.h);
      if (isl) {
        if (isl.id !== lastIsland) {
          lastIsland = isl.id;
          setActiveIsland(isl.id);
        }
        if (isl.id === "proj" && z >= 0.95) earnRef.current("zoom");
      }
    };
    apply();
    return camera.subscribe(apply);
  }, [camera, vpSize]);

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
      { rect: islandById("plugins"), text: "Лаборатория: плагины, сервисы и гараж — возьми машинку и прокатись по сайту" },
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

  /* ---------- гараж: машинка на WASD ---------- */

  const stopDrive = useCallback(() => {
    keysRef.current.clear();
    setDriving(false);
  }, []);

  const startDrive = useCallback(() => {
    if (drivingRef.current) return stopDrive();
    const g = frameById("garage");
    // машинка выезжает из гаража вниз, носом вниз
    carState.current = { x: g.x + g.w / 2, y: g.y + g.h + 140, a: Math.PI, v: 0 };
    keysRef.current.clear();
    setSelected(null);
    stopTour();
    // камерой во время езды управляет только цикл машинки — отдельный перелёт с ним спорил бы
    cancelAnimationFrame(animRef.current);
    setDriving(true);
  }, [stopDrive, stopTour]);

  const hitFrame = useCallback((id: string) => {
    const now = performance.now();
    if ((hitAt.current.get(id) ?? 0) > now - 350) return;
    hitAt.current.set(id, now);
    const el = worldRef.current?.querySelector(`[data-frame="${id}"]`);
    if (el) {
      el.classList.remove("is-hit");
      void (el as HTMLElement).offsetWidth;
      el.classList.add("is-hit");
    }
    earnRef.current("drive");
  }, []);

  useEffect(() => {
    if (!driving) return;
    const spec = CARS[carId];
    const R = Math.max(spec.w, spec.h) * 0.42;
    let raf = 0;
    let last = performance.now();
    let lastHud = 0;
    const DRIVE_Z = 0.75;
    const step = (now: number) => {
      // шаг ограничен 0.1 с: при просадке FPS машинка не уходит в замедленную съёмку
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const k = keysRef.current;
      const c = carState.current;
      const up = k.has("KeyW") || k.has("ArrowUp");
      const down = k.has("KeyS") || k.has("ArrowDown");
      const left = k.has("KeyA") || k.has("ArrowLeft");
      const right = k.has("KeyD") || k.has("ArrowRight");

      if (up) c.v += spec.accel * (c.v < 0 ? 2.2 : 1) * dt;
      else if (down) c.v -= spec.accel * (c.v > 0 ? 2.2 : 0.8) * dt;
      else c.v -= c.v * Math.min(1, 4 * dt);
      if (!up && !down && Math.abs(c.v) < 8) c.v = 0;
      c.v = clamp(c.v, -spec.max * 0.45, spec.max);
      // руль работает и на малой скорости, при заднем ходе — в обратную сторону
      const grip = Math.sign(c.v) * Math.min(1, 0.35 + Math.abs(c.v) / 500);
      c.a += ((right ? 1 : 0) - (left ? 1 : 0)) * spec.turn * dt * (c.v === 0 ? 0 : grip);

      let nx = c.x + Math.sin(c.a) * c.v * dt;
      let ny = c.y - Math.cos(c.a) * c.v * dt;

      for (const f of COLLIDERS) {
        const px = clamp(nx, f.x, f.x + f.w);
        const py = clamp(ny, f.y, f.y + f.h);
        let dx = nx - px;
        let dy = ny - py;
        const d = Math.hypot(dx, dy);
        if (d >= R) continue;
        if (d === 0) {
          // центр машинки уже внутри блока — выталкиваем через ближайшую сторону
          const sides = [nx - f.x, f.x + f.w - nx, ny - f.y, f.y + f.h - ny];
          const m = sides.indexOf(Math.min(...sides));
          dx = m === 0 ? -1 : m === 1 ? 1 : 0;
          dy = m === 2 ? -1 : m === 3 ? 1 : 0;
          nx = m === 0 ? f.x - R : m === 1 ? f.x + f.w + R : nx;
          ny = m === 2 ? f.y - R : m === 3 ? f.y + f.h + R : ny;
        } else {
          nx = px + (dx / d) * R;
          ny = py + (dy / d) * R;
        }
        c.v = -c.v * spec.bounce;
        hitFrame(f.id);
      }

      if (nx < WORLD.x + R || nx > WORLD.x + WORLD.w - R) {
        nx = clamp(nx, WORLD.x + R, WORLD.x + WORLD.w - R);
        c.v = -c.v * spec.bounce;
      }
      if (ny < WORLD.y + R || ny > WORLD.y + WORLD.h - R) {
        ny = clamp(ny, WORLD.y + R, WORLD.y + WORLD.h - R);
        c.v = -c.v * spec.bounce;
      }
      c.x = nx;
      c.y = ny;

      const el = carElRef.current;
      if (el) el.style.transform = `translate(${c.x - spec.w / 2}px, ${c.y - spec.h / 2}px) rotate(${c.a}rad)`;
      if (speedRef.current && now - lastHud > 100) {
        lastHud = now;
        speedRef.current.textContent = String(Math.round(Math.abs(c.v) / 10));
      }

      // Камера держит машинку в центре почти без запаздывания и плавно выходит на масштаб езды
      const cam = camera.get();
      const { w, h } = vpSize();
      const kz = 1 - Math.exp(-dt * 4);
      // доводим масштаб точно до цели, иначе --z менялся бы на каждом кадре и пересчитывал стили
      const z = Math.abs(DRIVE_Z - cam.z) < 0.002 ? DRIVE_Z : cam.z + (DRIVE_Z - cam.z) * kz;
      const kf = 1 - Math.exp(-dt * 16);
      const tx = w / 2 - c.x * z;
      const ty = h / 2 - c.y * z;
      camera.set({ z, x: cam.x + (tx - cam.x) * kf, y: cam.y + (ty - cam.y) * kf });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const release = () => keysRef.current.clear();
    window.addEventListener("blur", release);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("blur", release);
    };
  }, [driving, carId, camera, vpSize, hitFrame]);

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
      if (drivingRef.current) {
        if (DRIVE_KEYS.has(e.code)) {
          e.preventDefault();
          keysRef.current.add(e.code);
          return;
        }
        if (e.code === "Escape") return stopDrive();
      }
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
      keysRef.current.delete(e.code);
      if (e.code === "Space") setSpaceHeld(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [camera, onSlide, showAll, stopDrive, stopTour, zoomCenter]);

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
    const wx = (e.clientX - r.left) * s + WORLD.x;
    const wy = (e.clientY - r.top) * s + WORLD.y;
    const { w, h } = vpSize();
    const z = Math.max(camera.get().z, 0.45);
    stopTour();
    animateTo(clampCam({ z, x: w / 2 - wx * z, y: h / 2 - wy * z }), 800);
  };

  const sel = selected ? FRAMES.find((f) => f.id === selected) ?? null : null;
  const ach = openAch ? ACHIEVEMENTS.find((a) => a.id === openAch)! : null;
  const mapS = MAP_W / WORLD.w;

  return (
    <div className={`st-app${introDone ? " is-ready" : " is-intro"}${driving ? " is-driving" : ""}`}>
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
            carId={carId}
            driving={driving}
            onPickCar={setCarId}
            onDrive={startDrive}
          />

          <div
            ref={carElRef}
            className={`st-car${driving ? " is-on" : ""}`}
            style={{ width: CARS[carId].w, height: CARS[carId].h }}
          >
            <CarSvg car={CARS[carId]} />
          </div>

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
                  left: (i.x - WORLD.x) * mapS,
                  top: (i.y - WORLD.y) * mapS,
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

      {driving && (
        <div className="st-hud" style={{ "--c": CARS[carId].color } as React.CSSProperties}>
          <span className="st-hud__car">{CARS[carId].name}</span>
          <b>
            <span ref={speedRef}>0</span> км/ч
          </b>
          <span className="st-hud__keys">WASD — руль и газ · Esc — выйти</span>
          <button type="button" onClick={stopDrive}>
            Выйти из машины
          </button>
        </div>
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
