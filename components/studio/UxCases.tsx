"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { frameById } from "./data";
import { Frame } from "./Frame";

/*
 * Два мини-кейса про сложные интерфейсы — на одной доске с переключателем.
 * Экраны не картинки, а живая вёрстка по макетам: в первом сервисе объект открывает свои каналы,
 * канал — график; во втором список судов связан с картой и карточкой юнита.
 * Все названия, показатели и логотипы вымышленные: реальные данные заказчика не используются.
 */

/* ---------- значки ---------- */

const ICONS: Record<string, React.ReactNode> = {
  objects: <path d="M4 5h16M4 12h16M4 19h16M8 5v0M8 12v0M8 19v0" />,
  map: <path d="M3 6.5l6-2.5 6 2.5 6-2.500v13.500l-6 2.5-6-2.5-6 2.500V6.500zm6-2.500v13.500m6-11v13.5" />,
  chart: <path d="M4 19V5m0 14h16M8 15l3.5-4 3 2.500L19 8" />,
  alert: <path d="M12 4l9 15.500H3L12 4zm0 6v4m0 3v.5" />,
  users: <path d="M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm-6 9a6 6 0 0112 0M16 4.500a3.5 3.5 0 010 6.500M17 14a6 6 0 014 6" />,
  log: <path d="M6 3h9l4 4v14H6V3zm8 0v5h5M9 12h7M9 16h7" />,
  settings: <path d="M12 9a3 3 0 100 6 3 3 0 000-6zm8 3l-1.8-.7-.5-1.3.800-1.8-1.5-1.5-1.8.800-1.3-.500L13 4h-2l-.7 1.8-1.3.500-1.8-.8-1.5 1.5.800 1.8-.5 1.300L4 11v2l1.8.700.5 1.3-.8 1.8 1.5 1.5 1.8-.8 1.3.500L11 20h2l.7-1.8 1.3-.5 1.8.800 1.5-1.5-.8-1.8.500-1.300L20 13v-1z" />,
  search: <path d="M10.5 4a6.5 6.5 0 110 13 6.5 6.5 0 010-13zM20 20l-4.8-4.8" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  report: <path d="M7 3h10v18H7V3zm3 5h4m-4 4h4m-4 4h2" />,
  manage: <path d="M5 7h8m4 0h2M5 12h2m4 0h8M5 17h10m4 0h0M15 5v4M9 10v4M17 15v4" />,
  plug: <path d="M9 3v5m6-5v5M6 8h12v3a6 6 0 01-12 0V8zm6 9v4" />,
  bell: <path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15L6 16zm4 4.500h4" />,
  moon: <path d="M19 14.500A8 8 0 019.5 5a8 8 0 109.5 9.500z" />,
  globe: <path d="M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />,
  ship: <path d="M4 15l1.5 4h13L20 15l-8-3-8 3zm3-1V8h10v6M11 8V4h2v4" />,
  target: <path d="M12 4a8 8 0 100 16 8 8 0 000-16zm0 5a3 3 0 100 6 3 3 0 000-6z" />,
  speed: <path d="M4 16a8 8 0 1116 0M12 16l4-5" />,
  compass: <path d="M12 3a9 9 0 100 18 9 9 0 000-18zm3.5 5.500l-2 5-5 2 2-5 5-2z" />,
  battery: <path d="M4 8h14v8H4V8zm14 3h2v2h-2M7 11v2m3-2v2" />,
  fuel: <path d="M12 3c3 4 5 6.5 5 9.500a5 5 0 01-10 0C7 9.5 9 7 12 3z" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevron: <path d="M8 10l4 4 4-4" />,
};

function Ic({ id, size = 18 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[id]}
    </svg>
  );
}

// детерминированный генератор — данные одинаковые при каждой загрузке
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- сервис 1: мониторинг объектов ---------- */

const GROUPS = ["#7ea7e0", "#f0b35c", "#6cc4a1", "#c59be8"];
const OBJ_NAMES = ["Станция Северная-1", "Узел учёта № 14", "Станция Алексин", "Пункт редуцирования 7", "Станция Заокская", "Узел учёта № 22", "Станция Упа-3", "Пункт редуцирования 2", "Станция Южная-4", "Узел учёта № 31", "Станция Ока-2", "Пункт редуцирования 9", "Станция Щёкино", "Узел учёта № 8"];
const ERRORS = ["Нет связи", "Ниже нормы", "Перегрев", "Обрыв цепи", "Дверь открыта"];
const NOTES = ["Плановый осмотр 14.03", "Замена датчика", "—", "Под наблюдением", "—", "Выезд бригады"];

