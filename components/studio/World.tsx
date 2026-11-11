"use client";

import { memo, useEffect, useRef, useState } from "react";
import { ForumBoard } from "./ForumBoard";
import { earnAch } from "./earn";
import { EDUCATION, HERO, LINKS, PROJECTS, STATS, TOOLS, WORK } from "@/lib/content";
import {
  CARS,
  ISLANDS,
  LAB_CARDS,
  LAB_MOTION,
  SITE_FRAMES,
  frameById,
  islandById,
  poster,
  type CarSpec,
  type FrameMeta,
} from "./data";
import { Frame } from "./Frame";
import { SocialSphere } from "./SocialSphere";
import { WallField } from "./WallField";
import { AboutCalmBody } from "./AboutCalm";
import { CaseHR } from "./CaseHR";
import { CaseTour } from "./CaseTour";

/* eslint-disable @next/next/no-img-element */

export const NAME_LINES = ["я Арсений", "Кононов"];
export const NAME_CHARS = NAME_LINES.join("").length;
export const HELLO = "Привет!";

// Округление обязательно: на сервере и в браузере Math.sin даёт разные хвосты после запятой.
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return Math.round((x - Math.floor(x)) * 1000) / 1000;
};

export function CountUp({ value, run }: { value: string; run: boolean }) {
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

// Видео играет само, пока оно в кадре: за пределами экрана ставится на паузу, чтобы не грузить холст.
function AutoVideo({ video }: { video: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) el.play().catch(() => {});
      else el.pause();
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className="st-hv">
      <video ref={ref} src={video} poster={poster(video)} muted loop playsInline preload="none" />
    </div>
  );
}

/* ---------- Обо мне: приветствие-коллаж ---------- */

type StickerShape = "circle" | "burst" | "pill" | "square";

export const STICKERS: { shape: StickerShape; x: number; y: number; w: number; h: number; rot: number; color: string }[] = [
  { shape: "circle", x: 1110, y: 140, w: 180, h: 180, rot: 10, color: "#FEFE78" },
  { shape: "burst", x: 1090, y: 390, w: 210, h: 210, rot: -8, color: "#FFB6E1" },
  { shape: "pill", x: 560, y: 690, w: 250, h: 96, rot: -4, color: "#86DDFF" },
  { shape: "square", x: 840, y: 636, w: 170, h: 150, rot: 7, color: "#ACF9A2" },
  { shape: "burst", x: 0, y: 628, w: 200, h: 200, rot: -6, color: "#C791FF" },
  { shape: "pill", x: 220, y: 690, w: 270, h: 96, rot: 5, color: "#FFC7B6" },
];

export const BURST_POINTS = Array.from({ length: 28 }, (_, i) => {
  const a = (i / 28) * Math.PI * 2;
  const r = i % 2 ? 41 : 49;
  return `${(50 + Math.cos(a) * r).toFixed(2)},${(50 + Math.sin(a) * r).toFixed(2)}`;
}).join(" ");

