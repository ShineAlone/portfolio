import type { AchievementId } from "./data";

// Свои значки для достижений и экскурсии.
const GLYPHS: Record<AchievementId | "tour", React.ReactNode> = {
  tour: <path d="M8 5l11 7-11 7V5z" />,
  sticker: <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.9l-5.3 2.5 1.2-6-4.5-4.1 6-.7z" />,
  map: <path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5V6.5zm6-2.5v13.5m6-11v13.5" />,
  pile: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M5 16V6a2 2 0 012-2h10" />
    </>
  ),
  orbit: (
    <>
      <rect x="7.5" y="3" width="9" height="18" rx="2" />
      <path d="M11 17.5h2" />
    </>
  ),
  slides: <path d="M3 4.5h18v11H3zM12 15.5V20m-4 0h8" />,
  zoom: <path d="M10.5 4a6.5 6.5 0 110 13 6.5 6.5 0 010-13zM20 20l-4.8-4.8M10.5 8v5M8 10.5h5" />,
  drive: (
    <>
      <path d="M5 16V11.5L7 6.5h10l2 5V16H5z" />
      <path d="M5 11.5h14M7.5 16v2M16.5 16v2" />
      <circle cx="8" cy="13.6" r="0.8" />
      <circle cx="16" cy="13.6" r="0.8" />
    </>
  ),
};

export function Glyph({ id, size = 22 }: { id: AchievementId | "tour"; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {GLYPHS[id]}
    </svg>
  );
}
