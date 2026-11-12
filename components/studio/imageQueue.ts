import { useEffect } from "react";

/*
 * Очередь загрузки картинок холста. Все картинки, кроме первого экрана, помечены loading="lazy":
 * браузер сам грузит те, что рядом с экраном. Остальные очередь подгружает в фоне — по несколько
 * штук за раз, начиная с ближайших к тому месту, куда сейчас смотрит посетитель. Так первый экран
 * не делит канал со всем сайтом, а к моменту, когда до острова долетают, он уже загружен.
 * Пока картинка грузится, на её месте видна светлая заглушка (класс is-loaded её снимает).
 */

const PARALLEL = 6;

export function useImageQueue(root: string) {
  useEffect(() => {
    const host = document.querySelector<HTMLElement>(root);
    if (!host) return;
    const pending = new Set<HTMLImageElement>();
    const active = new Set<HTMLImageElement>();
    const seen = new WeakSet<HTMLImageElement>();
    let timer = 0;

    const done = (img: HTMLImageElement) => {
      img.classList.add("is-loaded");
      pending.delete(img);
      if (active.delete(img)) schedule();
    };

    const track = (img: HTMLImageElement) => {
      // учёт ведём в памяти этого запуска, а не в атрибутах: при повторном запуске эффекта всё собирается заново
      if (seen.has(img)) return;
      seen.add(img);
      img.decoding = "async";
      if (img.complete && img.naturalWidth > 0) return done(img);
      img.addEventListener("load", () => done(img));
      img.addEventListener("error", () => done(img));
      if (img.loading === "lazy") pending.add(img);
    };

    // расстояние от центра экрана до картинки — ближние грузятся первыми
    const distance = (img: HTMLImageElement) => {
      const r = img.getBoundingClientRect();
      return Math.hypot(r.left + r.width / 2 - window.innerWidth / 2, r.top + r.height / 2 - window.innerHeight / 2);
    };

    const pump = () => {
      timer = 0;
      // браузер мог начать загрузку сам (картинка оказалась рядом с экраном) — такие в очереди не нужны
      for (const img of pending) if (img.complete && img.naturalWidth > 0) done(img);
      const free = PARALLEL - active.size;
      if (free <= 0 || !pending.size) return;
      const next = [...pending]
        .filter((i) => i.isConnected)
        .map((img) => ({ img, d: distance(img) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, free);
      for (const { img } of next) {
        pending.delete(img);
        active.add(img);
        // смена lazy → eager запускает загрузку сразу, где бы картинка ни находилась
        img.loading = "eager";
      }
    };
    const schedule = () => {
      if (!timer) timer = window.setTimeout(pump, 60);
    };

    host.querySelectorAll("img").forEach(track);
    const mo = new MutationObserver((list) => {
      for (const m of list)
        m.addedNodes.forEach((n) => {
          if (n instanceof HTMLImageElement) track(n);
          else if (n instanceof HTMLElement) n.querySelectorAll("img").forEach(track);
        });
      schedule();
    });
    mo.observe(host, { subtree: true, childList: true });
    // фоновая загрузка начинается, когда первый экран уже отрисован
    const start = window.setTimeout(schedule, 1200);
    // страховка: если загрузка какой-то картинки зависла, очередь всё равно движется дальше
    const tick = window.setInterval(() => {
      if (active.size >= PARALLEL) active.clear();
      schedule();
    }, 8000);

    return () => {
      mo.disconnect();
      clearTimeout(start);
      clearTimeout(timer);
      clearInterval(tick);
    };
  }, [root]);
}
