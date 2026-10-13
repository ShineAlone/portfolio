"use client";

import { memo, useEffect, useState } from "react";
import { AUTOMATION, HERO, LINKS, PRESENTATIONS, PROJECTS, SOCIAL, STATS, WORK } from "@/lib/content";
import {
  DECK_SLIDES,
  ISLANDS,
  SITE_IMAGES,
  TOOLS,
  frameById,
  islandById,
  narrowWallpapers,
  poster,
  wideWallpapers,
  type FrameMeta,
  type ToolId,
} from "./data";
import { ToolGlyph } from "./glyphs";

/* eslint-disable @next/next/no-img-element */

export const HERO_LINES = ["Привет,", "я Арсений", "Кононов"];
export const HERO_CHARS = HERO_LINES.join("").length;

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

function Cycler({ images, delay, interval = 2600 }: { images: string[]; delay: number; interval?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;
    const t = setTimeout(() => {
      id = setInterval(() => setI((v) => (v + 1) % images.length), interval);
    }, delay);
    return () => {
      clearTimeout(t);
      if (id) clearInterval(id);
    };
  }, [delay, interval, images.length]);
  return (
    <>
      {images.map((src, k) => (
        <img key={src} src={src} alt="" loading="lazy" draggable={false} className={k === i ? "is-on" : ""} />
      ))}
    </>
  );
}

/* ---------- Обо мне ---------- */

