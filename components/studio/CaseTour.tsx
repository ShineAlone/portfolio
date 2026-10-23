"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LINKS } from "@/lib/content";
import { DECKS, frameById } from "./data";
import { Frame } from "./Frame";
import {
  BUDGETS,
  DURATIONS,
  INTERESTS,
  PHONE_JUMPS,
  PHONE_SCREENS,
  TOUR_BOARDS,
  TOUR_PALETTE,
  TOUR_STEPS,
  buildRoute,
  tourImg,
  type TourBoardId,
  type TourPlace,
} from "./casesTour";

/* eslint-disable @next/next/no-img-element */

/*
 * Кейс «Шагай и точка» — лента бордов в духе Behance, но в «туристическом» оформлении:
 * бумага, пунктир маршрутов, метки на карте, открытки. Главная фишка — живой телефон:
 * по экранам можно ходить, а «Построить маршрут» собирает маршрут по интересам,
 * и этот же маршрут прорисовывается на большой карте ниже.
 */

const H = Object.fromEntries(TOUR_BOARDS.map((b) => [b.id, b.h])) as Record<TourBoardId, number>;
const PHONE_W = 412;
const PHONE_H = 900;
// кварталы на нарисованной карте: [x, y, w, h]
const BLOCKS = [
  [20, 30, 80, 120], [150, 40, 240, 110], [450, 50, 280, 100], [790, 60, 220, 90], [1080, 30, 140, 60],
  [20, 220, 70, 260], [160, 230, 230, 250], [460, 290, 90, 190], [1000, 320, 210, 130], [1080, 520, 140, 140],
  [30, 560, 60, 140], [560, 540, 120, 130], [820, 520, 110, 140], [1000, 720, 220, 120], [560, 730, 120, 110],
  [260, 760, 140, 90], [30, 760, 180, 90], [780, 740, 150, 100],
];

function Label({ n, children, light }: { n: string; children: React.ReactNode; light?: boolean }) {
  return (
    <span className={`tb-label${light ? " is-light" : ""}`}>
      <em>{n}</em>
      {children}
    </span>
  );
}

// Внутри холста колесо крутит камеру; в экране телефона — прокручивает сам экран.
function useOwnWheel<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const stop = (e: WheelEvent) => {
      if (!e.ctrlKey && el.scrollHeight > el.clientHeight) e.stopPropagation();
    };
    el.addEventListener("wheel", stop, { passive: true });
    return () => el.removeEventListener("wheel", stop);
  }, []);
  return ref;
}

/* ---------- корпус телефона ---------- */

function PhoneShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`tb-phone ${className}`}>
      <div className="tb-phone__screen">
        <div className="tb-phone__status" aria-hidden>
          <b>9:41</b>
          <i className="tb-phone__island" />
          <span>●●● 5G ▮</span>
        </div>
        {children}
      </div>
    </div>
  );
}

// Статичный телефон с экраном; длинный экран может сам медленно листаться
function StaticPhone({ screen, scroll, className }: { screen: string; scroll?: boolean; className?: string }) {
  const s = PHONE_SCREENS[screen];
  const ratio = s ? s.h / PHONE_H : 1;
  return (
    <PhoneShell className={className}>
      <div className="tb-phone__view">
        <img
          className={scroll && ratio > 1.05 ? "is-autoscroll" : ""}
          style={{ "--k": ratio } as React.CSSProperties}
          src={tourImg(screen)}
          alt=""
          loading="lazy"
          draggable={false}
        />
      </div>
    </PhoneShell>
  );
}

/* ---------- конструктор маршрута внутри телефона ---------- */

