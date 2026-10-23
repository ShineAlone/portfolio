"use client";

import { useEffect, useState } from "react";
import { CaseHR } from "./CaseHR";
import { frameById } from "./data";

// Кейс вне холста: фрейм сдвинут в начало страницы; ?y= прокручивает к нужному борду.
export function CasePreview() {
  const f = frameById("case-hr");
  const [y, setY] = useState(0);
  useEffect(() => setY(Number(new URLSearchParams(window.location.search).get("y") ?? 0)), []);
  return (
    <div className="st-app" style={{ position: "relative", inset: "auto", minHeight: "100vh", overflow: "visible", background: "#ecebe4" }}>
      <div className="st-world is-shown" style={{ position: "relative", transform: `translate(${-f.x}px, ${-f.y - y}px)`, opacity: 1 }}>
        <CaseHR selected={null} active />
      </div>
    </div>
  );
}
