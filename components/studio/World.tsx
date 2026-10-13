"use client";

import { memo, useEffect, useState } from "react";
import { AUTOMATION, EDUCATION, HERO, LINKS, PRESENTATIONS, PROJECTS, STATS, TOOLS, WORK } from "@/lib/content";
import {
  DECKS,
  ISLANDS,
  PLUGIN_SLOTS,
  SITE_FRAMES,
  SOCIAL_LAYOUT,
  frameById,
  islandById,
  narrowWallpapers,
  pluginSlot,
  poster,
  wideWallpapers,
  type FrameMeta,
} from "./data";

/* eslint-disable @next/next/no-img-element */

export const NAME_LINES = ["я Арсений", "Кононов"];
export const NAME_CHARS = NAME_LINES.join("").length;
const HELLO = "Привет!";

// Округление обязательно: на сервере и в браузере Math.sin даёт разные хвосты после запятой.
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return Math.round((x - Math.floor(x)) * 1000) / 1000;
};

function Frame({
  meta,
  selected,
  className,
  children,
}: {
  meta: FrameMeta;
  selected: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const color = islandById(meta.island).color;
  return (
    <div
      className={`st-frame${selected ? " is-selected" : ""}${className ? ` ${className}` : ""}`}
      data-frame={meta.id}
      data-name={meta.name}
      data-color={color}
      style={
        {
          left: meta.x,
          top: meta.y,
          width: meta.w,
          height: meta.h,
          "--r": `${meta.r}px`,
          "--c": color,
        } as React.CSSProperties
      }
    >
      <div className="st-frame__label">{meta.name}</div>
      {children}
    </div>
  );
}

function CountUp({ value, run }: { value: string; run: boolean }) {
  const m = /^(\D*)(\d+)(.*)$/.exec(value);
  const target = m ? Number(m[2]) : 0;
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run || !target) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1100);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target]);
  if (!m) return <>{value}</>;
  return (
    <>
      {m[1]}
      {run ? n : 0}
      {m[3]}
    </>
  );
}

function HoverVideo({ video }: { video: string }) {
  const [on, setOn] = useState(false);
  return (
    <div className="st-hv" onPointerEnter={() => setOn(true)} onPointerLeave={() => setOn(false)}>
      <img src={poster(video)} alt="" draggable={false} />
      {on && <video src={video} autoPlay muted loop playsInline />}
      <span className="st-hv__hint">{on ? "▶ играет" : "наведи — оживёт"}</span>
    </div>
  );
}

/* ---------- Обо мне: приветствие-коллаж ---------- */

type StickerShape = "circle" | "burst" | "pill" | "square";

const STICKERS: { shape: StickerShape; x: number; y: number; w: number; h: number; rot: number; color: string }[] = [
  { shape: "circle", x: 1110, y: 140, w: 180, h: 180, rot: 10, color: "#FEFE78" },
  { shape: "burst", x: 1090, y: 390, w: 210, h: 210, rot: -8, color: "#FFB6E1" },
  { shape: "pill", x: 560, y: 690, w: 250, h: 96, rot: -4, color: "#86DDFF" },
  { shape: "square", x: 840, y: 636, w: 170, h: 150, rot: 7, color: "#ACF9A2" },
  { shape: "burst", x: 0, y: 628, w: 200, h: 200, rot: -6, color: "#C791FF" },
  { shape: "pill", x: 220, y: 690, w: 270, h: 96, rot: 5, color: "#FFC7B6" },
];

const BURST_POINTS = Array.from({ length: 28 }, (_, i) => {
  const a = (i / 28) * Math.PI * 2;
  const r = i % 2 ? 41 : 49;
  return `${(50 + Math.cos(a) * r).toFixed(2)},${(50 + Math.sin(a) * r).toFixed(2)}`;
}).join(" ");