// две главные цифры выделены цветом — остальные не спорят с ними
const STAT_ACCENT: Record<string, string> = { "лет в дизайне": "#fefe78", проектов: "#c9a8ff" };

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

      {/* фото стоит на цветной карточке: голова выходит за её верх, низ обрезан по краю */}
      <div className="sthg__stage">
        <div className="sthg__card" />
        <div className="sthg__photo">
          <img src="/images/photo.png" alt="Арсений Кононов" draggable={false} />
        </div>
        {/* круглый значок с бегущим по кругу текстом */}
        <div className="sthg__badge" aria-hidden>
          <svg viewBox="0 0 200 200">
            <defs>
              <path id="sthg-ring" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1 -148 0" />
            </defs>
            <text>
              <textPath href="#sthg-ring">открыт для сотрудничества • пиши в telegram •</textPath>
            </text>
          </svg>
          <i>↗</i>
        </div>
        <span className="sthg__place">
          <i />
          Тула · работаю удалённо
        </span>
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
        <span className="is-a">продуктовый</span>
        <em>и</em>
        <span className="is-b">коммуникационный</span>
        <b>дизайнер</b>
      </div>

      <div className="sthg__cta">
        <a data-ui className="st-btn" href={LINKS.telegram} target="_blank" rel="noopener noreferrer">
          {HERO.contactLabel} ↗
        </a>
        <span className="sth__status">
          <i />
          {HERO.statusLabel}
        </span>
      </div>

      {/* цифры — ровный ряд карточек; цветом выделены только две главные, остальные белые */}
      <div className="sthg__stats">
        {STATS.map((s, i) => (
          <button
            key={s.label}
            type="button"
            data-ui
            className={`st-stat${STAT_ACCENT[s.label] ? " is-accent" : ""}`}
            style={{ "--c": STAT_ACCENT[s.label] ?? "#fff", "--i": i } as React.CSSProperties}
            onClick={(e) => {
              const el = e.currentTarget;
              el.classList.remove("is-wiggle");
              void el.offsetWidth;
              el.classList.add("is-wiggle");
              onSticker();
            }}
          >
            <b>
              <CountUp value={s.value} run={step >= 4} />
            </b>
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </Frame>
  );
}

/* ---------- Обо мне: переписка ---------- */

type ChatMsg =
  | { q: true; text: string; time: string }
  | { q: false; kind: "intro" | "how" | "edu"; color: string; time: string; react?: string };

export const CHAT: ChatMsg[] = [
  { q: true, text: "Привет! Чем занимаешься?", time: "12:01" },
  { q: false, kind: "intro", color: "#FEFE78", time: "12:01", react: "🔥 3" },
  { q: true, text: "А как ты работаешь?", time: "12:02" },
  { q: false, kind: "how", color: "#1E1E1E", time: "12:02", react: "👍 5" },
  { q: true, text: "Где учился и в чём работаешь?", time: "12:03" },
  { q: false, kind: "edu", color: "#ACF9A2", time: "12:03", react: "😍 2" },
];

const AREAS: [string, string][] = [
  ["Презентации", "#C791FF"],
  ["Соцсети", "#ACF9A2"],
  ["Брендинг мероприятий", "#FFC7B6"],
  ["Реклама", "#FFFFFF"],
  ["Айдентика", "#86DDFF"],
];

const HOW: { icon: string; title: string; hint: string; color: string }[] = [
  { icon: "❓", title: "Задаю вопросы", hint: "чтобы понять задачу, а не угадывать её", color: "#FEFE78" },
  { icon: "💡", title: "Предлагаю идеи", hint: "приношу варианты, а не один «как просили»", color: "#FFB6E1" },
  { icon: "⏱️", title: "Слежу за деталями и сроками", hint: "сдаю вовремя и без мелких огрехов", color: "#ACF9A2" },
];

const EDU_YEARS = `${EDUCATION.years[0]}–${EDUCATION.years[1].replace(/^[–-]\s*/, "")}`;

function Answer({ kind }: { kind: "intro" | "how" | "edu" }) {
  if (kind === "intro") {
    return (
      <>
        <p>
          Проектирую <b>цифровые продукты</b> от идеи до интерфейса: веб-платформы, мобильные приложения, B2B-системы.
          Запустил <b>собственный стартап</b> и выиграл на него грант.
        </p>
        <p>
          Вторая сильная сторона — <b>коммуникационный дизайн</b>:
        </p>
        <div className="stchat__chips">
          {AREAS.map(([t, c], i) => (
            <span
              key={t}
              style={{ background: c, "--rot": `${i % 2 ? 2 : -2}deg`, "--i": i } as React.CSSProperties}
            >
              {t}
            </span>
          ))}
        </div>
      </>
    );
  }
  if (kind === "how") {
    return (
      <>
        <p>
          Мне важно не просто выполнить задачу, а <b>разобраться в её смысле</b>:
        </p>
        <div className="stchat__how">
          {HOW.map((s, i) => (
            <div key={s.title} className="stchat__step" style={{ "--c": s.color, "--i": i } as React.CSSProperties}>
              <em>0{i + 1}</em>
              <span className="stchat__icon">{s.icon}</span>
              <b>{s.title}</b>
              <small>{s.hint}</small>
            </div>
          ))}
        </div>
        <p className="stchat__small">
          Опыт <b>собственного стартапа</b> и <b>грантовых конкурсов</b> помогает смотреть на дизайн шире — как на
          часть продукта, коммуникации и пользовательского опыта.
        </p>
      </>
    );
  }
  return (
    <div className="stchat__edu">
      <div className="stchat__diploma">
        <span className="stchat__cap">🎓</span>
        <div>
          <b>Бакалавр</b>
          <span>{EDUCATION.lines[0].replace(/^Бакалавр,\s*/, "")}</span>
          <small>{EDUCATION.lines[1]}</small>
        </div>
        <em>{EDU_YEARS}</em>
      </div>
      <p className="stchat__small">
        Не останавливаюсь на макете: с помощью <b>вайб-кодинга</b> довожу идеи до работающих плагинов, сервисов и сайтов.
        Этот сайт — один из них.
      </p>
      <div className="stchat__tools">
        {TOOLS.icons.map((t, i) => (
          <span key={t.src} className="stchat__tool" style={{ "--i": i } as React.CSSProperties}>
            <i className={t.boxed ? "is-boxed" : ""}>
              <img src={t.src} alt="" draggable={false} />
            </i>
            {t.alt}
          </span>
        ))}
      </div>
    </div>
  );
}

function Chat({ step, selected }: { step: number; selected: boolean }) {
  return (
    <Frame meta={frameById("chat")} selected={selected} className="st-card stchat">
      <ChatContent step={step} />
    </Frame>
  );
}

// Содержимое переписки — общее для холста и мобильной ленты.
export function ChatContent({ step }: { step: number }) {
  const typing = step < CHAT.length && step > 0 && !CHAT[step].q;
  // реакции можно «докинуть» кликом — счётчик растёт, эмодзи подпрыгивает
  const [bumps, setBumps] = useState<Record<number, number>>({});
  return (
    <>
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
          <div key={i} className={`stchat__row ${m.q ? "is-q" : "is-a"}`}>
            <div
              className={`stchat__msg ${m.q ? "is-q" : `is-a is-${m.kind}`}`}
              style={m.q ? undefined : ({ "--c": m.color } as React.CSSProperties)}
            >
              {m.q ? m.text : <Answer kind={m.kind} />}
              <span className="stchat__meta">
                {m.time}
                {m.q && " ✓✓"}
              </span>
            </div>
            {!m.q && m.react && (
              <button
                type="button"
                data-ui
                className={`stchat__react${bumps[i] ? " is-mine" : ""}`}
                onClick={() => {
                  setBumps((b) => ({ ...b, [i]: (b[i] ?? 0) + 1 }));
                  earnAch("react");
                }}
                aria-label="Поставить реакцию"
              >
                <span key={bumps[i] ?? 0} className="stchat__emoji">
                  {m.react.split(" ")[0]}
                </span>
                {Number(m.react.split(" ")[1]) + (bumps[i] ?? 0)}
              </button>
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
    </>
  );
}

function History({ selected }: { selected: boolean }) {
  return (
    <Frame meta={frameById("history")} selected={selected} className="st-card">
      <HistoryContent />
    </Frame>
  );
}

// короткие описания для холста: полный текст остаётся на основном сайте
const WORK_SHORT = [
  "Оформляю материалы для федеральных и региональных мероприятий: брендинг, презентации для отчётных сессий и выступлений, реклама, полиграфия и посты для соцсетей.",
  "Проектировал веб-интерфейсы промышленных и корпоративных систем: сценарии, прототипы и визуальную часть — в связке с аналитиками и разработчиками.",
  "Айдентика, презентации, сайты и приложения для частных клиентов, малого бизнеса и стартапов. Сооснователь и дизайнер туристического стартапа, участник грантовых конкурсов.",
];

// История версий — общая для холста и мобильной ленты.
export function HistoryContent() {
  return (
    <div className="stv">
        <div className="stv__head">
          <span>История версий</span>
          <small>опыт работы</small>
        </div>
        <ol>
          {WORK.map((w, i) => (
            <li key={w.company} className={i === 0 ? "is-current" : ""} style={{ "--c": w.tagColor } as React.CSSProperties}>
              <span className="stv__ver">
                v{WORK.length - i}.0 · {w.period.replace("\n", " ")}
                {i === 0 && <em>текущая</em>}
              </span>
              <div className="stv__company">{w.company}</div>
              <div className="stv__role">{w.role}</div>
              <p>{WORK_SHORT[i] ?? w.description}</p>
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
            <a data-ui className="stv__cta" href={LINKS.telegram} target="_blank" rel="noopener noreferrer">
              <span className="stv__plane" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                  <path d="M21.6 3.2 2.9 10.4c-1.3.5-1.3 1.2-.2 1.6l4.8 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.8-1.3-1.5zM8.6 13.2l9.8-6.2c.5-.3.9-.1.5.2l-8.1 7.3-.3 3.4-1.9-4.7z" />
                </svg>
              </span>
              Обсудить проект в Telegram
              <span className="stv__arrow">↗</span>
            </a>
          </li>
        </ol>
    </div>
  );
}

/* ---------- Плагины ---------- */

function PluginCard({ index, selected }: { index: number; selected: boolean }) {
  const card = LAB_CARDS[index];
  const meta = frameById(`plugin-${index}`);
  return (
    <Frame meta={meta} selected={selected} className="st-card">
      <div className="stp stp--small" style={{ "--tc": card.tagColor } as React.CSSProperties}>
        <div className="stp__media">
          {card.video ? (
            <AutoVideo video={card.video} />
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

/* ---------- Лаборатория: идеи, вайб-код и гараж ---------- */

function LabIntro({ selected }: { selected: boolean }) {
  return (
    <Frame meta={frameById("lab-intro")} selected={selected} className="stl">
      <span className="stl__kicker">не только дизайн</span>
      <b className="stl__title">Придумываю и собираю сам</b>
      <p>
        Генерирую идеи и довожу их до работающего продукта с помощью вайб-кодинга: Figma-плагины, небольшие
        сервисы и сайты.
      </p>
      <div className="stl__flow">
        <span>Идея</span>→<span>Прототип</span>→<span>Продукт</span>
      </div>
      <p className="stl__note">Этот сайт и гараж с машинками — тоже мой вайб-код ↓</p>
    </Frame>
  );
}

// 3D-ролик для YouTube: пока он в работе, на месте видео — заглушка с вращающимся каркасом куба.
function LabMotion({ selected }: { selected: boolean }) {
  return (
    <Frame meta={frameById("lab-motion")} selected={selected} className="st-card stm">
      <div className="stm__screen">
        {LAB_MOTION.video ? (
          <AutoVideo video={LAB_MOTION.video} />
        ) : (
          <div className="stm__stub">
            <div className="stm__cube" aria-hidden>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <i key={i} />
              ))}
            </div>
            <span className="stm__soon">
              <i />
              Ролик в работе
            </span>
            <div className="stm__bar" aria-hidden>
              <b>▶</b>
              <span />
              <em>1920 × 1080</em>
            </div>
          </div>
        )}
      </div>
      <div className="stm__info">
        <span className="stm__tag">3D · моушен</span>
        <b className="stm__name">Анимация для YouTube-канала</b>
        <p>3D-анимация для превью видео: объёмная сцена, свет и движение камеры.</p>
        <p className="stm__note">{LAB_MOTION.video ? "Играет сама, пока блок в кадре." : "Сейчас доделываю — скоро появится здесь."}</p>
      </div>
    </Frame>
  );
}

// Машинки нарисованы сверху, носом вверх.
export function CarSvg({ car }: { car: CarSpec }) {
  const wheels = (w: number, h: number, ys: number[]) =>
    ys.flatMap((y) => [
      <rect key={`l${y}`} x={0} y={y} width={12} height={24} rx={4} fill="#111" />,
      <rect key={`r${y}`} x={w - 12} y={y} width={12} height={24} rx={4} fill="#111" />,
    ]);
  if (car.id === "pickup") {
    return (
      <svg viewBox="0 0 78 132" width={car.w} height={car.h} aria-hidden>
        {wheels(78, 132, [18, 96])}
        <rect x="7" y="4" width="64" height="124" rx="12" fill={car.color} stroke="#111" strokeWidth="3" />
        <rect x="15" y="26" width="48" height="16" rx="5" fill="#2a2a2a" />
        <rect x="15" y="44" width="48" height="16" rx="4" fill="#fff" stroke="#111" strokeWidth="2" />
        <rect x="14" y="68" width="50" height="52" rx="5" fill="none" stroke="#111" strokeWidth="2.5" />
        <path d="M14 82h50M14 94h50M14 106h50" stroke="#111" strokeWidth="2" />
        <circle cx="18" cy="11" r="4" fill="#fff" stroke="#111" strokeWidth="1.5" />
        <circle cx="60" cy="11" r="4" fill="#fff" stroke="#111" strokeWidth="1.5" />
      </svg>
    );
  }
  if (car.id === "bug") {
    return (
      <svg viewBox="0 0 72 100" width={car.w} height={car.h} aria-hidden>
        {wheels(72, 100, [14, 64])}
        <ellipse cx="36" cy="50" rx="30" ry="47" fill={car.color} stroke="#111" strokeWidth="3" />
        <ellipse cx="36" cy="34" rx="20" ry="9" fill="#2a2a2a" />
        <ellipse cx="36" cy="74" rx="15" ry="6" fill="#2a2a2a" />
        <circle cx="22" cy="54" r="4" fill="#fff" />
        <circle cx="50" cy="56" r="5" fill="#fff" />
        <circle cx="36" cy="58" r="3" fill="#fff" />
        <circle cx="26" cy="10" r="4" fill="#fff" stroke="#111" strokeWidth="1.5" />
        <circle cx="46" cy="10" r="4" fill="#fff" stroke="#111" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 70 124" width={car.w} height={car.h} aria-hidden>
      {wheels(70, 124, [18, 88])}
      <path
        d="M14 10Q35 0 56 10L62 42V112Q62 121 53 121H17Q8 121 8 112V42Z"
        fill={car.color}
        stroke="#111"
        strokeWidth="3"
      />
      <rect x="28" y="4" width="5" height="116" fill="#111" opacity="0.85" />
      <rect x="37" y="4" width="5" height="116" fill="#111" opacity="0.85" />
      <path d="M16 46Q35 38 54 46L52 62H18Z" fill="#2a2a2a" />
      <rect x="19" y="94" width="32" height="10" rx="3" fill="#2a2a2a" />
      <circle cx="18" cy="14" r="4" fill="#fff" stroke="#111" strokeWidth="1.5" />
      <circle cx="52" cy="14" r="4" fill="#fff" stroke="#111" strokeWidth="1.5" />
    </svg>
  );
}

function Garage({
  selected,
  carId,
  driving,
  onPick,
  onDrive,
}: {
  selected: boolean;
  carId: number;
  driving: boolean;
  onPick: (i: number) => void;
  onDrive: () => void;
}) {
  return (
    <Frame meta={frameById("garage")} selected={selected} className="stg">
      <div className="stg__info">
        <span className="stl__kicker">мини-игра</span>
        <b className="stl__title">Гараж</b>
        <p>Выбери машинку — и вокруг блоков вырастет город. Три удара — и блок рассыплется, но его можно собрать.</p>
        <div className="stg__keys">
          <span className="stg__wasd">
            <kbd>W</kbd>
            <kbd>A</kbd>
            <kbd>S</kbd>
            <kbd>D</kbd>
          </span>
          руль и газ
          <kbd className="is-wide">Esc</kbd>
          выйти
        </div>
        <button type="button" data-ui className="st-btn stg__go" onClick={onDrive}>
          {driving ? "Выйти из машины" : "Поехали!"}
        </button>
      </div>
      <div className="stg__lot">
        {CARS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            data-ui
            className={`stg__spot${i === carId ? " is-picked" : ""}`}
            style={{ "--c": c.color } as React.CSSProperties}
            onClick={() => onPick(i)}
          >
            <span className="stg__car">{!(driving && i === carId) && <CarSvg car={c} />}</span>
            <span className="stg__name">{c.name}</span>
          </button>
        ))}
      </div>
    </Frame>
  );
}

/* ---------- Проекты ---------- */

// [x, y, ширина, поворот] — коллаж из презентации айдентики поверх фирменной волны
const COFFEE_LAYOUT: [number, number, number, number][] = [
  [760, 60, 670, 2],
  [60, 345, 360, -4],
  [450, 360, 360, 3],
  [840, 480, 330, 4],
  [1150, 500, 300, -3],
  [60, 625, 360, 3],
  [450, 640, 360, -2],
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
      {/* честная пометка: это личный концепт, а не заказ бренда */}
      <div className="stk__note">
        <i aria-hidden>!</i>
        <p>
          <b>Некоммерческий концепт.</b> Делал для себя — в работу не пошёл. Логотип принадлежит сети «Кофе
          Культ» и показан только для демонстрации идеи.
        </p>
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
      <ForumBoard selected={selected === "forum"} />
      <Frame meta={frameById("merch")} selected={selected === "merch"} className="st-free st-prints">
        {PROJECTS.merch.map((src, i) => (
          <div
            key={src}
            className="st-print"
            style={
              {
                left: i * 372 + 10,
                top: (i % 2) * 16 + 8,
                width: 350,
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

/*
 * Лента текста, которая крутится вокруг фигуры в 3D: буквы стоят по окружности и вращаются вокруг вертикальной оси.
 * Чтобы текст проходил и перед фигурой, и за ней, кольцо рисуется дважды: «переднее» показывает только буквы,
 * обращённые к зрителю, «заднее» лежит под фигурой и показывает дальнюю половину — зеркально, как на просвет.
 */
function TextRing({ text, radius, back, className = "" }: { text: string; radius: number; back?: boolean; className?: string }) {
  const chars = [...text];
  const step = 360 / chars.length;
  // размер буквы подбирается так, чтобы текст ровно замкнул окружность
  // Unbounded широкий: буква занимает около 70% своего шага, остальное — воздух между буквами
  const size = Math.round(((2 * Math.PI * radius) / chars.length) * 0.94);
  return (
    <div className={`stx-ring${back ? " is-back" : ""} ${className}`} style={{ fontSize: size }} aria-hidden>
      {chars.map((ch, i) => (
        <span key={i} style={{ transform: `rotateY(${(i * step).toFixed(2)}deg) translateZ(${radius}px)` }}>
          <b>{ch}</b>
        </span>
      ))}
    </div>
  );
}

const RING_MAIN = "НАПИШИ МНЕ • ОБСУДИМ ЗАДАЧУ • ";
const RING_SUB = `TELEGRAM • @${LINKS.telegram.split("/").pop()!.toUpperCase()} • ОТКРЫТ ДЛЯ СОТРУДНИЧЕСТВА • `;

function Contact({ selected }: { selected: boolean }) {
  const isl = islandById("contact");
  const card = frameById("contact");
  // сцена занимает всё место справа от карточки
  const left = card.x + card.w + 200;
  const stage = { x: left, y: isl.y, w: isl.x + isl.w - left - 200, h: isl.h };
  const rings = (back: boolean) => (
    <div className={`stx-rings${back ? " is-back" : ""}`}>
      <TextRing text={RING_MAIN} radius={1080} back={back} className="is-main" />
      <TextRing text={RING_SUB} radius={900} back={back} className="is-sub" />
    </div>
  );
  return (
    <>
      <Frame meta={card} selected={selected} className="stx">
        <span className="stx__status">
          <i />
          {HERO.statusLabel}
        </span>
        <b className="stx__title">Есть задача?</b>
        <p>Напиши мне в Telegram — расскажи о проекте, обсудим сроки и формат работы.</p>
        <span className="stx__handle">
          <small>Telegram</small>@{LINKS.telegram.split("/").pop()}
        </span>
        <a data-ui className="st-btn stx__btn" href={LINKS.telegram} target="_blank" rel="noopener noreferrer">
          Написать в Telegram ↗
        </a>
      </Frame>
      <div className="st-deco stx-stage" style={{ left: stage.x, top: stage.y, width: stage.w, height: stage.h }}>
        {rings(true)}
        <SpinFigure className="stx-stage__me" ms={150} />
        {rings(false)}
      </div>
    </>
  );
}

/* ---------- Острова ---------- */

function Islands() {
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
  /** слайд презентации HR-кейса: листается и в кейсе, и стрелками клавиатуры */
  slide: number;
  onSlide: (delta: number) => void;
  carId: number;
  driving: boolean;
  onPickCar: (i: number) => void;
  onDrive: () => void;
  /** камера сейчас на острове кейсов, где стоит презентация (и мы не за рулём) */
  presView: boolean;
  /** спокойная версия: вместо приветствия, чата и истории — блок-визитка */
  calm?: boolean;
};

export const World = memo(function World(p: WorldProps) {
  return (
    <>
      <Islands />
      {p.calm ? (
        <Frame meta={frameById("about-calm")} selected={p.selected === "about-calm"} className="st-free ab ab--embed" noSelect>
          <AboutCalmBody on={p.introStep >= 6} />
        </Frame>
      ) : (
        <>
          <Greeting step={p.introStep} typed={p.typed} selected={p.selected === "hero"} onSticker={p.onSticker} />
          <Chat step={p.chatStep} selected={p.selected === "chat"} />
          <History selected={p.selected === "history"} />
            </>
      )}
      <LabIntro selected={p.selected === "lab-intro"} />
      <LabMotion selected={p.selected === "lab-motion"} />
      {LAB_CARDS.map((_, i) => (
        <PluginCard key={i} index={i} selected={p.selected === `plugin-${i}`} />
      ))}
      <Garage
        selected={p.selected === "garage"}
        carId={p.carId}
        driving={p.driving}
        onPick={p.onPickCar}
        onDrive={p.onDrive}
      />
      <SocialSphere selected={p.selected === "social"} onSpin={p.onToggleSpread} />
      <WallField selected={p.selected === "wall"} onPick={p.onPhone} />
      <CaseHR selected={p.selected} active={p.presView} slide={p.slide} onSlide={p.onSlide} />
      <CaseTour selected={p.selected} />
      <Projects selected={p.selected} />
      <Contact selected={p.selected === "contact"} />
    </>
  );
});
