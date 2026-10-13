"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { LINKS } from "@/lib/content";
import { Icon } from "./icons";
import {
  FRAMES,
  INTRO_RECT,
  PINS,
  SECTIONS,
  WORLD_BOUNDS,
  type FrameDef,
  type Rect,
} from "./layout";

// Верхний предел масштаба: дальше картинки в текущем разрешении начинают мылить.
const MIN_Z = 0.1;
const MAX_Z = 2;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

type Cam = { x: number; y: number; z: number };
type Tool = "move" | "hand";

// Камера живёт вне React-состояния, чтобы панорамирование не перерисовывало сотню картинок.
function createCameraStore() {
  let cam: Cam = { x: 0, y: 0, z: 1 };
  const listeners = new Set<() => void>();
  return {
    get: () => cam,
    set(next: Cam) {
      cam = next;
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}
type CameraStore = ReturnType<typeof createCameraStore>;

const BG_SWATCHES = ["#F5F5F5", "#FFFFFF", "#1E1E1E", "#FFF4D6", "#E6F0FF", "#EAF7E4", "#FCE8F1"];

function isDark(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum < 0.5;
}

function ZoomLabel({ camera }: { camera: CameraStore }) {
  const z = useSyncExternalStore(
    camera.subscribe,
    () => Math.round(camera.get().z * 100),
    () => 100
  );
  return <>{z}%</>;
}

function HexInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <input
      className="cv-hex"
      value={draft}
      spellCheck={false}
      onChange={(e) => {
        const v = e.target.value.toUpperCase();
        setDraft(v);
        if (/^#[0-9A-F]{6}$/.test(v)) onChange(v);
      }}
      onBlur={() => setDraft(value)}
    />
  );
}

function Inspector({
  frame,
  bg,
  onBg,
}: {
  frame: FrameDef | null;
  bg: string;
  onBg: (v: string) => void;
}) {
  if (!frame) {
    return (
      <>
        <div className="cv-insp__head">Страница</div>
        <section className="cv-insp__block">
          <h4>Фон холста</h4>
          <div className="cv-bgrow">
            <label className="cv-swatch-pick" style={{ background: bg }}>
              <input
                type="color"
                value={bg}
                onChange={(e) => onBg(e.target.value.toUpperCase())}
                aria-label="Выбрать цвет фона"
              />
            </label>
            <HexInput value={bg} onChange={onBg} />
          </div>
          <div className="cv-swatches">
            {BG_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                className={c === bg ? "is-active" : ""}
                style={{ background: c }}
                onClick={() => onBg(c)}
                aria-label={`Фон ${c}`}
              />
            ))}
          </div>
        </section>
        <section className="cv-insp__block">
          <h4>Управление</h4>
          <dl className="cv-keys">
            <dt>Колесо</dt>
            <dd>двигаться</dd>
            <dt>Ctrl + колесо</dt>
            <dd>масштаб</dd>
            <dt>Пробел + мышь</dt>
            <dd>тащить холст</dd>
            <dt>V / H</dt>
            <dd>курсор / рука</dd>
            <dt>C</dt>
            <dd>комментарии</dd>
            <dt>Shift + 1</dt>
            <dd>показать всё</dd>
            <dt>Shift + 2</dt>
            <dd>к выделению</dd>
          </dl>
        </section>
      </>
    );
  }

  const info = frame.info;
  return (
    <>
      <div className="cv-insp__head">
        <Icon name={frame.kind === "sticky" ? "sticky" : "frame"} size={14} />
        {frame.name}
      </div>
      <section className="cv-insp__block">
        <h4>Фрейм</h4>
        <div className="cv-props">
          <span>
            <i>X</i>
            {frame.x}
          </span>
          <span>
            <i>Y</i>
            {frame.y}
          </span>
          <span>
            <i>W</i>
            {frame.w}
          </span>
          <span>
            <i>H</i>
            {frame.h}
          </span>
        </div>
      </section>
      {info && (
        <section className="cv-insp__block">
          <h4>Описание</h4>
          <p className="cv-insp__text">{info.text}</p>
          {info.tags && (
            <div className="cv-tags cv-tags--small">
              {info.tags.map((t) => (
                <span key={t} style={{ background: info.tagColor ?? "#EDEDED" }}>
                  {t}
                </span>
              ))}
            </div>
          )}
          {info.link && (
            <a className="cv-insp__link" href={info.link.href} target="_blank" rel="noopener noreferrer">
              {info.link.label}
              <Icon name="link" size={14} />
            </a>
          )}
        </section>
      )}
    </>
  );
}

