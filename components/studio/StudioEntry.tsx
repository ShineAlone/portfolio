"use client";

import { useEffect, useState } from "react";
import { MobileApp } from "./MobileApp";
import { StudioApp } from "./StudioApp";

/*
 * Точка входа: на узком экране — мобильная лента, на остальных — холст.
 * ?feed принудительно открывает ленту (удобно проверять на компьютере), ?canvas — холст.
 * Режим выбирается после монтирования: на сервере ширина экрана неизвестна.
 */
export function StudioEntry() {
  const [mode, setMode] = useState<"feed" | "canvas" | null>(null);
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const narrow = window.matchMedia("(max-width: 760px)").matches;
    setPhone(narrow || params.has("feed"));
    setMode(params.has("canvas") ? "canvas" : params.has("feed") || narrow ? "feed" : "canvas");
  }, []);

  useEffect(() => {
    if (mode) window.scrollTo(0, 0);
  }, [mode]);

  if (!mode) return null;
  if (mode === "feed") return <MobileApp onCanvas={() => setMode("canvas")} />;
  return <StudioApp onFeed={phone ? () => setMode("feed") : undefined} />;
}
