"use client";

import { useState } from "react";
import { frameById } from "./data";
import { Frame } from "./Frame";
import { HR_LOOP, HR_PROBLEMS, HR_SIDES, SKIN_COLORS, caseSrc, caseThumb, skinSrc } from "./cases";

/* eslint-disable @next/next/no-img-element */

/*
 * Кейс «HR-платформа с сезонами»: описание, живой просмотрщик экранов двух кабинетов,
 * задача → решение, конструктор аватара на настоящих скинах продукта, цикл сезона
 * и лента наград за уровни. Презентация с защиты (deck) стоит рядом и рендерится в World.
 */

// ширина «экрана» в окне браузера (карточка 1400 − отступы 2×24 − рамка 2×3) и высота в пропорциях 1440×1024
const SCREEN_W = 1346;
const SCREEN_H = Math.round((SCREEN_W * 1024) / 1440);

const PATHS: Record<string, string> = {
  "emp-main": "season",
  "emp-week": "season/week-1",
  "emp-track": "tracks/intro",
  "emp-track-levels": "tracks/intro/levels",
  "emp-pass": "season/pass",
  "emp-reward": "season/pass/reward",
  "emp-profile": "profile",
  "emp-rating": "rating",
  "emp-shop": "shop",
  "emp-season": "season/achievements",
  "hr-main": "hr",
  "hr-analytics": "hr/tracks/analytics",
  "hr-moderation": "hr/moderation",
  "hr-seasons": "hr/seasons",
  "hr-weekly": "hr/editor/weekly",
  "hr-levels": "hr/editor/levels",
  "hr-seasonal": "hr/editor/seasonal",
  "hr-shop": "hr/shop",
};

function Intro({ selected }: { selected: boolean }) {
  return (
    <Frame meta={frameById("case-hr-intro")} selected={selected} className="st-card cx cx-intro">
      <div className="cx-cover">
        <img src={caseSrc("cover")} alt="" loading="lazy" draggable={false} />
        <span className="cx-cover__season">Сезон 1 · «Только начало»</span>
      </div>
      <div className="cx-intro__body">
        <span className="cx-kicker">кейс · продукт с нуля</span>
        <h3 className="cx-title">HR-платформа, где адаптация — это игровой сезон</h3>
        <p className="cx-lead">
          Веб-платформа для привлечения и адаптации сотрудников. Новичок проходит онбординг как сезон в игре:
          выполняет миссии, растёт в уровне, собирает скины, артефакты и бейджи. А HR собирает треки и задания
          прямо в интерфейсе и видит, кто застрял.
        </p>
        <div className="cx-facts">
          <div>
            <small>Роль</small>
            <b>Дизайн продукта</b>
            <span>сценарии, интерфейсы, персонажи</span>
          </div>
          <div>
            <small>Продукт</small>
            <b>2 кабинета</b>
            <span>сотрудника и HR</span>
          </div>
          <div>
            <small>Коллекция</small>
            <b>49 скинов</b>
            <span>7 цветов × 7 персонажей</span>
          </div>
        </div>
        <div className="cx-award">
          <span className="cx-award__cup">🏆</span>
          <div>
            <b>Проект хакатона</b>
            <span>Место и номинацию скоро добавлю</span>
          </div>
        </div>
      </div>
    </Frame>
  );
}

