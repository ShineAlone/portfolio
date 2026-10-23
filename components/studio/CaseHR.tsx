"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LINKS } from "@/lib/content";
import { frameById } from "./data";
import { Frame } from "./Frame";
import {
  HR_ADMIN,
  HR_BOARDS,
  HR_EMPLOYEE,
  HR_FLIPS,
  HR_PALETTE,
  HR_TASKS,
  HR_XP_LEVEL,
  HR_XP_START,
  SKIN_COLORS,
  hrImg,
  hrUi,
  skinSrc,
  skinThumb,
  type HrBoardId,
  type ShowScreen,
} from "./cases";

/* eslint-disable @next/next/no-img-element */

/*
 * Кейс «HR-платформа с сезонами» — проект в духе Behance: одна длинная лента бордов.
 * Обложка с параллаксом, «боль ↔ решение» на переворачивающихся карточках, большой мокап
 * с летающими кусочками интерфейса, мини-симулятор сезона, экраны двух кабинетов
 * с пояснениями-хотспотами, конструктор аватара, лента наград, дизайн-система и финал
 * с презентацией. По ленте бегают и выглядывают персонажи продукта.
 */

const H = Object.fromEntries(HR_BOARDS.map((b) => [b.id, b.h])) as Record<HrBoardId, number>;

// Параллакс за курсором: борд получает --mx/--my от −1 до 1, слои двигаются на свою глубину.
function useParallax() {
  const ref = useRef<HTMLElement>(null);
  const raf = useRef(0);
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const my = ((e.clientY - r.top) / r.height) * 2 - 1;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty("--mx", mx.toFixed(3));
      el.style.setProperty("--my", my.toFixed(3));
    });
  }, []);
  const onPointerLeave = useCallback(() => {
    ref.current?.style.setProperty("--mx", "0");
    ref.current?.style.setProperty("--my", "0");
  }, []);
  return { ref, onPointerMove, onPointerLeave };
}

function Label({ n, children, light }: { n: string; children: React.ReactNode; light?: boolean }) {
  return (
    <span className={`hb-label${light ? " is-light" : ""}`}>
      <em>{n}</em>
      {children}
    </span>
  );
}

/* ---------- 01. обложка ---------- */

function Hero() {
  const p = useParallax();
  return (
    <section
      ref={p.ref as React.RefObject<HTMLElement>}
      className="hb hb-hero"
      style={{ height: H.hero }}
      onPointerMove={p.onPointerMove}
      onPointerLeave={p.onPointerLeave}
    >
      <div className="hb-hero__planets" aria-hidden>
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="hb-hero__word" aria-hidden>
        СЕЗОН 1
      </div>
      <img className="hb-hero__astro" src={hrImg("astronaut")} alt="" draggable={false} />
      <div className="hb-hero__chips">
        <span>Кейс</span>
        <span>HR Tech</span>
        <span>Геймификация</span>
        <span>Хакатон</span>
      </div>
      <div className="hb-hero__text">
        <h2>Адаптация, в&nbsp;которую хочется играть</h2>
        <p>
          Платформа превращает первые месяцы в компании в игровой сезон: миссии, уровни и награды для
          новичка — и кабинет, где HR собирает всё это сам, без разработчиков.
        </p>
      </div>
      <dl className="hb-hero__meta">
        <div>
          <dt>Роль</dt>
          <dd>Дизайн продукта: сценарии, интерфейсы, персонажи</dd>
        </div>
        <div>
          <dt>Задача</dt>
          <dd>Привлечение и адаптация сотрудников</dd>
        </div>
        <div>
          <dt>Формат</dt>
          <dd>Хакатон · веб-платформа · 2 кабинета</dd>
        </div>
      </dl>
    </section>
  );
}

/* ---------- 02. о проекте: боль ↔ решение ---------- */

