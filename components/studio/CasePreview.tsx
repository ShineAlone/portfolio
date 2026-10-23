"use client";

import { useEffect, useState } from "react";
import { CaseHR } from "./CaseHR";
import { CaseTour } from "./CaseTour";
import { frameById } from "./data";

// Кейс вне холста: фрейм сдвинут в начало страницы; ?y= прокручивает к нужному борду.
export function CasePreview() {
  const [q, setQ] = useState({ y: 0, tour: false });
  useEffect(() => {
    const s = new URLSearchParams(window.location.search);
    setQ({ y: Number(s.get("y") ?? 0), tour: s.get("case") === "tour" });
  }, []);
  const f = frameById(q.tour ? "case-tour" : "case-hr");
  return (
    <div className="st-app" style={{ position: "relative", inset: "auto", minHeight: "100vh", overflow: "visible", background: "#ecebe4" }}>
      <div className="st-world is-shown" style={{ position: "relative", transform: `translate(${-f.x}px, ${-f.y - q.y}px)`, opacity: 1 }}>
        {q.tour ? <CaseTour selected={null} /> : <CaseHR selected={null} active />}
      </div>
    </div>
  );
}
