// Собственный набор иконок для интерфейса холста (не копия иконок Figma).
const PATHS: Record<string, React.ReactNode> = {
  move: <path d="M4.5 3.5l10 4.6-4.3 1.4-1.5 4.3-4.2-10.3z" />,
  hand: (
    <path d="M6.5 9.5V5a1 1 0 012 0v4m0-.5V3.8a1 1 0 012 0V9m0-.5V5a1 1 0 012 0v5m0-2.5a1 1 0 012 0v3.2A5.3 5.3 0 019.2 16H9a4.8 4.8 0 01-3.9-2L3.4 11.5a1 1 0 011.6-1.2l1.5 1.9" />
  ),
  comment: <path d="M3.5 9a5.5 5.5 0 115.5 5.5H3.5V9z" />,
  fit: (
    <path d="M3 6.5V3h3.5M11.5 3H15v3.5M15 11.5V15h-3.5M6.5 15H3v-3.5" />
  ),
  frame: <path d="M6 2.5v13M12 2.5v13M2.5 6h13M2.5 12h13" />,
  section: (
    <>
      <rect x="2.5" y="5" width="13" height="10" rx="1.5" />
      <path d="M2.5 5V3.5h6V5" />
    </>
  ),
  sticky: <path d="M3 3h12v8l-4 4H3V3zm8 12v-4h4" />,
  page: <path d="M4.5 2.5h6l3 3v10h-9v-13zm6 0v3h3" />,
  play: <path d="M6 4l8 5-8 5V4z" />,
  chevron: <path d="M5 7l4 4 4-4" />,
  link: <path d="M10.5 3.5H14.5V7.5M14.5 3.5L8 10M12.5 10.5v4h-9v-9h4" />,
};

export function Icon({ name, size = 18 }: { name: keyof typeof PATHS | string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
