import { AUTOMATION, HERO, LINKS, PRESENTATIONS, PROJECTS, SOCIAL, WALLPAPERS } from "@/lib/content";

export type Rect = { x: number; y: number; w: number; h: number };

export type Island = Rect & { id: string; name: string; color: string; dark?: boolean };

/*
 * Модульная сетка: 6 колонок по 600 с промежутком 200 (ширина 4600).
 * Острова занимают целое число колонок, высоты в одном ряду равны,
 * между рядами тот же промежуток 200 — на общем плане всё выровнено.
 */
const COL = 600;
const GAP = 200;
const colX = (i: number) => i * (COL + GAP);
const span = (n: number) => n * COL + (n - 1) * GAP;

const ROW1 = { y: 0, h: 1840 };
const ROW2 = { y: ROW1.y + ROW1.h + GAP, h: 1420 };
const ROW3 = { y: ROW2.y + ROW2.h + GAP, h: 2500 };

export const ISLANDS: Island[] = [
  { id: "about", name: "Обо мне", color: "#FEFE78", x: colX(0), y: ROW1.y, w: span(3), h: ROW1.h },
  { id: "plugins", name: "Плагины", color: "#86DDFF", x: colX(3), y: ROW1.y, w: span(3), h: ROW1.h },
  { id: "social", name: "Соцсети", color: "#FFB6E1", x: colX(0), y: ROW2.y, w: span(2), h: ROW2.h },
  { id: "wall", name: "Обои", color: "#ACF9A2", x: colX(2), y: ROW2.y, w: span(2), h: ROW2.h },
  { id: "pres", name: "Презентации", color: "#C791FF", x: colX(4), y: ROW2.y, w: span(2), h: ROW2.h },
  { id: "proj", name: "Проекты", color: "#FFC7B6", x: colX(0), y: ROW3.y, w: span(5), h: ROW3.h },
  { id: "contact", name: "Контакты", color: "#1E1E1E", dark: true, x: colX(5), y: ROW3.y, w: span(1), h: ROW3.h },
];

export const WORLD: Rect = { x: 0, y: 0, w: span(6), h: ROW3.y + ROW3.h };

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

// Окна в «Проектах» расставлены с равным шагом по ширине острова.
const SITE_STEP = 580;

export const SITE_FRAMES = SITES.map(([id, name, src, h], i) => ({
  src,
  meta: {
    id,
    name,
    ...rel("proj", 60 + i * SITE_STEP, 170),
    w: 470,
    h: h + 40,
    r: 18,
    text: PROJECTS.description,
  } as FrameMeta,
}));

/*
 * Посты: «кирпичная кладка» из 8 колонок без обрезки.
 * Пропорции исходников по рядам: второй ряд 640×770, последний — сторис 640×1067, остальные квадраты.
 * Каждый пост встаёт в самую короткую колонку, поэтому низ сетки получается ровным.
 */
const SOCIAL_ROW_ASPECT = [1, 770 / 640, 1, 1, 1, 1, 1, 1067 / 640];
const POST_W = 150;
const POST_GAP = 12;
const POST_COLS = 8;

export const SOCIAL_LAYOUT = (() => {
  const heights = Array(POST_COLS).fill(0);
  const posts = SOCIAL.rows.flatMap((row, r) =>
    row.map((src) => {
      const h = Math.round(POST_W * SOCIAL_ROW_ASPECT[r]);
      const col = heights.indexOf(Math.min(...heights));
      const post = { src, x: col * (POST_W + POST_GAP), y: heights[col], w: POST_W, h };
      heights[col] += h + POST_GAP;
      return post;
    })
  );
  return {
    posts,
    w: POST_COLS * POST_W + (POST_COLS - 1) * POST_GAP,
    h: Math.max(...heights) - POST_GAP,
  };
})();

// Плагины: сетка 3×3, карточки по центру острова.
const PLUGIN_W = 640;
const PLUGIN_H = 520;
const PLUGIN_GAP = 40;
const PLUGIN_X0 = (span(3) - (PLUGIN_W * 3 + PLUGIN_GAP * 2)) / 2;
export const PLUGIN_SLOTS = 9;
export const pluginSlot = (i: number) => ({
  x: islandById("plugins").x + PLUGIN_X0 + (i % 3) * (PLUGIN_W + PLUGIN_GAP),
  y: islandById("plugins").y + 140 + Math.floor(i / 3) * (PLUGIN_H + PLUGIN_GAP),
  w: PLUGIN_W,
  h: PLUGIN_H,
});

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
    h: 800,
    r: 40,
    text: HERO.paragraphs[1],
  },
  {
    id: "history",
    name: "История версий",
    ...rel("about", 1400, 120),
    w: 740,
    h: 1640,
    r: 40,
    text: "Опыт работы: от фриланса и собственного стартапа до федерального ведомства.",
  },
  ...AUTOMATION.cards.map((card, i): FrameMeta => {
    const href = card.figmaButton ? LINKS.figmaPlugin : card.link;
    return {
      id: `plugin-${i}`,
      name: card.title,
      island: "plugins",
      ...pluginSlot(i),
      r: 32,
      text: card.text,
      tags: [card.tag],
      tagColor: card.tagColor,
      link: href ? { href, label: "Открыть в Figma" } : undefined,
    };
  }),
  {
    id: "social",
    name: "Посты для соцсетей",
    ...rel(
      "social",
      Math.round((span(2) - SOCIAL_LAYOUT.w) / 2),
      Math.round((ROW2.h - SOCIAL_LAYOUT.h) / 2) + 30
    ),
    w: SOCIAL_LAYOUT.w,
    h: SOCIAL_LAYOUT.h,
    r: 0,
    text: SOCIAL.description,
    tags: [SOCIAL.subtitle],
  },
  {
    id: "wall",
    name: "Обои для телефонов и ПК",
    ...rel("wall", 90, 120),
    w: 1220,
    h: 1260,
    r: 0,
    text: WALLPAPERS.description,
  },
  ...PRESENTATIONS.cards.map(
    (card, i): FrameMeta => ({
      id: `pres-${i}`,
      name: i === 0 ? "Хакатон: ИИ для стройки" : "Кудач — мой стартап",
      ...rel("pres", 110 + i * 620, 130),
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
    ...rel("pres", 110, 620),
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
    ...rel("proj", 60 + 5 * SITE_STEP, 170),
    w: 470,
    h: 1996,
    r: 18,
    text: PROJECTS.description,
  },
  {
    id: "site-6",
    name: "Вне рамок — мобильная",
    ...rel("proj", 60 + 6 * SITE_STEP, 170),
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
    ...rel("proj", 60 + 3 * SITE_STEP, 1400),
    w: 1050,
    h: 960,
    r: 0,
    text: PROJECTS.description,
  },
  {
    id: "contact",
    name: "Связаться",
    ...rel("contact", 60, 170),
    w: 480,
    h: 620,
    r: 36,
    text: "Пиши в Telegram — расскажи о задаче, обсудим сроки и формат работы.",
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

// Секретное слово за все достижения: посетитель пишет его в Telegram и получает скидку.
export const SECRET_WORD = "ОРБИТА";
export const SECRET_DISCOUNT = "10%";