function Hero({ step, typed, selected }: { step: number; typed: number; selected: boolean }) {
  let rest = typed;
  let caretLine = -1;
  const lines = HERO_LINES.map((l, i) => {
    const s = l.slice(0, Math.max(0, rest));
    if (caretLine === -1 && rest <= l.length) caretLine = i;
    rest -= l.length;
    return s;
  });
  const typing = step === 2;
  const cls = [1, 2, 3, 4, 5].filter((s) => step >= s).map((s) => `s${s}`).join(" ");

  return (
    <Frame meta={frameById("hero")} selected={selected} className="st-free">
      <div className={`sth ${cls}`}>
        <div className="sth__card">
          <span className="sth__role">Дизайнер широкого профиля</span>
          <h1 className="sth__title">
            {lines.map((l, i) => (
              <span key={i} className={`sth__l${i}`}>
                {l || " "}
                {typing && caretLine === i && <i className="sth__caret" />}
              </span>
            ))}
          </h1>
          <div className="sth__cta">
            <a data-ui className="st-btn" href={LINKS.telegram} target="_blank" rel="noopener noreferrer">
              {HERO.contactLabel}
            </a>
            <span className="sth__status">
              <i />
              {HERO.statusLabel}
            </span>
          </div>
          <div className="sth__stats">
            {STATS.map((s, i) => (
              <div key={s.label} style={{ transitionDelay: `${i * 90}ms` }}>
                <b>
                  <CountUp value={s.value} run={step >= 4} />
                </b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="sth__photo">
            <img src="/images/photo.png" alt="Арсений Кононов" draggable={false} />
          </div>
        </div>
        <span className="sth__size">1240 × 720</span>
      </div>
    </Frame>
  );
}

function Bio({ selected }: { selected: boolean }) {
  return (
    <Frame meta={frameById("bio")} selected={selected} className="st-card">
      <div className="stb">
        {HERO.paragraphs.map((p) => (
          <p key={p.slice(0, 20)}>{p}</p>
        ))}
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
        </ol>
      </div>
    </Frame>
  );
}

/* ---------- Плагины ---------- */

function PluginCard({ index, selected, onTry }: { index: number; selected: boolean; onTry: (t: ToolId) => void }) {
  const card = AUTOMATION.cards[index];
  const tool = TOOLS[index];
  return (
    <Frame meta={frameById(`plugin-${index}`)} selected={selected} className="st-card">
      <div className="stp" style={{ "--tc": card.tagColor } as React.CSSProperties}>
        <div className="stp__media">
          {card.video ? (
            <HoverVideo video={card.video} />
          ) : (
            <div className="stp__art">
              <ToolGlyph id={tool.id} size={96} />
            </div>
          )}
        </div>
        <span className="stp__tag">{card.tag}</span>
        <div className="stp__name">{card.title}</div>
        <p>{card.text}</p>
        <button type="button" data-ui className="stp__try" onClick={() => onTry(tool.id)}>
          <ToolGlyph id={tool.id} size={18} />
          Попробовать здесь
        </button>
      </div>
    </Frame>
  );
}

/* ---------- Соцсети: стопка, которая раскладывается ---------- */

const SOCIAL_IMAGES = SOCIAL.rows.flat();

function SocialPile({ spread, selected }: { spread: boolean; selected: boolean }) {
  const meta = frameById("social");
  return (
    <Frame meta={meta} selected={selected} className={`st-social${spread ? " is-spread" : ""}`}>
      {SOCIAL_IMAGES.map((src, i) => {
        const gx = (i % 8) * 162;
        const gy = Math.floor(i / 8) * 162;
        const px = meta.w / 2 - 75 - gx + (rand(i * 3 + 1) - 0.5) * 780;
        const py = meta.h / 2 - 75 - gy + (rand(i * 3 + 2) - 0.5) * 520;
        const rot = (rand(i * 3 + 3) - 0.5) * 56;
        return (
          <div
            key={src}
            className="st-post"
            style={
              {
                left: gx,
                top: gy,
                zIndex: i,
                transitionDelay: `${(spread ? i : SOCIAL_IMAGES.length - i) * 14}ms`,
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

/* ---------- Обои ---------- */

const PHONE_GROUPS = [0, 1, 2, 3, 4].map((g) => narrowWallpapers.filter((_, i) => i % 5 === g));

function Wallpapers({ selected }: { selected: string | null }) {
  return (
    <>
      <Frame meta={frameById("wall-phones")} selected={selected === "wall-phones"} className="st-free st-phones">
        {PHONE_GROUPS.map((imgs, i) => (
          <div key={i} className="st-phone" style={{ "--ry": `${(i - 2) * 11}deg` } as React.CSSProperties}>
            <Cycler images={imgs} delay={i * 450} />
          </div>
        ))}
      </Frame>
      <Frame meta={frameById("wall-pc")} selected={selected === "wall-pc"} className="st-free st-monitor">
        <div className="st-monitor__screen">
          <Cycler images={wideWallpapers} delay={1200} interval={2200} />
        </div>
        <div className="st-monitor__neck" />
        <div className="st-monitor__base" />
      </Frame>
    </>
  );
}

/* ---------- Презентации ---------- */

function Presentations({
  selected,
  order,
  flying,
  onNext,
}: {
  selected: string | null;
  order: number[];
  flying: number | null;
  onNext: () => void;
}) {
  return (
    <>
      {PRESENTATIONS.cards.map((card, i) => (
        <Frame key={i} meta={frameById(`pres-${i}`)} selected={selected === `pres-${i}`} className="st-card">
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
      <Frame meta={frameById("deck")} selected={selected === "deck"} className="st-free st-deck">
        <div data-ui className="st-deck__stack" onClick={onNext}>
          {DECK_SLIDES.map((src, k) => {
            const pos = order.indexOf(k);
            return (
              <img
                key={src}
                src={src}
                alt=""
                loading="lazy"
                draggable={false}
                className={flying === k ? "is-flying" : ""}
                style={{
                  zIndex: 100 - pos,
                  transform: `translate(${pos * 8}px, ${pos * 8}px) rotate(${pos === 0 ? 0 : (k % 2 ? 1 : -1) * 1.2}deg)`,
                }}
              />
            );
          })}
        </div>
        <span className="st-deck__hint">кликни по стопке — следующий слайд</span>
      </Frame>
    </>
  );
}

/* ---------- Проекты ---------- */

function Projects({ selected }: { selected: string | null }) {
  return (
    <>
      {SITE_IMAGES.slice(0, 6).map((src, i) => {
        const meta = frameById(`site-${i}`);
        return (
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
        );
      })}
      <Frame meta={frameById("site-6")} selected={selected === "site-6"} className="st-win st-win--phone">
        <div className="st-win__page">
          <img src={SITE_IMAGES[6]} alt="" loading="lazy" draggable={false} />
        </div>
      </Frame>
      <Frame meta={frameById("coffee")} selected={selected === "coffee"} className="st-card st-coffee">
        {PROJECTS.coffeeGrid.map((src) => (
          <img key={src} src={src} alt="" loading="lazy" draggable={false} />
        ))}
      </Frame>
      <Frame meta={frameById("merch")} selected={selected === "merch"} className="st-free st-prints">
        {PROJECTS.merch.map((src, i) => (
          <div
            key={src}
            className="st-print"
            style={{ left: 10 + i * 238, "--rot": `${(i % 2 ? 1 : -1) * (4 + i * 1.5)}deg` } as React.CSSProperties}
          >
            <img src={src} alt="" loading="lazy" draggable={false} />
          </div>
        ))}
      </Frame>
      <Frame meta={frameById("transarctic")} selected={selected === "transarctic"} className="st-img">
        <img src={PROJECTS.transarctic} alt="" loading="lazy" draggable={false} />
      </Frame>
      <Frame meta={frameById("forum")} selected={selected === "forum"} className="st-free st-forum">
        {PROJECTS.er.banners.map((src) => (
          <img key={src} src={src} alt="" loading="lazy" draggable={false} />
        ))}
      </Frame>
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
          className="st-island"
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
  selected: string | null;
  spread: boolean;
  onToggleSpread: () => void;
  deckOrder: number[];
  deckFlying: number | null;
  onDeckNext: () => void;
  onTry: (t: ToolId) => void;
};

export const World = memo(function World(p: WorldProps) {
  return (
    <>
      <Islands spread={p.spread} onToggleSpread={p.onToggleSpread} />
      <Hero step={p.introStep} typed={p.typed} selected={p.selected === "hero"} />
      <Bio selected={p.selected === "bio"} />
      <History selected={p.selected === "history"} />
      {AUTOMATION.cards.map((_, i) => (
        <PluginCard key={i} index={i} selected={p.selected === `plugin-${i}`} onTry={p.onTry} />
      ))}
      {[6, 7].map((i) => (
        <div
          key={i}
          className="st-slot"
          style={{ left: 2460 + (i % 4) * 480, top: 150 + Math.floor(i / 4) * 540, width: 440, height: 500 }}
        >
          <span>+</span>
          Скоро тут будет
          <br />
          новый плагин
        </div>
      ))}
      <SocialPile spread={p.spread} selected={p.selected === "social"} />
      <Wallpapers selected={p.selected} />
      <Presentations
        selected={p.selected}
        order={p.deckOrder}
        flying={p.deckFlying}
        onNext={p.onDeckNext}
      />
      <Projects selected={p.selected} />
    </>
  );
});
