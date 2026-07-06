"use client";

import { useState } from "react";
import { MicroButton } from "./Pill";

export function Section({
  title,
  subtitle,
  description,
  children,
}: {
  title: string;
  subtitle?: string;
  description: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <section className="section">
      <div className="section__header">
        <div className="section__title-row">
          <h2 className="h-36">{title}</h2>
          <MicroButton
            open={open}
            onClick={() => setOpen(!open)}
            label={`Свернуть или развернуть раздел «${title}»`}
          />
        </div>
        {subtitle && <p className="sub-24 section__subtitle">{subtitle}</p>}
        <p className="body-16 text-open-sans">{description}</p>
      </div>
      {open && <div className="section__content">{children}</div>}
    </section>
  );
}
