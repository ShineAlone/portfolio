import { islandById, type FrameMeta } from "./data";

// у этих блоков наведение не рисует рамку и подпись — они и так крупные и понятные
const QUIET_ISLANDS = ["plugins", "cases", "social", "wall"];

// Фрейм на холсте: позиция и размер из данных, подпись и рамка выделения.
export function Frame({
  meta,
  selected,
  className,
  noSelect,
  children,
}: {
  meta: FrameMeta;
  selected: boolean;
  className?: string;
  /** клик не выделяет фрейм (например, длинная лента кейса — внутри свои кнопки) */
  noSelect?: boolean;
  children: React.ReactNode;
}) {
  const color = islandById(meta.island).color;
  const quiet = QUIET_ISLANDS.includes(meta.island) || meta.id === "history";
  // увеличенный фрейм: вёрстка остаётся в исходных пикселях, zoom растягивает её целиком
  const k = meta.k ?? 1;
  return (
    <div
      className={`st-frame${quiet ? " is-quiet" : ""}${selected ? " is-selected" : ""}${className ? ` ${className}` : ""}`}
      data-frame={meta.id}
      data-ui={noSelect ? "" : undefined}
      data-name={meta.name}
      data-color={color}
      style={
        {
          left: meta.x / k,
          top: meta.y / k,
          width: meta.w / k,
          height: meta.h / k,
          zoom: k === 1 ? undefined : k,
          "--zk": k === 1 ? undefined : k,
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
