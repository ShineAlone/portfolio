import { AUTOMATION, HERO, PRESENTATIONS, PROJECTS, SOCIAL, WALLPAPERS } from "@/lib/content";

export type Rect = { x: number; y: number; w: number; h: number };

export type Island = Rect & { id: string; name: string; color: string };

// Острова мастерской: у каждой темы свой цвет из палитры тегов сайта.
export const ISLANDS: Island[] = [
  { id: "about", name: "Обо мне", color: "#FEFE78", x: 0, y: 0, w: 2200, h: 1380 },
  { id: "plugins", name: "Плагины", color: "#86DDFF", x: 2400, y: 0, w: 2000, h: 1380 },
  { id: "social", name: "Соцсети", color: "#FFB6E1", x: 0, y: 1500, w: 1400, h: 1300 },
  { id: "wall", name: "Обои", color: "#ACF9A2", x: 1600, y: 1500, w: 1300, h: 1300 },
  { id: "pres", name: "Презентации", color: "#C791FF", x: 3100, y: 1500, w: 1300, h: 1300 },
  { id: "proj", name: "Проекты", color: "#FFC7B6", x: 0, y: 3000, w: 4400, h: 1600 },
];

export const WORLD: Rect = { x: 0, y: 0, w: 4400, h: 4600 };

export type ToolId = "geometry" | "digest" | "card" | "pattern" | "telegram" | "check";

// Инструменты дока — это настоящие плагины Арсения, в том же порядке, что и карточки.
export const TOOLS: { id: ToolId; short: string; plugin: string; color: string; hint: string }[] = [
  {
    id: "geometry",
    short: "Геометрия",
    plugin: AUTOMATION.cards[0].title,
    color: "#FEFE78",
    hint: "Кликай по пустому месту на холсте — плагин нарисует абстрактную фигуру.",
  },
  {
    id: "digest",
    short: "Дайджест",
    plugin: AUTOMATION.cards[1].title,
    color: "#86DDFF",
    hint: "Плагин соберёт дайджест моих работ и сам проведёт по ним.",
  },
  {
    id: "card",
    short: "Карточка",
    plugin: AUTOMATION.cards[2].title,
    color: "#FFC7B6",
    hint: "Впиши своё имя — плагин сверстает новостную карточку в моём стиле.",
  },
  {
    id: "pattern",
    short: "Паттерн",
    plugin: AUTOMATION.cards[3].title,
    color: "#C791FF",
    hint: "Сгенерирую паттерн и постелю его вместо фона мастерской.",
  },
  {
    id: "telegram",
    short: "Telegram",
    plugin: AUTOMATION.cards[4].title,
    color: "#FFB6E1",
    hint: "Выбери любую работу на холсте — и обсудим её в Telegram.",
  },
  {
    id: "check",
    short: "Чек-лист",
    plugin: AUTOMATION.cards[5].title,
    color: "#ACF9A2",
    hint: "Проверю мастерскую так же, как свои презентации перед отправкой.",
  },
];

export type FrameMeta = Rect & {
  id: string;
  name: string;
  island: string;
  r: number;
  text: string;
  tags?: string[];
  tagColor?: string;
  tool?: ToolId;
};

const project = (id: string, name: string, x: number, y: number, w: number, h: number, r = 18): FrameMeta => ({
  id,
  name,
  island: "proj",
  x,
  y,
  w,
  h,
  r,
  text: PROJECTS.description,
});