const OBJECTS = (() => {
  const r = rng(7);
  return OBJ_NAMES.map((name, i) => ({
    id: 1040 + i * 3,
    name,
    group: Math.floor(r() * 4),
    errors: Array.from({ length: r() < 0.35 ? 0 : r() < 0.6 ? 1 : 2 }, () => ERRORS[Math.floor(r() * ERRORS.length)]).filter((v, k, a) => a.indexOf(v) === k),
    note: NOTES[Math.floor(r() * NOTES.length)],
    channels: 96 + Math.floor(r() * 40),
  }));
})();

const CH_DEFS: [string, string, number, number][] = [
  ["Ток защиты", "А", 12.4, 2.2],
  ["Напряжение на выходе", "В", 24.1, 1.6],
  ["Потенциал «труба — земля»", "В", -1.12, 0.14],
  ["Температура в шкафу", "°C", 31, 6],
  ["Вибрация", "мм/с²", 0.14, 0.08],
  ["Давление на входе", "МПа", 5.4, 0.3],
  ["Расход", "м³/ч", 840, 120],
  ["Напряжение сети", "В", 228, 9],
];
const OBJ_TABS = ["Таблица каналов", "Приборная панель", "Мнемосхема", "История комментариев", "Состояние", "Оборудование"];

function series(seed: number, base: number, amp: number) {
  const r = rng(seed);
  let v = base;
  return Array.from({ length: 49 }, () => {
    v += (r() - 0.5) * amp * 0.7 + (base - v) * 0.18;
    return v;
  });
}

function Chart({ data, unit }: { data: number[]; unit: string }) {
  const W = 560;
  const H = 210;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = (max - min) * 0.2 || 1;
  const y = (v: number) => H - 24 - ((v - (min - pad)) / (max - min + pad * 2)) * (H - 40);
  const x = (i: number) => 44 + (i / (data.length - 1)) * (W - 56);
  const line = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => min - pad + (max - min + pad * 2) * t);
  return (
    <svg className="ux1-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`График значений, ${unit}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={44} x2={W - 12} y1={y(t)} y2={y(t)} />
          <text x={36} y={y(t) + 4} textAnchor="end">
            {Math.abs(t) >= 100 ? t.toFixed(0) : t.toFixed(2)}
          </text>
        </g>
      ))}
      {["18:00", "00:00", "06:00", "12:00", "18:00"].map((t, i) => (
        <text key={i} x={44 + (i / 4) * (W - 56)} y={H - 6} textAnchor="middle">
          {t}
        </text>
      ))}
      <path className="ux1-chart__area" d={`${line} L${x(data.length - 1)} ${H - 24} L${x(0)} ${H - 24} Z`} />
      <path className="ux1-chart__line" d={line} />
    </svg>
  );
}

