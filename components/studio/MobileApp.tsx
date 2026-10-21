"use client";

import { useEffect, useRef, useState } from "react";
import { HERO, LINKS, STATS } from "@/lib/content";
import { CHAT_STEP_MS, ISLANDS } from "./data";
import {
  BURST_POINTS,
  CHAT,
  ChatContent,
  CountUp,
  HELLO,
  HistoryContent,
  NAME_CHARS,
  NAME_LINES,
  STICKERS,
} from "./World";

/* eslint-disable @next/next/no-img-element */

/*
 * Мобильная версия: вместо холста — вертикальная лента островов.
 * Острова идут сверху вниз полноэкранными секциями своего цвета, блоки перестроены под ширину
 * телефона, а ощущение холста передают «наезд камеры» при входе в остров и чипы-навигация.
 * Сам холст остаётся пасхалкой — кнопка «Открыть холст» внизу.
 */

// Появление при прокрутке: блок «подлетает», как камера на холсте.
function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.15);
  return (
    <div ref={ref} className={`m-reveal${seen ? " is-in" : ""} ${className}`}>
      {children}
    </div>
  );
}

/* ---------- приветствие ---------- */

// Тот же сценарий, что на холсте: буквы падают, имя печатается, фото выезжает, наклейки шлёпаются.
function MHero() {
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState(0);
  const [stickersRef, stickersIn] = useInView<HTMLDivElement>(0.3);

  useEffect(() => {
    const ts = [
      setTimeout(() => setStep(1), 150),
      setTimeout(() => setStep(2), 800),
      setTimeout(() => setStep(3), 1700),
      setTimeout(() => setStep(5), 2300),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (step < 2) return;
    const id = setInterval(() => setTyped((t) => (t >= NAME_CHARS ? t : t + 1)), 55);
    return () => clearInterval(id);
  }, [step]);

  let rest = typed;
  let caretLine = -1;
  const lines = NAME_LINES.map((l, i) => {
    const s = l.slice(0, Math.max(0, rest));
    if (caretLine === -1 && rest <= l.length) caretLine = i;
    rest -= l.length;
    return s;
  });
  const cls = [1, 2, 3, 5].filter((s) => step >= s).map((s) => `s${s}`).join(" ");

  return (
    <div className={`mh ${cls}`}>
      <div className="mh__hello" aria-label={HELLO}>
        {[...HELLO].map((ch, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties}>
            {ch}
          </span>
        ))}
      </div>

      <div className="mh__stage">
        <div className="mh__name">
          {lines.map((l, i) => (
            <span key={i}>
              {l || " "}
              {step >= 2 && typed < NAME_CHARS && caretLine === i && <i className="sth__caret" />}
            </span>
          ))}
        </div>
        <div className="mh__photo">
          <img src="/images/photo.png" alt="Арсений Кононов" draggable={false} />
        </div>
      </div>

      <div className="mh__note">
        <span>дизайнер широкого профиля</span>
      </div>

      <div className="mh__cta">
        <a className="st-btn" href={LINKS.telegram} target="_blank" rel="noopener noreferrer">
          {HERO.contactLabel}
        </a>
        <span className="sth__status">
          <i />
          {HERO.statusLabel}
        </span>
      </div>

      {/* наклейки с цифрами: в два столбца, «таблетки» — во всю ширину */}
      <div ref={stickersRef} className={`mh__stickers${stickersIn ? " is-in" : ""}`}>
        {STICKERS.map((s, i) => (
          <button
            key={i}
            type="button"
            className={`st-sticker st-sticker--${s.shape} mh__sticker`}
            style={{ "--rot": `${s.rot * 0.6}deg`, "--c": s.color, "--i": i } as React.CSSProperties}
            onClick={(e) => {
              const el = e.currentTarget;
              el.classList.remove("is-wiggle");
              void el.offsetWidth;
              el.classList.add("is-wiggle");
            }}
          >
            {s.shape === "burst" && (
              <svg className="st-sticker__burst" viewBox="0 0 100 100" aria-hidden>
                <polygon points={BURST_POINTS} />
              </svg>
            )}
            <b>
              <CountUp value={STATS[i].value} run={stickersIn} />
            </b>
            <span>{STATS[i].label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- переписка: оживает, когда до неё долистали ---------- */

function MChat() {
  const [ref, seen] = useInView<HTMLDivElement>(0.2);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!seen || step >= CHAT.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 300 : CHAT[step].q ? CHAT_STEP_MS.q : CHAT_STEP_MS.a);
    return () => clearTimeout(t);
  }, [seen, step]);
  return (
    <div ref={ref} className="st-card stchat m-chat">
      <ChatContent step={step} />
    </div>
  );
}

/* ---------- лента ---------- */

const ORDER = ["about", "plugins", "social", "wall", "pres", "cases", "proj", "contact"];

export function MobileApp({ onCanvas }: { onCanvas: () => void }) {
  const [active, setActive] = useState("about");
  const chipsRef = useRef<HTMLElement>(null);

  // какой остров сейчас на экране — подсвечиваем его чип и докручиваем ленту чипов к нему
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id.replace("m-", ""));
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    ORDER.forEach((id) => {
      const el = document.getElementById(`m-${id}`);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    chipsRef.current
      ?.querySelector<HTMLElement>(`[data-id="${active}"]`)
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  const islands = ORDER.map((id) => ISLANDS.find((i) => i.id === id)!);

  return (
    <div className="m-app">
      <header className="m-top">
        <span className="st-brand__logo">АК</span>
        <span className="m-top__name">
          <b>Арсений Кононов</b>
          <small>дизайнер</small>
        </span>
        <a className="m-top__write" href={LINKS.telegram} target="_blank" rel="noopener noreferrer">
          <i />
          Написать
        </a>
      </header>

      <nav ref={chipsRef} className="m-chips" aria-label="Разделы">
        {islands.map((i) => (
          <button
            key={i.id}
            type="button"
            data-id={i.id}
            className={`${active === i.id ? "is-active" : ""}${i.dark ? " is-dark" : ""}`}
            style={{ "--c": i.color } as React.CSSProperties}
            onClick={() => document.getElementById(`m-${i.id}`)?.scrollIntoView({ behavior: "smooth" })}
          >
            {i.name}
          </button>
        ))}
      </nav>

      <main>
        {islands.map((isl) => (
          <section
            key={isl.id}
            id={`m-${isl.id}`}
            className={`m-island${isl.dark ? " is-dark" : ""}`}
            style={{ "--c": isl.color } as React.CSSProperties}
          >
            <Reveal className="m-island__head">
              <span className="m-island__label">{isl.name}</span>
            </Reveal>

            {isl.id === "about" ? (
              <>
                <MHero />
                <Reveal>
                  <MChat />
                </Reveal>
                <Reveal>
                  <div className="st-card m-history">
                    <HistoryContent />
                  </div>
                </Reveal>
              </>
            ) : (
              <Reveal>
                <div className="m-soon">
                  <b>Скоро здесь</b>
                  <p>Этот раздел ещё переезжает в мобильную ленту. Пока его можно посмотреть на холсте.</p>
                  <button type="button" className="st-btn" onClick={onCanvas}>
                    Открыть на холсте
                  </button>
                </div>
              </Reveal>
            )}
          </section>
        ))}

        <section className="m-canvas">
          <Reveal>
            <div className="m-canvas__card">
              <span className="m-canvas__kicker">пасхалка</span>
              <b>Весь сайт — это холст</b>
              <p>
                На компьютере портфолио выглядит как бесконечное пространство: острова, машинка, город и
                достижения. Его можно открыть и здесь — лучше повернуть телефон горизонтально.
              </p>
              <button type="button" className="st-btn" onClick={onCanvas}>
                Открыть холст ↗
              </button>
            </div>
          </Reveal>
        </section>
      </main>
    </div>
  );
}
