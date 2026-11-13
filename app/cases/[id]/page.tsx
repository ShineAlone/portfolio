import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LINKS } from "@/lib/content";
import { portfolioCases, portfolioCaseIds, type PortfolioCaseId } from "@/components/studio/portfolioCases";
import "../../v2/mobile.css";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return portfolioCaseIds.map((id) => ({ id }));
}

async function resolveCase({ params }: Props) {
  const { id } = await params;
  if (!portfolioCaseIds.includes(id as PortfolioCaseId)) notFound();
  return { id, item: portfolioCases[id as PortfolioCaseId] };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { item } = await resolveCase(props);
  return { title: `${item.title} — Арсений Кононов`, description: item.summary };
}

export default async function PortfolioCasePage(props: Props) {
  const { id, item } = await resolveCase(props);
  return (
    <div className="m-app">
      <main className="m-main m-case">
        <a href="/?section=cases">← Все кейсы</a>
        <header>
          <p>{item.category}</p>
          <h1>{item.title}</h1>
          <p>{item.summary}</p>
          <p><strong>Роль</strong> · {item.role}</p>
        </header>
        {item.sections.map((section) => (
          <section className="m-section" key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.text}</p>
            <img src={section.image} width={section.width} height={section.height} alt={section.title} loading="lazy" decoding="async" />
          </section>
        ))}
        <div className="m-actions">
          <a className="m-button" href={`/?canvas&section=cases&case=${id}`}>Интерактивный кейс на холсте ↗</a>
          <a href={LINKS.telegram} target="_blank" rel="noopener noreferrer">Написать в Telegram ↗</a>
        </div>
      </main>
    </div>
  );
}
