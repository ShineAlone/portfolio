"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LINKS } from "@/lib/content";
import { frameById } from "./data";
import { Frame } from "./Frame";
import { TourMap } from "./TourMap";
import legsData from "./tourLegs.json";
import {
  ABOUT_CARDS,
  BEZEL,
  BUDGETS,
  DECK,
  DURATIONS,
  INTERESTS,
  KIND_COLOR,
  PHONE_SCREENS,
  PLACES,
  PRESETS,
  TOUR_BOARDS,
  TOUR_PALETTE,
  buildRoute,
  deckSlide,
  legOf,
  orderStops,
  tourImg,
  tourPhoto,
  type Legs,
  type TourBoardId,
} from "./casesTour";

/* eslint-disable @next/next/no-img-element */

/*
 * Кейс «Шагай и точка» — лента бордов в духе Behance: фото Тулы, экраны в рамке iPhone 17 Pro,
 * живой телефон с конструктором маршрута и настоящая карта, на которой прорисовывается
 * пешеходный маршрут — собранный в телефоне или один из готовых.
 */

const LEGS = legsData as unknown as Legs;
const H = Object.fromEntries(TOUR_BOARDS.map((b) => [b.id, b.h])) as Record<TourBoardId, number>;

function Label({ n, children, light }: { n: string; children: React.ReactNode; light?: boolean }) {
  return (
    <span className={`tb-label${light ? " is-light" : ""}`}>
      <em>{n}</em>
      {children}
    </span>
  );
}

// длина и время пешком по заранее посчитанным отрезкам
function walk(stops: number[]) {
  let d = 0;
  let t = 0;
  for (let i = 1; i < stops.length; i++) {
    const l = legOf(LEGS, stops[i - 1], stops[i]);
    d += l.d;
    t += l.t;
  }
  return { km: (d / 1000).toFixed(1).replace(".", ","), min: t };
}

// Внутри холста колесо двигает камеру; в экране телефона — прокручивает сам экран.
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

/* ---------- телефон в рамке iPhone 17 Pro ---------- */

function StatusBar({ light }: { light?: boolean }) {
  return (
    <div className={`tb-status${light ? " is-light" : ""}`} aria-hidden>
      <b>9:41</b>
      <span>
        <svg viewBox="0 0 18 12">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg viewBox="0 0 16 12">
          <path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .4C5.2.4 2.7 1.5.8 3.3L2 4.6a8.6 8.6 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.3-1.3A6.8 6.8 0 0 0 8 4c-1.8 0-3.5.7-4.7 1.8l1.3 1.3c.9-.8 2.1-1.3 3.4-1.3Zm0 3.6c-.6 0-1.1.2-1.5.6L8 11.6l1.5-1.6c-.4-.4-.9-.6-1.5-.6Z" />
        </svg>
        <i />
      </span>
    </div>
  );
}

function Device({
  children,
  bezel = "silver",
  className = "",
  light,
}: {
  children: React.ReactNode;
  bezel?: keyof typeof BEZEL;
  className?: string;
  light?: boolean;
}) {
  return (
    <div className={`tb-device ${className}`}>
      <div className="tb-device__screen">
        {/* экран свёрстан в размере макета (412 px) и масштабируется под рамку */}
        <div className="tb-device__ui">
          {children}
          <StatusBar light={light} />
        </div>
      </div>
      <img className="tb-device__frame" src={BEZEL[bezel]} alt="" draggable={false} />
    </div>
  );
}

// Статичный экран; длинный может сам медленно листаться
function Phone({ screen, scroll, bezel, className }: { screen: string; scroll?: boolean; bezel?: keyof typeof BEZEL; className?: string }) {
  const s = PHONE_SCREENS[screen];
  const k = s.h / (s.photo ? 896 : 841);
  return (
    <Device bezel={bezel} className={className} light={s.photo}>
      <div className={`tb-device__view${s.photo ? "" : " is-bar"}`}>
        <img
          className={scroll && k > 1.05 ? "is-autoscroll" : ""}
          style={{ "--k": k } as React.CSSProperties}
          src={tourImg(screen)}
          alt={s.title}
          loading="lazy"
          draggable={false}
        />
      </div>
    </Device>
  );
}

