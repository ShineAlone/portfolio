import type { ToolId } from "./data";

// Свои значки для плагинов в доке.
const GLYPHS: Record<ToolId, React.ReactNode> = {
  geometry: <path d="M5 16l4-11 6 4 4 9-9 2-5-4z" />,
  digest: <path d="M5 4h10l4 4v12H5V4zm3 6h8M8 13h8M8 16h5" />,
  card: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M7.5 15.5h9M7.5 12h6M7.5 8.5h3" />
    </>
  ),
  pattern: (
    <>
      <circle cx="7" cy="7" r="2.2" />
      <circle cx="17" cy="7" r="2.2" />
      <circle cx="7" cy="17" r="2.2" />
      <circle cx="17" cy="17" r="2.2" />
      <path d="M12 9.5v5M9.5 12h5" />
    </>
  ),
  telegram: <path d="M20 4.5L3.8 10.8l5.4 2 2 6 3-3.7 4.4 3.2L20 4.5zM9.2 12.8l8-5.6" />,
  check: <path d="M5 6.5l1.6 1.6L9.5 5M5 12.5l1.6 1.6 2.9-3.1M5 18.5l1.6 1.6 2.9-3.1M12.5 7h7M12.5 13h7M12.5 19h5" />,
};

export function ToolGlyph({ id, size = 22 }: { id: ToolId; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {GLYPHS[id]}
    </svg>
  );
}
