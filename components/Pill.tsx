export function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="pill" style={{ background: color }}>
      {children}
    </span>
  );
}

export function TgButton({ label }: { label: string }) {
  return (
    <a
      className="pill pill--btn"
      href="https://t.me/sh1nealone"
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
    </a>
  );
}

export function FigmaButton() {
  return (
    <a
      className="pill pill--btn"
      href="https://www.figma.com/community/plugin/1637580282322341528"
      target="_blank"
      rel="noopener noreferrer"
    >
      Открыть в Figma
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/figma-btn.svg" alt="" width={11} height={16} />
    </a>
  );
}

export function MicroButton({
  open,
  onClick,
  label,
}: {
  open: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`micro-btn${open ? " micro-btn--open" : ""}`}
      onClick={onClick}
      aria-expanded={open}
      aria-label={label}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/chevron.svg" alt="" />
    </button>
  );
}