/* ---------- конструктор маршрута внутри телефона ---------- */

// Собранный маршрут сразу уходит на карту; «Пройти маршрут» в телефоне запускает прогулку на карте
function Builder({ onBuilt, onPlay, playing }: { onBuilt: (stops: number[]) => void; onPlay: () => void; playing: boolean }) {
  const [picked, setPicked] = useState<string[]>(["culture", "food"]);
  const [dur, setDur] = useState(1);
  const [budget, setBudget] = useState(1);
  const [phase, setPhase] = useState<"form" | "loading" | "done">("form");
  const [stops, setStops] = useState<number[]>([]);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const build = () => {
    setPhase("loading");
    const r = orderStops(LEGS, buildRoute(picked, DURATIONS[dur].stops));
    setTimeout(() => {
      setStops(r);
      setPhase("done");
      onBuilt(r);
    }, 1300);
  };
  const w = walk(stops);
  return (
    <div className="tb-builder">
      <div className="tb-builder__top">
        {phase === "done" ? (
          <button type="button" data-ui onClick={() => setPhase("form")} aria-label="Изменить маршрут">
            <svg viewBox="0 0 24 24">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
        ) : (
          <span />
        )}
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
                style={{ "--c": KIND_COLOR[x.id] } as React.CSSProperties}
                onClick={() => toggle(x.id)}
              >
                <i />
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
          <span className="tb-builder__spinner" />
          <b>Подбираем места под ваши интересы</b>
          <span>Учитываем часы работы и расстояния</span>
        </div>
      )}

      {phase === "done" && (
        <div className="tb-builder__done">
          <div className="tb-builder__summary">
            <div>
              <b>{stops.length}</b>
              <span>мест</span>
            </div>
            <div>
              <b>{w.km}</b>
              <span>км пешком</span>
            </div>
            <div>
              <b>{w.min}</b>
              <span>мин в пути</span>
            </div>
          </div>
          <ol>
            {stops.map((id, i) => (
              <li key={id} style={{ "--i": i, "--c": KIND_COLOR[PLACES[id].kind] } as React.CSSProperties}>
                <em>{i + 1}</em>
                <div>
                  <b>{PLACES[id].name}</b>
                  <span>
                    {PLACES[id].tag} · {PLACES[id].time}
                  </span>
                </div>
              </li>
            ))}
          </ol>
          <div className="tb-builder__actions">
            <button type="button" data-ui className={`tb-builder__cta${playing ? " is-stop" : ""}`} onClick={onPlay}>
              {playing ? "Остановить прогулку" : "Пройти маршрут"}
            </button>
            <button type="button" data-ui className="tb-builder__ghost" onClick={() => setPhase("form")}>
              Изменить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 01. обложка ---------- */

function Hero() {
  return (
    <section className="tb tb-hero" style={{ height: H.hero }}>
      <img className="tb-hero__bg" src={tourPhoto("cathedral")} alt="Успенский собор Тульского кремля" draggable={false} />
      <div className="tb-hero__shade" />

      <div className="tb-hero__text">
        <div className="tb-hero__chips">
          <span>Мой стартап</span>
          <span>Мобильное приложение</span>
          <span>Туризм</span>
        </div>
        <h2>
          Шагай
          <br />и точка
        </h2>
        <p>
          Персональные пешие маршруты по Туле. Расскажи, что тебе интересно, — приложение соберёт прогулку из
          реальных мест, посчитает время и поведёт по карте.
        </p>
        <dl>
          <div>
            <dt>Роль</dt>
            <dd>Основатель, дизайнер продукта</dd>
          </div>
          <div>
            <dt>Платформа</dt>
            <dd>Мобильное приложение</dd>
          </div>
          <div>
            <dt>Город</dt>
            <dd>Тула</dd>
          </div>
        </dl>
      </div>

      <div className="tb-hero__grant">
        <b>Грант</b>
        <span>стартап выиграл грантовый конкурс</span>
      </div>

      <div className="tb-hero__phones">
        <Phone screen="route" className="tb-hero__back" />
        <Phone screen="home" bezel="blue" className="tb-hero__front" />
      </div>

      <div className="tb-hero__foot">
        <span>54°11′ с. ш. · 37°37′ в. д.</span>
        <span>Тула — оружейная столица России</span>
      </div>
    </section>
  );
}

/* ---------- 02. о проекте ---------- */

function About() {
  return (
    <section className="tb tb-about" style={{ height: H.about }}>
      <div className="tb-about__head">
        <Label n="01">О проекте</Label>
        <p className="tb-statement">
          Приезжаешь в&nbsp;новый город — и&nbsp;не&nbsp;знаешь, с&nbsp;чего начать. «Шагай и&nbsp;точка» за&nbsp;минуту
          собирает прогулку под&nbsp;твои интересы и&nbsp;ведёт по&nbsp;ней от&nbsp;точки к&nbsp;точке.
        </p>
      </div>
      <div className="tb-about__cards">
        {ABOUT_CARDS.map((c) => (
          <article key={c.label} className="tb-card">
            <img src={tourPhoto(c.photo)} alt="" loading="lazy" draggable={false} />
            <span className="tb-card__label">{c.label}</span>
            <div className="tb-card__body">
              <b>{c.title}</b>
              <p>{c.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------- 02. маршрут: живой телефон + карта Тулы ---------- */

function Steps() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M8.5 3c1.7 0 2.6 1.8 2.4 4.2-.2 2-1.1 3.3-2.4 3.3S6.3 9.4 6.1 7.4C5.9 5 6.8 3 8.5 3Zm-1.9 9.3 3.6-.3.4 2.3c.2 1.3-.6 2.4-1.9 2.5-1.2.1-2.1-.8-2.2-2l.1-2.5Zm9.1-6.6c1.7.1 2.4 2 2.1 4.3-.3 2-1.3 3.2-2.6 3.1-1.3-.1-2.1-1.6-2.1-3.6 0-2.4 1-3.9 2.6-3.8Zm-2.6 9 3.6.4-.1 2.4c-.1 1.3-1.1 2.1-2.3 2-1.3-.1-2-1.3-1.7-2.5l.5-2.3Z" />
    </svg>
  );
}

const fmtDist = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} м` : `${(m / 1000).toFixed(1).replace(".", ",")} км`);

function RouteBoard() {
  // маршрут
  const [custom, setCustom] = useState<number[] | null>(null);
  const [sel, setSel] = useState<string>(PRESETS[0].id);
  const [hover, setHover] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [passed, setPassed] = useState(-1);
  const stops = useMemo(() => {
    if (sel === "custom" && custom) return custom;
    return orderStops(LEGS, PRESETS.find((p) => p.id === sel)?.ids ?? PRESETS[0].ids);
  }, [sel, custom]);
  useEffect(() => {
    setFocus(null);
    setPlaying(false);
    setPassed(-1);
  }, [stops]);
  const w = walk(stops);
  const list = useOwnWheel<HTMLOListElement>();
  const options = [...(custom ? [{ id: "custom", name: "Твой маршрут" }] : []), ...PRESETS];
  const title = options.find((o) => o.id === sel)?.name ?? "";
  const phoneView = useOwnWheel<HTMLDivElement>();
  const togglePlay = () => {
    setPassed(-1);
    setHover(null);
    setPlaying((v) => !v);
  };
  // подсказка «что делать дальше»: телефон → карта → прогулка
  const step = playing ? 2 : sel === "custom" || passed >= 0 ? 1 : 0;

  return (
    <section className="tb tb-route" style={{ height: H.route }}>
      <TourMap
        stops={stops}
        legs={LEGS}
        hover={hover}
        onHover={setHover}
        focus={focus}
        playing={playing}
        onPlayStop={(i) => {
          setPassed(i);
          setHover(i);
        }}
        onPlayEnd={() => {
          setPlaying(false);
          setHover(null);
        }}
        pad={{ top: 150, bottom: 130, left: 780, right: 660 }}
        w={2000}
        h={H.route}
      />
      <div className="tb-route__fade" />

      <div className="tb-route__side">
        <Label n="02">Маршрут</Label>
        <h3>Маршрут под&nbsp;тебя — за&nbsp;минуту</h3>
        <ol className="tb-route__how">
          {["Настрой в телефоне", "Смотри его на карте", "Пройди по улицам"].map((x, i) => (
            <li key={x} className={step === i ? "is-on" : step > i ? "is-done" : ""}>
              <em>{step > i ? "✓" : i + 1}</em>
              {x}
            </li>
          ))}
        </ol>

        <div className="tb-route__card">
          <div className="tb-route__tabs">
            {options.map((o) => (
              <button key={o.id} type="button" data-ui className={o.id === sel ? "is-on" : ""} onClick={() => setSel(o.id)}>
                {o.name}
              </button>
            ))}
          </div>
          <div className="tb-route__head">
            <b>{title}</b>
            <div className="tb-route__stats">
              <span>
                <b>{stops.length}</b> мест
              </span>
              <span>
                <b>{w.km}</b> км
              </span>
              <span>
                <b>{w.min}</b> мин пешком
              </span>
            </div>
          </div>
          <ol ref={list} className="tb-route__stops">
            {stops.map((id, i) => {
              const p = PLACES[id];
              const leg = i > 0 ? legOf(LEGS, stops[i - 1], id) : null;
              return (
                <li
                  key={id}
                  className={`${hover === i ? "is-on" : ""}${passed >= i ? " is-passed" : ""}`}
                  style={{ "--c": KIND_COLOR[p.kind] } as React.CSSProperties}
                >
                  {leg && (
                    <span className="tb-route__leg">
                      <Steps />
                      {leg.t} мин · {fmtDist(leg.d)}
                    </span>
                  )}
                  <button
                    type="button"
                    data-ui
                    onPointerEnter={() => setHover(i)}
                    onPointerLeave={() => setHover(null)}
                    onClick={() => setFocus(i)}
                  >
                    <em>{i + 1}</em>
                    <span>
                      <b>{p.name}</b>
                      <small>
                        {p.tag} · {p.time}
                      </small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <button type="button" data-ui className={`tb-route__play${playing ? " is-on" : ""}`} onClick={togglePlay}>
            <i />
            {playing ? "Остановить прогулку" : "Пройти маршрут"}
          </button>
        </div>
      </div>

      <div className="tb-route__phone">
        <span className="tb-route__tip">Настрой маршрут здесь</span>
        <Device bezel="silver" className="is-live">
          <div ref={phoneView} className="tb-device__view is-scroll is-bar">
            <Builder
              onBuilt={(r) => {
                setCustom(r);
                setSel("custom");
              }}
              onPlay={togglePlay}
              playing={playing}
            />
          </div>
        </Device>
      </div>
    </section>
  );
}

/* ---------- 05. экраны ---------- */

function Screens() {
  return (
    <section className="tb tb-screens" style={{ height: H.screens }}>
      <div className="tb-screens__head">
        <Label n="03">Экраны</Label>
        <h3>От первого знакомства до карточки места</h3>
      </div>
      <div className="tb-screens__row">
        <figure className="tb-screens__onb">
          <div className="tb-screens__fan">
            <Phone screen="onb-1" bezel="blue" className="is-fan-1" />
            <Phone screen="onb-2" bezel="blue" className="is-fan-2" />
            <Phone screen="onb-3" bezel="blue" className="is-fan-3" />
          </div>
          <figcaption>Онбординг: город, простота, контроль</figcaption>
        </figure>
        {[
          { s: "routes", t: "Все маршруты" },
          { s: "route", t: "Маршрут" },
          { s: "place", t: "Место" },
        ].map((x) => (
          <figure key={x.s}>
            <Phone screen={x.s} bezel="blue" scroll />
            <figcaption>{x.t}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ---------- 06. путешествия как игра ---------- */

function Social() {
  return (
    <section className="tb tb-social" style={{ height: H.social }}>
      <img className="tb-social__bg" src={tourPhoto("romantsevo")} alt="" loading="lazy" draggable={false} />
      <div className="tb-social__head">
        <Label n="04" light>
          Путешествия как игра
        </Label>
        <h3>Километры, места и рейтинг города</h3>
        <p>За пройденные маршруты копятся баллы: можно сравнить себя с другими туристами и вернуться за новыми точками.</p>
      </div>
      <div className="tb-social__row">
        {[
          { s: "menu", t: "Меню и достижения", badge: "19 км за 3 дня" },
          { s: "rating", t: "Таблица лидеров", badge: "6 место · 7 900" },
          { s: "history", t: "История маршрутов", badge: "оценки и даты" },
          { s: "settings", t: "Публичный профиль", badge: "соцсети и ссылка" },
        ].map((x) => (
          <figure key={x.s}>
            <span className="tb-badge">{x.badge}</span>
            <Phone screen={x.s} />
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
        <Label n="05">Дизайн</Label>
        <h3>Небо, купола и кирпич — цвета самой Тулы</h3>
      </div>
      <div className="tb-palette">
        {TOUR_PALETTE.map((p) => (
          <div key={p.hex} className="tb-swatch" style={{ "--c": p.hex } as React.CSSProperties}>
            <span>{p.hex}</span>
            <b>{p.name}</b>
            <small>{p.role}</small>
          </div>
        ))}
      </div>
      <div className="tb-system__grid">
        <div className="tb-type">
          <span className="tb-type__aa">Аа</span>
          <div>
            <b>PT Root UI</b>
            <span>Спокойный гротеск с русскими корнями — читается на ходу и на солнце.</span>
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
              <i />
              <i />
              <i />
              <i />
              <i />
              <small>211 оценок</small>
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
  const [i, setI] = useState(0);
  const n = DECK.length;
  return (
    <section className="tb tb-outro" style={{ height: H.outro }}>
      <img className="tb-outro__bg" src={tourPhoto("aerial")} alt="" loading="lazy" draggable={false} />
      <div className="tb-outro__head">
        <Label n="06" light>
          Презентация стартапа
        </Label>
      </div>
      <div className="tb-deck">
        <div className="tb-deck__screen">
          <img key={i} src={deckSlide(DECK[i])} alt={`Слайд ${i + 1}`} loading="lazy" draggable={false} />
          <span className="tb-deck__count">
            {i + 1} / {n}
          </span>
          <button type="button" data-ui className="tb-deck__arrow is-prev" onClick={() => setI((x) => (x - 1 + n) % n)} aria-label="Предыдущий слайд">
            <svg viewBox="0 0 24 24">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button type="button" data-ui className="tb-deck__arrow is-next" onClick={() => setI((x) => (x + 1) % n)} aria-label="Следующий слайд">
            <svg viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="tb-deck__strip">
          {DECK.map((num, k) => (
            <button key={num} type="button" data-ui className={k === i ? "is-on" : ""} onClick={() => setI(k)}>
              <img src={deckSlide(num, true)} alt="" loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
      </div>
      <div className="tb-outro__end">
        <b>Спасибо, что прошёл маршрут до конца</b>
        <a data-ui className="tb-outro__cta" href={LINKS.telegram} target="_blank" rel="noopener noreferrer">
          Обсудить проект ↗
        </a>
      </div>
    </section>
  );
}

export function CaseTour({ selected }: { selected: string | null }) {
  return (
    <Frame meta={frameById("case-tour")} selected={selected === "case-tour"} className="tb-case" noSelect>
      <div className="tb-case__boards">
        <Hero />
        <About />
        <RouteBoard />
        <Screens />
        <Social />
        <System />
        <Outro />
      </div>
    </Frame>
  );
}
