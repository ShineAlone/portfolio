"use client";

import { useEffect, useRef, useState } from "react";
import { isStudioBusy, onStudioActivity } from "./drive";
import { frameById } from "./data";
import { earnAch } from "./earn";
import { Frame } from "./Frame";

/* eslint-disable @next/next/no-img-element */

/*
 * Брендинг форума «Российское село — место силы»: на борде показаны экраны сцены.
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
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = stage.current;
    if (!auto || !element) return;
    let visible = false;
    let timer = 0;
    const sync = () => {
      window.clearInterval(timer);
      if (visible && !document.hidden && !isStudioBusy() &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        timer = window.setInterval(() => setCur((value) => (value + 1) % SCREENS.length), STEP_MS);
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(element);
    const off = onStudioActivity(sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      off();
      document.removeEventListener("visibilitychange", sync);
      window.clearInterval(timer);
    };
  }, [auto]);

  return (
    <Frame meta={frameById("forum")} selected={selected} className="st-forum">
      <span ref={stage} className="st-forum__visibility" aria-hidden />
      <img className="st-forum__pattern" src={`${DIR}/pattern.svg`} alt="" loading="lazy" draggable={false} />

      <header className="st-forum__head">
        <div>
          <span className="st-forum__kicker">Брендинг мероприятия</span>
          <h3>
            Российское село —<br />
            место силы
          </h3>
        </div>
        <p>
          Полный брендинг форума: экраны сцены, бейджи, ленты для бейджей и другие материалы. Здесь — экраны:
          заставки сессий, плашки спикеров и темы выступлений.
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
              earnAch("forum");
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
        <figcaption>Главный экран</figcaption>
      </figure>

      <div className="st-forum__row">
        <figure className="st-forum__side">
          {SCREENS.map((s, i) => (
            <img key={s.tab} className={i === cur ? "is-on" : ""} src={`${DIR}/side-${i + 1}.webp`} alt="" loading="lazy" draggable={false} />
          ))}
          <figcaption>Боковой экран</figcaption>
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

    </Frame>
  );
}