function Screens({ selected }: { selected: boolean }) {
  const [side, setSide] = useState(0);
  const [index, setIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const set = HR_SIDES[side];
  const s = set.screens[index];
  const tall = s.h / s.w > 1024 / 1440 + 0.02;
  const imgH = (SCREEN_W * s.h) / s.w;
  // длинные экраны на наведении прокручиваются — со скоростью ~450 px/с
  const dur = Math.max(1.5, (imgH - SCREEN_H) / 450);
  const go = (d: number) => {
    setScrolled(false);
    setIndex((i) => (i + d + set.screens.length) % set.screens.length);
  };
  return (
    <Frame meta={frameById("case-hr-screens")} selected={selected} className="st-card cx cx-screens">
      <div className="cx-switch">
        <div className="cx-switch__track" data-ui>
          <i style={{ transform: `translateX(${side * 100}%)` }} />
          {HR_SIDES.map((x, i) => (
            <button
              key={x.id}
              type="button"
              data-ui
              className={i === side ? "is-active" : ""}
              onClick={() => {
                setSide(i);
                setIndex(0);
                setScrolled(false);
              }}
            >
              {x.name}
            </button>
          ))}
        </div>
        <span className="cx-switch__hint">{set.hint}</span>
      </div>

      <div className="cx-window">
        <div className="cx-window__bar">
          <i />
          <i />
          <i />
          <span>app.technopolis.ru/{PATHS[s.id]}</span>
        </div>
        <div
          className={`cx-window__screen${tall ? " is-tall" : ""}${scrolled ? " is-scrolled" : ""}`}
          style={{ "--sh": `${SCREEN_H}px`, "--dur": `${dur}s` } as React.CSSProperties}
          onClick={() => tall && setScrolled((v) => !v)}
          data-ui={tall ? "" : undefined}
        >
          <img key={s.id} src={caseSrc(s.id)} alt={s.title} draggable={false} />
        </div>
        <button type="button" data-ui className="cx-arrow is-prev" onClick={() => go(-1)} aria-label="Предыдущий экран">
          ←
        </button>
        <button type="button" data-ui className="cx-arrow is-next" onClick={() => go(1)} aria-label="Следующий экран">
          →
        </button>
      </div>

      <div className="cx-caption">
        <b>
          <em>
            {index + 1}/{set.screens.length}
          </em>
          {s.title}
        </b>
        <p>{s.text}</p>
      </div>

      <div className="cx-thumbs">
        {set.screens.map((x, i) => (
          <button
            key={x.id}
            type="button"
            data-ui
            className={i === index ? "is-active" : ""}
            onClick={() => {
              setIndex(i);
              setScrolled(false);
            }}
            title={x.title}
          >
            <img src={caseThumb(x.id)} alt="" loading="lazy" draggable={false} />
          </button>
        ))}
      </div>
    </Frame>
  );
}

function Results({ selected }: { selected: boolean }) {
  return (
    <Frame meta={frameById("case-hr-results")} selected={selected} className="cx cx-results">
      <span className="cx-kicker">итоги</span>
      <b className="cx-subtitle">Результаты хакатона</b>
      <p>Место, номинацию и отзывы жюри добавлю совсем скоро.</p>
      <div className="cx-results__slots">
        <span>место</span>
        <span>команд</span>
        <span>часов на проект</span>
      </div>
    </Frame>
  );
}

function Problem({ selected }: { selected: boolean }) {
  return (
    <Frame meta={frameById("case-hr-problem")} selected={selected} className="st-card cx cx-problem">
      <span className="cx-kicker">задача → решение</span>
      <b className="cx-subtitle">Почему адаптация буксует</b>
      <div className="cx-problem__rows">
        {HR_PROBLEMS.map((p, i) => (
          <div key={i} className="cx-problem__row" style={{ "--c": p.color, "--i": i } as React.CSSProperties}>
            <p className="is-pain">
              <i>✕</i>
              {p.pain}
            </p>
            <span className="cx-problem__arrow">→</span>
            <p className="is-fix">
              <i>✓</i>
              {p.fix}
            </p>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function Avatar({ selected }: { selected: boolean }) {
  const [color, setColor] = useState(4);
  const [skin, setSkin] = useState(4);
  const c = SKIN_COLORS[color];
  return (
    <Frame meta={frameById("case-hr-avatar")} selected={selected} className="st-card cx cx-avatar">
      <div className="cx-avatar__stage" style={{ "--c": c.color } as React.CSSProperties}>
        <img key={`${color}-${skin}`} src={skinSrc(color, skin)} alt="" draggable={false} />
        <span>
          коллекция {c.name} · скин {skin + 1} из 7
        </span>
      </div>
      <div className="cx-avatar__panel">
        <span className="cx-kicker">попробуй сам</span>
        <b className="cx-subtitle">Собери аватар</b>
        <p>
          В продукте аватар — это 3D-персонаж. Скины выдаются за уровни и задания и продаются в магазине — это
          главная коллекционная мотивация сезона.
        </p>
        <small>Цвет коллекции</small>
        <div className="cx-avatar__colors">
          {SKIN_COLORS.map((x, i) => (
            <button
              key={x.name}
              type="button"
              data-ui
              className={i === color ? "is-active" : ""}
              style={{ "--c": x.color } as React.CSSProperties}
              onClick={() => setColor(i)}
              aria-label={`Коллекция: ${x.name}`}
            />
          ))}
        </div>
        <small>Скин</small>
        <div className="cx-avatar__skins">
          {Array.from({ length: 7 }, (_, i) => (
            <button
              key={i}
              type="button"
              data-ui
              className={i === skin ? "is-active" : ""}
              onClick={() => setSkin(i)}
              aria-label={`Скин ${i + 1}`}
            >
              <img src={skinSrc(color, i)} alt="" loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
      </div>
    </Frame>
  );
}

function Loop({ selected }: { selected: boolean }) {
  return (
    <Frame meta={frameById("case-hr-loop")} selected={selected} className="st-card cx cx-loop">
      <span className="cx-kicker">механика</span>
      <b className="cx-subtitle">Как работает сезон</b>
      <div className="cx-loop__steps">
        {HR_LOOP.map((s, i) => (
          <div key={s.title} className="cx-loop__step" style={{ "--i": i } as React.CSSProperties}>
            <span className="cx-loop__icon">{s.icon}</span>
            <em>0{i + 1}</em>
            <b>{s.title}</b>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
      <p className="cx-loop__note">
        Сезон 1 идёт с 16.10 по 20.12. Потом — новый сезон, новый пропуск и новые награды, а рейтинг обнуляется.
      </p>
    </Frame>
  );
}

function Levels({ selected }: { selected: boolean }) {
  return (
    <Frame meta={frameById("case-hr-levels")} selected={selected} className="st-card cx cx-levels">
      <div className="cx-levels__head">
        <b className="cx-subtitle">Награды за уровни сезонного пропуска</b>
        <p>Каждый уровень что-то даёт: бейдж, артефакт с бонусом к опыту, новые цвета аватара или скин.</p>
      </div>
      <div className="cx-levels__strip">
        <img src={caseSrc("lvl-rewards")} alt="Первые 15 уровней сезонного пропуска" loading="lazy" draggable={false} />
      </div>
    </Frame>
  );
}

export function CaseHR({ selected }: { selected: string | null }) {
  return (
    <>
      <Intro selected={selected === "case-hr-intro"} />
      <Screens selected={selected === "case-hr-screens"} />
      <Results selected={selected === "case-hr-results"} />
      <Problem selected={selected === "case-hr-problem"} />
      <Avatar selected={selected === "case-hr-avatar"} />
      <Loop selected={selected === "case-hr-loop"} />
      <Levels selected={selected === "case-hr-levels"} />
    </>
  );
}
