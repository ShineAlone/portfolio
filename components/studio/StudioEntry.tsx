"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
const MobileGate = dynamic(() => import("./MobileGate").then((module) => module.MobileGate));

const StudioApp = dynamic(() => import("./StudioApp").then((module) => module.StudioApp), {
  loading: () => <p className="m-opening" role="status">Открываем холст…</p>,
});

type Mode = "auto" | "gate" | "feed" | "canvas";

export function StudioEntry({ feed }: { feed: ReactNode }) {
  const [mode, setMode] = useState<Mode>("auto");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("canvas")) setMode("canvas");
    else if (params.has("feed")) setMode("feed");
    else if (params.has("gate")) setMode("gate");
    else setMode(window.matchMedia("(max-width: 760px)").matches ? "feed" : "canvas");
  }, []);

  if (mode === "gate") return <MobileGate />;
  if (mode === "canvas") return <StudioApp />;
  return <div className={mode === "auto" ? "m-feed-auto" : undefined}>{feed}</div>;
}