function Builder({ onDone, onBack }: { onDone: (route: TourPlace[]) => void; onBack: () => void }) {
  const [picked, setPicked] = useState<string[]>(["culture", "food"]);
  const [dur, setDur] = useState(1);
  const [budget, setBudget] = useState(1);
  const [phase, setPhase] = useState<"form" | "loading" | "done">("form");
  const [route, setRoute] = useState<TourPlace[]>([]);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const build = () => {
    setPhase("loading");
    const r = buildRoute(picked, DURATIONS[dur].stops);
    setTimeout(() => {
      setRoute(r);
      setPhase("done");
    }, 1700);
  };
  const hours = DURATIONS[dur].name;
  return (
    <div className="tb-builder">
      <div className="tb-builder__top">
        <button type="button" data-ui onClick={phase === "done" ? () => setPhase("form") : onBack} aria-label="Назад">
          ←
        </button>
        <b>{phase === "done" ? "Ваш маршрут" : "Новый маршрут"}</b>
        <span />
      </div>

      {phase === "form" && (
        <div className="tb-builder__form">
          <h4>Что вам интересно?</h4>
          <p>Выберите одно или несколько</p>
          <div className="tb-chips">
            {INTERESTS.map((x) => (
              <button
                key={x.id}
                type="button"
                data-ui
                className={picked.includes(x.id) ? "is-on" : ""}
                onClick={() => toggle(x.id)}
              >
                <span>{x.icon}</span>
                {x.name}
              </button>
            ))}
          </div>
          <h4>Сколько у вас времени?</h4>
          <div className="tb-seg">
            {DURATIONS.map((x, i) => (
              <button key={x.id} type="button" data-ui className={i === dur ? "is-on" : ""} onClick={() => setDur(i)}>
                {x.name}
              </button>
            ))}
          </div>
          <h4>Бюджет</h4>
          <div className="tb-seg">
            {BUDGETS.map((x, i) => (
              <button key={x} type="button" data-ui className={i === budget ? "is-on" : ""} onClick={() => setBudget(i)}>
                {x}
              </button>
            ))}
          </div>
          <button type="button" data-ui className="tb-builder__cta" disabled={!picked.length} onClick={build}>
            Построить маршрут
          </button>
        </div>
      )}

      {phase === "loading" && (
        <div className="tb-builder__loading">
          <svg viewBox="0 0 200 120" aria-hidden>
            <path d="M20 90 C 60 20, 110 120, 180 30" />
          </svg>
          <i className="tb-builder__pin">📍</i>
          <b>Подбираем места под ваши интересы…</b>
          <span>Учитываем время работы и расстояния</span>
        </div>
      )}

      {phase === "done" && (
        <div className="tb-builder__done">
          <div className="tb-builder__summary">
            <b>{route.length} мест</b>
            <span>~{hours}</span>
            <span>{BUDGETS[budget].toLowerCase()}</span>
          </div>
          <ol>
            {route.map((p, i) => (
              <li key={p.name} style={{ "--i": i } as React.CSSProperties}>
                <em>{i + 1}</em>
                <div>
                  <b>{p.name}</b>
                  <span>
                    {p.tag} · {p.time}
                  </span>
                </div>
              </li>
            ))}
          </ol>
          <button type="button" data-ui className="tb-builder__cta" onClick={() => onDone(route)}>
            Начать маршрут
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- живой телефон ---------- */

function LivePhone({
  screen,
  dir,
  onGo,
  onBack,
  onRoute,
  hint,
}: {
  screen: string;
  dir: "fwd" | "back";
  onGo: (to: string) => void;
  onBack: () => void;
  onRoute: (r: TourPlace[]) => void;
  hint: boolean;
}) {
  const s = PHONE_SCREENS[screen];
  const view = useOwnWheel<HTMLDivElement>();
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    view.current?.scrollTo({ top: 0 });
  }, [screen, view]);
  return (
    <PhoneShell className="is-live">
      <div ref={view} className="tb-phone__view is-scroll">
        <div key={screen} className={`tb-phone__page is-${dir}`}>
          {screen === "builder" ? (
            <Builder
              onBack={onBack}
              onDone={(r) => {
                onRoute(r);
                onGo("map");
              }}
            />
          ) : (
            <div
              className="tb-phone__img"
              onClick={() => {
                // нажали мимо — подсказываем, где кнопки
                setFlash(true);
                setTimeout(() => setFlash(false), 700);
              }}
            >
              <img src={tourImg(screen)} alt={s.title} draggable={false} />
              {s.taps.map((t) => (
                <button
                  key={t.label + t.y}
                  type="button"
                  data-ui
                  className={`tb-tap${hint || flash ? " is-hint" : ""}`}
                  style={{
                    left: `${(t.x / PHONE_W) * 100}%`,
                    top: `${(t.y / s.h) * 100}%`,
                    width: `${(t.w / PHONE_W) * 100}%`,
                    height: `${(t.h / s.h) * 100}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onGo(t.to);
                  }}
                  aria-label={t.label}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PhoneShell>
  );
}

/* ---------- 01. обложка ---------- */

function Hero() {
  const [i, setI] = useState(0);
  const slides = ["splash", "onb-2", "onb-3", "home"];
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 2600);
    return () => clearInterval(t);
  }, [slides.length]);
  return (
    <section className="tb tb-hero" style={{ height: H.hero }}>
      <svg className="tb-hero__route" viewBox="0 0 2000 1200" preserveAspectRatio="none" aria-hidden>
        <path d="M-40 980 C 300 860, 420 1040, 700 900 S 1100 640, 1300 760 S 1700 980, 2040 700" />
      </svg>
      <span className="tb-pin is-a" aria-hidden>1</span>
      <span className="tb-pin is-b" aria-hidden>2</span>
      <span className="tb-pin is-c" aria-hidden>3</span>
      <i className="tb-walker" aria-hidden />

      <div className="tb-hero__text">
        <div className="tb-hero__chips">
          <span>Мой стартап</span>
          <span className="is-grant">Выигран грант</span>
          <span>Мобильное приложение</span>
          <span>Туризм</span>
        </div>
        <h2>
          Шагай
          <br />и точка
        </h2>
        <p>
          Персональные маршруты по Туле. Расскажи, что тебе интересно, — приложение соберёт маршрут из
          реальных мест, посчитает время и поведёт по карте.
        </p>
        <dl>
          <div>
            <dt>Роль</dt>
            <dd>Основатель и дизайнер продукта</dd>
          </div>
          <div>
            <dt>Город</dt>
            <dd>Тула — оружейная столица</dd>
          </div>
        </dl>
      </div>

      <div className="tb-hero__postcard">
        <img src={tourImg("onb-1")} alt="Тульский кремль" draggable={false} />
        <span className="tb-hero__stamp">
          ТУЛА
          <small>оружейная столица</small>
        </span>
      </div>
      <StaticPhone screen={slides[i]} className="tb-hero__phone" />
    </section>
  );
}

/* ---------- 02. идея: три шага по пунктиру ---------- */

function Idea() {
  return (
    <section className="tb tb-idea" style={{ height: H.idea }}>
      <div className="tb-idea__head">
        <Label n="01">Идея</Label>
        <p className="tb-statement">
          Приезжаешь в&nbsp;новый город — и&nbsp;полдня уходит на&nbsp;то, чтобы понять, куда идти. Мы&nbsp;сделали
          гида, который за&nbsp;минуту собирает маршрут под&nbsp;тебя.
        </p>
      </div>
      <div className="tb-steps">
        <svg viewBox="0 0 1840 120" preserveAspectRatio="none" aria-hidden>
          <path d="M40 60 C 300 0, 520 120, 920 60 S 1540 0, 1800 60" />
        </svg>
        {TOUR_STEPS.map((s, i) => (
          <div key={s.n} className="tb-step" style={{ "--i": i } as React.CSSProperties}>
            <span className="tb-step__pin">{s.n}</span>
            <b>{s.title}</b>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- 03. живой телефон ---------- */

function Try({ onRoute }: { onRoute: (r: TourPlace[]) => void }) {
  const [stack, setStack] = useState<{ s: string; dir: "fwd" | "back" }>({ s: "home", dir: "fwd" });
  const history = useRef<string[]>([]);
  const [hint, setHint] = useState(false);
  const go = (to: string) => {
    if (to === stack.s) return;
    history.current.push(stack.s);
    setStack({ s: to, dir: "fwd" });
  };
  const back = () => {
    const prev = history.current.pop();
    if (prev) setStack({ s: prev, dir: "back" });
  };
  const s = PHONE_SCREENS[stack.s];
  return (
    <section className="tb tb-try" style={{ height: H.try }}>
      <div className="tb-try__side">
        <Label n="02" light>
          Попробуй приложение
        </Label>
        <h3>Телефон настоящий — по нему можно ходить</h3>
        <p className="tb-try__lead">
          Нажимай на экран, как в приложении. Начни с «Построить маршрут»: выбери интересы — и маршрут соберётся
          из реальных мест Тулы.
        </p>
        <div className="tb-try__now">
          <small>Сейчас на экране</small>
          <b>{s.title}</b>
          <span>{s.text}</span>
        </div>
        <div className="tb-try__jumps">
          {PHONE_JUMPS.map((j) => (
            <button
              key={j.to}
              type="button"
              data-ui
              className={j.to === stack.s ? "is-on" : ""}
              onClick={() => {
                history.current = [];
                setStack({ s: j.to, dir: "fwd" });
              }}
            >
              {j.label}
            </button>
          ))}
        </div>
      </div>
      <div className="tb-try__stage">
        <LivePhone screen={stack.s} dir={stack.dir} onGo={go} onBack={back} onRoute={onRoute} hint={hint} />
        <div className="tb-try__nav">
          <button type="button" data-ui onClick={back} disabled={!history.current.length}>
            ← Назад
          </button>
          <button
            type="button"
            data-ui
            onClick={() => {
              history.current = [];
              setStack({ s: "home", dir: "back" });
            }}
          >
            ⌂ Главная
          </button>
          <button type="button" data-ui className={hint ? "is-on" : ""} onClick={() => setHint((v) => !v)}>
            ◎ Где нажимать
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- 04. маршрут на карте ---------- */

function MapBoard({ route, mine }: { route: TourPlace[]; mine: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 1240;
  const Hh = 860;
  // места в данных лежат плотно у центра — на карте разносим их шире
  const at = (p: TourPlace) => ({
    x: Math.min(0.92, Math.max(0.08, 0.5 + (p.x - 0.5) * 1.55)),
    y: Math.min(0.9, Math.max(0.1, 0.48 + (p.y - 0.48) * 1.5)),
  });
  const pts = route.map((p) => [at(p).x * W, at(p).y * Hh]);
  const d = pts.map(([x, y], i) => (i ? `L${x.toFixed(0)} ${y.toFixed(0)}` : `M${x.toFixed(0)} ${y.toFixed(0)}`)).join(" ");
  const key = route.map((p) => p.name).join("|");
  return (
    <section className="tb tb-map" style={{ height: H.map }}>
      <div className="tb-map__side">
        <Label n="03">Маршрут на карте</Label>
        <h3>{mine ? "Это маршрут, который ты собрал" : "Так выглядит маршрут"}</h3>
        <p>
          {mine
            ? "Точки идут по кругу от центра, чтобы не петлять. Наведи на метку — увидишь, что там."
            : "Собери свой маршрут в телефоне выше — и он прорисуется здесь."}
        </p>
        <ol className="tb-map__list">
          {route.map((p, i) => (
            <li
              key={p.name}
              className={hover === i ? "is-on" : ""}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            >
              <em>{i + 1}</em>
              <div>
                <b>{p.name}</b>
                <span>{p.tag}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="tb-map__card">
        <svg viewBox={`0 0 ${W} ${Hh}`} className="tb-map__svg" aria-hidden>
          {/* стилизованный центр Тулы: река Упа, парки, сетка улиц */}
          <rect width={W} height={Hh} fill="#EFE8DA" />
          <g stroke="#fff" strokeWidth="14" strokeLinecap="round" fill="none" opacity="0.9">
            <path d="M0 180 L1240 260" />
            <path d="M0 520 L1240 470" />
            <path d="M120 0 L240 860" />
            <path d="M420 0 L520 860" />
            <path d="M760 0 L700 860" />
            <path d="M1040 0 L960 860" />
            <path d="M0 720 L1240 680" />
          </g>
          <g fill="#E6DCC8">
            {BLOCKS.map(([x, y, w, h]) => (
              <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="10" />
            ))}
          </g>
          <ellipse cx="300" cy="610" rx="170" ry="110" fill="#CFE6B8" />
          <ellipse cx="760" cy="430" rx="110" ry="70" fill="#CFE6B8" />
          <rect x="570" y="330" width="150" height="130" rx="18" fill="#E6C9B2" stroke="#C99A7A" strokeWidth="4" />
          <path d="M1240 120 C 1000 220, 880 300, 800 420 S 700 640, 560 860" stroke="#9FD1F2" strokeWidth="46" fill="none" strokeLinecap="round" />
          <text x="1010" y="230" className="tb-map__river">р. Упа</text>
          <text x="600" y="318" className="tb-map__label">Кремль</text>
          {pts.length > 1 && <path key={key} d={d} className="tb-map__line" pathLength={1} />}
        </svg>
        {route.map((p, i) => (
          <button
            key={p.name}
            type="button"
            data-ui
            className={`tb-map__pin${hover === i ? " is-on" : ""}`}
            style={{ left: `${at(p).x * 100}%`, top: `${at(p).y * 100}%`, "--i": i } as React.CSSProperties}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
          >
            {i + 1}
            <span className="tb-map__tip">
              <b>{p.name}</b>
              {p.tag} · {p.time}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------- 05. экраны: онбординг и каталог ---------- */

function Screens() {
  return (
    <section className="tb tb-screens" style={{ height: H.screens }}>
      <div className="tb-screens__head">
        <Label n="04" light>
          Экраны
        </Label>
        <h3>От первого знакомства до карточки места</h3>
      </div>
      <div className="tb-screens__row">
        <div className="tb-screens__fan">
          <StaticPhone screen="onb-1" className="is-fan-1" />
          <StaticPhone screen="onb-2" className="is-fan-2" />
          <StaticPhone screen="onb-3" className="is-fan-3" />
          <span className="tb-caption">Онбординг: город, простота, контроль</span>
        </div>
        <div className="tb-screens__scroll">
          <figure>
            <StaticPhone screen="routes" scroll />
            <figcaption>Все маршруты</figcaption>
          </figure>
          <figure>
            <StaticPhone screen="route" scroll />
            <figcaption>Маршрут</figcaption>
          </figure>
          <figure>
            <StaticPhone screen="place" scroll />
            <figcaption>Место</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ---------- 06. путешествия как игра: рейтинг и профиль ---------- */

function Social() {
  return (
    <section className="tb tb-social" style={{ height: H.social }}>
      <div className="tb-social__head">
        <Label n="05">Путешествия как игра</Label>
        <h3>Километры, места и рейтинг города</h3>
        <p>За пройденные маршруты копятся баллы. Можно сравнить себя с другими туристами и вернуться за новыми точками.</p>
      </div>
      <div className="tb-social__row">
        {[
          { s: "menu", t: "Меню и достижения", badge: "19 км за 3 дня" },
          { s: "rating", t: "Таблица лидеров", badge: "6 место · 7 900" },
          { s: "history", t: "История маршрутов", badge: "оценки и даты" },
          { s: "settings", t: "Публичный профиль", badge: "соцсети и ссылка" },
        ].map((x, i) => (
          <figure key={x.s} style={{ "--i": i } as React.CSSProperties}>
            <span className="tb-badge">{x.badge}</span>
            <StaticPhone screen={x.s} />
            <figcaption>{x.t}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ---------- 07. дизайн ---------- */

function System() {
  return (
    <section className="tb tb-system" style={{ height: H.system }}>
      <div className="tb-system__head">
        <Label n="06">Дизайн</Label>
        <h3>Небо, купола и кирпич — цвета самой Тулы</h3>
      </div>
      <div className="tb-system__grid">
        <div className="tb-palette">
          {TOUR_PALETTE.map((p) => (
            <div key={p.hex} className="tb-swatch" style={{ "--c": p.hex } as React.CSSProperties}>
              <i />
              <b>{p.name}</b>
              <span>{p.hex}</span>
              <small>{p.role}</small>
            </div>
          ))}
        </div>
        <div className="tb-type">
          <span className="tb-type__aa">Аа</span>
          <div>
            <b>PT Root UI</b>
            <span>спокойный гротеск с русскими корнями — читается на ходу и на солнце</span>
          </div>
        </div>
        <div className="tb-ui">
          <div className="tb-ui__row">
            <span className="tb-ui__btn">Начать маршрут</span>
            <span className="tb-ui__btn is-ghost">Сохранить</span>
          </div>
          <div className="tb-ui__row">
            <span className="tb-ui__chip is-on">Гастрономия</span>
            <span className="tb-ui__chip">Шопинг</span>
            <span className="tb-ui__chip">Паломничество</span>
          </div>
          <div className="tb-ui__row">
            <span className="tb-ui__rate">
              ●●●●● <small>211 оценок</small>
            </span>
            <span className="tb-ui__meta">5 мест · ~4 часа</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 08. презентация стартапа и финал ---------- */

function Outro() {
  const deck = DECKS[1];
  const [i, setI] = useState(0);
  const n = deck.slides.length;
  return (
    <section className="tb tb-outro" style={{ height: H.outro }}>
      <div className="tb-outro__head">
        <Label n="07" light>
          Презентация стартапа
        </Label>
      </div>
      <div className="tb-deck">
        <div className="tb-deck__screen">
          <img key={i} src={deck.slides[i]} alt={`Слайд ${i + 1}`} loading="lazy" draggable={false} />
          <span className="tb-deck__count">
            {i + 1} / {n}
          </span>
          <button type="button" data-ui className="tb-deck__arrow is-prev" onClick={() => setI((x) => (x - 1 + n) % n)} aria-label="Предыдущий слайд">
            ←
          </button>
          <button type="button" data-ui className="tb-deck__arrow is-next" onClick={() => setI((x) => (x + 1) % n)} aria-label="Следующий слайд">
            →
          </button>
        </div>
        <div className="tb-deck__strip">
          {deck.slides.map((src, k) => (
            <button key={src} type="button" data-ui className={k === i ? "is-on" : ""} onClick={() => setI(k)}>
              <img src={src} alt="" loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
      </div>
      <div className="tb-outro__end">
        <b>Спасибо, что прошёл маршрут до конца!</b>
        <a data-ui className="tb-outro__cta" href={LINKS.telegram} target="_blank" rel="noopener noreferrer">
          Обсудить проект ↗
        </a>
      </div>
    </section>
  );
}

export function CaseTour({ selected }: { selected: string | null }) {
  const fallback = useMemo(() => buildRoute(["culture", "food"], 5), []);
  const [route, setRoute] = useState<TourPlace[] | null>(null);
  return (
    <Frame meta={frameById("case-tour")} selected={selected === "case-tour"} className="tb-case" noSelect>
      <div className="tb-case__boards">
        <Hero />
        <Idea />
        <Try onRoute={setRoute} />
        <MapBoard route={route ?? fallback} mine={!!route} />
        <Screens />
        <Social />
        <System />
        <Outro />
      </div>
    </Frame>
  );
}
