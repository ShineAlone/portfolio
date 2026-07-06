import {
  AUTOMATION,
  EDUCATION,
  HERO,
  PRESENTATIONS,
  PROJECTS,
  SOCIAL,
  STATS,
  TOOLS,
  WALLPAPERS,
  WORK,
} from "@/lib/content";
import { MediaCard } from "@/components/MediaCard";
import { ScrollSpinner } from "@/components/ScrollSpinner";
import { Section } from "@/components/Section";
import { TgButton } from "@/components/Pill";
import { WorkCard } from "@/components/WorkCard";

/* eslint-disable @next/next/no-img-element */

function Status({ label }: { label: string }) {
  return (
    <span className="hero__status">
      <span className="hero__dot" aria-hidden />
      <span className="body-16">{label}</span>
    </span>
  );
}

export default function Home() {
  return (
    <main className="container">
      <ScrollSpinner />
      {/* Hero */}
      <section className="hero">
        <div className="hero__photo">
          <img src="/images/photo.png" alt="Арсений Кононов" />
        </div>
        <div className="hero__text">
          <h1 className="hero__title">
            <span className="hero__hello">{HERO.title[0]}</span>
            <span className="hero__name">{HERO.title[1]}</span>
          </h1>
          <div className="hero__bottom">
            <TgButton label={HERO.contactLabel} />
            <Status label={HERO.statusLabel} />
          </div>
        </div>
        <div className="stats" aria-label="Цифры">
          {STATS.map((s) => (
            <div key={s.label} className="stats__item">
              <span className="stats__value">{s.value}</span>
              <span className="stats__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Био */}
      <div className="hero-bio">
        {HERO.paragraphs.map((p) => (
          <p key={p.slice(0, 20)} className="body-16">
            {p}
          </p>
        ))}
      </div>

      {/* Образование и инструменты */}
      <section className="edu-tools">
        <div className="edu-tools__col">
          <h2 className="h-36">{EDUCATION.title}</h2>
          <div className="edu__row">
            <span className="data-chip edu__years">
              {EDUCATION.years[0]}
              <br />
              {EDUCATION.years[1]}
            </span>
            <div className="edu__text body-16">
              {EDUCATION.lines.map((line) => (
                <p key={line.slice(0, 20)}>{line}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="edu-tools__col">
          <h2 className="h-36">{TOOLS.title}</h2>
          <div className="tools__row">
            {TOOLS.icons.map((icon) => (
              <span
                key={icon.src}
                className={`tools__icon${icon.boxed ? " tools__icon--boxed" : ""}`}
              >
                <img src={icon.src} alt={icon.alt} />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Опыт работы */}
      <section className="work-list" aria-label="Опыт работы">
        {WORK.map((item) => (
          <WorkCard key={item.company} item={item} />
        ))}
      </section>

      {/* Автоматизация и инструменты */}
      <Section
        title={AUTOMATION.title}
        subtitle={AUTOMATION.subtitle}
        description={AUTOMATION.description}
      >
        <div className="cards-grid">
          {AUTOMATION.cards.map((card) => (
            <MediaCard key={card.title} card={card} />
          ))}
        </div>
      </Section>

      {/* Социальные сети */}
      <Section
        title={SOCIAL.title}
        subtitle={SOCIAL.subtitle}
        description={SOCIAL.description}
      >
        <div className="tile-grid">
          {SOCIAL.rows.flat().map((src) => (
            <img key={src} src={src} alt="Пост для социальных сетей" loading="lazy" />
          ))}
        </div>
      </Section>

      {/* Обои */}
      <Section title={WALLPAPERS.title} description={WALLPAPERS.description}>
        <div className="wp-mosaic">
          {WALLPAPERS.rows.map((row) => (
            <div
              key={row.images[0]}
              className="wp-row"
              style={{
                gridTemplateColumns: row.cols
                  .map((c) => (c === 2 ? "8fr" : "3fr"))
                  .join(" "),
              }}
            >
              {row.images.map((src) => (
                <img key={src} src={src} alt="Обои" loading="lazy" />
              ))}
            </div>
          ))}
        </div>
      </Section>

      {/* Презентации */}
      <Section
        title={PRESENTATIONS.title}
        subtitle={PRESENTATIONS.subtitle}
        description={PRESENTATIONS.description}
      >
        <div className="cards-grid">
          {PRESENTATIONS.cards.map((card) => (
            <MediaCard key={card.text} card={card} />
          ))}
        </div>
        <div style={{ marginTop: 20 }}>
          {PRESENTATIONS.slideGroups.map((group) => (
            <div key={group[0]} className="slides-grid">
              {group.map((src) => (
                <img key={src} src={src} alt="Слайд презентации" loading="lazy" />
              ))}
            </div>
          ))}
        </div>
      </Section>

      {/* Проекты */}
      <Section
        title={PROJECTS.title}
        subtitle={PROJECTS.subtitle}
        description={PROJECTS.description}
      >
        <div className="projects-collage">
          <div className="projects-grid-3">
            {PROJECTS.coffeeGrid.map((src) => (
              <img key={src} src={src} alt="Проект — кофейня" loading="lazy" />
            ))}
          </div>
          <div className="projects-2col">
            {/* Левая колонка (как в макете, сверху вниз) */}
            <div className="projects-2col__col">
              <img src={PROJECTS.sites.tzVk} alt="Сайт" loading="lazy" />
              <img src={PROJECTS.sites.serviceSoft1} alt="Сайт Service Soft" loading="lazy" />
              <div className="projects-screens">
                <img src={PROJECTS.sites.site1920} alt="Лендинг" loading="lazy" />
                <img
                  src={PROJECTS.sites.androidCompact}
                  alt="Мобильная версия"
                  loading="lazy"
                />
              </div>
              <div className="projects-grid-2">
                {PROJECTS.er.templates.map((src) => (
                  <img key={src} src={src} alt="Шаблон" loading="lazy" />
                ))}
              </div>
            </div>
            {/* Правая колонка */}
            <div className="projects-2col__col">
              <img src={PROJECTS.sites.platforma} alt="Сайт «Платформа»" loading="lazy" />
              <img src={PROJECTS.sites.binghatti} alt="Сайт Binghatti Nova" loading="lazy" />
              <img src={PROJECTS.sites.serviceSoft2} alt="Сайт Service Soft" loading="lazy" />
              <div className="projects-grid-2">
                {PROJECTS.merch.map((src) => (
                  <img key={src} src={src} alt="Мерч" loading="lazy" />
                ))}
              </div>
              <img
                src={PROJECTS.transarctic}
                alt="Трансарктический транспортный коридор"
                loading="lazy"
              />
              <div className="projects-grid-2">
                {PROJECTS.er.photos.map((src) => (
                  <img key={src} src={src} alt="Оформление" loading="lazy" />
                ))}
              </div>
              {PROJECTS.er.banners.map((src) => (
                <img key={src} src={src} alt="Баннер" loading="lazy" />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Футер */}
      <footer className="footer">
        <TgButton label={HERO.contactLabel} />
        <Status label={HERO.statusLabel} />
      </footer>
    </main>
  );
}
