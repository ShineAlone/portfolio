import {
  AUTOMATION,
  EDUCATION,
  HERO,
  LINKS,
  PRESENTATIONS,
  PROJECTS,
  SOCIAL,
  STATS,
  TOOLS,
  WALLPAPERS,
  WORK,
  type MediaCard,
} from "@/lib/content";

/* eslint-disable @next/next/no-img-element */

export type Rect = { x: number; y: number; w: number; h: number };

export type Info = {
  text: React.ReactNode;
  tags?: string[];
  tagColor?: string;
  link?: { href: string; label: string };
};

export type SectionDef = Rect & { id: string; name: string };

export type FrameDef = Rect & {
  id: string;
  name: string;
  section?: string;
  fill?: string;
  kind?: "frame" | "sticky";
  info?: Info;
  content: React.ReactNode;
};

export type PinDef = { id: string; x: number; y: number; text: string };

// Координаты в «мировых» пикселях холста, как в Figma.
export const SECTIONS: SectionDef[] = [
  { id: "s-about", name: "Обо мне", x: 0, y: 0, w: 2240, h: 1180 },
  { id: "s-plugins", name: "Плагины и сервисы", x: 2440, y: 0, w: 2000, h: 1180 },
  { id: "s-social", name: "Соцсети", x: 0, y: 1380, w: 1140, h: 1530 },
  { id: "s-wall", name: "Обои", x: 1340, y: 1380, w: 1560, h: 1530 },
  { id: "s-pres", name: "Презентации", x: 3100, y: 1380, w: 1340, h: 1530 },
  { id: "s-proj", name: "Проекты", x: 0, y: 3110, w: 4440, h: 1680 },
];

const sec = (id: string) => SECTIONS.find((s) => s.id === id)!;
const at = (section: string, x: number, y: number) => ({
  section,
  x: sec(section).x + x,
  y: sec(section).y + y,
});

const poster = (video: string) =>
  video.replace("/videos/", "/images/posters/").replace(".mp4", ".jpg");

/* ---------- содержимое фреймов ---------- */

