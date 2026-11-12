"use client";

import { useEffect, useState } from "react";
import { MobileApp } from "./MobileApp";
import { MobileGate } from "./MobileGate";
import { StudioApp } from "./StudioApp";

/*
 * Точка входа: на узком экране — заглушка с просьбой открыть сайт с компьютера (без перехода в ленту),
 * на остальных — холст. ?feed принудительно открывает ленту, ?canvas — холст, ?gate — заглушку.
 * Режим выбирается после монтирования: на сервере ширина экрана неизвестна.
 */
export function StudioEntry() {
  const [mode, setMode] = useState<"gate" | "feed" | "canvas" | null>(null);
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const narrow = window.matchMedia("(max-width: 760px)").matches;
    setPhone(narrow || params.has("feed"));
    setMode(params.has("canvas") ? "canvas" : params.has("feed") ? "feed" : narrow || params.has("gate") ? "gate" : "canvas");
  }, []);

  useEffect(() => {
    if (mode) window.scrollTo(0, 0);
  }, [mode]);

  if (!mode) return null;
  if (mode === "gate") return <MobileGate />;
  if (mode === "feed") return <MobileApp onCanvas={() => setMode("canvas")} />;
  return <StudioApp onFeed={phone ? () => setMode("feed") : undefined} />;
}
