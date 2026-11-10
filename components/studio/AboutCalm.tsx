"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { EDUCATION, HERO, LINKS, STATS, TOOLS, WORK } from "@/lib/content";

/* eslint-disable @next/next/no-img-element */

/*
 * Спокойный вариант блока «Обо мне»: визитка и сетка плиток вместо коллажа с наклейками и чата.
 * Живёт на отдельной странице /v2/about-preview — основной холст не трогает.
 */

const AREAS = ["Интерфейсы", "Сайты", "Презентации", "Соцсети", "Брендинг мероприятий", "Реклама", "Айдентика", "Полиграфия"];
const EDU_YEARS = `${EDUCATION.years[0]}–${EDUCATION.years[1].replace(/^[–-]\s*/, "")}`;
const TULA: [number, number] = [37.6175, 54.193];

// число «докручивается» при появлении: «>2000» → считает до 2000 и сохраняет знак
function Count({ value, run }: { value: string; run: boolean }) {
  const target = parseInt(value.replace(/\D/g, ""), 10);
  const prefix = value.replace(/[\d\s]/g, "");
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const f = Math.min(1, (now - t0) / 1100);
      setN(Math.round(target * (1 - Math.pow(1 - f, 3))));
      if (f < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target]);
  return (
    <>
      {prefix}
      {n}
    </>
  );
}

// маленькая неподвижная карта с точкой на Туле
function CityMap() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let dead = false;
    let map: import("maplibre-gl").Map | undefined;
    import("maplibre-gl").then(({ default: ml }) => {
      if (dead || !ref.current) return;
      map = new ml.Map({
        container: ref.current,
        style: "https://tiles.openfreemap.org/styles/positron",
        center: TULA,
        zoom: 10.6,
        interactive: false,
        attributionControl: { compact: true },
        fadeDuration: 0,
      });
      map.on("load", () => {
        for (const l of map!.getStyle().layers) {
          if (l.type !== "symbol" || !map!.getLayoutProperty(l.id, "text-field")) continue;
          try {
            map!.setLayoutProperty(l.id, "text-field", ["coalesce", ["get", "name:ru"], ["get", "name"]]);
          } catch {}
        }
        const el = document.createElement("i");
        el.className = "ab-pin";
        new ml.Marker({ element: el }).setLngLat(TULA).addTo(map!);
      });
    });
    return () => {
      dead = true;
      map?.remove();
    };
  }, []);
  return <div ref={ref} className="ab-map" aria-hidden />;
}

export function AboutCalm() {
  const [on, setOn] = useState(false);
  // входная анимация запускается через кадр после загрузки
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 120);
    return () => clearTimeout(t);
  }, []);
  return (
    <main className="ab">
      <AboutCalmBody on={on} />
    </main>
  );
}

// Само содержимое блока — используется и на отдельной странице, и внутри холста спокойной версии.
export function AboutCalmBody({ on }: { on: boolean }) {
  const [open, setOpen] = useState(0);
  return (
      <div className={`ab__wrap${on ? " is-on" : ""}`}>
        <header className="ab-head">
          <div className="ab-photo">
            <img src="/images/photo.png" alt="Арсений Кононов" draggable={false} />
          </div>
          <div className="ab-head__text">
            <h1>
              <span>Привет, я Арсений Кононов —</span> <span>дизайнер широкого профиля.</span>{" "}
              <span className="is-muted">В дизайне с 2021 года.</span>
            </h1>
            <p>{HERO.paragraphs[0]}</p>
            <div className="ab-head__row">
              <span className="ab-status">
                <i />
                {HERO.statusLabel}
              </span>
              <a data-ui className="ab-btn" href={LINKS.telegram} target="_blank" rel="noopener noreferrer">
                Написать в Telegram
                <svg viewBox="0 0 16 16" aria-hidden>
                  <path d="M4 12L12 4M6 4h6v6" />
                </svg>
              </a>
            </div>
          </div>
        </header>

        <div className="ab-grid">
          <section className="ab-tile is-exp" style={{ "--i": 0 } as React.CSSProperties}>
            <span className="ab-tag">Опыт</span>
            <ol className="ab-exp">
              {WORK.map((w, i) => (
                <li key={w.company} className={open === i ? "is-open" : ""}>
                  <button type="button" data-ui onClick={() => setOpen(i)} aria-expanded={open === i}>
                    <small>{w.period.replace("\n", " ")}</small>
                    <b>{w.company}</b>
                    <span>{w.role}</span>
                  </button>
                  <div className="ab-exp__more">
                    <p>{w.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="ab-tile is-stats" style={{ "--i": 1 } as React.CSSProperties}>
            <span className="ab-tag">В цифрах</span>
            <dl className="ab-stats">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt>
                    <Count value={s.value} run={on} />
                  </dt>
                  <dd>{s.label}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="ab-tile is-skills" style={{ "--i": 2 } as React.CSSProperties}>
            <span className="ab-tag">С чем работаю</span>
            <ul className="ab-chips">
              {AREAS.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </section>

          <section className="ab-tile is-tools" style={{ "--i": 3 } as React.CSSProperties}>
            <span className="ab-tag">{TOOLS.title}</span>
            <ul className="ab-tools">
              {TOOLS.icons.map((t) => (
                <li key={t.alt} title={t.alt}>
                  <span className={t.boxed ? "is-boxed" : ""}>
                    <img src={t.src} alt="" draggable={false} />
                  </span>
                  {t.alt}
                </li>
              ))}
            </ul>
          </section>

          <section className="ab-tile is-edu" style={{ "--i": 4 } as React.CSSProperties}>
            <span className="ab-tag">{EDUCATION.title}</span>
            <b className="ab-title">{EDUCATION.lines[0]}</b>
            <p>{EDUCATION.lines[1]}</p>
            <small className="ab-years">{EDU_YEARS}</small>
          </section>

          <section className="ab-tile is-city" style={{ "--i": 5 } as React.CSSProperties}>
            <CityMap />
            <span className="ab-tag is-over">Где я</span>
            <div className="ab-city">
              <b>Тула</b>
              <span>МСК · работаю удалённо</span>
            </div>
          </section>

          <section className="ab-tile is-side" style={{ "--i": 6 } as React.CSSProperties}>
            <span className="ab-tag">Вне работы</span>
            <b className="ab-title">Свой стартап и вайб-кодинг</b>
            <p>
              Сделал туристическое приложение «Шагай и точка» — проект выиграл грант. Для себя собираю Figma-плагины и
              небольшие сервисы.
            </p>
            <a data-ui className="ab-link" href="/v2?canvas">
              Смотреть в «Лаборатории»
              <svg viewBox="0 0 16 16" aria-hidden>
                <path d="M4 12L12 4M6 4h6v6" />
              </svg>
            </a>
          </section>
        </div>
      </div>
  );
}
