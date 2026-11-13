import type { AchievementId } from "./data";

// Свои значки для достижений.
const GLYPHS: Record<AchievementId, React.ReactNode> = {
  sticker: <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.9l-5.3 2.5 1.2-6-4.5-4.1 6-.7z" />,
  react: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0112 7.4a4.3 4.3 0 017.5 2.4C19.5 15.4 12 20 12 20z" />,
  route: (
    <>
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <path d="M8.2 18H14a3 3 0 000-6h-4a3 3 0 010-6h5.8" />
    </>
  ),
  // микрофон на сцене
  forum: (
    <>
      <rect x="9" y="3" width="6" height="10" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0013 0M12 17.500V21m-3.5 0h7" />
    </>
  ),
  map: <path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5V6.5zm6-2.5v13.5m6-11v13.5" />,
  // сфера постов
  pile: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.500c3 3 3 14 0 17M12 3.500c-3 3-3 14 0 17" />
    </>
  ),
  // стопка обоев
  orbit: (
    <>
      <rect x="4" y="7" width="12" height="13" rx="2" />
      <path d="M8 4h10a2 2 0 012 2v11M4 16l4-4 3 3 2-2 3 3" />
    </>
  ),
  slides: <path d="M3 4.5h18v11H3zM12 15.5V20m-4 0h8" />,
  zoom: <path d="M10.5 4a6.5 6.5 0 110 13 6.5 6.5 0 010-13zM20 20l-4.8-4.8M10.5 8v5M8 10.5h5" />,
  drive: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 9.5v5" />
    </>
  ),
};

export function Glyph({ id, size = 22 }: { id: AchievementId; size?: number }) {
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
