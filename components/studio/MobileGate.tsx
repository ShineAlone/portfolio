"use client";

import { useState } from "react";
import { LINKS } from "@/lib/content";
import { ISLANDS, WORLD } from "./data";
import { useTypograph } from "./typograph";

/*
 * Заглушка для телефона: сайт — большое полотно, и на маленьком экране оно не помещается.
 * Показываем само полотно в миниатюре, рядом — «твой экран» в его масштабе, и зовём открыть с компьютера.
 * Перейти отсюда в упрощённую ленту нельзя: на телефоне сайт показывает только эту заглушку.
 */

const MAP_W = 190;
const K = MAP_W / WORLD.w;

export function MobileGate() {
  const [copied, setCopied] = useState(false);
  useTypograph();

  const copy = async () => {
    const url = window.location.origin + window.location.pathname;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2600);
    } catch {
      // буфер недоступен — открываем системное «Поделиться», если оно есть
      navigator.share?.({ url }).catch(() => {});
    }
  };

  return (
    <main className="m-gate">
      <header className="m-gate__top">
        <span className="st-brand__logo">АК</span>
        <b>Арсений Кононов</b>
      </header>

      <div className="m-gate__map" style={{ width: MAP_W, height: WORLD.h * K }} aria-hidden>
        {ISLANDS.map((i) => (
          <span
            key={i.id}
            style={{ left: (i.x - WORLD.x) * K, top: (i.y - WORLD.y) * K, width: i.w * K, height: i.h * K, background: i.color }}
          />
        ))}
        <i className="m-gate__phone">
          <em>твой экран</em>
        </i>
      </div>

      <h1>
        Этот сайт
        <br />
        не влезает
        <br />в телефон
      </h1>
      <p>
        Портфолио сделано как большое полотно: по нему летают, приближают работы и катаются на машинке. На телефоне
        от него остаётся кусочек размером с марку — открой, пожалуйста, с компьютера.
      </p>

      <div className="m-gate__actions">
        <button type="button" className="m-gate__main" onClick={copy}>
          {copied ? "Ссылка скопирована ✓" : "Скопировать ссылку"}
        </button>
        <a className="m-gate__ghost" href={LINKS.telegram} target="_blank" rel="noopener noreferrer">
          Написать в Telegram ↗
        </a>
      </div>

    </main>
  );
}
