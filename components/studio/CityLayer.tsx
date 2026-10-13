import { forwardRef, memo } from "react";
import { CURB, TRACK, getCity, type Block, type Building } from "./city";
import { ISLANDS } from "./data";

const ASPHALT = "#4A4B51";
const INK = "#1E1E1E";
const GRASS = "#A8D88A";
const WATER = "#86DDFF";
// запас вокруг квартала под тени высоток
const PAD = 90;

const BASE: Record<Block["kind"], string> = {
  downtown: "#E4E0D8",
  courtyard: "#ECEAE4",
  cottages: GRASS,
  industrial: "#6A6B70",
  park: GRASS,
  parking: "#5A5B61",
  lot: "#D6B488",
  stadium: "#E4E0D8",
};

function Roof({ h }: { h: Building }) {
  const cx = h.x + h.w / 2;
  const cy = h.y + h.h / 2;
  return (
    <g>
      <rect x={h.x} y={h.y} width={h.w} height={h.h} rx={h.style === "container" ? 4 : 10} fill={h.roof} stroke={INK} strokeWidth={h.style === "container" ? 3 : 4} />
      {h.style === "flat" && (
        <rect x={h.x + 14} y={h.y + 14} width={Math.max(0, h.w - 28)} height={Math.max(0, h.h - 28)} rx={6} fill="none" stroke="rgba(0,0,0,.12)" strokeWidth={4} />
      )}
      {h.style === "solar" && (
        <g fill="#3A4766" stroke="#6E7FA6" strokeWidth={2}>
          {Array.from({ length: Math.max(1, Math.floor((h.w - 40) / 70)) }, (_, i) => (
            <rect key={i} x={h.x + 24 + i * 70} y={h.y + 24} width={56} height={Math.min(120, h.h * 0.4)} rx={4} />
          ))}
        </g>
      )}
      {h.style === "helipad" && (
        <g>
          <circle cx={cx} cy={cy} r={Math.min(h.w, h.h) * 0.24} fill="#3B3C42" stroke="#FEFE78" strokeWidth={6} />
          <path
            d={`M${cx - 18} ${cy - 24}v48M${cx + 18} ${cy - 24}v48M${cx - 18} ${cy}h36`}
            stroke="#fff"
            strokeWidth={8}
            strokeLinecap="round"
          />
        </g>
      )}
      {h.style === "garden" && (
        <g>
          <rect x={h.x + 26} y={h.y + 26} width={h.w - 52} height={h.h - 52} rx={14} fill={GRASS} />
          <circle cx={h.x + 70} cy={h.y + 70} r={26} fill="#6FB453" stroke={INK} strokeWidth={3} />
          <circle cx={h.x + h.w - 70} cy={h.y + h.h - 70} r={30} fill="#5FA347" stroke={INK} strokeWidth={3} />
        </g>
      )}
      {h.style === "ribs" && (
        <g stroke="rgba(0,0,0,.16)" strokeWidth={4}>
          {h.w > h.h
            ? Array.from({ length: Math.floor(h.w / 36) - 1 }, (_, i) => (
                <line key={i} x1={h.x + 36 * (i + 1)} y1={h.y + 6} x2={h.x + 36 * (i + 1)} y2={h.y + h.h - 6} />
              ))
            : Array.from({ length: Math.floor(h.h / 36) - 1 }, (_, i) => (
                <line key={i} x1={h.x + 6} y1={h.y + 36 * (i + 1)} x2={h.x + h.w - 6} y2={h.y + 36 * (i + 1)} />
              ))}
        </g>
      )}
      {h.style === "gable" && (
        // конёк двускатной крыши и тёмный скат
        <g>
          {h.w > h.h ? (
            <>
              <rect x={h.x + 2} y={cy} width={h.w - 4} height={h.h / 2 - 2} rx={8} fill="rgba(0,0,0,.12)" />
              <line x1={h.x + 8} y1={cy} x2={h.x + h.w - 8} y2={cy} stroke={INK} strokeWidth={3} />
            </>
          ) : (
            <>
              <rect x={cx} y={h.y + 2} width={h.w / 2 - 2} height={h.h - 4} rx={8} fill="rgba(0,0,0,.12)" />
              <line x1={cx} y1={h.y + 8} x2={cx} y2={h.y + h.h - 8} stroke={INK} strokeWidth={3} />
            </>
          )}
        </g>
      )}
      {h.style === "container" && (
        <g stroke="rgba(0,0,0,.2)" strokeWidth={2}>
          {Array.from({ length: Math.floor(h.w / 16) - 1 }, (_, i) => (
            <line key={i} x1={h.x + 16 * (i + 1)} y1={h.y + 4} x2={h.x + 16 * (i + 1)} y2={h.y + h.h - 4} />
          ))}
        </g>
      )}
      {h.vents.map((v, i) => (
        <rect key={i} x={v.x} y={v.y} width={v.w} height={v.h} rx={4} fill="#fff" stroke={INK} strokeWidth={2.5} />
      ))}
    </g>
  );
}