function ServiceObjects() {
  const [obj, setObj] = useState<number | null>(2);
  const [ch, setCh] = useState<number | null>(2);
  const [grouped, setGrouped] = useState(true);
  const [tab, setTab] = useState(0);

  const list = useMemo(() => (grouped ? [...OBJECTS].sort((a, b) => a.group - b.group) : OBJECTS), [grouped]);
  const current = obj === null ? null : OBJECTS[obj];
  const channels = useMemo(() => {
    if (obj === null) return [];
    const r = rng(100 + obj);
    return CH_DEFS.map(([name, unit, base, amp], i) => {
      const data = series(obj * 31 + i, base, amp);
      return { name, unit, data, value: data[data.length - 1], good: r() > 0.18 };
    });
  }, [obj]);
  const chan = ch === null ? null : channels[ch];
  const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2));

  return (
    <div className="ux1">
      <aside className="ux1-side">
        <span className="ux1-logo" />
        {["objects", "map", "chart", "alert", "users", "log", "settings"].map((id, i) => (
          <i key={id} className={i === 0 ? "is-on" : ""}>
            <Ic id={id} />
          </i>
        ))}
      </aside>

      <section className="ux1-list">
        <h4>Список объектов</h4>
        <p>Всего объектов: 527</p>
        <div className="ux1-row">
          <span className="ux1-muted">Группировать по:</span>
          <button type="button" data-ui className={`ux1-pill${grouped ? " is-on" : ""}`} onClick={() => setGrouped((g) => !g)}>
            {grouped ? "Тип объекта" : "Без группировки"}
            <Ic id="chevron" size={14} />
          </button>
        </div>
        <div className="ux1-row">
          <span className="ux1-search">
            <Ic id="search" size={15} />
            Поиск
          </span>
          <span className="ux1-ghost">
            <Ic id="filter" size={15} />
            Фильтр
          </span>
        </div>
        <div className="ux1-table">
          <div className="ux1-tr is-head">
            <span>ID</span>
            <span>Имя</span>
            <span>Информация</span>
            <span>Комментарий</span>
          </div>
          {list.map((o) => {
            const i = OBJECTS.indexOf(o);
            return (
              <button
                key={o.id}
                type="button"
                data-ui
                className={`ux1-tr${obj === i ? " is-on" : ""}`}
                style={grouped ? ({ "--g": GROUPS[o.group] } as React.CSSProperties) : undefined}
                onClick={() => {
                  setObj(obj === i ? null : i);
                  setCh(null);
                }}
              >
                <span>{o.id}</span>
                <span>{o.name}</span>
                <span className="ux1-tags">{o.errors.length ? o.errors.map((e) => <em key={e}>{e}</em>) : <em className="is-ok">В норме</em>}</span>
                <span>{o.note}</span>
              </button>
            );
          })}
        </div>
        <div className="ux1-pages">
          Страница 3 из 30
          <span>
            <b>1</b> 2 3 … 10 11 12
          </span>
        </div>
      </section>

      {current ? (
        <section className="ux1-detail">
          <div className="ux1-card">
            <div className="ux1-row">
              <h5>{current.name}</h5>
              <span className="ux1-pill is-on">Сведения</span>
              <span className="ux1-ghost">Карта</span>
            </div>
            <div className="ux1-tabs">
              {OBJ_TABS.map((t, i) => (
                <button key={t} type="button" data-ui className={tab === i ? "is-on" : ""} onClick={() => setTab(i)}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="ux1-card is-grow">
            <p>Всего каналов: {current.channels}</p>
            <div className="ux1-table is-ch">
              <div className="ux1-tr is-head">
                <span>Название</span>
                <span>Значение</span>
                <span>Обновлено</span>
                <span>Состояние</span>
              </div>
              {channels.slice(0, chan ? 5 : 8).map((c, i) => (
                <button key={c.name} type="button" data-ui className={`ux1-tr${ch === i ? " is-on" : ""}`} onClick={() => setCh(ch === i ? null : i)}>
                  <span>{c.name}</span>
                  <span>
                    {fmt(c.value)} {c.unit}
                  </span>
                  <span>22.03.25 12:44</span>
                  <span className={c.good ? "is-good" : "is-bad"}>{c.good ? "GOOD" : "BAD"}</span>
                </button>
              ))}
            </div>
          </div>

          {chan && (
            <div className="ux1-card">
              <div className="ux1-row">
                <h5>{chan.name}</h5>
                <span className="ux1-pill is-on">График и значения</span>
                <span className="ux1-ghost">Состояние</span>
                <span className="ux1-muted is-right">Значений: 585</span>
              </div>
              <div className="ux1-graph">
                <ul>
                  {chan.data.slice(-5).map((v, i) => (
                    <li key={i}>
                      <b>
                        {fmt(v)} {chan.unit}
                      </b>
                      22.03.25 12:{String(40 + i).padStart(2, "0")}
                    </li>
                  ))}
                </ul>
                <Chart data={chan.data} unit={chan.unit} />
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="ux1-empty">Выбери объект в списке — справа откроются его каналы</section>
      )}
    </div>
  );
}

/* ---------- сервис 2: мониторинг флота ---------- */

type Unit = { id: string; name: string; lng: number; lat: number; speed: number; course: number; battery: number; fresh: boolean; link: string; diesel: number; oil: number };

const UNITS: Unit[] = [
  { id: "51830620", name: "Service Unit 7 FB", lng: 19.6, lat: 58.4, speed: 11, course: 214, battery: 82, fresh: true, link: "GSM", diesel: 3024, oil: 1180 },
  { id: "51830633", name: "Rita V", lng: 3.9, lat: 56.3, speed: 14, course: 96, battery: 64, fresh: true, link: "IR", diesel: 5410, oil: 2260 },
  { id: "51830641", name: "Vodnik 1", lng: 28.2, lat: 59.9, speed: 0, course: 0, battery: 20, fresh: false, link: "GSM", diesel: 840, oil: 310 },
  { id: "51830658", name: "Nordkap", lng: 14.8, lat: 68.9, speed: 9, course: 41, battery: 91, fresh: true, link: "IR", diesel: 7130, oil: 3020 },
  { id: "51830664", name: "Vodnik 2", lng: 33.4, lat: 44.2, speed: 7, course: 305, battery: 47, fresh: true, link: "GSM", diesel: 2190, oil: 905 },
  { id: "51830672", name: "Baltic Star", lng: 11.2, lat: 54.9, speed: 12, course: 78, battery: 73, fresh: true, link: "GSM", diesel: 4480, oil: 1740 },
  { id: "51830689", name: "Aurora", lng: -6.4, lat: 47.1, speed: 16, course: 187, battery: 58, fresh: false, link: "IR", diesel: 6020, oil: 2510 },
];
const NAV = [
  ["ship", "Мониторинг"],
  ["report", "Отчёты"],
  ["manage", "Управление"],
  ["plug", "Интеграции"],
];
const WIDGETS = [
  ["bell", "Уведомления"],
  ["moon", "Тёмная тема"],
  ["globe", "Сменить язык"],
];

function ServiceFleet() {
  const [sel, setSel] = useState<number | null>(0);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markers = useRef<HTMLElement[]>([]);

  // карта создаётся, когда доска оказалась в кадре: библиотека и тайлы не грузятся заранее
  useEffect(() => {
    const el = mapEl.current;
    if (!el) return;
    let dead = false;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || mapRef.current) return;
      io.disconnect();
      import("maplibre-gl").then(({ default: ml }) => {
        if (dead) return;
        const map = new ml.Map({
          container: el,
          style: "https://tiles.openfreemap.org/styles/positron",
          center: [16, 56],
          zoom: 2.6,
          interactive: false,
          attributionControl: { compact: true },
          fadeDuration: 0,
        });
        mapRef.current = map;
        UNITS.forEach((u, i) => {
          const m = document.createElement("button");
          m.type = "button";
          m.dataset.ui = "";
          m.className = `ux2-pin${u.fresh ? "" : " is-stale"}`;
          // поворот по курсу — у вложенного элемента: саму метку карта двигает через transform
          const tip = document.createElement("i");
          tip.style.setProperty("--a", `${u.course}deg`);
          m.appendChild(tip);
          m.addEventListener("click", () => setSel(i));
          markers.current[i] = m;
          new ml.Marker({ element: m }).setLngLat([u.lng, u.lat]).addTo(map);
        });
      });
    });
    io.observe(el);
    return () => {
      dead = true;
      io.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // выбранный юнит: карта подлетает к нему, метка подсвечивается
  useEffect(() => {
    markers.current.forEach((m, i) => m?.classList.toggle("is-on", i === sel));
    if (sel === null) return;
    const u = UNITS[sel];
    // центр карты сдвинут вправо от судна: метка остаётся слева от карточки, а не под ней
    mapRef.current?.flyTo({ center: [u.lng + 8, u.lat + 1.5], zoom: 4.2, duration: 900 });
  }, [sel]);

  const u = sel === null ? null : UNITS[sel];
  return (
    <div className="ux2">
      <aside className="ux2-side">
        <span className="ux2-brand">
          <i />
          FLEET<b>WATCH</b>
        </span>
        <small>Страницы</small>
        {NAV.map(([ic, name], i) => (
          <span key={name} className={`ux2-nav${i === 0 ? " is-on" : ""}`}>
            <Ic id={ic} size={17} />
            {name}
          </span>
        ))}
        <small>Виджеты</small>
        {WIDGETS.map(([ic, name]) => (
          <span key={name} className="ux2-nav">
            <Ic id={ic} size={17} />
            {name}
          </span>
        ))}
        <span className="ux2-user">
          <i>A</i>
          Admin
        </span>
      </aside>

      <section className="ux2-list">
        <h4>Мониторинг</h4>
        <span className="ux2-search">
          <Ic id="search" size={14} />
          Поиск
          <Ic id="filter" size={14} />
        </span>
        {UNITS.map((unit, i) => (
          <button key={unit.id} type="button" data-ui className={`ux2-unit${sel === i ? " is-on" : ""}${unit.fresh ? "" : " is-stale"}`} onClick={() => setSel(i)}>
            <i>
              <Ic id="ship" size={16} />
            </i>
            <span>
              <b>
                {unit.id} {unit.name}
              </b>
              <small>
                {unit.fresh ? "15.11.22 10:02" : "Данные не обновлялись 3 дня"} · {unit.speed} уз · {unit.course}° · {unit.link}
              </small>
            </span>
          </button>
        ))}
      </section>

      <section className="ux2-map">
        <div ref={mapEl} className="ux2-map__gl" aria-hidden />
        {u && (
          <div className="ux2-card">
            <div className="ux2-card__head">
              <b>
                {u.id} {u.name}
              </b>
              <button type="button" data-ui aria-label="Закрыть карточку" onClick={() => setSel(null)}>
                <Ic id="close" size={16} />
              </button>
            </div>
            <div className="ux2-card__tabs">
              <span className="is-on">Мониторинг</span>
              <span>Информация</span>
              <span>Управление</span>
              <span>Экспорт</span>
            </div>
            <div className="ux2-stats">
              {[
                ["target", "Координаты", `${u.lat.toFixed(4)}, ${u.lng.toFixed(4)}`],
                ["speed", "Скорость", `${u.speed} уз`],
                ["compass", "Курс", `${u.course}°`],
                ["battery", "Батарея", `${u.battery}%`],
              ].map(([ic, name, val]) => (
                <span key={name}>
                  <i>
                    <Ic id={ic} size={17} />
                  </i>
                  <b>{name}</b>
                  {val}
                </span>
              ))}
            </div>
            <div className="ux2-fuel">
              <span className="ux2-fuel__title">
                <i>
                  <Ic id="fuel" size={17} />
                </i>
                <b>Данные о топливе</b>
              </span>
              {[
                ["Остаток дизеля", u.diesel, "литров"],
                ["Плотность дизеля по бункерной расписке", 842, "кг/м³"],
                ["Остаток мазута", u.oil, "литров"],
                ["Плотность мазута по бункерной расписке", 961, "кг/м³"],
              ].map(([name, val, unit]) => (
                <span key={name}>
                  <small>{name}</small>
                  <b>{val}</b> {unit}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------- доска с двумя мини-кейсами ---------- */

const CASES = [
  {
    tab: "Мониторинг объектов",
    title: "Три уровня данных на одном экране",
    text: "Веб-сервис мониторинга промышленных объектов: сотни станций, у каждой больше сотни каналов телеметрии. Пересобрал главный рабочий экран диспетчера.",
    notes: [
      ["Объект → канал → график", "Вся цепочка раскрывается вправо на одном экране — диспетчер не теряет список и не ходит по страницам."],
      ["Группировка цветом", "Цветная метка слева делит сотни объектов на группы — нужный тип находится взглядом."],
      ["Проблемы видны в строке", "Ошибки и состояние вынесены тегами прямо в таблицу: открывать объект, чтобы узнать о сбое, не нужно."],
    ],
    hint: "Кликни по объекту, затем по каналу",
  },
  {
    tab: "Мониторинг флота",
    title: "Список, карта и карточка судна — вместе",
    text: "Веб-сервис слежения за судами: положение, скорость, курс и топливо в реальном времени. Спроектировал экран мониторинга и карточку юнита.",
    notes: [
      ["Список связан с картой", "Клик по судну в списке центрирует карту на нём и сразу открывает карточку."],
      ["Главное — одной строкой", "Координаты, скорость, курс и батарея стоят в ряд: состояние судна читается за секунду."],
      ["Устаревшие данные заметны", "Красная полоса у карточки и метки на карте показывает, что судно давно не выходило на связь."],
    ],
    hint: "Кликни по судну в списке или на карте",
  },
];

export function UxCases({ selected }: { selected: boolean }) {
  const [cur, setCur] = useState(0);
  const c = CASES[cur];
  return (
    <Frame meta={frameById("ux-cases")} selected={selected} className="st-card st-ux">
      <header className="st-ux__head">
        <div>
          <span className="st-ux__kicker">UX/UI · сложные интерфейсы</span>
          <h3>{c.title}</h3>
        </div>
        <div className="st-ux__tabs" data-ui>
          {CASES.map((k, i) => (
            <button key={k.tab} type="button" className={i === cur ? "is-on" : ""} onClick={() => setCur(i)}>
              {k.tab}
            </button>
          ))}
        </div>
      </header>
      <div className="st-ux__lead">
        <p className="st-ux__text">{c.text}</p>
        <span className="st-ux__hint">{c.hint}</span>
      </div>

      <div className="st-ux__screen">
        <div className="st-ux__zoom">{cur === 0 ? <ServiceObjects /> : <ServiceFleet />}</div>
      </div>

      <ol className="st-ux__notes">
        {c.notes.map(([name, text], i) => (
          <li key={name}>
            <em>0{i + 1}</em>
            <b>{name}</b>
            <span>{text}</span>
          </li>
        ))}
      </ol>
    </Frame>
  );
}