function Greeting({
  step,
  typed,
  selected,
  onSticker,
}: {
  step: number;
  typed: number;
  selected: boolean;
  onSticker: () => void;
}) {
  let rest = typed;
  let caretLine = -1;
  const lines = NAME_LINES.map((l, i) => {
    const s = l.slice(0, Math.max(0, rest));
    if (caretLine === -1 && rest <= l.length) caretLine = i;
    rest -= l.length;
    return s;
  });
  const cls = [1, 2, 3, 4, 5].filter((s) => step >= s).map((s) => `s${s}`).join(" ");

  return (
    <Frame meta={frameById("hero")} selected={selected} className={`st-free sthg ${cls}`}>
      <div className="sthg__hello" aria-label={HELLO}>
        {[...HELLO].map((ch, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties}>
            {ch}
          </span>
        ))}
      </div>

      <div className="sthg__photo">
        <img src="/images/photo.png" alt="Арсений Кононов" draggable={false} />
      </div>

      <div className="sthg__name">
        {lines.map((l, i) => (
          <span key={i}>
            {l || " "}
            {step === 2 && caretLine === i && <i className="sth__caret" />}
          </span>
        ))}
      </div>

      <div className="sthg__note">
        <span>дизайнер широкого профиля</span>
        <svg width="190" height="70" viewBox="0 0 190 70" fill="none" aria-hidden>
          <path d="M6 52c40 10 90 6 132-26" stroke="#111" strokeWidth="4" strokeLinecap="round" />
          <path d="M120 20l20 4-6 19" stroke="#111" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="sthg__cta">
        <a data-ui className="st-btn" href={LINKS.telegram} target="_blank" rel="noopener noreferrer">
          {HERO.contactLabel}
        </a>
        <span className="sth__status">
          <i />
          {HERO.statusLabel}
        </span>
      </div>

      {STICKERS.map((s, i) => (
        <button
          key={i}
          type="button"
          data-ui
          className={`st-sticker st-sticker--${s.shape}`}
          style={
            {
              left: s.x,
              top: s.y,
              width: s.w,
              height: s.h,
              "--rot": `${s.rot}deg`,
              "--c": s.color,
              "--i": i,
            } as React.CSSProperties
          }
          onClick={(e) => {
            const el = e.currentTarget;
            el.classList.remove("is-wiggle");
            void el.offsetWidth;
            el.classList.add("is-wiggle");
            onSticker();
          }}
        >
          {s.shape === "burst" && (
            <svg className="st-sticker__burst" viewBox="0 0 100 100" aria-hidden>
              <polygon points={BURST_POINTS} />
            </svg>
          )}
          <b>
            <CountUp value={STATS[i].value} run={step >= 4} />
          </b>
          <span>{STATS[i].label}</span>
        </button>
      ))}
    </Frame>
  );
}

/* ---------- Обо мне: переписка ---------- */

const EDU_TEXT = `${EDUCATION.lines[0]} — ${EDUCATION.lines[1].toLowerCase()}, ${EDUCATION.years[0]}–${EDUCATION.years[1].replace(/^[–-]\s*/, "")}. Работаю в этих инструментах:`;

export const CHAT: { q: boolean; text: string; color?: string; tools?: boolean }[] = [
  { q: true, text: "Привет! Чем занимаешься?" },
  { q: false, text: HERO.paragraphs[0], color: "#FEFE78" },
  { q: true, text: "А как ты работаешь?" },
  { q: false, text: HERO.paragraphs[1], color: "#86DDFF" },
  { q: true, text: "Где учился и в чём работаешь?" },
  { q: false, text: EDU_TEXT, color: "#ACF9A2", tools: true },
];

