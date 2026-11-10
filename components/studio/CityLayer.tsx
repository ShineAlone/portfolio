import { forwardRef, memo } from "react";
import { CURB, RING, SHORE, TRACK, getCity, type Block, type Building } from "./city";
import { ISLANDS } from "./data";

const ASPHALT = "#4A4B51";
const INK = "#1E1E1E";
const GRASS = "#A8D88A";
const WATER = "#86DDFF";
const SAND = "#F1DFB0";
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
  plaza: "#EDE6D8",
  sports: GRASS,
};

function Roof({ h }: { h: Building }) {
  // верхняя ступень высотки: на ней стоят вертолётная площадка, сад или панели
  const inset = (h.tiers - 1) * Math.min(26, Math.min(h.w, h.h) * 0.09);
  const q = { x: h.x + inset, y: h.y + inset, w: h.w - inset * 2, h: h.h - inset * 2 };
  const cx = q.x + q.w / 2;
  const cy = q.y + q.h / 2;
  return (
    <g>
      <rect x={h.x} y={h.y} width={h.w} height={h.h} rx={h.style === "container" ? 4 : 10} fill={h.roof} stroke={INK} strokeWidth={h.style === "container" ? 3 : 4} />
      {Array.from({ length: h.tiers - 1 }, (_, i) => {
        const d = ((i + 1) * inset) / (h.tiers - 1);
        return (
          <g key={i}>
            <rect x={h.x + d + 7} y={h.y + d + 7} width={h.w - d * 2} height={h.h - d * 2} rx={9} fill="rgba(0,0,0,.14)" />
            <rect x={h.x + d} y={h.y + d} width={h.w - d * 2} height={h.h - d * 2} rx={9} fill={h.roof} stroke={INK} strokeWidth={3} />
            <rect x={h.x + d} y={h.y + d} width={h.w - d * 2} height={h.h - d * 2} rx={9} fill={`rgba(255,255,255,${0.12 * (i + 1)})`} />
          </g>
        );
      })}
      {h.style === "flat" && (
        <rect x={q.x + 14} y={q.y + 14} width={Math.max(0, q.w - 28)} height={Math.max(0, q.h - 28)} rx={6} fill="none" stroke="rgba(0,0,0,.12)" strokeWidth={4} />
      )}
      {h.style === "solar" && (
        <g fill="#3A4766" stroke="#6E7FA6" strokeWidth={2}>
          {Array.from({ length: Math.max(1, Math.floor((q.w - 40) / 70)) }, (_, i) => (
            <rect key={i} x={q.x + 24 + i * 70} y={q.y + 24} width={56} height={Math.min(120, q.h * 0.4)} rx={4} />
          ))}
        </g>
      )}
      {h.style === "helipad" && (
        <g>
          <circle cx={cx} cy={cy} r={Math.min(q.w, q.h) * 0.24} fill="#3B3C42" stroke="#FEFE78" strokeWidth={6} />
          <path
            d={`M${cx - 18} ${cy - 24}v48M${cx + 18} ${cy - 24}v48M${cx - 18} ${cy}h36`}
            stroke="#fff"
            strokeWidth={8}
            strokeLinecap="round"
          />
        </g>
      )}
      {h.style === "garden" && q.w > 150 && q.h > 150 && (
        <g>
          <rect x={q.x + 26} y={q.y + 26} width={q.w - 52} height={q.h - 52} rx={14} fill={GRASS} />
          <circle cx={q.x + 70} cy={q.y + 70} r={26} fill="#6FB453" stroke={INK} strokeWidth={3} />
          <circle cx={q.x + q.w - 70} cy={q.y + q.h - 70} r={30} fill="#5FA347" stroke={INK} strokeWidth={3} />
        </g>
      )}
      {h.style === "ribs" && (
        <g stroke="rgba(0,0,0,.16)" strokeWidth={4}>
          {h.w > h.h
            ? Array.from({ length: Math.max(0, Math.floor(h.w / 36) - 1) }, (_, i) => (
                <line key={i} x1={h.x + 36 * (i + 1)} y1={h.y + 6} x2={h.x + 36 * (i + 1)} y2={h.y + h.h - 6} />
              ))
            : Array.from({ length: Math.max(0, Math.floor(h.h / 36) - 1) }, (_, i) => (
                <line key={i} x1={h.x + 6} y1={h.y + 36 * (i + 1)} x2={h.x + h.w - 6} y2={h.y + 36 * (i + 1)} />
              ))}
        </g>
      )}
      {h.style === "gable" && (
        // конёк двускатной крыши, тёмный скат и труба
        <g>
          {h.w > h.h ? (
            <>
              <rect x={h.x + 2} y={cy} width={h.w - 4} height={h.h / 2 - 2} rx={8} fill="rgba(0,0,0,.14)" />
              <line x1={h.x + 8} y1={cy} x2={h.x + h.w - 8} y2={cy} stroke={INK} strokeWidth={3} />
            </>
          ) : (
            <>
              <rect x={cx} y={h.y + 2} width={h.w / 2 - 2} height={h.h - 4} rx={8} fill="rgba(0,0,0,.14)" />
              <line x1={cx} y1={h.y + 8} x2={cx} y2={h.y + h.h - 8} stroke={INK} strokeWidth={3} />
            </>
          )}
          <rect x={h.x + h.w * 0.68} y={h.y + h.h * 0.2} width={14} height={14} rx={2} fill="#F4F1EA" stroke={INK} strokeWidth={2.5} />
        </g>
      )}
      {h.style === "container" && (
        <g stroke="rgba(0,0,0,.2)" strokeWidth={2}>
          {Array.from({ length: Math.max(0, Math.floor(h.w / 16) - 1) }, (_, i) => (
            <line key={i} x1={h.x + 16 * (i + 1)} y1={h.y + 4} x2={h.x + 16 * (i + 1)} y2={h.y + h.h - 4} />
          ))}
        </g>
      )}
      {h.tiers === 1 &&
        h.vents.map((v, i) => <rect key={i} x={v.x} y={v.y} width={v.w} height={v.h} rx={4} fill="#fff" stroke={INK} strokeWidth={2.5} />)}
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
        {/* всё содержимое квартала обрезано по его границе — наружу выходят только тени и кроны */}
        <clipPath id={`cb${Math.round(b.x)}_${Math.round(b.y)}`}>
          <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} rx={18} />
        </clipPath>
        <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={30} fill="#DCD8CF" stroke={INK} strokeWidth={4} />
        <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} rx={18} fill={BASE[b.kind]} />

        <g clipPath={`url(#cb${Math.round(b.x)}_${Math.round(b.y)})`}>
          {b.greens.map((g, i) => (
            <rect key={`g${i}`} x={g.x} y={g.y} width={g.w} height={g.h} rx={18} fill={GRASS} />
          ))}
          {b.kind === "plaza" && b.fountain && (
            // мощение кругами от фонтана
            <g fill="none" stroke="rgba(0,0,0,.07)" strokeWidth={5}>
              {[2.2, 3.4, 4.6, 5.8].map((k) => (
                <circle key={k} cx={b.fountain!.cx} cy={b.fountain!.cy} r={b.fountain!.r * k} />
              ))}
            </g>
          )}

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

          {b.paths.map((d, i) => (
            <g key={`p${i}`}>
              <path d={d} fill="none" stroke="#D9CBA6" strokeWidth={48} strokeLinecap="round" />
              <path d={d} fill="none" stroke="#EFE3C8" strokeWidth={40} strokeLinecap="round" />
            </g>
          ))}

          {b.fences.length > 0 && (
            <g stroke="#F4F1EA" strokeWidth={4} strokeDasharray="14 8" opacity={0.85}>
              {b.fences.map((s, i) => (
                <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
              ))}
            </g>
          )}

          {b.stripes.map((s, i) => (
            <line key={`s${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#F4F1EA" strokeWidth={5} strokeLinecap="round" />
          ))}

          {b.courts.map((c, i) =>
            c.type === "tennis" ? (
              <g key={`k${i}`}>
                <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={8} fill="#4E9BD6" stroke={INK} strokeWidth={3} />
                <g stroke="#fff" strokeWidth={3} fill="none">
                  <rect x={c.x + 16} y={c.y + 14} width={c.w - 32} height={c.h - 28} />
                  <line x1={c.x + c.w / 2} y1={c.y + 6} x2={c.x + c.w / 2} y2={c.y + c.h - 6} strokeWidth={5} />
                  <line x1={c.x + 16 + (c.w - 32) * 0.25} y1={c.y + c.h / 2} x2={c.x + 16 + (c.w - 32) * 0.75} y2={c.y + c.h / 2} />
                </g>
              </g>
            ) : c.type === "basket" ? (
              <g key={`k${i}`}>
                <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={8} fill="#E79A5B" stroke={INK} strokeWidth={3} />
                <g stroke="#fff" strokeWidth={3} fill="none">
                  <line x1={c.x + c.w / 2} y1={c.y + 6} x2={c.x + c.w / 2} y2={c.y + c.h - 6} />
                  <circle cx={c.x + c.w / 2} cy={c.y + c.h / 2} r={22} />
                  <path d={`M${c.x + 4} ${c.y + c.h / 2 - 32}a32 32 0 0 1 0 64M${c.x + c.w - 4} ${c.y + c.h / 2 - 32}a32 32 0 0 0 0 64`} />
                </g>
              </g>
            ) : (
              // детская площадка: песок, горка и песочница
              <g key={`k${i}`}>
                <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={22} fill="#EAD9A8" stroke={INK} strokeWidth={3} />
                <rect x={c.x + c.w * 0.14} y={c.y + c.h * 0.2} width={c.w * 0.16} height={c.h * 0.6} rx={6} fill="#FFB6E1" stroke={INK} strokeWidth={3} />
                <circle cx={c.x + c.w * 0.68} cy={c.y + c.h * 0.5} r={Math.min(c.w, c.h) * 0.22} fill="#86DDFF" stroke={INK} strokeWidth={3} />
              </g>
            )
          )}

          {b.mounds.map((m, i) => (
            <g key={`m${i}`}>
              <ellipse cx={m.cx + 10} cy={m.cy + 12} rx={m.rx} ry={m.ry} fill="rgba(0,0,0,.12)" />
              <ellipse cx={m.cx} cy={m.cy} rx={m.rx} ry={m.ry} fill="#B88F5E" stroke={INK} strokeWidth={3} />
              <ellipse cx={m.cx - m.rx * 0.25} cy={m.cy - m.ry * 0.3} rx={m.rx * 0.4} ry={m.ry * 0.3} fill="#CFA676" />
            </g>
          ))}

          {b.ponds.map((p, i) => (
            <g key={`w${i}`}>
              {/* песчаный берег — тот же контур, обведённый толстой линией */}
              <path d={p.d} fill="#E3D6A8" stroke="#E3D6A8" strokeWidth={34} strokeLinejoin="round" />
              <path d={p.d} fill={WATER} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
              <ellipse cx={p.cx - p.rx * 0.25} cy={p.cy - p.ry * 0.35} rx={p.rx * 0.3} ry={p.ry * 0.1} fill="rgba(255,255,255,.55)" />
              {p.lilies.map((l, k) => (
                <circle key={k} cx={l.x} cy={l.y} r={l.r} fill="#7FC35E" stroke={INK} strokeWidth={2} />
              ))}
            </g>
          ))}

          {b.fountain && (
            <g>
              <circle cx={b.fountain.cx} cy={b.fountain.cy} r={b.fountain.r + 16} fill="#DCD3C0" stroke={INK} strokeWidth={4} />
              <circle cx={b.fountain.cx} cy={b.fountain.cy} r={b.fountain.r} fill={WATER} stroke={INK} strokeWidth={3} />
              <circle cx={b.fountain.cx} cy={b.fountain.cy} r={b.fountain.r * 0.55} fill="none" stroke="rgba(255,255,255,.8)" strokeWidth={4} strokeDasharray="10 12" />
              <circle cx={b.fountain.cx} cy={b.fountain.cy} r={b.fountain.r * 0.2} fill="#fff" stroke={INK} strokeWidth={3} />
            </g>
          )}

          {b.pools.map((p, i) => (
            <rect key={`o${i}`} x={p.x} y={p.y} width={p.w} height={p.h} rx={10} fill={WATER} stroke="#fff" strokeWidth={5} />
          ))}

          {b.beds.map((f, i) => (
            <g key={`fl${i}`}>
              <circle cx={f.x} cy={f.y} r={f.r} fill="#5FA347" />
              <circle cx={f.x} cy={f.y} r={f.r * 0.62} fill={f.c} stroke={INK} strokeWidth={2} />
            </g>
          ))}

          {b.parked.map((c, i) => (
            <g key={`c${i}`}>
              <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={14} fill={c.c} stroke={INK} strokeWidth={3} />
              <rect x={c.x + 8} y={c.y + 22} width={c.w - 16} height={18} rx={5} fill="#2a2a2a" />
            </g>
          ))}

          {b.tanks.map((t, i) => (
            <g key={`tk${i}`}>
              <circle cx={t.x + 12} cy={t.y + 14} r={t.r} fill="rgba(0,0,0,.2)" />
              <circle cx={t.x} cy={t.y} r={t.r} fill={t.c} stroke={INK} strokeWidth={4} />
              <circle cx={t.x} cy={t.y} r={t.r * 0.55} fill="none" stroke="rgba(0,0,0,.14)" strokeWidth={4} />
              <circle cx={t.x} cy={t.y} r={6} fill={INK} />
            </g>
          ))}

          {b.umbrellas.map((u, i) => (
            <g key={`u${i}`}>
              <circle cx={u.x + 5} cy={u.y + 7} r={u.r} fill="rgba(0,0,0,.16)" />
              <circle cx={u.x} cy={u.y} r={u.r} fill={u.c} stroke={INK} strokeWidth={3} />
              <path d={`M${u.x - u.r} ${u.y}h${u.r * 2}M${u.x} ${u.y - u.r}v${u.r * 2}`} stroke="rgba(0,0,0,.25)" strokeWidth={2} />
            </g>
          ))}
        </g>

        {b.curbTrees.map((t, i) => (
          <circle key={`ct${i}`} cx={t.x} cy={t.y} r={t.r} fill={t.c} stroke={INK} strokeWidth={2.5} />
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
            <rect x={b.crane.x - 100 + 30} y={b.crane.y - 11 + 30} width={b.crane.len + 100} height={22} fill="rgba(0,0,0,.15)" />
            <rect x={b.crane.x - 100} y={b.crane.y - 11} width={b.crane.len + 100} height={22} fill="#F2C14E" stroke={INK} strokeWidth={3} />
            <path
              d={Array.from({ length: Math.floor((b.crane.len + 100) / 22) }, (_, i) => `M${b.crane!.x - 100 + i * 22} ${b.crane!.y - 11}l22 22`).join("")}
              stroke={INK}
              strokeWidth={2}
            />
            <rect x={b.crane.x - 110} y={b.crane.y - 26} width={60} height={52} rx={4} fill="#8A8A8A" stroke={INK} strokeWidth={3} />
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
 * Основа (берег, асфальт, река, мосты, разметка) — один неподвижный SVG,
 * каждый квартал — свой слой: так их появление анимируется без перерисовки всего холста.
 * Кольцевые развязки лежат поверх кварталов: кольцо шире улицы и срезает их углы.
 * Внутрь fxRef прикрепляются трещины на домах.
 */
export const CityLayer = memo(
  forwardRef<HTMLDivElement>(function CityLayer(_, fxRef) {
    const city = getCity();
    const { bounds: c, band, outer: o } = city;
    const g = SHORE.grass;
    const s = SHORE.grass + SHORE.sand;
    return (
      <div className="st-city" style={{ left: o.x, top: o.y, width: o.w, height: o.h }} aria-hidden>
        <svg className="st-city__base" viewBox={`${o.x} ${o.y} ${o.w} ${o.h}`} width={o.w} height={o.h}>
          {/* берег: прибой, пляж, полоса травы — и сам город */}
          <rect x={c.x - s - 44} y={c.y - s - 44} width={c.w + (s + 44) * 2} height={c.h + (s + 44) * 2} rx={80 + s + 44} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={10} strokeDasharray="120 90" />
          <rect x={c.x - s - 14} y={c.y - s - 14} width={c.w + (s + 14) * 2} height={c.h + (s + 14) * 2} rx={80 + s + 14} fill="#BFEAFB" />
          <rect x={c.x - s} y={c.y - s} width={c.w + s * 2} height={c.h + s * 2} rx={80 + s} fill={SAND} stroke={INK} strokeWidth={4} />
          <rect x={c.x - g} y={c.y - g} width={c.w + g * 2} height={c.h + g * 2} rx={80 + g} fill={GRASS} stroke={INK} strokeWidth={4} />
          {city.beach.map((u, i) => (
            <g key={`bu${i}`}>
              <circle cx={u.x + 5} cy={u.y + 7} r={u.r} fill="rgba(0,0,0,.14)" />
              <circle cx={u.x} cy={u.y} r={u.r} fill={u.c} stroke={INK} strokeWidth={3} />
              <path d={`M${u.x - u.r} ${u.y}h${u.r * 2}M${u.x} ${u.y - u.r}v${u.r * 2}`} stroke="rgba(0,0,0,.22)" strokeWidth={2} />
            </g>
          ))}
          {city.boats.map((b, i) => (
            <g key={`bo${i}`} transform={`rotate(${b.a} ${b.x} ${b.y})`}>
              <path d={`M${b.x - 34} ${b.y}q34 -30 68 0q-34 30 -68 0z`} fill="#fff" stroke={INK} strokeWidth={3} />
              <path d={`M${b.x - 8} ${b.y}l26 -12v24z`} fill={b.c} stroke={INK} strokeWidth={2.5} />
            </g>
          ))}

          {/* река дотекает до моря: поверх берега и пляжа */}
          <path d={city.river} fill="none" stroke={SAND} strokeWidth={40} />
          <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={80} fill={ASPHALT} stroke={INK} strokeWidth={4} />
          {/* под полупрозрачными островами — светлое основание, иначе асфальт их затемнит */}
          {ISLANDS.map((i) => (
            <rect key={i.id} x={i.x} y={i.y} width={i.w} height={i.h} rx={72} fill="#ECEAE4" />
          ))}

          {/* набережная с рекой */}
          <rect x={band.x} y={band.y} width={band.w} height={band.h} fill={GRASS} />
          <path d={`M${band.x} ${band.y}h${band.w}M${band.x} ${band.y + band.h}h${band.w}`} stroke={INK} strokeWidth={4} />
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

          <g stroke="#F4F1EA" strokeWidth={8} strokeDasharray="56 44" opacity={0.7}>
            {city.lines.map((l, i) => (
              <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
            ))}
          </g>
          {/* пешеходные переходы: полосы вдоль движения */}
          {city.zebras.map((z, i) => (
            <g key={`z${i}`}>
              <line x1={z.x1} y1={z.y1} x2={z.x2} y2={z.y2} stroke={ASPHALT} strokeWidth={z.w + 14} />
              <line x1={z.x1} y1={z.y1} x2={z.x2} y2={z.y2} stroke="#F4F1EA" strokeWidth={z.w} strokeDasharray="16 14" opacity={0.92} />
            </g>
          ))}
        </svg>
        {city.blocks.map((b, i) => (
          <BlockView key={i} b={b} ox={o.x} oy={o.y} />
        ))}
        {/* кольцевые развязки: клумба с деревом посередине; каждая — свой небольшой слой */}
        {city.rings.map((r, i) => {
          const R = RING.road + 10;
          return (
            <svg
              key={`ring${i}`}
              className="st-city__ring"
              style={{ left: r.cx - R - o.x, top: r.cy - R - o.y }}
              viewBox={`${r.cx - R} ${r.cy - R} ${R * 2} ${R * 2}`}
              width={R * 2}
              height={R * 2}
            >
              <circle cx={r.cx} cy={r.cy} r={RING.road} fill={ASPHALT} stroke={INK} strokeWidth={4} />
              {/* въезды: стираем обводку кольца там, где в него входят улицы */}
              <path d={`M${r.cx - R} ${r.cy}h${R * 2}M${r.cx} ${r.cy - R}v${R * 2}`} stroke={ASPHALT} strokeWidth={192} />
              <circle cx={r.cx} cy={r.cy} r={(RING.road + RING.isle) / 2} fill="none" stroke="#F4F1EA" strokeWidth={6} strokeDasharray="30 24" opacity={0.7} />
              <circle cx={r.cx} cy={r.cy} r={RING.isle} fill={GRASS} stroke={INK} strokeWidth={4} />
              <circle cx={r.cx + 6} cy={r.cy + 8} r={30} fill="rgba(0,0,0,.18)" />
              <circle cx={r.cx} cy={r.cy} r={30} fill="#5FA347" stroke={INK} strokeWidth={3} />
            </svg>
          );
        })}
        <div ref={fxRef} className="st-city__fx" />
      </div>
    );
  })
);