function HeroFrame() {
  return (
    <div className="cvh">
      <div className="cvh__text">
        <div className="cvh__hello">{HERO.title[0]}</div>
        <div className="cvh__name">{HERO.title[1]}</div>
        <div className="cvh__cta">
          <a className="cv-btn-black" href={LINKS.telegram} target="_blank" rel="noopener noreferrer">
            {HERO.contactLabel}
          </a>
          <span className="cvh__status">
            <i />
            {HERO.statusLabel}
          </span>
        </div>
      </div>
      <div className="cvh__photo">
        <img src="/images/photo.png" alt="Арсений Кононов" draggable={false} />
      </div>
      <div className="cvh__stats">
        {STATS.map((s) => (
          <div key={s.label}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BioFrame() {
  return (
    <div className="cv-pad cv-text16">
      {HERO.paragraphs.map((p) => (
        <p key={p.slice(0, 20)}>{p}</p>
      ))}
    </div>
  );
}

function EduFrame() {
  return (
    <div className="cv-pad cve">
      <div>
        <div className="cv-h24">{EDUCATION.title}</div>
        <div className="cve__row">
          <span className="cv-chip-black">
            {EDUCATION.years[0]} {EDUCATION.years[1]}
          </span>
          <div>
            {EDUCATION.lines.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
        </div>
      </div>
      <div>
        <div className="cv-h24">{TOOLS.title}</div>
        <div className="cve__tools">
          {TOOLS.icons.map((i) => (
            <span key={i.src} className={i.boxed ? "is-boxed" : ""}>
              <img src={i.src} alt={i.alt} draggable={false} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExperienceFrame() {
  return (
    <div className="cv-pad cvx">
      <div className="cv-h36">Опыт работы</div>
      {WORK.map((w) => (
        <div className="cvx__item" key={w.company}>
          <span className="cv-chip-black cvx__period">{w.period}</span>
          <div>
            <div className="cvx__company">{w.company}</div>
            <div className="cvx__role">{w.role}</div>
            <p className="cvx__desc">{w.description}</p>
            <div className="cv-tags">
              {w.tags.map((t) => (
                <span key={t} style={{ background: w.tagColor }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PluginWindow({ card }: { card?: MediaCard }) {
  if (!card) {
    return (
      <div className="cvp cvp--empty">
        <div className="cvp__plus">+</div>
        <div>Место для нового плагина</div>
      </div>
    );
  }
  return (
    <div className="cvp">
      <div className="cvp__bar">
        <span className="cvp__dots">
          <i />
          <i />
          <i />
        </span>
        <span>{card.title}</span>
      </div>
      <div className="cvp__media">
        {card.video ? (
          <img src={poster(card.video)} alt="" draggable={false} />
        ) : (
          <div className="cvp__nomedia">{card.title}</div>
        )}
      </div>
      <div className="cvp__info">
        <span className="cvp__tag" style={{ background: card.tagColor }}>
          {card.tag}
        </span>
        <p>{card.text}</p>
      </div>
    </div>
  );
}

function ImageGrid({ images, cols, gap, ratio }: { images: string[]; cols: number; gap: number; ratio: string }) {
  return (
    <div className="cv-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gap }}>
      {images.map((src) => (
        <img key={src} src={src} alt="" loading="lazy" draggable={false} style={{ aspectRatio: ratio }} />
      ))}
    </div>
  );
}

const narrowWallpapers = WALLPAPERS.rows.flatMap((r) => r.images.filter((_, i) => r.cols[i] === 1));
const wideWallpapers = WALLPAPERS.rows.flatMap((r) => r.images.filter((_, i) => r.cols[i] === 2));

/* ---------- фреймы ---------- */

export const FRAMES: FrameDef[] = [
  {
    id: "f-hint",
    name: "Как тут всё устроено",
    kind: "sticky",
    x: -380,
    y: 100,
    w: 320,
    h: 380,
    fill: "#FFE58A",
    content: (
      <div className="cv-sticky">
        <b>Привет! Это мой холст 👋</b>
        <p>Колесо — двигаться</p>
        <p>Ctrl + колесо — масштаб</p>
        <p>Клик по фрейму — описание справа</p>
        <p>Слева — слои для быстрых переходов</p>
      </div>
    ),
  },
  {
    id: "f-hero",
    name: "Главная",
    ...at("s-about", 60, 100),
    w: 1040,
    h: 560,
    info: {
      text: "Дизайнер широкого профиля. Интерфейсы, сайты, презентации, соцсети, брендинг мероприятий — и Figma-плагины, которые ускоряют работу команды.",
      link: { href: LINKS.telegram, label: "Написать в Telegram" },
    },
    content: <HeroFrame />,
  },
  {
    id: "f-bio",
    name: "Обо мне",
    ...at("s-about", 60, 720),
    w: 1040,
    h: 210,
    content: <BioFrame />,
  },
  {
    id: "f-edu",
    name: "Образование и инструменты",
    ...at("s-about", 60, 990),
    w: 1040,
    h: 150,
    content: <EduFrame />,
  },
  {
    id: "f-exp",
    name: "Опыт работы",
    ...at("s-about", 1160, 100),
    w: 1020,
    h: 1040,
    content: <ExperienceFrame />,
  },
  ...[...AUTOMATION.cards, undefined, undefined].map((card, i): FrameDef => ({
    id: `f-plugin-${i}`,
    name: card ? card.title : "Новый плагин",
    ...at("s-plugins", 60 + (i % 4) * 480, 100 + Math.floor(i / 4) * 520),
    w: 440,
    h: 480,
    fill: "transparent",
    info: card
      ? {
          text: card.text,
          tags: [card.tag],
          tagColor: card.tagColor,
          link: card.figmaButton ? { href: LINKS.figmaPlugin, label: "Открыть в Figma" } : undefined,
        }
      : { text: "Сюда встанут новые плагины и сервисы." },
    content: <PluginWindow card={card} />,
  })),
  {
    id: "f-social",
    name: "Посты для соцсетей",
    ...at("s-social", 60, 100),
    w: 1020,
    h: 1364,
    fill: "transparent",
    info: { text: SOCIAL.description, tags: [SOCIAL.subtitle] },
    content: <ImageGrid images={SOCIAL.rows.flat()} cols={6} gap={12} ratio="1" />,
  },
  {
    id: "f-wall-phone",
    name: "Обои для телефона",
    ...at("s-wall", 60, 100),
    w: 1440,
    h: 400,
    info: { text: WALLPAPERS.description },
    content: (
      <div className="cvw-phones">
        {narrowWallpapers.slice(0, 8).map((src) => (
          <div className="cvw-phone" key={src}>
            <img src={src} alt="" loading="lazy" draggable={false} />
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "f-wall-pc",
    name: "Обои для ПК",
    ...at("s-wall", 60, 560),
    w: 1440,
    h: 500,
    info: { text: WALLPAPERS.description },
    content: (
      <div className="cvw-desktops">
        {wideWallpapers.slice(0, 8).map((src) => (
          <div className="cvw-desktop" key={src}>
            <img src={src} alt="" loading="lazy" draggable={false} />
          </div>
        ))}
      </div>
    ),
  },
  ...PRESENTATIONS.cards.map((card, i): FrameDef => ({
    id: `f-pres-${i}`,
    name: i === 0 ? "Хакатон: ИИ для стройки" : "Кудач — стартап",
    ...at("s-pres", 60 + i * 620, 100),
    w: 600,
    h: 450,
    info: { text: card.text, tags: [card.tag], tagColor: card.tagColor },
    content: (
      <div className="cvc">
        <img src={poster(card.video!)} alt="" draggable={false} />
        <div className="cvc__info">
          <span className="cvp__tag" style={{ background: card.tagColor }}>
            {card.tag}
          </span>
          <p>{card.text}</p>
        </div>
      </div>
    ),
  })),
  {
    id: "f-slides",
    name: "Подборка слайдов",
    ...at("s-pres", 60, 610),
    w: 1220,
    h: 743,
    info: { text: PRESENTATIONS.description, tags: [PRESENTATIONS.subtitle] },
    content: (
      <div className="cv-pad20">
        <ImageGrid images={PRESENTATIONS.slideGroups[0].slice(0, 9)} cols={3} gap={20} ratio="380 / 221" />
      </div>
    ),
  },
  {
    id: "f-coffee",
    name: "Кофейня",
    ...at("s-proj", 60, 100),
    w: 961,
    h: 559,
    info: { text: PROJECTS.description },
    content: (
      <div className="cv-pad10">
        <ImageGrid images={PROJECTS.coffeeGrid} cols={3} gap={10} ratio="307 / 173" />
      </div>
    ),
  },
  {
    id: "f-forum",
    name: "Форум «Российское село»",
    ...at("s-proj", 60, 720),
    w: 961,
    h: 863,
    info: { text: PROJECTS.description },
    content: (
      <div className="cv-pad10 cv-stack">
        <ImageGrid images={PROJECTS.er.photos} cols={2} gap={10} ratio="225 / 141" />
        {PROJECTS.er.banners.map((src) => (
          <img key={src} src={src} alt="" loading="lazy" draggable={false} />
        ))}
      </div>
    ),
  },
  ...(
    [
      ["f-site-1", "Лендинг", PROJECTS.sites.tzVk],
      ["f-site-2", "Платформа", PROJECTS.sites.platforma],
      ["f-site-3", "Binghatti Nova", PROJECTS.sites.binghatti],
      ["f-site-4", "Service Soft", PROJECTS.sites.serviceSoft1],
    ] as const
  ).map(
    ([id, name, src], i): FrameDef => ({
      id,
      name,
      ...at("s-proj", 1080 + i * 510, 100),
      w: 470,
      h: 1300,
      info: { text: "Сайт целиком — в финальной версии фрейм можно будет «пролистать» внутри." },
      content: <img className="cv-cover-top" src={src} alt="" loading="lazy" draggable={false} />,
    })
  ),
  {
    id: "f-vne-desktop",
    name: "Вне рамок — сайт",
    ...at("s-proj", 3120, 100),
    w: 340,
    h: 1300,
    content: <img className="cv-cover-top" src={PROJECTS.sites.site1920} alt="" loading="lazy" draggable={false} />,
  },
  {
    id: "f-vne-mobile",
    name: "Вне рамок — моб.",
    ...at("s-proj", 3480, 100),
    w: 140,
    h: 1300,
    content: <img className="cv-cover-top" src={PROJECTS.sites.androidCompact} alt="" loading="lazy" draggable={false} />,
  },
  {
    id: "f-merch",
    name: "Мерч",
    ...at("s-proj", 3660, 100),
    w: 490,
    h: 366,
    content: (
      <div className="cv-pad10">
        <ImageGrid images={PROJECTS.merch} cols={2} gap={10} ratio="225 / 168" />
      </div>
    ),
  },
  {
    id: "f-transarctic",
    name: "Трансарктический коридор",
    ...at("s-proj", 3660, 520),
    w: 490,
    h: 352,
    content: (
      <div className="cv-pad10">
        <img src={PROJECTS.transarctic} alt="" loading="lazy" draggable={false} />
      </div>
    ),
  },
  {
    id: "f-templates",
    name: "Шаблоны презентаций",
    ...at("s-proj", 3660, 920),
    w: 490,
    h: 421,
    content: (
      <div className="cv-pad10">
        <ImageGrid images={PROJECTS.er.templates} cols={2} gap={10} ratio="225 / 127" />
      </div>
    ),
  },
];

export const PINS: PinDef[] = [
  { id: "p1", x: 4330, y: 70, text: "Все плагины сделаны с помощью вайб-кодинга. Два пустых места ждут новых." },
  { id: "p2", x: 1040, y: 1460, text: "Больше 2000 постов — здесь только малая часть." },
  { id: "p3", x: 3720, y: 1450, text: "«Кудач» — мой собственный стартап." },
  { id: "p4", x: 1100, y: 3170, text: "Нажми на любой фрейм — справа появится описание." },
];

export const WORLD_BOUNDS: Rect = { x: -380, y: 0, w: 4820, h: 4790 };
export const INTRO_RECT: Rect = { x: -400, y: 40, w: 1560, h: 720 };