function Chat({ step, selected }: { step: number; selected: boolean }) {
  const typing = step < CHAT.length && step > 0 && !CHAT[step].q;
  return (
    <Frame meta={frameById("chat")} selected={selected} className="st-card stchat">
      <div className="stchat__head">
        <span className="stchat__avatar">
          <img src="/images/photo.png" alt="" draggable={false} />
        </span>
        <div>
          <b>Арсений Кононов</b>
          <small>{typing ? "печатает…" : "в сети"}</small>
        </div>
      </div>
      <div className="stchat__body">
        {CHAT.slice(0, step).map((m, i) => (
          <div
            key={i}
            className={`stchat__msg ${m.q ? "is-q" : "is-a"}`}
            style={m.color ? ({ "--c": m.color } as React.CSSProperties) : undefined}
          >
            {m.text}
            {m.tools && (
              <div className="stchat__tools">
                {TOOLS.icons.map((t) => (
                  <span key={t.src} className={t.boxed ? "is-boxed" : ""} title={t.alt}>
                    <img src={t.src} alt={t.alt} draggable={false} />
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div className="stchat__msg is-a is-typing">
            <i />
            <i />
            <i />
          </div>
        )}
      </div>
    </Frame>
  );
}

function History({ selected }: { selected: boolean }) {
  return (
    <Frame meta={frameById("history")} selected={selected} className="st-card">
      <div className="stv">
        <div className="stv__head">
          <span>История версий</span>
          <small>опыт работы</small>
        </div>
        <ol>
          {WORK.map((w, i) => (
            <li key={w.company} style={{ "--c": w.tagColor } as React.CSSProperties}>
              <span className="stv__ver">
                v{WORK.length - i}.0 · {w.period.replace("\n", " ")}
                {i === 0 && <em>текущая</em>}
              </span>
              <div className="stv__company">{w.company}</div>
              <div className="stv__role">{w.role}</div>
              <p>{w.description}</p>
              <div className="st-tags">
                {w.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </li>
          ))}
          <li className="stv__next">
            <span className="stv__ver">v{WORK.length + 1}.0 · скоро</span>
            <div className="stv__company">Твой проект?</div>
            <a data-ui className="st-btn st-btn--small" href={LINKS.telegram} target="_blank" rel="noopener noreferrer">
              Обсудить в Telegram ↗
            </a>
          </li>
        </ol>
      </div>
    </Frame>
  );
}

/* ---------- Плагины ---------- */

function PluginCard({ index, selected }: { index: number; selected: boolean }) {
  const card = AUTOMATION.cards[index];
  const meta = frameById(`plugin-${index}`);
  return (
    <Frame meta={meta} selected={selected} className="st-card">
      <div className="stp" style={{ "--tc": card.tagColor } as React.CSSProperties}>
        <div className="stp__media">
          {card.video ? (
            <HoverVideo video={card.video} />
          ) : card.image ? (
            <img src={card.image} alt="" loading="lazy" draggable={false} />
          ) : (
            <div className="stp__art">{card.title}</div>
          )}
        </div>
        <span className="stp__tag">{card.tag}</span>
        <div className="stp__name">{card.title}</div>
        <p>{card.text}</p>
        {meta.link && (
          <a data-ui className="stp__link" href={meta.link.href} target="_blank" rel="noopener noreferrer">
            {meta.link.label} ↗
          </a>
        )}
      </div>
    </Frame>
  );
}

/* ---------- Соцсети: стопка, которая раскладывается ---------- */

function SocialPile({ spread, selected }: { spread: boolean; selected: boolean }) {
  const meta = frameById("social");
  const posts = SOCIAL_LAYOUT.posts;
  return (
    <Frame meta={meta} selected={selected} className={`st-social${spread ? " is-spread" : ""}`}>
      {posts.map(({ src, x, y, w, h }, i) => {
        const px = meta.w / 2 - w / 2 - x + (rand(i * 3 + 1) - 0.5) * 780;
        const py = meta.h / 2 - h / 2 - y + (rand(i * 3 + 2) - 0.5) * 520;
        const rot = (rand(i * 3 + 3) - 0.5) * 56;
        return (
          <div
            key={src}
            className="st-post"
            style={
              {
                left: x,
                top: y,
                width: w,
                height: h,
                zIndex: i,
                transitionDelay: `${(spread ? i : posts.length - i) * 14}ms`,
                "--px": `${px}px`,
                "--py": `${py}px`,
                "--rot": `${rot}deg`,
              } as React.CSSProperties
            }
          >
            <img src={src} alt="" loading="lazy" draggable={false} />
          </div>
        );
      })}
    </Frame>
  );
}

/* ---------- Обои: телефоны вращаются по часовой вокруг монитора ---------- */

const ORBIT_N = 10;
const ORBIT_SECONDS = 70;

function OrbitPhone({ images, delay, style, onPick }: { images: string[]; delay: number; style: React.CSSProperties; onPick: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;
    const t = setTimeout(() => {
      id = setInterval(() => setI((v) => (v + 1) % images.length), 3600);
    }, delay);
    return () => {
      clearTimeout(t);
      if (id) clearInterval(id);
    };
  }, [delay, images.length]);
  return (
    <button
      type="button"
      data-ui
      className="st-phone"
      style={style}
      onClick={() => {
        setI((v) => (v + 1) % images.length);
        onPick();
      }}
    >
      {images.map((src, k) => (
        <img key={src} src={src} alt="" loading="lazy" draggable={false} className={k === i ? "is-on" : ""} />
      ))}
    </button>
  );
}

function Monitor() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % wideWallpapers.length), 2600);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="st-monitor__screen">
      {wideWallpapers.map((src, k) => (
        <img key={src} src={src} alt="" loading="lazy" draggable={false} className={k === i ? "is-on" : ""} />
      ))}
    </div>
  );
}

function Orbit({ selected, onPhone }: { selected: boolean; onPhone: () => void }) {
  const meta = frameById("wall");
  const cx = meta.w / 2;
  const cy = meta.h / 2 + 20;
  const rx = 520;
  const ry = 480;
  // Эллипс от верхней точки; флаг sweep=1 — движение по часовой стрелке.
  const path = `path('M ${cx} ${cy - ry} A ${rx} ${ry} 0 1 1 ${cx} ${cy + ry} A ${rx} ${ry} 0 1 1 ${cx} ${cy - ry}')`;
  return (
    <Frame meta={meta} selected={selected} className="st-free st-orbit">
      {Array.from({ length: ORBIT_N }, (_, k) => (
        <OrbitPhone
          key={k}
          images={narrowWallpapers.filter((_, n) => n % ORBIT_N === k)}
          delay={k * 360}
          onPick={onPhone}
          style={{
            offsetPath: path,
            animationDelay: `${(-k * ORBIT_SECONDS) / ORBIT_N}s, ${-k * 0.5}s`,
            animationDuration: `${ORBIT_SECONDS}s, 5s`,
          }}
        />
      ))}
      <div className="st-monitor" style={{ left: cx - 332, top: cy - 230 }}>
        <Monitor />
        <div className="st-monitor__neck" />
        <div className="st-monitor__base" />
        <span className="st-orbit__caption">Каждый месяц — новые обои</span>
      </div>
    </Frame>
  );
}

/* ---------- Презентации: просмотрщик по порядку ---------- */

// SVG вместо символа «→»: у шрифтовой стрелки метрики смещают её от центра кнопки.
function ArrowIcon({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={dir === "next" ? "M4 12h15M13 6l6 6-6 6" : "M20 12H5M11 6l-6 6 6 6"}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Presenter({
  selected,
  deck,
  slide,
  dir,
  onDeck,
  onSlide,
}: {
  selected: boolean;
  deck: number;
  slide: number;
  dir: "next" | "prev";
  onDeck: (i: number) => void;
  onSlide: (delta: number) => void;
}) {
  const d = DECKS[deck];
  const n = d.slides.length;
  const start = Math.max(0, Math.min(slide - 4, n - 9));
  return (
    <Frame meta={frameById("deck")} selected={selected} className="st-presenter">
      <div className="stpr">
        <div className="stpr__top">
          <div className="stpr__tabs">
            {DECKS.map((x, i) => (
              <button key={x.name} type="button" data-ui className={i === deck ? "is-active" : ""} onClick={() => onDeck(i)}>
                {x.name}
                <small>{x.slides.length}</small>
              </button>
            ))}
          </div>
          <span className="stpr__count">
            {slide + 1} / {n}
          </span>
        </div>
        <div className="stpr__stage">
          <button type="button" data-ui className="stpr__arrow" onClick={() => onSlide(-1)} aria-label="Предыдущий слайд">
            <ArrowIcon dir="prev" />
          </button>
          <div className="stpr__screen">
            <img key={`${deck}-${slide}`} src={d.slides[slide]} alt="" draggable={false} className={`is-${dir}`} />
          </div>
          <button type="button" data-ui className="stpr__arrow" onClick={() => onSlide(1)} aria-label="Следующий слайд">
            <ArrowIcon dir="next" />
          </button>
        </div>
        <div className="stpr__strip">
          {d.slides.slice(start, start + 9).map((src, k) => (
            <button
              key={src}
              type="button"
              data-ui
              className={start + k === slide ? "is-active" : ""}
              onClick={() => onSlide(start + k - slide)}
            >
              <img src={src} alt="" loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
      </div>
    </Frame>
  );
}

function Presentations(p: {
  selected: string | null;
  deck: number;
  slide: number;
  dir: "next" | "prev";
  onDeck: (i: number) => void;
  onSlide: (delta: number) => void;
}) {
  return (
    <>
      {PRESENTATIONS.cards.map((card, i) => (
        <Frame key={i} meta={frameById(`pres-${i}`)} selected={p.selected === `pres-${i}`} className="st-card">
          <div className="stc">
            <div className="stc__media">
              <HoverVideo video={card.video!} />
            </div>
            <span className="stp__tag" style={{ background: card.tagColor }}>
              {card.tag}
            </span>
            <p>{card.text}</p>
          </div>
        </Frame>
      ))}
      <Presenter
        selected={p.selected === "deck"}
        deck={p.deck}
        slide={p.slide}
        dir={p.dir}
        onDeck={p.onDeck}
        onSlide={p.onSlide}
      />
    </>
  );
}

/* ---------- Проекты ---------- */

// [x, y, ширина, поворот] — коллаж из презентации айдентики поверх фирменной волны
const COFFEE_LAYOUT: [number, number, number, number][] = [
  [760, 60, 670, 2],
  [60, 300, 360, -4],
  [450, 320, 360, 3],
  [840, 480, 330, 4],
  [1150, 500, 300, -3],
  [60, 580, 360, 3],
  [450, 600, 360, -2],
  [840, 740, 330, -4],
  [1150, 760, 300, 3],
];

function Coffee({ selected }: { selected: boolean }) {
  return (
    <Frame meta={frameById("coffee")} selected={selected} className="st-coffee">
      <div className="stk__bg">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} style={{ marginLeft: (i % 2) * -260 }}>
            coffee is the new cult · coffee is the new cult · coffee is the new cult
          </span>
        ))}
      </div>
      <svg className="stk__wave" viewBox="0 0 1490 1000" preserveAspectRatio="none" aria-hidden>
        <path d="M-40 860C300 640 520 940 820 640S1300 280 1540 380" stroke="#111" strokeWidth="120" fill="none" />
        <path d="M-40 760C300 540 520 840 820 540S1300 180 1540 280" stroke="#fff" strokeWidth="46" fill="none" />
      </svg>
      <div className="stk__title">
        <span>Айдентика</span>
        <b>Кофе Культ</b>
        <p>стаканчики · упаковка · меню · абонементы</p>
      </div>
      {COFFEE_LAYOUT.map(([x, y, w, rot], i) => (
        <div
          key={i}
          className="stk__card"
          style={{ left: x, top: y, width: w, "--rot": `${rot}deg` } as React.CSSProperties}
        >
          <img src={PROJECTS.coffeeGrid[i]} alt="" loading="lazy" draggable={false} />
        </div>
      ))}
    </Frame>
  );
}

function Projects({ selected }: { selected: string | null }) {
  return (
    <>
      {SITE_FRAMES.map(({ src, meta }) => (
        <Frame key={meta.id} meta={meta} selected={selected === meta.id} className="st-win">
          <div className="st-win__bar">
            <i />
            <i />
            <i />
            <span>{meta.name}</span>
          </div>
          <div className="st-win__page">
            <img src={src} alt="" loading="lazy" draggable={false} />
          </div>
        </Frame>
      ))}
      <Frame meta={frameById("site-5")} selected={selected === "site-5"} className="st-win">
        <div className="st-win__bar">
          <i />
          <i />
          <i />
          <span>Вне рамок</span>
        </div>
        <div className="st-win__page">
          <img src={PROJECTS.sites.site1920} alt="" loading="lazy" draggable={false} />
        </div>
      </Frame>
      <Frame meta={frameById("site-6")} selected={selected === "site-6"} className="st-win st-win--phone">
        <div className="st-win__page">
          <img src={PROJECTS.sites.androidCompact} alt="" loading="lazy" draggable={false} />
        </div>
      </Frame>
      <Coffee selected={selected === "coffee"} />
      <Frame meta={frameById("merch")} selected={selected === "merch"} className="st-free st-prints">
        {PROJECTS.merch.map((src, i) => (
          <div
            key={src}
            className="st-print"
            style={
              {
                left: (i % 2) * 530 + 20,
                top: Math.floor(i / 2) * 450 + (i % 2) * 30 + 20,
                "--rot": `${[-4, 3, 2, -3][i]}deg`,
              } as React.CSSProperties
            }
          >
            <img src={src} alt="" loading="lazy" draggable={false} />
          </div>
        ))}
      </Frame>
    </>
  );
}

/* ---------- Контакты: финальная точка маршрута ---------- */

// Та самая крутящаяся фигура из 16 кадров.
export function SpinFigure({ className, ms = 75 }: { className?: string; ms?: number }) {
  const [f, setF] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setF((v) => (v + 1) % 16), ms);
    return () => clearInterval(id);
  }, [ms]);
  return (
    <img
      className={className}
      src={`/images/scroll/frame-${String(f + 1).padStart(2, "0")}.png`}
      alt=""
      draggable={false}
    />
  );
}

