import { forwardRef } from "react";
import { CURB, getCity, type Block } from "./city";
import { ISLANDS } from "./data";

const ASPHALT = "#4A4B51";
const INK = "#1E1E1E";
const BASE: Record<Block["kind"], string> = {
  houses: "#ECEAE4",
  park: "#A8D88A",
  parking: "#5A5B61",
  lot: "#D6B488",
};

function BlockView({ b }: { b: Block }) {
  return (
    <g className="st-city__block" style={{ "--d": `${b.d}s` } as React.CSSProperties}>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={30} fill="#DCD8CF" stroke={INK} strokeWidth={4} />
      <rect x={b.x + CURB} y={b.y + CURB} width={b.w - CURB * 2} height={b.h - CURB * 2} rx={18} fill={BASE[b.kind]} />

      {b.stripes.map((s, i) => (
        <line
          key={`s${i}`}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke={b.kind === "park" ? "#EFE3C8" : "#F4F1EA"}
          strokeWidth={b.kind === "park" ? 44 : 5}
          strokeLinecap={b.kind === "park" ? "butt" : "round"}
        />
      ))}

      {b.mounds.map((m, i) => (
        <g key={`m${i}`}>
          <ellipse cx={m.cx + 10} cy={m.cy + 12} rx={m.rx} ry={m.ry} fill="rgba(0,0,0,.12)" />
          <ellipse cx={m.cx} cy={m.cy} rx={m.rx} ry={m.ry} fill="#B88F5E" stroke={INK} strokeWidth={3} />
          <ellipse cx={m.cx - m.rx * 0.25} cy={m.cy - m.ry * 0.3} rx={m.rx * 0.4} ry={m.ry * 0.3} fill="#CFA676" />
        </g>
      ))}

      {b.ponds.map((p, i) => (
        <g key={`p${i}`}>
          <ellipse cx={p.cx} cy={p.cy} rx={p.rx + 14} ry={p.ry + 14} fill="#D9CFA9" />
          <ellipse cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill="#86DDFF" stroke={INK} strokeWidth={4} />
          <ellipse cx={p.cx - p.rx * 0.3} cy={p.cy - p.ry * 0.35} rx={p.rx * 0.35} ry={p.ry * 0.16} fill="rgba(255,255,255,.55)" />
        </g>
      ))}

      {b.parked.map((c, i) => (
        <g key={`c${i}`}>
          <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={14} fill={c.c} stroke={INK} strokeWidth={3} />
          <rect x={c.x + 8} y={c.y + 22} width={c.w - 16} height={18} rx={5} fill="#2a2a2a" />
        </g>
      ))}

      {/* сначала тени всех домов, потом крыши — тени не ложатся на соседние крыши */}
      {b.buildings.map((h) => (
        <rect key={`t${h.id}`} x={h.x + h.tall * 24} y={h.y + h.tall * 24} width={h.w} height={h.h} rx={10} fill="rgba(0,0,0,.2)" />
      ))}
      {b.buildings.map((h) => (
        <g key={h.id}>
          <rect x={h.x} y={h.y} width={h.w} height={h.h} rx={10} fill={h.roof} stroke={INK} strokeWidth={4} />
          {h.style === 0 && (
            <rect x={h.x + 16} y={h.y + 16} width={h.w - 32} height={h.h - 32} rx={6} fill="none" stroke="rgba(0,0,0,.14)" strokeWidth={4} />
          )}
          {h.style === 1 && (
            <rect x={h.x + 22} y={h.y + 22} width={h.w - 44} height={Math.min(90, h.h * 0.35)} rx={6} fill="#3A4766" />
          )}
          {h.style === 2 && (
            <circle cx={h.x + h.w / 2} cy={h.y + h.h / 2} r={Math.min(h.w, h.h) * 0.22} fill="none" stroke="#fff" strokeWidth={7} />
          )}
          {h.vents.map((v, i) => (
            <rect key={i} x={v.x} y={v.y} width={v.w} height={v.h} rx={4} fill="#fff" stroke={INK} strokeWidth={2.5} />
          ))}
        </g>
      ))}

      {b.trees.map((t, i) => (
        <g key={`r${i}`}>
          <circle cx={t.x + 8} cy={t.y + 10} r={t.r} fill="rgba(0,0,0,.18)" />
          <circle cx={t.x} cy={t.y} r={t.r} fill={t.c} stroke={INK} strokeWidth={3} />
          <circle cx={t.x - t.r * 0.3} cy={t.y - t.r * 0.3} r={t.r * 0.42} fill="rgba(255,255,255,.22)" />
        </g>
      ))}
    </g>
  );
}

/*
 * Город с видом сверху. Лежит под островами и показывается только во время езды.
 * Внутрь (fxRef) прикрепляются трещины на домах.
 */
export const CityLayer = forwardRef<HTMLDivElement>(function CityLayer(_, fxRef) {
  const city = getCity();
  const { bounds: c } = city;
  return (
    <div className="st-city" style={{ left: c.x, top: c.y, width: c.w, height: c.h }} aria-hidden>
      <svg viewBox={`${c.x} ${c.y} ${c.w} ${c.h}`} width={c.w} height={c.h}>
        <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={80} fill={ASPHALT} />
        {/* под полупрозрачными островами — светлое основание, иначе асфальт их затемнит */}
        {ISLANDS.map((i) => (
          <rect key={i.id} x={i.x} y={i.y} width={i.w} height={i.h} rx={72} fill="#ECEAE4" />
        ))}
        <g className="st-city__lanes" stroke="#F4F1EA" strokeWidth={8} strokeDasharray="56 44" opacity={0.7}>
          {city.lines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
          ))}
        </g>
        {city.blocks.map((b, i) => (
          <BlockView key={i} b={b} />
        ))}
      </svg>
      <div ref={fxRef} className="st-city__fx" />
    </div>
  );
});