export function CanvasApp() {
  const camera = useMemo(createCameraStore, []);
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorLabelRef = useRef<HTMLSpanElement>(null);
  const animRef = useRef(0);

  const [tool, setTool] = useState<Tool>("move");
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showPins, setShowPins] = useState(true);
  const [openPin, setOpenPin] = useState<string | null>(null);
  const [bg, setBg] = useState("#F5F5F5");
  const [zoomMenu, setZoomMenu] = useState(false);
  const [ready, setReady] = useState(false);

  const handActive = tool === "hand" || spaceHeld;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const handRef = useRef(handActive);
  handRef.current = handActive;

  const vpSize = useCallback(() => {
    const r = viewportRef.current!.getBoundingClientRect();
    return { w: r.width, h: r.height, left: r.left, top: r.top };
  }, []);

  // Не даём улететь от работ в пустоту: хотя бы край холста всегда виден.
  const clampCam = useCallback(
    (c: Cam): Cam => {
      const { w, h } = vpSize();
      const b = WORLD_BOUNDS;
      const m = 160;
      const z = clamp(c.z, MIN_Z, MAX_Z);
      return {
        z,
        x: clamp(c.x, m - (b.x + b.w) * z, w - m - b.x * z),
        y: clamp(c.y, m - (b.y + b.h) * z, h - m - b.y * z),
      };
    },
    [vpSize]
  );

  const fit = useCallback(
    (r: Rect, pad = 80, maxZ = 1): Cam => {
      const { w, h } = vpSize();
      const z = clamp(Math.min((w - pad * 2) / r.w, (h - pad * 2) / r.h), MIN_Z, maxZ);
      return { z, x: w / 2 - (r.x + r.w / 2) * z, y: h / 2 - (r.y + r.h / 2) * z };
    },
    [vpSize]
  );

  // Плавный перелёт камеры: центр интерполируется линейно, масштаб — логарифмически.
  const animateTo = useCallback(
    (target: Cam, ms = 650) => {
      cancelAnimationFrame(animRef.current);
      const { w, h } = vpSize();
      const from = camera.get();
      const fc = { x: (w / 2 - from.x) / from.z, y: (h / 2 - from.y) / from.z };
      const tc = { x: (w / 2 - target.x) / target.z, y: (h / 2 - target.y) / target.z };
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / ms);
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        const z = Math.exp(Math.log(from.z) + (Math.log(target.z) - Math.log(from.z)) * e);
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
      animateTo(clampCam({ z, x: w / 2 - wx * z, y: h / 2 - wy * z }), 260);
    },
    [animateTo, camera, clampCam, vpSize]
  );

  const showAll = useCallback(() => animateTo(fit(WORLD_BOUNDS, 40)), [animateTo, fit]);

  const focusFrame = useCallback(
    (id: string) => {
      const f = FRAMES.find((x) => x.id === id);
      if (!f) return;
      setSelected(id);
      animateTo(clampCam(fit(f, 90, 1)));
    },
    [animateTo, clampCam, fit]
  );

  const focusSection = useCallback(
    (id: string) => {
      const s = SECTIONS.find((x) => x.id === id);
      if (!s) return;
      setSelected(null);
      animateTo(clampCam(fit(s, 40, 1)));
    },
    [animateTo, clampCam, fit]
  );

  // Применяем камеру к DOM напрямую.
  useEffect(() => {
    const apply = () => {
      const { x, y, z } = camera.get();
      const w = worldRef.current;
      const v = viewportRef.current;
      if (!w || !v) return;
      w.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${z})`;
      w.style.setProperty("--z", String(z));
      const s = 24 * z;
      v.style.backgroundSize = `${s}px ${s}px`;
      v.style.backgroundPosition = `${x}px ${y}px`;
      v.classList.toggle("cv-nodots", z < 0.35);
    };
    apply();
    return camera.subscribe(apply);
  }, [camera]);

  // Вступление: сначала весь холст, потом плавный наезд на первый экран.
  useEffect(() => {
    camera.set(fit(WORLD_BOUNDS, 40));
    setReady(true);
    const t = setTimeout(() => animateTo(fit(INTRO_RECT, 60), 1700), 1100);
    return () => clearTimeout(t);
  }, [animateTo, camera, fit]);

  // Колесо: как в Figma — без модификаторов двигает холст, с Ctrl/⌘ (и щипком тачпада) — масштаб.
  useEffect(() => {
    const v = viewportRef.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cancelAnimationFrame(animRef.current);
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
  }, [camera, clampCam, zoomAt]);

  // Горячие клавиши (по e.code, чтобы работали и в русской раскладке).
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      if (e.code === "Space") {
        e.preventDefault();
        setSpaceHeld(true);
        return;
      }
      if (e.shiftKey && e.code === "Digit1") return showAll();
      if (e.shiftKey && e.code === "Digit2") {
        if (selectedRef.current) focusFrame(selectedRef.current);
        return;
      }
      if (e.shiftKey && e.code === "Digit0") return zoomCenter(1);
      switch (e.code) {
        case "KeyV":
          setTool("move");
          break;
        case "KeyH":
          setTool("hand");
          break;
        case "KeyC":
          setShowPins((p) => !p);
          break;
        case "Escape":
          setSelected(null);
          setOpenPin(null);
          setZoomMenu(false);
          break;
        case "Equal":
        case "NumpadAdd":
          zoomCenter(camera.get().z * 1.3);
          break;
        case "Minus":
        case "NumpadSubtract":
          zoomCenter(camera.get().z / 1.3);
          break;
      }
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
  }, [camera, focusFrame, showAll, zoomCenter]);

  /* ---------- мышь, тач и щипок ---------- */

  const drag = useRef<{
    id: number;
    sx: number;
    sy: number;
    cam: Cam;
    moved: boolean;
    forcePan: boolean;
    frameId: string | null;
  } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; mx: number; my: number; cam: Cam } | null>(null);

  const moveCursor = (e: React.PointerEvent) => {
    const c = cursorRef.current;
    if (!c || e.pointerType !== "mouse") return;
    c.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    c.classList.add("is-visible");
    const f = (e.target as HTMLElement).closest?.("[data-frame]") as HTMLElement | null;
    const label = f?.dataset.name ?? "Гость";
    if (cursorLabelRef.current && cursorLabelRef.current.textContent !== label) {
      cursorLabelRef.current.textContent = label;
    }
    c.classList.toggle("is-on-frame", !!f);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".cv-toolbar, .cv-pin")) return;
    cancelAnimationFrame(animRef.current);
    setZoomMenu(false);
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
    const frame = (e.target as HTMLElement).closest("[data-frame]");
    drag.current = {
      id: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      cam: camera.get(),
      moved: false,
      forcePan: e.button === 1 || handRef.current,
      frameId: frame?.getAttribute("data-frame") ?? null,
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
      // Захват только после начала движения — иначе ломаются клики по ссылкам внутри фреймов.
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
      if (!d.moved && !d.forcePan) {
        setSelected(d.frameId);
        setOpenPin(null);
      }
      drag.current = null;
      viewportRef.current!.classList.remove("is-panning");
    }
  };

  const highlight = (id: string, on: boolean) =>
    worldRef.current?.querySelector(`[data-frame="${id}"]`)?.classList.toggle("is-hover", on);

  const selectedFrame = FRAMES.find((f) => f.id === selected) ?? null;

  const worldContent = useMemo(
    () => (
      <>
        {SECTIONS.map((s) => (
          <div
            key={s.id}
            className="cv-section"
            style={{ left: s.x, top: s.y, width: s.w, height: s.h }}
          >
            <div className="cv-section__label">{s.name}</div>
          </div>
        ))}
        {FRAMES.map((f, i) => {
          const isSel = selected === f.id;
          return (
            <div
              key={f.id}
              className={`cv-frame cv-frame--${f.kind ?? "frame"}${isSel ? " is-selected" : ""}`}
              data-frame={f.id}
              data-name={f.name}
              style={
                {
                  left: f.x,
                  top: f.y,
                  width: f.w,
                  height: f.h,
                  "--w": f.w,
                  animationDelay: `${0.25 + i * 0.04}s`,
                } as React.CSSProperties
              }
            >
              <div className="cv-frame__label">{f.name}</div>
              <div className="cv-frame__body" style={f.fill ? { background: f.fill } : undefined}>
                {f.content}
              </div>
              {isSel && (
                <>
                  <span className="cv-handle tl" />
                  <span className="cv-handle tr" />
                  <span className="cv-handle bl" />
                  <span className="cv-handle br" />
                  <span className="cv-size">
                    {f.w} × {f.h}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </>
    ),
    [selected]
  );

  const sectionsWithFrames = SECTIONS.map((s) => ({
    ...s,
    frames: FRAMES.filter((f) => f.section === s.id),
  }));
  const looseFrames = FRAMES.filter((f) => !f.section);

  return (
    <div className={`cv-app${isDark(bg) ? " is-dark-canvas" : ""}`}>
      <header className="cv-topbar">
        <div className="cv-top-left">
          <span className="cv-logo">АК</span>
          <span className="cv-crumb">
            Арсений Кононов <span>/</span> <b>Портфолио</b>
          </span>
        </div>
        <div className="cv-top-right">
          <span className="cv-avatar" title="Арсений">
            А
          </span>
          <button
            type="button"
            className="cv-icon-btn"
            disabled
            title="Режим презентации — в следующей итерации"
          >
            <Icon name="play" size={16} />
          </button>
          <a className="cv-share" href={LINKS.telegram} target="_blank" rel="noopener noreferrer">
            Связаться
          </a>
          <div className="cv-zoom">
            <button type="button" className="cv-zoom__btn" onClick={() => setZoomMenu((v) => !v)}>
              <ZoomLabel camera={camera} />
              <Icon name="chevron" size={14} />
            </button>
            {zoomMenu && (
              <div className="cv-zoommenu" onClick={() => setZoomMenu(false)}>
                <button type="button" onClick={() => zoomCenter(camera.get().z * 1.3)}>
                  Увеличить <kbd>+</kbd>
                </button>
                <button type="button" onClick={() => zoomCenter(camera.get().z / 1.3)}>
                  Уменьшить <kbd>−</kbd>
                </button>
                <hr />
                <button type="button" onClick={showAll}>
                  Показать всё <kbd>⇧1</kbd>
                </button>
                <button
                  type="button"
                  disabled={!selected}
                  onClick={() => selected && focusFrame(selected)}
                >
                  К выделению <kbd>⇧2</kbd>
                </button>
                <hr />
                {[0.5, 1, 2].map((z) => (
                  <button key={z} type="button" onClick={() => zoomCenter(z)}>
                    {z * 100}%{z === 1 && <kbd>⇧0</kbd>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <aside className="cv-left">
        <div className="cv-panel-title">Страницы</div>
        <div className="cv-page is-active">
          <Icon name="page" size={14} /> Портфолио
        </div>
        <div className="cv-page is-muted">
          <Icon name="page" size={14} /> Черновики <span>скоро</span>
        </div>
        <div className="cv-panel-title">Слои</div>
        <ul className="cv-layers">
          {looseFrames.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                className={`cv-layer${selected === f.id ? " is-selected" : ""}`}
                onClick={() => focusFrame(f.id)}
                onMouseEnter={() => highlight(f.id, true)}
                onMouseLeave={() => highlight(f.id, false)}
              >
                <Icon name={f.kind === "sticky" ? "sticky" : "frame"} size={14} />
                {f.name}
              </button>
            </li>
          ))}
          {sectionsWithFrames.map((s) => (
            <li key={s.id}>
              <button type="button" className="cv-layer cv-layer--section" onClick={() => focusSection(s.id)}>
                <Icon name="section" size={14} />
                {s.name}
              </button>
              <ul>
                {s.frames.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      className={`cv-layer${selected === f.id ? " is-selected" : ""}`}
                      onClick={() => focusFrame(f.id)}
                      onMouseEnter={() => highlight(f.id, true)}
                      onMouseLeave={() => highlight(f.id, false)}
                    >
                      <Icon name="frame" size={14} />
                      {f.name}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </aside>

      <main
        ref={viewportRef}
        className={`cv-viewport${handActive ? " is-hand" : ""}`}
        style={{ "--bg": bg } as React.CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => cursorRef.current?.classList.remove("is-visible")}
        onAuxClick={(e) => e.preventDefault()}
      >
        <div ref={worldRef} className={`cv-world${ready ? " is-ready" : ""}`}>
          {worldContent}
          {showPins &&
            PINS.map((p) => (
              <div key={p.id} className="cv-pin-anchor" style={{ left: p.x, top: p.y }}>
                <div className="cv-pin">
                  <button
                    type="button"
                    className={`cv-pin__btn${openPin === p.id ? " is-open" : ""}`}
                    onClick={() => setOpenPin((o) => (o === p.id ? null : p.id))}
                    aria-label="Комментарий"
                  >
                    А
                  </button>
                  {openPin === p.id && (
                    <div className="cv-pin__bubble">
                      <b>Арсений</b>
                      <p>{p.text}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>

        <div className="cv-toolbar" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={tool === "move" ? "is-active" : ""}
            onClick={() => setTool("move")}
            title="Курсор (V)"
          >
            <Icon name="move" />
          </button>
          <button
            type="button"
            className={tool === "hand" ? "is-active" : ""}
            onClick={() => setTool("hand")}
            title="Рука (H)"
          >
            <Icon name="hand" />
          </button>
          <button
            type="button"
            className={showPins ? "is-on" : ""}
            onClick={() => setShowPins((v) => !v)}
            title="Комментарии (C)"
          >
            <Icon name="comment" />
          </button>
          <span className="cv-toolbar__sep" />
          <button type="button" onClick={showAll} title="Показать всё (Shift+1)">
            <Icon name="fit" />
          </button>
        </div>
      </main>

      <aside className={`cv-right${selectedFrame ? " has-selection" : ""}`}>
        <Inspector frame={selectedFrame} bg={bg} onBg={setBg} />
      </aside>

      <div ref={cursorRef} className={`cv-cursor${handActive ? " is-hidden" : ""}`} aria-hidden>
        <svg width="22" height="24" viewBox="0 0 22 24">
          <path
            d="M3 2.5l15 7.2-6.4 1.9-2.6 6.4L3 2.5z"
            fill="#1E1E1E"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
        <span ref={cursorLabelRef} className="cv-cursor__label">
          Гость
        </span>
      </div>
    </div>
  );
}
