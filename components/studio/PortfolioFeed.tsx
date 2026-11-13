import { HERO, LINKS, WORK } from "@/lib/content";
import { portfolioCases, portfolioCaseIds } from "./portfolioCases";

const projects = [
  { title: "Service Soft", text: "Сайт компании, разрабатывающей B2B-системы.", image: "/images/projects/service-soft-2-v2-preview.webp" },
  { title: "Кофе Культ", text: "Концепт айдентики и упаковки для сети кофеен.", image: "/images/projects/coffee-1-preview.webp" },
  { title: "Российское село — место силы", text: "Айдентика и оформление экранов форума.", image: "/images/projects/forum/main-1-preview.webp" },
];

export function PortfolioFeed() {
  return (
    <div className="m-app">
      <header className="m-top">
        <nav className="m-links" aria-label="Разделы">
          <a href="#m-cases">Кейсы</a>
          <a href="#m-projects">Проекты</a>
          <a href="#m-experience">Опыт</a>
          <a href="#m-contact">Контакты</a>
        </nav>
      </header>
      <main className="m-main">
        <section className="m-intro">
          <img src="/images/photo-480.webp" width={480} height={480} alt="Арсений Кононов" loading="lazy" decoding="async" />
          <div>
            <h1>Арсений Кононов</h1>
            <p>Продуктовый и коммуникационный дизайнер</p>
            <div className="m-actions">
              <a className="m-button" href="#m-cases">Смотреть кейсы</a>
              <a href={LINKS.telegram} target="_blank" rel="noopener noreferrer">Написать в Telegram ↗</a>
            </div>
          </div>
        </section>
        <section id="m-cases" className="m-section">
          <h2>Кейсы</h2>
          <div className="m-grid">
            {portfolioCaseIds.map((id) => {
              const item = portfolioCases[id];
              return (
                <a className="m-work" href={`/cases/${id}`} key={id}>
                  <img src={item.preview} alt="" loading="lazy" decoding="async" />
                  <div>
                    <small>{item.category}</small>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <span>Открыть кейс ↗</span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
        <section id="m-projects" className="m-section">
          <h2>Проекты</h2>
          <div className="m-grid m-grid--projects">
            {projects.map(({ title, text, image }) => (
              <article className="m-work" key={title}>
                <img src={image} alt="" loading="lazy" decoding="async" />
                <div><h3>{title}</h3><p>{text}</p></div>
              </article>
            ))}
          </div>
          <a href="/?canvas&section=proj">Больше проектов на холсте ↗</a>
        </section>
        <section id="m-experience" className="m-section">
          <h2>Опыт</h2>
          <p>{HERO.paragraphs[0]}</p>
          <ul className="m-experience">
            {WORK.map(({ company, role, period }) => (
              <li key={company}><strong>{role}</strong><span>{company}</span><small>{period}</small></li>
            ))}
          </ul>
        </section>
        <section id="m-contact" className="m-section">
          <h2>Контакты</h2>
          <div className="m-actions">
            <a className="m-button" href={LINKS.telegram} target="_blank" rel="noopener noreferrer">Написать в Telegram ↗</a>
            <a href="/?canvas">Открыть интерактивный холст ↗</a>
          </div>
        </section>
      </main>
    </div>
  );
}
