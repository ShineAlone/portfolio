"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
const MobileGate = dynamic(() => import("./MobileGate").then((module) => module.MobileGate));

const StudioApp = dynamic(() => import("./StudioApp").then((module) => module.StudioApp), {
  loading: () => <p className="m-opening" role="status">Открываем холст…</p>,
});

/*
 * Точка входа: на узком экране — заглушка с просьбой открыть сайт с компьютера (без перехода в ленту),
 * на остальных — холст. ?canvas принудительно открывает холст, ?gate — заглушку.
 * Режим выбирается после монтирования: на сервере ширина экрана неизвестна.
 */
type Mode = "gate" | "canvas";

export function StudioEntry() {
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("canvas")) setMode("canvas");
    else if (params.has("gate")) setMode("gate");
    else setMode(window.matchMedia("(max-width: 760px)").matches ? "gate" : "canvas");
  }, []);

  if (mode === "gate") return <MobileGate />;
  if (mode === "canvas") return <StudioApp />;
  return <p className="m-opening" role="status">Открываем холст…</p>;
}
