"use client";

import { useState } from "react";
import type { WorkItem } from "@/lib/content";
import { MicroButton, Pill } from "./Pill";

export function WorkCard({ item }: { item: WorkItem }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="work-card">
      <div className="work-card__period">
        <span className="data-chip">{item.period}</span>
      </div>
      <div className="work-card__body">
        <div className="work-card__head">
          <h3 className="h-36">{item.company}</h3>
          <div>
            <div className="work-card__role-row">
              <span className="work-card__role">{item.role}</span>
              <MicroButton
                open={open}
                onClick={() => setOpen(!open)}
                label={`Подробнее о работе в ${item.company}`}
              />
            </div>
            {open && <p className="work-card__desc">{item.description}</p>}
          </div>
        </div>
        <div className="work-card__tags">
          {item.tags.map((tag) => (
            <Pill key={tag} color={item.tagColor}>
              {tag}
            </Pill>
          ))}
        </div>
      </div>
    </article>
  );
}