export const FRAMES: FrameMeta[] = [
  {
    id: "hero",
    name: "Привет",
    island: "about",
    x: 80,
    y: 150,
    w: 1240,
    h: 720,
    r: 40,
    text: HERO.paragraphs[0],
  },
  {
    id: "bio",
    name: "Обо мне",
    island: "about",
    x: 80,
    y: 920,
    w: 1240,
    h: 340,
    r: 40,
    text: HERO.paragraphs[1],
  },
  {
    id: "history",
    name: "История версий",
    island: "about",
    x: 1400,
    y: 150,
    w: 720,
    h: 1180,
    r: 40,
    text: "Опыт работы: от фриланса и собственного стартапа до федерального ведомства.",
  },
  ...AUTOMATION.cards.map(
    (card, i): FrameMeta => ({
      id: `plugin-${i}`,
      name: card.title,
      island: "plugins",
      x: 2460 + (i % 4) * 480,
      y: 150 + Math.floor(i / 4) * 540,
      w: 440,
      h: 500,
      r: 32,
      text: card.text,
      tags: [card.tag],
      tagColor: card.tagColor,
      tool: TOOLS[i].id,
    })
  ),
  {
    id: "social",
    name: "Посты для соцсетей",
    island: "social",
    x: 58,
    y: 1690,
    w: 1284,
    h: 960,
    r: 0,
    text: SOCIAL.description,
    tags: [SOCIAL.subtitle],
  },
  {
    id: "wall-phones",
    name: "Обои для телефона",
    island: "wall",
    x: 1720,
    y: 1670,
    w: 1060,
    h: 370,
    r: 34,
    text: WALLPAPERS.description,
  },
  {
    id: "wall-pc",
    name: "Обои для ПК",
    island: "wall",
    x: 1870,
    y: 2110,
    w: 760,
    h: 560,
    r: 22,
    text: WALLPAPERS.description,
  },
  ...PRESENTATIONS.cards.map(
    (card, i): FrameMeta => ({
      id: `pres-${i}`,
      name: i === 0 ? "Хакатон: ИИ для стройки" : "Кудач — мой стартап",
      island: "pres",
      x: 3160 + i * 620,
      y: 1670,
      w: 560,
      h: 440,
      r: 28,
      text: card.text,
      tags: [card.tag],
      tagColor: card.tagColor,
    })
  ),
  {
    id: "deck",
    name: "Слайды",
    island: "pres",
    x: 3430,
    y: 2180,
    w: 728,
    h: 461,
    r: 16,
    text: PRESENTATIONS.description,
    tags: [PRESENTATIONS.subtitle],
  },
  project("site-0", "Лендинг", 60, 3170, 470, 1260),
  project("site-1", "Платформа", 570, 3170, 470, 1260),
  project("site-2", "Binghatti Nova", 1080, 3170, 470, 1260),
  project("site-3", "Service Soft", 1590, 3170, 470, 1260),
  project("site-4", "Service Soft II", 2100, 3170, 470, 1260),
  project("site-5", "Вне рамок", 2610, 3170, 470, 1260),
  project("site-6", "Вне рамок — мобильная", 3120, 3170, 200, 420, 30),
  project("coffee", "Кофейня", 3380, 3170, 961, 560, 24),
  project("merch", "Мерч", 3380, 3790, 961, 360, 0),
  project("transarctic", "Трансарктический коридор", 3380, 4200, 470, 332),
  project("forum", "Форум «Российское село»", 3871, 4200, 470, 276, 14),
];

export const SITE_IMAGES = [
  PROJECTS.sites.tzVk,
  PROJECTS.sites.platforma,
  PROJECTS.sites.binghatti,
  PROJECTS.sites.serviceSoft1,
  PROJECTS.sites.serviceSoft2,
  PROJECTS.sites.site1920,
  PROJECTS.sites.androidCompact,
];

export const frameById = (id: string) => FRAMES.find((f) => f.id === id)!;
export const islandById = (id: string) => ISLANDS.find((i) => i.id === id)!;

export const narrowWallpapers = WALLPAPERS.rows.flatMap((r) => r.images.filter((_, i) => r.cols[i] === 1));
export const wideWallpapers = WALLPAPERS.rows.flatMap((r) => r.images.filter((_, i) => r.cols[i] === 2));

export const DECK_SLIDES = PRESENTATIONS.slideGroups.flatMap((g) => g.slice(0, 4));

export const poster = (video: string) =>
  video.replace("/videos/", "/images/posters/").replace(".mp4", ".jpg");