function Contact({ selected }: { selected: boolean }) {
  const isl = islandById("contact");
  return (
    <>
      <Frame meta={frameById("contact")} selected={selected} className="stx">
        <span className="stx__status">
          <i />
          {HERO.statusLabel}
        </span>
        <b className="stx__title">Есть задача?</b>
        <p>Напиши мне в Telegram — расскажи о проекте, обсудим сроки и формат работы.</p>
        <a data-ui className="st-btn stx__btn" href={LINKS.telegram} target="_blank" rel="noopener noreferrer">
          Написать в Telegram ↗
        </a>
      </Frame>
      <div className="st-deco stx__spin" style={{ left: isl.x + 100, top: isl.y + 860 }}>
        <SpinFigure ms={110} />
        <span>кручусь, пока ты решаешься</span>
      </div>
      <div className="st-deco stx__vertical" style={{ left: isl.x + isl.w / 2 - 70, top: isl.y + 1330 }}>
        напиши мне
      </div>
    </>
  );
}

/* ---------- Острова ---------- */

function Islands({ spread, onToggleSpread }: { spread: boolean; onToggleSpread: () => void }) {
  return (
    <>
      {ISLANDS.map((isl) => (
        <div
          key={isl.id}
          className={`st-island${isl.dark ? " is-dark" : ""}`}
          style={
            {
              left: isl.x,
              top: isl.y,
              width: isl.w,
              height: isl.h,
              "--c": isl.color,
            } as React.CSSProperties
          }
        >
          <div className="st-island__label">{isl.name}</div>
          <div
            className="st-island__title"
            style={{ fontSize: Math.min(380, (isl.w * 0.86) / (isl.name.length * 0.8)) }}
          >
            {isl.name}
          </div>
          {isl.id === "social" && (
            <div className="st-island__action">
              <button type="button" data-ui onClick={onToggleSpread}>
                {spread ? "Собрать в стопку" : "Разложить посты"}
              </button>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

type WorldProps = {
  introStep: number;
  typed: number;
  chatStep: number;
  selected: string | null;
  spread: boolean;
  onToggleSpread: () => void;
  onSticker: () => void;
  onPhone: () => void;
  deck: number;
  slide: number;
  slideDir: "next" | "prev";
  onDeck: (i: number) => void;
  onSlide: (delta: number) => void;
};

export const World = memo(function World(p: WorldProps) {
  return (
    <>
      <Islands spread={p.spread} onToggleSpread={p.onToggleSpread} />
      <Greeting step={p.introStep} typed={p.typed} selected={p.selected === "hero"} onSticker={p.onSticker} />
      <Chat step={p.chatStep} selected={p.selected === "chat"} />
      <History selected={p.selected === "history"} />
      {AUTOMATION.cards.map((_, i) => (
        <PluginCard key={i} index={i} selected={p.selected === `plugin-${i}`} />
      ))}
      {Array.from({ length: PLUGIN_SLOTS - AUTOMATION.cards.length }, (_, k) => {
        const s = pluginSlot(AUTOMATION.cards.length + k);
        return (
          <div key={k} className="st-slot" style={{ left: s.x, top: s.y, width: s.w, height: s.h }}>
            <span>+</span>
            Скоро тут будет
            <br />
            новый плагин
          </div>
        );
      })}
      <SocialPile spread={p.spread} selected={p.selected === "social"} />
      <Orbit selected={p.selected === "wall"} onPhone={p.onPhone} />
      <Presentations
        selected={p.selected}
        deck={p.deck}
        slide={p.slide}
        dir={p.slideDir}
        onDeck={p.onDeck}
        onSlide={p.onSlide}
      />
      <Projects selected={p.selected} />
      <Contact selected={p.selected === "contact"} />
    </>
  );
});
