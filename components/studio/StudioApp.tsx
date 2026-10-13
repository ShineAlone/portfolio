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
import { CityLayer } from "./CityLayer";
import { SURFACES, getCity, surfaceAt, type Surface } from "./city";
import { addParticle, drawFx, makeCrack, shatter, type Mark, type Particle } from "./effects";

const BASE_BG = "#ECEAE4";
const DRIVE_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
// новый ключ обнуляет прогресс у всех, кто заходил раньше
const STORAGE_KEY = "ak-achievements-v2";
const MAP_W = 172;
// фары и стоп-сигналы стоят там, где они нарисованы у каждой машинки (доли ширины и высоты)
const DRIVE_Z = 0.6;
const DRIVE_MIN_Z = 0.15;
const DRIVE_MAX_Z = 1.4;
const LAMPS: Record<string, [number, number]> = { sport: [0.26, 0.11], pickup: [0.23, 0.08], bug: [0.36, 0.1] };

type Solid = Rect & { id: string; frame: boolean };

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
  const [cityOn, setCityOn] = useState(false);
  // масштаб камеры за рулём: колесо и +/− меняют его, не выходя из машины
  const driveZRef = useRef(0.6);
  const zoomTouched = useRef(false);
  const [cityNotice, setCityNotice] = useState(false);
  const carElRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);
  const surfRef = useRef<HTMLSpanElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const cityFxRef = useRef<HTMLDivElement>(null);
  const mapCarRef = useRef<HTMLElement>(null);
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
    // в скрытой вкладке размер бывает нулевым — тогда считаем по окну, иначе камера улетает в минимальный масштаб
    if (!vpRef.current.w) return { w: window.innerWidth, h: window.innerHeight };
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
      // во время езды камерой управляет только машинка
      if (drivingRef.current) return;
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
      if (drivingRef.current) {
        driveZRef.current = clamp(nz, DRIVE_MIN_Z, DRIVE_MAX_Z);
        zoomTouched.current = true;
        return;
      }
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

  // Город собирается заранее, пока он скрыт: иначе тысячи элементов создавались бы в момент старта и давали рывок.
  useEffect(() => {
    if (!introDone) return;
    const t = setTimeout(() => setCityOn(true), 2500);
    return () => clearTimeout(t);
  }, [introDone]);

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
    setCityNotice(false);
    // машинка могла уехать далеко за острова — плавно возвращаем камеру в пределы холста
    setTimeout(() => animateTo(clampCam(camera.get()), 800), 0);
  }, [animateTo, camera, clampCam]);

  const noticeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
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
    setCityOn(true);
    setCityNotice(true);
    driveZRef.current = DRIVE_Z;
    zoomTouched.current = false;
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setCityNotice(false), 4200);
    setDriving(true);
  }, [stopDrive, stopTour]);

  /* ---------- блоки, разбитые машинкой ---------- */

  // три сильных удара — и блок рассыпается; на его месте остаётся кнопка, которая собирает его обратно
  const [broken, setBroken] = useState<string[]>([]);
  const brokenRef = useRef(new Set<string>());
  const hitsRef = useRef(new Map<string, number>());
  const countedAt = useRef(new Map<string, number>());
  const restoring = useRef(new Set<string>());

  const breakFrame = useCallback((id: string, ix: number, iy: number) => {
    const el = worldRef.current?.querySelector<HTMLElement>(`[data-frame="${id}"]`);
    const f = frameById(id);
    if (!el) return;
    el.classList.remove("is-hit");
    shatter(el, f.w, f.h, ix, iy, "out");
    // трещины разлетелись вместе с осколками
    el.querySelector(".st-crack-clip")?.remove();
    brokenRef.current.add(id);
    hitsRef.current.delete(id);
    setBroken([...brokenRef.current]);
  }, []);

  const restoreFrame = useCallback((id: string) => {
    if (restoring.current.has(id)) return;
    const el = worldRef.current?.querySelector<HTMLElement>(`[data-frame="${id}"]`);
    const f = frameById(id);
    if (!el) return;
    restoring.current.add(id);
    // осколки слетаются со всех сторон, затем блок появляется целиком и пружинит
    const ms = shatter(el, f.w, f.h, f.w / 2, f.h / 2, "in");
    setTimeout(() => {
      brokenRef.current.delete(id);
      restoring.current.delete(id);
      setBroken([...brokenRef.current]);
      el.animate(
        [
          { transform: "scale(0.96)", filter: "brightness(1.25)" },
          { transform: "scale(1.02)", filter: "brightness(1.1)", offset: 0.5 },
          { transform: "none", filter: "none" },
        ],
        { duration: 520, easing: "cubic-bezier(.34,1.56,.64,1)" }
      );
    }, ms);
  }, []);

  // Удар: блок вздрагивает, в точке удара появляется трещина, летят осколки.
  const hitSolid = useCallback((s: Solid, px: number, py: number, angle: number, power: number) => {
    const now = performance.now();
    if ((hitAt.current.get(s.id) ?? 0) > now - 350) return false;
    hitAt.current.set(s.id, now);
    if (s.frame) {
      const el = worldRef.current?.querySelector<HTMLElement>(`[data-frame="${s.id}"]`);
      // один заезд — один удар: пока машинка отскакивает и упирается, счёт не растёт
      if (el && power > 0.15 && (countedAt.current.get(s.id) ?? 0) < now - 900) {
        countedAt.current.set(s.id, now);
        const n = (hitsRef.current.get(s.id) ?? 0) + 1;
        hitsRef.current.set(s.id, n);
        if (n >= 3) {
          breakFrame(s.id, px - s.x, py - s.y);
          earnRef.current("drive");
          return true;
        }
        if (n === 2) showToast({ text: "Блок трещит — ещё удар, и он рассыплется" });
      }
      if (el) {
        el.classList.remove("is-hit");
        void el.offsetWidth;
        el.classList.add("is-hit");
        if (power > 0.12) makeCrack(el, px - s.x, py - s.y, angle, power, Math.min(s.w, s.h) * 0.5, "var(--r)");
      }
    } else if (power > 0.12 && cityFxRef.current) {
      // у дома своя подложка по его контуру — трещина не вылезет на тротуар
      const fx = cityFxRef.current;
      let host = fx.querySelector<HTMLElement>(`[data-b="${s.id}"]`);
      if (!host) {
        const b = getCity().bounds;
        host = document.createElement("div");
        host.dataset.b = s.id;
        host.className = "st-city__host";
        Object.assign(host.style, { left: `${s.x - b.x}px`, top: `${s.y - b.y}px`, width: `${s.w}px`, height: `${s.h}px` });
        fx.appendChild(host);
      }
      makeCrack(host, px - s.x, py - s.y, angle, power, Math.min(s.w, s.h) * 0.5, "10px");
    }
    earnRef.current("drive");
    return true;
  }, [breakFrame, showToast]);

  useEffect(() => {
    if (!driving) return;
    const spec = CARS[carId];
    const city = getCity();
    const R = Math.max(spec.w, spec.h) * 0.42;
    const solids: Solid[] = [
      ...COLLIDERS.map((f) => ({ id: f.id, x: f.x, y: f.y, w: f.w, h: f.h, frame: true })),
      ...city.buildings.map((b) => ({ id: b.id, x: b.x, y: b.y, w: b.w, h: b.h, frame: false })),
    ];
    const canvas = fxRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    const marks: Mark[] = [];
    const parts: Particle[] = [];
    // колёса и выхлоп в координатах машинки (нос смотрит вверх)
    const wheels = [
      [-spec.w * 0.36, -spec.h * 0.3],
      [spec.w * 0.36, -spec.h * 0.3],
      [-spec.w * 0.36, spec.h * 0.3],
      [spec.w * 0.36, spec.h * 0.3],
    ];
    const lastWheel: ({ x: number; y: number } | null)[] = [null, null, null, null];
    const exhaust = [-spec.w * 0.2, spec.h / 2 + 2];
    const c = carState.current;
    let surf: Surface = surfaceAt(city, c.x, c.y);
    let pending = surf;
    let pendingAt = 0;
    if (surfRef.current) {
      surfRef.current.textContent = SURFACES[surf].name;
      surfRef.current.dataset.s = surf;
    }
    let raf = 0;
    const t0 = performance.now();
    let last = t0;
    let lastHud = 0;
    let lastPuff = 0;
    let lastDust = 0;
    let braking = false;
    const ZOOM_OUT = 0.3;
    const rnd = (a: number) => (Math.random() - 0.5) * a;

    const toWorld = (lx: number, ly: number) => {
      const cos = Math.cos(c.a);
      const sin = Math.sin(c.a);
      return { x: c.x + lx * cos - ly * sin, y: c.y + lx * sin + ly * cos };
    };

    // частицы поверхности: трава летит клочками, грунт пылит, вода расходится кругами
    const kick = (s: Surface, x: number, y: number, bx: number, by: number, t: number, n = 1) => {
      for (let i = 0; i < n; i++) {
        if (s === "grass" || s === "field") {
          addParticle(parts, { x, y, vx: bx * 140 + rnd(160), vy: by * 140 + rnd(160), t, life: 0.55, r0: 5, r1: 2, rgb: Math.random() < 0.5 ? "78,130,52" : "120,176,78", a: 0.9 });
        } else if (s === "dirt") {
          addParticle(parts, { x, y, vx: bx * 70 + rnd(80), vy: by * 70 + rnd(80), t, life: 1.1, r0: 10, r1: 38, rgb: "176,136,92", a: 0.42 });
        } else if (s === "water") {
          addParticle(parts, { x, y, vx: 0, vy: 0, t, life: 0.9, r0: 8, r1: 46, rgb: "255,255,255", a: 0.8, ring: true });
          addParticle(parts, { x, y, vx: bx * 120 + rnd(200), vy: by * 120 + rnd(200), t, life: 0.45, r0: 5, r1: 2, rgb: "220,246,255", a: 0.95 });
        } else {
          addParticle(parts, { x, y, vx: bx * 50 + rnd(60), vy: by * 50 + rnd(60), t, life: 0.9, r0: 10, r1: 34, rgb: "230,230,230", a: 0.45 });
        }
      }
    };

    const step = (now: number) => {
      // шаг ограничен 0.1 с: при просадке FPS машинка не уходит в замедленную съёмку
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const k = keysRef.current;
      const up = k.has("KeyW") || k.has("ArrowUp");
      const down = k.has("KeyS") || k.has("ArrowDown");
      const left = k.has("KeyA") || k.has("ArrowLeft");
      const right = k.has("KeyD") || k.has("ArrowRight");
      const steer = (right ? 1 : 0) - (left ? 1 : 0);
      const S = SURFACES[surf];

      if (up) c.v += spec.accel * S.accel * (c.v < 0 ? 2.2 : 1) * dt;
      else if (down) c.v -= spec.accel * S.accel * (c.v > 0 ? 2.2 : 0.8) * dt;
      else c.v -= c.v * Math.min(1, 4 * dt);
      if (!up && !down && Math.abs(c.v) < 8) c.v = 0;
      // трава, грунт и вода не дают разогнаться: лишняя скорость плавно гасится
      const vmax = spec.max * S.max;
      if (c.v > vmax) c.v += (vmax - c.v) * Math.min(1, 4 * dt);
      if (c.v < -vmax * 0.45) c.v += (-vmax * 0.45 - c.v) * Math.min(1, 4 * dt);
      c.v = clamp(c.v, -spec.max * 0.45, spec.max);
      // Аркадный руль: A/D крутят машинку даже на месте; задним ходом — в обратную сторону
      c.a += steer * spec.turn * dt * (down && c.v < -5 ? -1 : 1);

      let nx = c.x + Math.sin(c.a) * c.v * dt;
      let ny = c.y - Math.cos(c.a) * c.v * dt;

      for (const f of solids) {
        // разбитый блок не мешает — по развалинам можно ехать
        if (f.frame && brokenRef.current.has(f.id)) continue;
        // дальние дома отсекаем сразу
        if (nx < f.x - R || nx > f.x + f.w + R || ny < f.y - R || ny > f.y + f.h + R) continue;
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
          dx /= d;
          dy /= d;
          nx = px + dx * R;
          ny = py + dy * R;
        }
        const power = Math.min(1, Math.abs(c.v) / spec.max);
        // точка удара — на краю блока; трещина растёт внутрь, против нормали
        const hx = clamp(nx - dx * R, f.x, f.x + f.w);
        const hy = clamp(ny - dy * R, f.y, f.y + f.h);
        if (Math.abs(c.v) > 40 && hitSolid(f, hx, hy, Math.atan2(-dy, -dx), power)) {
          for (let i = 0; i < 6 + power * 14; i++)
            addParticle(parts, {
              x: hx,
              y: hy,
              vx: dx * 220 * (0.4 + Math.random()) + rnd(260),
              vy: dy * 220 * (0.4 + Math.random()) + rnd(260),
              t,
              life: 0.6,
              r0: 3 + Math.random() * 4,
              r1: 1,
              rgb: i % 3 ? "30,30,30" : "255,255,255",
              a: 0.9,
            });
        }
        c.v = -c.v * spec.bounce;
      }
      // границ больше нет: за городом — бескрайнее поле
      c.x = nx;
      c.y = ny;

      // покрытие меняется, только если машинка задержалась на новом дольше доли секунды —
      // иначе на кромке тротуара надпись и эффекты мигали бы
      const ns = surfaceAt(city, c.x, c.y);
      if (ns !== pending) {
        pending = ns;
        pendingAt = t;
      }
      if (ns !== surf && t - pendingAt > 0.12) {
        surf = ns;
        kick(ns, c.x, c.y, 0, 0, t, 14);
        const sEl = surfRef.current;
        if (sEl) {
          sEl.textContent = SURFACES[ns].name;
          sEl.dataset.s = ns;
          sEl.classList.remove("is-flash");
          void sEl.offsetWidth;
          sEl.classList.add("is-flash");
        }
      }

      // следы: каждое колесо оставляет отрезок, как только сдвинулось на несколько пикселей
      const S2 = SURFACES[surf];
      const back = { x: -Math.sin(c.a), y: Math.cos(c.a) };
      const spinning = steer !== 0 && Math.abs(c.v) < 60;
      const skid = spinning || (steer !== 0 && Math.abs(c.v) > 420) || (down && c.v > 220);
      wheels.forEach(([lx, ly], i) => {
        const p = toWorld(lx, ly);
        const L = lastWheel[i];
        if (!L || Math.hypot(p.x - L.x, p.y - L.y) > 60) {
          lastWheel[i] = p;
          return;
        }
        if (Math.hypot(p.x - L.x, p.y - L.y) < 6) return;
        if (S2.mark) {
          marks.push({ x1: L.x, y1: L.y, x2: p.x, y2: p.y, t, rgb: S2.mark, a: S2.markA * (skid ? 2.4 : 1) * (i < 2 ? 0.7 : 1), w: 11 });
        } else if (i >= 2 && Math.random() < 0.35) {
          kick(surf, p.x, p.y, back.x, back.y, t);
        }
        lastWheel[i] = p;
      });

      // выхлоп: на газу дымит гуще
      if (t - lastPuff > (up ? 0.03 : 0.11)) {
        lastPuff = t;
        const e = toWorld(exhaust[0], exhaust[1]);
        const sp = 50 + Math.random() * 50;
        addParticle(parts, {
          x: e.x,
          y: e.y,
          vx: back.x * sp + rnd(30),
          vy: back.y * sp + rnd(30),
          t,
          life: 1 + Math.random() * 0.4,
          r0: 5,
          r1: 18 + Math.random() * 12,
          rgb: "140,140,146",
          a: up ? 0.32 : 0.2,
        });
      }

      // пыль и брызги из-под задних колёс, дым шин при пробуксовке на асфальте
      const dusty = surf === "grass" || surf === "field" || surf === "dirt";
      if (t - lastDust > 0.035 && ((dusty && Math.abs(c.v) > 80) || (skid && !dusty && surf !== "water"))) {
        lastDust = t;
        const [lx, ly] = wheels[2 + Math.floor(Math.random() * 2)];
        const p = toWorld(lx, ly);
        kick(surf, p.x, p.y, back.x, back.y, t);
      }

      const el = carElRef.current;
      if (el) {
        el.style.transform = `translate(${c.x - spec.w / 2}px, ${c.y - spec.h / 2}px) rotate(${c.a}rad)`;
        if (down !== braking) {
          braking = down;
          el.classList.toggle("is-braking", down);
        }
      }
      if (now - lastHud > 100) {
        lastHud = now;
        if (speedRef.current) speedRef.current.textContent = String(Math.round(Math.abs(c.v) / 10));
        const mc = mapCarRef.current;
        if (mc) {
          const s = MAP_W / WORLD.w;
          mc.style.transform = `translate(${clamp((c.x - WORLD.x) * s, 0, MAP_W)}px, ${clamp((c.y - WORLD.y) * s, 0, WORLD.h * s)}px)`;
        }
      }

      // Камера: сначала отъезжает, чтобы показать выросший город, потом возвращается к машинке
      const cam = camera.get();
      const { w, h } = vpSize();
      // если игрок сам покрутил масштаб — облёт города прерывается
      const reveal = now - t0 < 2600 && !zoomTouched.current;
      const target = reveal ? ZOOM_OUT : driveZRef.current;
      const kz = 1 - Math.exp(-dt * (reveal ? 2.6 : zoomTouched.current ? 7 : 2.2));
      // доводим масштаб точно до цели, иначе --z менялся бы на каждом кадре и пересчитывал стили
      const z = Math.abs(target - cam.z) < 0.002 ? target : cam.z + (target - cam.z) * kz;
      const kf = 1 - Math.exp(-dt * 16);
      const tx = w / 2 - c.x * z;
      const ty = h / 2 - c.y * z;
      camera.set({ z, x: cam.x + (tx - cam.x) * kf, y: cam.y + (ty - cam.y) * kf });

      // холст эффектов лежит внутри мира, но в масштабе 1:1 с экраном — рисуем в экранных координатах
      if (canvas && ctx) {
        const cm = camera.get();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const cw = Math.round(w * dpr);
        const ch = Math.round(h * dpr);
        if (canvas.width !== cw || canvas.height !== ch) {
          canvas.width = cw;
          canvas.height = ch;
          canvas.style.width = `${w}px`;
          canvas.style.height = `${h}px`;
        }
        canvas.style.transform = `translate(${-cm.x / cm.z}px, ${-cm.y / cm.z}px) scale(${1 / cm.z})`;
        drawFx(ctx, marks, parts, t, cm, w, h, dpr);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const release = () => keysRef.current.clear();
    window.addEventListener("blur", release);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("blur", release);
      ctx?.clearRect(0, 0, canvas!.width, canvas!.height);
      carElRef.current?.classList.remove("is-braking");
    };
  }, [driving, carId, camera, vpSize, hitSolid]);

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
      const k = e.deltaMode === 1 ? 16 : 1;
      // за рулём камера привязана к машинке, колесо только отдаляет и приближает
      if (drivingRef.current) {
        const d = clamp(e.deltaY * k, -60, 60);
        driveZRef.current = clamp(driveZRef.current * Math.exp(-d * (e.ctrlKey ? 0.012 : 0.004)), DRIVE_MIN_Z, DRIVE_MAX_Z);
        zoomTouched.current = true;
        return;
      }
      cancelAnimationFrame(animRef.current);
      stopTour();
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

    if (drivingRef.current) return;
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
          {cityOn && <CityLayer ref={cityFxRef} />}
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

          {broken.length > 0 && (
            // разбитые блоки прячем правилом, а не классом: React не перезапишет его при перерисовке
            <style>{`${broken.map((id) => `[data-frame="${id}"]`).join(",")}{visibility:hidden}`}</style>
          )}
          {broken.map((id) => {
            const f = frameById(id);
            return (
              <div
                key={id}
                className="st-ruin"
                data-ui
                style={{ left: f.x, top: f.y, width: f.w, height: f.h, "--r": `${f.r}px` } as React.CSSProperties}
              >
                <button type="button" className="st-ruin__btn" onClick={() => restoreFrame(id)}>
                  <span className="st-ruin__icon">↺</span>
                  <span>
                    <b>Собрать блок</b>
                    <small>«{f.name}»</small>
                  </span>
                </button>
              </div>
            );
          })}

          <canvas ref={fxRef} className={`st-fx${driving ? " is-on" : ""}`} aria-hidden />

          <div
            ref={carElRef}
            className={`st-car${driving ? " is-on" : ""}`}
            style={
              {
                width: CARS[carId].w,
                height: CARS[carId].h,
                "--lx": `${LAMPS[CARS[carId].id][0] * 100}%`,
                "--ly": `${LAMPS[CARS[carId].id][1] * 100}%`,
              } as React.CSSProperties
            }
          >
            <i className="st-car__beam" />
            <CarSvg car={CARS[carId]} />
            <i className="st-car__lamp" />
            <i className="st-car__lamp is-r" />
            <i className="st-car__tail" />
            <i className="st-car__tail is-r" />
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
          {driving && <i ref={mapCarRef} className="st-map__car" style={{ "--c": CARS[carId].color } as React.CSSProperties} />}
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
          <span ref={surfRef} className="st-hud__surf" />
          <span className="st-hud__keys">W/S — газ · A/D — поворот · колесо — масштаб · Esc — выйти</span>
          <button type="button" onClick={stopDrive}>
            Выйти из машины
          </button>
        </div>
      )}

      {cityNotice && (
        <div className="st-notice" role="status">
          <span className="st-notice__sign">!</span>
          <div>
            <b>Внимание: вокруг блоков вырос город</b>
            <small>Катайся по улицам. На траве и грунте машинка вязнет, в прудах — буксует</small>
          </div>
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