function About() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="hb hb-about" style={{ height: H.about }}>
      <div className="hb-about__intro">
        <Label n="01">О проекте</Label>
        <p className="hb-statement">
          Первые недели решают, останется ли человек в&nbsp;компании. Мы&nbsp;сделали их похожими на&nbsp;любимую
          игру — с&nbsp;понятной целью на&nbsp;каждый день.
        </p>
        <span className="hb-hint">Наведи на карточку — увидишь решение</span>
      </div>
      <div className="hb-flips">
        {HR_FLIPS.map((f, i) => (
          <button
            key={i}
            type="button"
            data-ui
            className={`hb-flip${open === i ? " is-open" : ""}`}
            style={{ "--c": f.color, "--i": i } as React.CSSProperties}
            onClick={() => setOpen((o) => (o === i ? null : i))}
          >
            <span className="hb-flip__inner">
              <span className="hb-flip__face is-front">
                <em>Проблема 0{i + 1}</em>
                <span className="hb-flip__icon">{f.icon}</span>
                <b>{f.pain}</b>
              </span>
              <span className="hb-flip__face is-back">
                <em>Решение 0{i + 1}</em>
                <b>{f.fix}</b>
                <span className="hb-flip__check">✓</span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------- 03. большой мокап с летающими кусочками интерфейса ---------- */

const FLOATERS: { src: string; cls: string; depth: number }[] = [
  { src: hrUi("level-card"), cls: "is-level", depth: 40 },
  { src: hrUi("tracks"), cls: "is-tracks", depth: 26 },
  { src: hrUi("boot"), cls: "is-boot", depth: 60 },
  { src: hrUi("skin-speed"), cls: "is-skin", depth: 70 },
  { src: hrUi("rating-col"), cls: "is-rating", depth: 34 },
];

function Mockup() {
  const p = useParallax();
  return (
    <section
      ref={p.ref as React.RefObject<HTMLElement>}
      className="hb hb-mockup"
      style={{ height: H.mockup }}
      onPointerMove={p.onPointerMove}
      onPointerLeave={p.onPointerLeave}
    >
      <div className="hb-mockup__head">
        <Label n="02" light>
          Главная сезона
        </Label>
        <p>Всё, что нужно новичку, — на одном экране: сезон, треки, спецзадание, магазин, рейтинг и профиль.</p>
      </div>
      <div className="hb-mockup__scene">
        <div className="hb-mockup__window">
          <div className="hb-bar">
            <i />
            <i />
            <i />
            <span>app.technopolis.ru/season</span>
          </div>
          <img src={hrImg("emp-main@2x")} alt="Главная сезона" loading="lazy" draggable={false} />
        </div>
      </div>
      {FLOATERS.map((f) => (
        <div key={f.cls} className={`hb-float ${f.cls}`} style={{ "--d": f.depth } as React.CSSProperties}>
          <img src={f.src} alt="" loading="lazy" draggable={false} />
        </div>
      ))}
    </section>
  );
}

/* ---------- 04. попробуй сезон: миссии → опыт → уровень → награда ---------- */

function Play() {
  const [done, setDone] = useState<number[]>([]);
  const [pops, setPops] = useState<{ id: number; xp: number; i: number }[]>([]);
  const xp = HR_XP_START + done.reduce((s, i) => s + HR_TASKS[i].xp, 0);
  const levelUp = xp >= HR_XP_LEVEL;
  const pct = Math.min(1, xp / HR_XP_LEVEL);
  const complete = (i: number) => {
    if (done.includes(i) || levelUp) return;
    setDone((d) => [...d, i]);
    const id = Date.now() + i;
    setPops((p) => [...p, { id, xp: HR_TASKS[i].xp, i }]);
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1100);
  };
  return (
    <section className="hb hb-play" style={{ height: H.play }}>
      <div className="hb-play__head">
        <Label n="03" light>
          Как работает сезон
        </Label>
        <h3>Попробуй сам: закрой первую неделю</h3>
        <p>Миссия → опыт → уровень → награда. Жми на задания — копи опыт и открой награду второго уровня.</p>
      </div>
      <div className="hb-play__body">
        <div className="hb-tasks">
          <div className="hb-tasks__head">
            <b>Неделя 1</b>
            <span>
              {done.length}/{HR_TASKS.length} миссий
            </span>
          </div>
          {HR_TASKS.map((t, i) => (
            <button
              key={t.title}
              type="button"
              data-ui
              className={`hb-task${done.includes(i) ? " is-done" : ""}`}
              onClick={() => complete(i)}
              disabled={levelUp && !done.includes(i)}
            >
              <i>{done.includes(i) ? "✓" : ""}</i>
              <span>{t.title}</span>
              <b>{t.xp} XP</b>
              {pops
                .filter((p) => p.i === i)
                .map((p) => (
                  <em key={p.id} className="hb-task__pop">
                    +{p.xp} XP
                  </em>
                ))}
            </button>
          ))}
        </div>

        <div className={`hb-pass${levelUp ? " is-up" : ""}`}>
          <div className="hb-pass__level">
            <span>Уровень</span>
            <b key={levelUp ? 2 : 1}>{levelUp ? 2 : 1}</b>
          </div>
          <div className="hb-pass__xp">
            <span>
              Опыт сезонного пропуска: <b>{Math.min(xp, HR_XP_LEVEL)}/{HR_XP_LEVEL}</b>
            </span>
            <div className="hb-pass__bar">
              <i style={{ width: `${pct * 100}%` }} />
            </div>
          </div>
          <div className="hb-reward">
            <div className="hb-reward__art">
              <img src={hrUi("boot")} alt="" loading="lazy" draggable={false} />
            </div>
            <div className="hb-reward__text">
              <em>{levelUp ? "Получено!" : "Награда 2-го уровня"}</em>
              <b>Артефакт «Первый шаг»</b>
              <span>+25% XP на миссии адаптации</span>
            </div>
            {levelUp && (
              <div className="hb-reward__burst" aria-hidden>
                {Array.from({ length: 18 }, (_, i) => (
                  <i key={i} style={{ "--i": i } as React.CSSProperties} />
                ))}
              </div>
            )}
          </div>
          {levelUp ? (
            <button
              type="button"
              data-ui
              className="hb-pass__reset"
              onClick={() => {
                setDone([]);
                setPops([]);
              }}
            >
              Пройти ещё раз ↺
            </button>
          ) : (
            <span className="hb-pass__left">До награды — {HR_XP_LEVEL - xp} XP</span>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- 05–06. экраны с хотспотами ---------- */

function Showcase({
  n,
  title,
  text,
  screens,
  dark,
  board,
}: {
  n: string;
  title: string;
  text: string;
  screens: ShowScreen[];
  dark?: boolean;
  board: HrBoardId;
}) {
  const [index, setIndex] = useState(0);
  const [spot, setSpot] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const s = screens[index];
  const tall = s.h > 1100;
  // окно 1240 px; длинный экран прокручивается со скоростью ~500 px/с
  const viewH = Math.round((1240 * 1024) / 1440);
  const dur = Math.max(1.5, ((1240 * s.h) / 1440 - viewH) / 500);
  return (
    <section className={`hb hb-show${dark ? " is-dark" : ""}`} style={{ height: H[board] }}>
      <div className="hb-show__side">
        <Label n={n} light={dark}>
          {title}
        </Label>
        <p className="hb-show__text">{text}</p>
        <ol className="hb-show__list">
          {s.spots.map((x, i) => (
            <li
              key={x.title}
              className={spot === i ? "is-active" : ""}
              onPointerEnter={() => setSpot(i)}
              onPointerLeave={() => setSpot(null)}
            >
              <em>{i + 1}</em>
              <div>
                <b>{x.title}</b>
                <span>{x.text}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="hb-show__main">
        <div className="hb-show__window">
          <div className="hb-bar">
            <i />
            <i />
            <i />
            <span>app.technopolis.ru/{s.id.replace("emp-", "").replace("hr-", "hr/")}</span>
          </div>
          <div
            className={`hb-show__screen${tall ? " is-tall" : ""}${scrolled ? " is-scrolled" : ""}`}
            style={{ height: viewH, "--vh": `${viewH}px`, "--dur": `${dur}s` } as React.CSSProperties}
          >
            <img key={s.id} src={s.src} alt={s.name} loading="lazy" draggable={false} />
            {s.spots.map((x, i) => (
              <button
                key={x.title}
                type="button"
                data-ui
                className={`hb-spot${spot === i ? " is-active" : ""}`}
                style={{ left: `${x.x * 100}%`, top: `${x.y * 100}%`, "--i": i } as React.CSSProperties}
                onPointerEnter={() => setSpot(i)}
                onPointerLeave={() => setSpot(null)}
                onClick={() => setSpot((v) => (v === i ? null : i))}
              >
                {i + 1}
                <span className="hb-spot__tip">
                  <b>{x.title}</b>
                  {x.text}
                </span>
              </button>
            ))}
            {tall && (
              <button type="button" data-ui className="hb-show__scroll" onClick={() => setScrolled((v) => !v)}>
                {scrolled ? "↑ к началу" : "↓ весь экран"}
              </button>
            )}
          </div>
        </div>
        <div className="hb-show__tabs">
          {screens.map((x, i) => (
            <button
              key={x.id}
              type="button"
              data-ui
              className={i === index ? "is-active" : ""}
              onClick={() => {
                setIndex(i);
                setSpot(null);
                setScrolled(false);
              }}
            >
              {x.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 07. аватар ---------- */

function Avatar() {
  const [color, setColor] = useState(4);
  const [skin, setSkin] = useState(4);
  const c = SKIN_COLORS[color];
  return (
    <section className="hb hb-avatar" style={{ height: H.avatar, "--c": c.color } as React.CSSProperties}>
      <div className="hb-avatar__head">
        <Label n="06">Аватар</Label>
        <h3>Собери своего персонажа</h3>
        <p>
          В продукте аватар — это 3D-персонаж. 49 скинов в 7 коллекциях выдаются за уровни и задания и продаются
          в магазине — главная коллекционная мотивация сезона.
        </p>
      </div>
      <div className="hb-avatar__body">
        <div className="hb-avatar__colors">
          <small>Коллекция</small>
          {SKIN_COLORS.map((x, i) => (
            <button
              key={x.name}
              type="button"
              data-ui
              className={i === color ? "is-active" : ""}
              style={{ "--c": x.color } as React.CSSProperties}
              onClick={() => setColor(i)}
            >
              <i />
              <span>{x.name}</span>
            </button>
          ))}
        </div>
        <div className="hb-avatar__stage">
          <img key={`${color}-${skin}`} src={skinSrc(color, skin)} alt="" draggable={false} />
          <span className="hb-avatar__tag">
            {c.name} коллекция · {skin + 1}/7
          </span>
        </div>
        <div className="hb-avatar__skins">
          <small>Скин</small>
          <div>
            {Array.from({ length: 7 }, (_, i) => (
              <button
                key={i}
                type="button"
                data-ui
                className={i === skin ? "is-active" : ""}
                onClick={() => setSkin(i)}
                aria-label={`Скин ${i + 1}`}
              >
                <img src={skinThumb(color, i)} alt="" loading="lazy" draggable={false} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 08. награды за уровни — бегущая лента ---------- */

function Rewards() {
  return (
    <section className="hb hb-rewards" style={{ height: H.rewards }}>
      <div className="hb-rewards__head">
        <Label n="07" light>
          Сезонный пропуск
        </Label>
        <h3>Каждый уровень — награда</h3>
      </div>
      <div className="hb-rewards__track">
        <div className="hb-rewards__strip">
          <img src={hrImg("lvl-rewards")} alt="Награды первых 15 уровней" loading="lazy" draggable={false} />
          <img src={hrImg("lvl-rewards")} alt="" loading="lazy" draggable={false} aria-hidden />
        </div>
      </div>
    </section>
  );
}

/* ---------- 09. дизайн-система ---------- */

function System() {
  return (
    <section className="hb hb-system" style={{ height: H.system }}>
      <div className="hb-system__head">
        <Label n="08">Дизайн-система</Label>
        <h3>Яркие цвета треков, мягкие формы, крупный Montserrat</h3>
      </div>
      <div className="hb-system__grid">
        <div className="hb-palette">
          {HR_PALETTE.map((p) => (
            <div key={p.hex} className="hb-swatch" style={{ "--c": p.hex } as React.CSSProperties}>
              <i />
              <b>{p.name}</b>
              <span>{p.hex}</span>
              <small>{p.role}</small>
            </div>
          ))}
        </div>
        <div className="hb-type">
          <span className="hb-type__aa">Аа</span>
          <div>
            <b>Montserrat</b>
            <span>Bold — заголовки и цифры</span>
            <span>Medium — кнопки и чипы</span>
            <span>Regular — описания</span>
          </div>
        </div>
        <div className="hb-ui">
          <div className="hb-ui__row">
            <span className="hb-ui__btn is-white">Принять</span>
            <span className="hb-ui__btn is-gray">Получено</span>
            <span className="hb-ui__btn is-green">Перейти к треку</span>
            <span className="hb-ui__btn is-red">Заочно завершить</span>
          </div>
          <div className="hb-ui__row">
            <span className="hb-ui__chip is-active">Уровни</span>
            <span className="hb-ui__chip">Еженедельные</span>
            <span className="hb-ui__chip">Сезонные</span>
            <span className="hb-ui__pill">
              <i>1 ур.</i>50 кредитов
            </span>
          </div>
          <div className="hb-ui__row">
            <span className="hb-ui__task">
              Пройди короткий опрос
              <br />о рабочей неделе <b>50 XP</b>
            </span>
            <span className="hb-ui__task is-red">
              Прочитать статью
              <br />
              «Как устроен Технополис» <b>100 XP</b>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 10. презентация и финал ---------- */

function Outro() {
  return (
    <section className="hb hb-outro" style={{ height: H.outro }}>
      <div className="hb-outro__head">
        <Label n="09" light>
          Презентация с защиты
        </Label>
      </div>
      {/* сам просмотрщик — отдельный фрейм «deck», он стоит ровно в этом окне */}
      <div className="hb-outro__deck" aria-hidden />
      <div className="hb-outro__end">
        <b>Спасибо, что досмотрел!</b>
        <a data-ui className="hb-outro__cta" href={LINKS.telegram} target="_blank" rel="noopener noreferrer">
          Обсудить похожий проект ↗
        </a>
      </div>
    </section>
  );
}

/* ---------- персонажи бегают по ленте ---------- */

const CREW = Array.from({ length: 14 }, (_, i) => `/images/crew/crew-${String(i + 1).padStart(2, "0")}.webp`);
type Runner = { id: number; src: string; mode: "peek-l" | "peek-r" | "walk"; top: number; dir: 1 | -1 };

function CaseCrew({ active, root }: { active: boolean; root: React.RefObject<HTMLDivElement | null> }) {
  const [runners, setRunners] = useState<Runner[]>([]);
  const visible = useRef(new Set<string>());

  // какие борды сейчас в кадре — персонажи появляются только там, где на них смотрят
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.board!;
          if (e.isIntersecting) visible.current.add(id);
          else visible.current.delete(id);
        }
      },
      { threshold: 0.25 }
    );
    el.querySelectorAll<HTMLElement>("[data-board]").forEach((b) => io.observe(b));
    return () => io.disconnect();
  }, [root]);

  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let id = 0;
    let last = -1;
    let t: ReturnType<typeof setTimeout>;
    const spawn = () => {
      const boards = HR_BOARDS.filter((b) => visible.current.has(b.id) && b.id !== "outro");
      if (boards.length) {
        const b = boards[Math.floor(Math.random() * boards.length)];
        let top = 0;
        for (const x of HR_BOARDS) {
          if (x.id === b.id) break;
          top += x.h;
        }
        let k = Math.floor(Math.random() * CREW.length);
        if (k === last) k = (k + 1) % CREW.length;
        last = k;
        const r = Math.random();
        const mode: Runner["mode"] = r < 0.35 ? "peek-l" : r < 0.7 ? "peek-r" : "walk";
        const runner: Runner = {
          id: id++,
          src: CREW[k],
          mode,
          // выглядывают на случайной высоте борда, ходят по его нижнему краю
          top: mode === "walk" ? top + b.h - 20 : top + 120 + Math.random() * Math.max(0, b.h - 520),
          dir: Math.random() < 0.5 ? 1 : -1,
        };
        setRunners((rs) => [...rs.slice(-3), runner]);
        setTimeout(() => setRunners((rs) => rs.filter((x) => x.id !== runner.id)), mode === "walk" ? 9000 : 5400);
      }
      t = setTimeout(spawn, 1800 + Math.random() * 1600);
    };
    t = setTimeout(spawn, 800);
    return () => {
      clearTimeout(t);
      setRunners([]);
    };
  }, [active]);

  return (
    <div className="hb-crew" aria-hidden>
      {runners.map((r) => (
        <div
          key={r.id}
          className={`hb-crew__runner is-${r.mode}`}
          style={{ top: r.top, "--dir": r.dir } as React.CSSProperties}
        >
          <div className="hb-crew__body">
            <img src={r.src} alt="" draggable={false} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CaseHR({ selected, active }: { selected: string | null; active: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  return (
    <Frame meta={frameById("case-hr")} selected={selected === "case-hr"} className="hb-case">
      <div ref={root} className="hb-case__boards">
        {HR_BOARDS.map((b) => (
          <div key={b.id} data-board={b.id} className="hb-case__slot">
            {b.id === "hero" && <Hero />}
            {b.id === "about" && <About />}
            {b.id === "mockup" && <Mockup />}
            {b.id === "play" && <Play />}
            {b.id === "employee" && (
              <Showcase
                board="employee"
                n="04"
                title="Путь сотрудника"
                text="Новичок проходит адаптацию как сезон: недели с миссиями, треки, пропуск с наградами, профиль и рейтинг. Наведи на цифры на экране."
                screens={HR_EMPLOYEE}
              />
            )}
            {b.id === "hr" && (
              <Showcase
                board="hr"
                n="05"
                title="Кабинет HR"
                text="Всё, что видит сотрудник, HR собирает сам: задания, награды и сезоны — и следит, кто застрял."
                screens={HR_ADMIN}
                dark
              />
            )}
            {b.id === "avatar" && <Avatar />}
            {b.id === "rewards" && <Rewards />}
            {b.id === "system" && <System />}
            {b.id === "outro" && <Outro />}
          </div>
        ))}
      </div>
      <CaseCrew active={active} root={root} />
    </Frame>
  );
}

