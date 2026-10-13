import { AUTOMATION, HERO, LINKS, PRESENTATIONS, PROJECTS, SOCIAL, WALLPAPERS } from "@/lib/content";

export type Rect = { x: number; y: number; w: number; h: number };

export type Island = Rect & { id: string; name: string; color: string };

// Острова: у каждой темы свой цвет из палитры тегов сайта. Высоты разные — так живее.
export const ISLANDS: Island[] = [
  { id: "about", name: "Обо мне", color: "#FEFE78", x: 0, y: 0, w: 2200, h: 1700 },
  { id: "plugins", name: "Плагины", color: "#86DDFF", x: 2400, y: 0, w: 2000, h: 1400 },
  { id: "social", name: "Соцсети", color: "#FFB6E1", x: 0, y: 1900, w: 1400, h: 1420 },
  { id: "wall", name: "Обои", color: "#ACF9A2", x: 1600, y: 1900, w: 1300, h: 1420 },
  { id: "pres", name: "Презентации", color: "#C791FF", x: 3100, y: 1900, w: 1300, h: 1420 },
  { id: "proj", name: "Проекты", color: "#FFC7B6", x: 0, y: 3520, w: 3380, h: 2500 },
];

export const WORLD: Rect = { x: 0, y: 0, w: 4400, h: 6020 };

export const islandById = (id: string) => ISLANDS.find((i) => i.id === id)!;

const rel = (island: string, x: number, y: number) => ({
  island,
  x: islandById(island).x + x,
  y: islandById(island).y + y,
});

export type FrameMeta = Rect & {
  id: string;
  name: string;
  island: string;
  r: number;
  text: string;
  tags?: string[];
  tagColor?: string;
  link?: { href: string; label: string };
};

// Высоты лендингов посчитаны по пропорциям картинок, чтобы страницы были видны целиком.
const SITES: [id: string, name: string, src: string, h: number][] = [
  ["site-0", "Лендинг", PROJECTS.sites.tzVk, 794],
  ["site-1", "Платформа", PROJECTS.sites.platforma, 624],
  ["site-2", "Binghatti Nova", PROJECTS.sites.binghatti, 768],
  ["site-3", "Service Soft", PROJECTS.sites.serviceSoft1, 1066],
  ["site-4", "Service Soft II", PROJECTS.sites.serviceSoft2, 1107],
];

export const SITE_FRAMES = SITES.map(([id, name, src, h], i) => ({
  src,
  meta: {
    id,
    name,
    ...rel("proj", 60 + i * 510, 170),
    w: 470,
    h: h + 40,
    r: 18,
    text: PROJECTS.description,
  } as FrameMeta,
}));

export const FRAMES: FrameMeta[] = [
  {
    id: "hero",
    name: "Привет",
    ...rel("about", 60, 120),
    w: 1280,
    h: 800,
    r: 0,
    text: HERO.paragraphs[0],
  },
  {
    id: "chat",
    name: "Обо мне",
    ...rel("about", 60, 960),
    w: 1280,
    h: 700,
    r: 40,
    text: HERO.paragraphs[1],
  },
  {
    id: "history",
    name: "История версий",
    ...rel("about", 1400, 150),
    w: 720,
    h: 1180,
    r: 40,
    text: "Опыт работы: от фриланса и собственного стартапа до федерального ведомства.",
  },
  ...AUTOMATION.cards.map(
    (card, i): FrameMeta => ({
      id: `plugin-${i}`,
      name: card.title,
      ...rel("plugins", 60 + (i % 4) * 480, 150 + Math.floor(i / 4) * 540),
      w: 440,
      h: 500,
      r: 32,
      text: card.text,
      tags: [card.tag],
      tagColor: card.tagColor,
      link: card.figmaButton ? { href: LINKS.figmaPlugin, label: "Открыть в Figma" } : undefined,
    })
  ),
  {
    id: "social",
    name: "Посты для соцсетей",
    ...rel("social", 58, 230),
    w: 1284,
    h: 960,
    r: 0,
    text: SOCIAL.description,
    tags: [SOCIAL.subtitle],
  },
  {
    id: "wall",
    name: "Обои для телефонов и ПК",
    ...rel("wall", 40, 120),
    w: 1220,
    h: 1260,
    r: 0,
    text: WALLPAPERS.description,
  },
  ...PRESENTATIONS.cards.map(
    (card, i): FrameMeta => ({
      id: `pres-${i}`,
      name: i === 0 ? "Хакатон: ИИ для стройки" : "Кудач — мой стартап",
      ...rel("pres", 60 + i * 620, 130),
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
    ...rel("pres", 60, 620),
    w: 1180,
    h: 740,
    r: 32,
    text: PRESENTATIONS.description,
    tags: [PRESENTATIONS.subtitle],
  },
  ...SITE_FRAMES.map((s) => s.meta),
  {
    id: "site-5",
    name: "Вне рамок",
    ...rel("proj", 2610, 170),
    w: 470,
    h: 1996,
    r: 18,
    text: PROJECTS.description,
  },
  {
    id: "site-6",
    name: "Вне рамок — мобильная",
    ...rel("proj", 3120, 170),
    w: 200,
    h: 2252,
    r: 30,
    text: PROJECTS.description,
  },
  {
    id: "coffee",
    name: "Кофе Культ",
    ...rel("proj", 60, 1100),
    w: 1490,
    h: 1000,
    r: 40,
    text: "Айдентика сети кофеен: стаканчики, упаковка десертов, меню, абонементы. Заказчик просил сохранить старый логотип и фирменные цвета заведений.",
    tags: ["Айдентика", "Упаковка", "Полиграфия"],
    tagColor: "#FFD400",
  },
  {
    id: "merch",
    name: "Мерч",
    ...rel("proj", 1590, 1400),
    w: 980,
    h: 400,
    r: 0,
    text: PROJECTS.description,
  },
];

export const frameById = (id: string) => FRAMES.find((f) => f.id === id)!;

export const narrowWallpapers = WALLPAPERS.rows.flatMap((r) => r.images.filter((_, i) => r.cols[i] === 1));
export const wideWallpapers = WALLPAPERS.rows.flatMap((r) => r.images.filter((_, i) => r.cols[i] === 2));

export const DECKS = PRESENTATIONS.slideGroups.map((slides, i) => ({
  name: `Презентация ${i + 1}`,
  slides,
}));

export const poster = (video: string) =>
  video.replace("/videos/", "/images/posters/").replace(".mp4", ".jpg");

/* ---------- достижения ---------- */

export type AchievementId = "sticker" | "map" | "pile" | "orbit" | "slides" | "zoom";

export const ACHIEVEMENTS: {
  id: AchievementId;
  name: string;
  hint: string;
  island: string;
  color: string;
}[] = [
  { id: "sticker", name: "Знакомство", hint: "Кликни по любой наклейке рядом с моим фото", island: "about", color: "#FEFE78" },
  { id: "map", name: "Картограф", hint: "Отдались так, чтобы увидеть всё пространство целиком", island: "about", color: "#86DDFF" },
  { id: "pile", name: "Ворох постов", hint: "Разложи стопку постов в «Соцсетях»", island: "social", color: "#FFB6E1" },
  { id: "orbit", name: "Смена обоев", hint: "Кликни по любому телефону в «Обоях»", island: "wall", color: "#ACF9A2" },
  { id: "slides", name: "Слайдшоу", hint: "Пролистай пять слайдов в «Презентациях»", island: "pres", color: "#C791FF" },
  { id: "zoom", name: "Под лупой", hint: "Приблизь любой лендинг в «Проектах» до 100%", island: "proj", color: "#FFC7B6" },
];
