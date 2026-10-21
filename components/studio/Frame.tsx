import { islandById, type FrameMeta } from "./data";

// у этих блоков наведение не рисует рамку и подпись — они и так крупные и понятные
const QUIET_ISLANDS = ["plugins", "pres", "cases"];

// Фрейм на холсте: позиция и размер из данных, подпись и рамка выделения.
export function Frame({
  meta,
  selected,
  className,
  children,
}: {
  meta: FrameMeta;
  selected: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const color = islandById(meta.island).color;
  const quiet = QUIET_ISLANDS.includes(meta.island) || meta.id === "history";
  return (
    <div
      className={`st-frame${quiet ? " is-quiet" : ""}${selected ? " is-selected" : ""}${className ? ` ${className}` : ""}`}
      data-frame={meta.id}
      data-name={meta.name}
      data-color={color}
      style={
        {
          left: meta.x,
          top: meta.y,
          width: meta.w,
          height: meta.h,
          "--r": `${meta.r}px`,
          "--c": color,
        } as React.CSSProperties
      }
    >
      <div className="st-frame__label">{meta.name}</div>
      {children}
    </div>
  );
}
