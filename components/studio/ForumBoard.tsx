"use client";

import { useEffect, useState } from "react";
import { frameById } from "./data";
import { Frame } from "./Frame";

/* eslint-disable @next/next/no-img-element */

/*
 * Оформление форума «Российское село — место силы»: экраны сцены в двух форматах.
 * Борд собран как сцена: главный экран 32:9 и боковой 16:9 показывают один и тот же шаблон,
 * шаблоны листаются сами и по клику на вкладку. Фон — фирменный паттерн форума на градиенте.
 */

const DIR = "/images/projects/forum";
const SCREENS = [
  { tab: "Заставка", note: "Название сессии — крупно, на весь экран" },
  { tab: "Спикеры", note: "Два выступающих: фото, имя и должность" },
  { tab: "Панель", note: "До шести участников панельной сессии" },
  { tab: "Тема", note: "Спикер и тема его выступления" },
];
const STEP_MS = 3600;

export function ForumBoard({ selected }: { selected: boolean }) {
  const [cur, setCur] = useState(0);
  const [auto, setAuto] = useState(true);

  // шаблоны листаются сами, пока посетитель не выбрал вкладку
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setCur((v) => (v + 1) % SCREENS.length), STEP_MS);
    return () => clearInterval(id);
  }, [auto]);

  return (
    <Frame meta={frameById("forum")} selected={selected} className="st-forum">
      <img className="st-forum__pattern" src={`${DIR}/pattern.svg`} alt="" draggable={false} />

      <header className="st-forum__head">
        <div>
          <span className="st-forum__kicker">Оформление форума</span>
          <h3>
            Российское село —<br />
            место силы
          </h3>
        </div>
        <p>
          Экраны сцены для форума: заставки сессий, плашки спикеров и темы выступлений. Каждый шаблон сделан в двух
          форматах — под главный и боковой экраны.
        </p>
      </header>

      <div className="st-forum__tabs" data-ui>
        {SCREENS.map((s, i) => (
          <button
            key={s.tab}
            type="button"
            className={i === cur ? "is-on" : ""}
            onClick={() => {
              setAuto(false);
              setCur(i);
            }}
          >
            {s.tab}
            {i === cur && auto && <i style={{ animationDuration: `${STEP_MS}ms` }} />}
          </button>
        ))}
        <span>{SCREENS[cur].note}</span>
      </div>

      {/* главный экран сцены */}
      <figure className="st-forum__main">
        {SCREENS.map((s, i) => (
          <img key={s.tab} className={i === cur ? "is-on" : ""} src={`${DIR}/main-${i + 1}.webp`} alt="" loading="lazy" draggable={false} />
        ))}
        <figcaption>Главный экран · 3840 × 1080</figcaption>
      </figure>

      <div className="st-forum__row">
        <figure className="st-forum__side">
          {SCREENS.map((s, i) => (
            <img key={s.tab} className={i === cur ? "is-on" : ""} src={`${DIR}/side-${i + 1}.webp`} alt="" loading="lazy" draggable={false} />
          ))}
          <figcaption>Боковой экран · 1920 × 1080</figcaption>
        </figure>
        <figure className="st-forum__photo">
          <img src={`${DIR}/photo-1.webp`} alt="" loading="lazy" draggable={false} />
          <figcaption>На сцене</figcaption>
        </figure>
        <figure className="st-forum__photo">
          <img src={`${DIR}/photo-2.webp`} alt="" loading="lazy" draggable={false} />
          <figcaption>В зале</figcaption>
        </figure>
      </div>

      <ul className="st-forum__specs">
        <li>
          <b>4</b> шаблона экранов
        </li>
        <li>
          <b>2</b> формата: 32:9 и 16:9
        </li>
        <li>
          <i className="st-forum__grad" />
          #1354A1 → #1E4EDB
        </li>
        <li>Паттерн из пиктограмм села</li>
      </ul>
    </Frame>
  );
}