const BlockView = memo(function BlockView({ b, ox, oy }: { b: Block; ox: number; oy: number }) {
  const inner = { x: b.x + CURB, y: b.y + CURB, w: b.w - CURB * 2, h: b.h - CURB * 2 };
  const vx = b.x - PAD;
  const vy = b.y - PAD;
  const vw = b.w + PAD * 2;
  const vh = b.h + PAD * 2;
  return (
    <div
      className="st-city__block"
      style={{ left: vx - ox, top: vy - oy, width: vw, height: vh, "--d": `${b.d}s` } as React.CSSProperties}
    >
      <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} width={vw} height={vh}>
        <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={30} fill="#DCD8CF" stroke={INK} strokeWidth={4} />
        <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} rx={18} fill={BASE[b.kind]} />

        {b.greens.map((g, i) => (
          <rect key={`g${i}`} x={g.x} y={g.y} width={g.w} height={g.h} rx={18} fill={GRASS} />
        ))}

        {b.kind === "stadium" &&
          b.fields.map((f, i) => (
            <g key={`f${i}`}>
              <ellipse cx={f.cx} cy={f.cy} rx={f.rx + TRACK + 40} ry={f.ry + TRACK + 40} fill="#C791FF" stroke={INK} strokeWidth={4} />
              <ellipse cx={f.cx} cy={f.cy} rx={f.rx + TRACK} ry={f.ry + TRACK} fill="#E07A5F" stroke={INK} strokeWidth={4} />
              {[0.33, 0.66].map((k) => (
                <ellipse key={k} cx={f.cx} cy={f.cy} rx={f.rx + TRACK * k} ry={f.ry + TRACK * k} fill="none" stroke="rgba(255,255,255,.7)" strokeWidth={3} />
              ))}
              <ellipse cx={f.cx} cy={f.cy} rx={f.rx} ry={f.ry} fill="#7FC35E" stroke={INK} strokeWidth={4} />
              <g stroke="rgba(255,255,255,.85)" strokeWidth={5} fill="none">
                <rect x={f.cx - f.rx * 0.62} y={f.cy - f.ry * 0.55} width={f.rx * 1.24} height={f.ry * 1.1} rx={6} />
                <line x1={f.cx} y1={f.cy - f.ry * 0.55} x2={f.cx} y2={f.cy + f.ry * 0.55} />
                <circle cx={f.cx} cy={f.cy} r={Math.min(f.rx, f.ry) * 0.22} />
              </g>
            </g>
          ))}
        {b.kind === "courtyard" &&
          b.fields.map((f, i) => (
            <g key={`f${i}`}>
              <ellipse cx={f.cx} cy={f.cy} rx={f.rx} ry={f.ry} fill="#EAD9A8" stroke={INK} strokeWidth={3} />
              <rect x={f.cx - 14} y={f.cy - 30} width={28} height={60} rx={6} fill="#FFB6E1" stroke={INK} strokeWidth={3} />
            </g>
          ))}

        {b.paths.map((d, i) => (
          <path key={`p${i}`} d={d} fill="none" stroke="#EFE3C8" strokeWidth={40} strokeLinecap="round" />
        ))}

        {b.stripes.map((s, i) => (
          <line key={`s${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#F4F1EA" strokeWidth={5} strokeLinecap="round" />
        ))}

        {b.mounds.map((m, i) => (
          <g key={`m${i}`}>
            <ellipse cx={m.cx + 10} cy={m.cy + 12} rx={m.rx} ry={m.ry} fill="rgba(0,0,0,.12)" />
            <ellipse cx={m.cx} cy={m.cy} rx={m.rx} ry={m.ry} fill="#B88F5E" stroke={INK} strokeWidth={3} />
            <ellipse cx={m.cx - m.rx * 0.25} cy={m.cy - m.ry * 0.3} rx={m.rx * 0.4} ry={m.ry * 0.3} fill="#CFA676" />
          </g>
        ))}

        {b.ponds.map((p, i) => (
          <g key={`w${i}`}>
            <ellipse cx={p.cx} cy={p.cy} rx={p.rx + 16} ry={p.ry + 16} fill="#D9CFA9" />
            <ellipse cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill={WATER} stroke={INK} strokeWidth={4} />
            <ellipse cx={p.cx - p.rx * 0.3} cy={p.cy - p.ry * 0.35} rx={p.rx * 0.35} ry={p.ry * 0.14} fill="rgba(255,255,255,.55)" />
          </g>
        ))}

        {b.pools.map((p, i) => (
          <rect key={`o${i}`} x={p.x} y={p.y} width={p.w} height={p.h} rx={10} fill={WATER} stroke="#fff" strokeWidth={5} />
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
          <Roof key={h.id} h={h} />
        ))}

        {b.crane && (
          // башенный кран сверху: стрела с решёткой, противовес и тень на земле
          <g transform={`rotate(${(b.crane.a * 180) / Math.PI} ${b.crane.x} ${b.crane.y})`}>
            <rect x={b.crane.x - 140 + 30} y={b.crane.y - 11 + 30} width={b.crane.len + 140} height={22} fill="rgba(0,0,0,.15)" />
            <rect x={b.crane.x - 140} y={b.crane.y - 11} width={b.crane.len + 140} height={22} fill="#F2C14E" stroke={INK} strokeWidth={3} />
            <path
              d={Array.from({ length: Math.floor((b.crane.len + 140) / 22) }, (_, i) => `M${b.crane!.x - 140 + i * 22} ${b.crane!.y - 11}l22 22`).join("")}
              stroke={INK}
              strokeWidth={2}
            />
            <rect x={b.crane.x - 150} y={b.crane.y - 26} width={60} height={52} rx={4} fill="#8A8A8A" stroke={INK} strokeWidth={3} />
            <rect x={b.crane.x - 20} y={b.crane.y - 20} width={40} height={40} rx={4} fill="#F2C14E" stroke={INK} strokeWidth={3} />
            <line x1={b.crane.x + b.crane.len - 30} y1={b.crane.y} x2={b.crane.x + b.crane.len - 30} y2={b.crane.y + 40} stroke={INK} strokeWidth={3} />
          </g>
        )}

        {b.trees.map((t, i) => (
          <g key={`r${i}`}>
            <circle cx={t.x + 8} cy={t.y + 10} r={t.r} fill="rgba(0,0,0,.18)" />
            <circle cx={t.x} cy={t.y} r={t.r} fill={t.c} stroke={INK} strokeWidth={3} />
            <circle cx={t.x - t.r * 0.3} cy={t.y - t.r * 0.3} r={t.r * 0.42} fill="rgba(255,255,255,.22)" />
          </g>
        ))}
      </svg>
    </div>
  );
});

/*
 * Город с видом сверху. Лежит под островами и показывается только во время езды.
 * Основа (асфальт, река, мосты, развязки, разметка) — один неподвижный SVG,
 * каждый квартал — свой слой: так их появление анимируется без перерисовки всего холста.
 * Внутрь fxRef прикрепляются трещины на домах.
 */
export const CityLayer = memo(
  forwardRef<HTMLDivElement>(function CityLayer(_, fxRef) {
    const city = getCity();
    const { bounds: c, band } = city;
    return (
      <div className="st-city" style={{ left: c.x, top: c.y, width: c.w, height: c.h }} aria-hidden>
        <svg className="st-city__base" viewBox={`${c.x} ${c.y} ${c.w} ${c.h}`} width={c.w} height={c.h}>
          <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={80} fill={ASPHALT} />
          {/* под полупрозрачными островами — светлое основание, иначе асфальт их затемнит */}
          {ISLANDS.map((i) => (
            <rect key={i.id} x={i.x} y={i.y} width={i.w} height={i.h} rx={72} fill="#ECEAE4" />
          ))}

          {/* набережная с рекой */}
          <rect x={band.x} y={band.y} width={band.w} height={band.h} fill={GRASS} stroke={INK} strokeWidth={4} />
          <path d={city.river} fill={WATER} stroke={INK} strokeWidth={5} />
          <path d={city.river} fill="none" stroke="rgba(255,255,255,.5)" strokeWidth={3} strokeDasharray="60 120" transform="translate(0 -40)" />
          {city.bridges.map((b, i) => {
            const mid = b.x + b.w / 2;
            const top = city.riverY(mid) - city.riverW(mid) - 40;
            const bot = city.riverY(mid) + city.riverW(mid) + 40;
            return (
              <g key={i}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={ASPHALT} />
                <rect x={b.x - 14} y={top + 18} width={b.w + 28} height={bot - top} fill="rgba(0,0,0,.18)" />
                <rect x={b.x - 10} y={top} width={b.w + 20} height={bot - top} fill={ASPHALT} stroke={INK} strokeWidth={4} />
                <path d={`M${b.x - 2} ${top}V${bot}M${b.x + b.w + 2} ${top}V${bot}`} stroke="#F4F1EA" strokeWidth={6} />
              </g>
            );
          })}
          {city.bankTrees.map((t, i) => (
            <g key={`bt${i}`}>
              <circle cx={t.x + 8} cy={t.y + 10} r={t.r} fill="rgba(0,0,0,.18)" />
              <circle cx={t.x} cy={t.y} r={t.r} fill={t.c} stroke={INK} strokeWidth={3} />
            </g>
          ))}

          {city.rings.map((r, i) => (
            <circle key={`ra${i}`} cx={r.cx} cy={r.cy} r={170} fill={ASPHALT} />
          ))}
          <g stroke="#F4F1EA" strokeWidth={8} strokeDasharray="56 44" opacity={0.7}>
            {city.lines.map((l, i) => (
              <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
            ))}
          </g>
          {/* кольцевые развязки: клумба с деревом посередине */}
          {city.rings.map((r, i) => (
            <g key={`rr${i}`}>
              <circle cx={r.cx} cy={r.cy} r={112} fill={ASPHALT} />
              <circle cx={r.cx} cy={r.cy} r={112} fill="none" stroke="#F4F1EA" strokeWidth={6} strokeDasharray="30 24" opacity={0.7} />
              <circle cx={r.cx} cy={r.cy} r={62} fill={GRASS} stroke={INK} strokeWidth={4} />
              <circle cx={r.cx + 6} cy={r.cy + 8} r={30} fill="rgba(0,0,0,.18)" />
              <circle cx={r.cx} cy={r.cy} r={30} fill="#5FA347" stroke={INK} strokeWidth={3} />
            </g>
          ))}
        </svg>
        {city.blocks.map((b, i) => (
          <BlockView key={i} b={b} ox={c.x} oy={c.y} />
        ))}
        <div ref={fxRef} className="st-city__fx" />
      </div>
    );
  })
);
