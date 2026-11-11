import { AUTOMATION, HERO, LINKS, PROJECTS, SOCIAL, WALLPAPERS } from "@/lib/content";
import { HR_CASE_H } from "./cases";
import { TOUR_CASE_H } from "./casesTour";

export type Rect = { x: number; y: number; w: number; h: number };

// focus — куда подлетать камере, если остров слишком велик, чтобы показать его целиком крупно
export type Island = Rect & { id: string; name: string; color: string; dark?: boolean; focus?: Rect };

/*
 * Модульная сетка: 6 колонок по 600 с промежутком 200 (ширина 4600).
 * Острова занимают целое число колонок, высоты в одном ряду равны,
 * между рядами тот же промежуток 200 — на общем плане всё выровнено.
 * Подписи островов стоят над ними, в этом промежутке.
 */
const COL = 600;
const GAP = 200;
const colX = (i: number) => i * (COL + GAP);
const span = (n: number) => n * COL + (n - 1) * GAP;

// Кейсы — справа от сетки: две вертикальные ленты бордов рядом, как проекты на Behance.
const CASES = { x: colX(6), w: 4500, h: Math.max(HR_CASE_H, TOUR_CASE_H) + 200 };

// Блок «Обо мне» спокойной версии: свёрстан в w×h и увеличен в k раз.
const ABOUT_CALM = { w: 1240, h: 1120, k: 1.7 };

// Во сколько раз крупнее показаны работы-картинки: обои и проекты свёрстаны в своём размере и увеличены целиком.
const PROJ_K = 1.2;
const CONTACT_K = 1.7;

/*
 * Левая часть — четыре ряда, по высоте ровно с лентами кейсов: мир получается цельным прямоугольником.
 * Нижний ряд («Контакты») забирает всё, что осталось до нижнего края кейсов.
 */
const ROW1 = { y: 0, h: 2260 };
const ROW2 = { y: ROW1.y + ROW1.h + GAP, h: 2700 };
const ROW3 = { y: ROW2.y + ROW2.h + GAP, h: 3000 };
const ROW4 = { y: ROW3.y + ROW3.h + GAP, h: Math.max(1000, CASES.h - (ROW3.y + ROW3.h + GAP)) };

// Сетка нужна городу: улицы продолжают промежутки между островами.
export const GRID = { COL, GAP, rows: [ROW1, ROW2, ROW3, ROW4], colX, span };

export const ISLANDS: Island[] = [
  { id: "about", name: "Обо мне", color: "#FEFE78", x: colX(0), y: ROW1.y, w: span(3), h: ROW1.h },
  { id: "plugins", name: "Лаборатория", color: "#86DDFF", x: colX(3), y: ROW1.y, w: span(3), h: ROW1.h },
  { id: "social", name: "Соцсети", color: "#FFB6E1", x: colX(0), y: ROW2.y, w: span(3), h: ROW2.h },
  { id: "wall", name: "Обои", color: "#ACF9A2", x: colX(3), y: ROW2.y, w: span(3), h: ROW2.h },
  {
    id: "cases",
    name: "Кейсы",
    color: "#B8C7FF",
    x: CASES.x,
    y: 0,
    w: CASES.w,
    h: CASES.h,
    // камера подлетает к обложкам обоих кейсов, а не ко всей ленте
    focus: { x: CASES.x + 60, y: 40, w: CASES.w - 120, h: 1320 },
  },
  { id: "proj", name: "Проекты", color: "#FFC7B6", x: colX(0), y: ROW3.y, w: span(6), h: ROW3.h },
  { id: "contact", name: "Контакты", color: "#1E1E1E", dark: true, x: colX(0), y: ROW4.y, w: span(6), h: ROW4.h },
];

export const WORLD: Rect = { x: 0, y: -120, w: CASES.x + CASES.w, h: CASES.h + 120 };

// Темп переписки «Обо мне»: вопрос приходит быстро, ответ — после «печатает…»
export const CHAT_STEP_MS = { q: 350, a: 800 };

export const islandById = (id: string) => ISLANDS.find((i) => i.id === id)!;
export const islandFocus = (i: Island): Rect => i.focus ?? i;

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
  /** фрейм свёрстан в размере w/k × h/k и увеличен целиком в k раз */
  k?: number;
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
const PROJ_X0 = 77;
// координаты и размеры «Проектов» заданы в исходном масштабе вёрстки и увеличиваются в PROJ_K раз
const proj = (x: number, y: number, w: number, h: number) => ({
  ...rel("proj", Math.round(x * PROJ_K), Math.round(y * PROJ_K)),
  w: Math.round(w * PROJ_K),
  h: Math.round(h * PROJ_K),
  k: PROJ_K,
});

export const SITE_FRAMES = SITES.map(([id, name, src, h], i) => ({
  src,
  meta: {
    id,
    name,
    ...proj(PROJ_X0 + i * SITE_STEP, 80, 470, h + 40),
    r: 18,
    text: PROJECTS.description,
  } as FrameMeta,
}));

/*
 * Посты: рубрики идут рядами в исходном порядке, по 6 в ряд.
 * Высота ряда считается по пропорциям его постов: второй ряд 640×770,
 * последний — сторис 640×1067, остальные квадраты. Края сетки ровные, ничего не обрезается.
 */
const SOCIAL_ROW_ASPECT = [1, 770 / 640, 1, 1, 1, 1, 1, 1067 / 640];
const POST_W = 250;
const POST_GAP = 18;
export const POST_SCALE = POST_W / 170;

export const SOCIAL_LAYOUT = (() => {
  let y = 0;
  const posts = SOCIAL.rows.flatMap((row, r) => {
    const h = Math.round(POST_W * SOCIAL_ROW_ASPECT[r]);
    const rowPosts = row.map((src, c) => ({ src, x: c * (POST_W + POST_GAP), y, w: POST_W, h }));
    y += h + POST_GAP;
    return rowPosts;
  });
  return { posts, w: 6 * POST_W + 5 * POST_GAP, h: y - POST_GAP };
})();

// Лаборатория: сетка 3×3, карточки по центру острова, гараж — во весь нижний ряд.
// «Чек-лист презентаций» в новой версии не показываем.
export const LAB_CARDS = AUTOMATION.cards.filter((c) => !c.title.startsWith("Чек-лист"));

// 3D-ролик для YouTube-канала: пока видео не готово (video: null), на его месте стоит заглушка.
export const LAB_MOTION: { video: string | null } = { video: null };

/*
 * Три ряда: вступление и крупный 3D-ролик, под ними пять плагинов в одну строку, внизу гараж во всю ширину.
 */
const LAB_W = 2000;
const LAB_GAP = 40;
const LAB_ROWS = [640, 600, 620];
const LAB_X0 = (span(3) - LAB_W) / 2;
const LAB_Y0 = (ROW1.h - (LAB_ROWS.reduce((a, b) => a + b, 0) + LAB_GAP * 2)) / 2;
const LAB_INTRO_W = 520;
const LAB_CARD_W = (LAB_W - LAB_GAP * (LAB_CARDS.length - 1)) / LAB_CARDS.length;
const labBox = (row: number, x: number, w: number) => ({
  x: islandById("plugins").x + LAB_X0 + x,
  y: islandById("plugins").y + LAB_Y0 + LAB_ROWS.slice(0, row).reduce((a, b) => a + b + LAB_GAP, 0),
  w,
  h: LAB_ROWS[row],
});

export const FRAMES: FrameMeta[] = [
  {
    id: "hero",
    name: "Привет",
    ...rel("about", 96, 96),
    w: 1220,
    h: 684,
    r: 0,
    text: HERO.paragraphs[0],
  },
  {
    id: "chat",
    name: "Обо мне",
    ...rel("about", 96, 828),
    w: 1220,
    h: 1336,
    r: 40,
    text: HERO.paragraphs[1],
  },
  {
    id: "history",
    name: "История версий",
    ...rel("about", 1364, 96),
    w: 740,
    h: 2068,
    r: 40,
    text: "Опыт работы: от фриланса и собственного стартапа до федерального ведомства.",
  },
  // спокойная версия сайта: вместо приветствия, чата и истории — один блок-визитка
  {
    id: "about-calm",
    name: "Обо мне",
    ...rel("about", Math.round((span(3) - ABOUT_CALM.w * ABOUT_CALM.k) / 2), Math.round((ROW1.h - ABOUT_CALM.h * ABOUT_CALM.k) / 2)),
    w: ABOUT_CALM.w * ABOUT_CALM.k,
    h: ABOUT_CALM.h * ABOUT_CALM.k,
    k: ABOUT_CALM.k,
    r: 0,
    text: HERO.paragraphs[0],
  },
  {
    id: "lab-intro",
    name: "Не только дизайн",
    island: "plugins",
    ...labBox(0, 0, LAB_INTRO_W),
    r: 32,
    text: "Генерирую идеи и довожу их до работающего продукта с помощью вайб-кодинга: Figma-плагины, небольшие сервисы и сайты.",
  },
  {
    id: "lab-motion",
    name: "3D-анимация",
    island: "plugins",
    ...labBox(0, LAB_INTRO_W + LAB_GAP, LAB_W - LAB_INTRO_W - LAB_GAP),
    r: 32,
    text: "3D-анимация для превью видео на YouTube-канале. Ролик ещё в работе.",
    tags: ["3D", "Моушен"],
    tagColor: "#c791ff",
  },
  ...LAB_CARDS.map((card, i): FrameMeta => {
    const href = card.figmaButton ? LINKS.figmaPlugin : card.link;
    return {
      id: `plugin-${i}`,
      name: card.title,
      island: "plugins",
      ...labBox(1, i * (LAB_CARD_W + LAB_GAP), LAB_CARD_W),
      r: 32,
      text: card.text,
      tags: [card.tag],
      tagColor: card.tagColor,
      link: href ? { href, label: "Открыть в Figma" } : undefined,
    };
  }),
  {
    id: "garage",
    name: "Гараж",
    island: "plugins",
    ...labBox(2, 0, LAB_W),
    r: 32,
    text: "Мини-игра внутри портфолио: выбери машинку и прокатись по сайту на WASD. Физика, столкновения и камера — тоже вайб-код.",
  },
  {
    id: "social",
    name: "Посты для соцсетей",
    ...rel(
      "social",
      Math.round((span(3) - 2100) / 2),
      Math.round((ROW2.h - 2200) / 2)
    ),
    w: 2100,
    h: 2200,
    r: 0,
    text: SOCIAL.description,
    tags: [SOCIAL.subtitle],
  },
  {
    id: "wall",
    name: "Обои для телефонов и ПК",
    // поле обоев занимает остров целиком и обрезается по его скруглению
    ...rel("wall", 0, 0),
    w: span(3),
    h: ROW2.h,
    r: 0,
    text: WALLPAPERS.description,
  },
  /* ---------- кейс: HR-платформа — одна лента бордов ---------- */
  {
    id: "case-hr",
    name: "Кейс: HR-платформа",
    ...rel("cases", 100, 100),
    w: 2000,
    h: HR_CASE_H,
    r: 40,
    text: "Геймифицированная платформа для привлечения и адаптации сотрудников: сезоны, миссии, уровни, награды — и кабинет HR.",
    tags: ["Продуктовый дизайн", "UX/UI", "Геймификация"],
    tagColor: "#B8C7FF",
  },
  {
    id: "case-tour",
    name: "Кейс: Шагай и точка",
    ...rel("cases", 2400, 100),
    w: 2000,
    h: TOUR_CASE_H,
    r: 40,
    text: "Мой стартап: мобильный гид по Туле, который собирает персональный маршрут по интересам. Проект выиграл грант.",
    tags: ["Стартап", "Мобильное приложение", "Туризм"],
    tagColor: "#B8C7FF",
  },
  ...SITE_FRAMES.map((s) => s.meta),
  {
    id: "site-5",
    name: "Вне рамок",
    ...proj(PROJ_X0 + 5 * SITE_STEP, 80, 470, 1996),
    r: 18,
    text: PROJECTS.description,
  },
  {
    id: "site-6",
    name: "Вне рамок — мобильная",
    ...proj(PROJ_X0 + 6 * SITE_STEP, 80, 200, 2252),
    r: 30,
    text: PROJECTS.description,
  },
  {
    id: "coffee",
    name: "Кофе Культ",
    ...proj(PROJ_X0, 1000, 1490, 1000),
    r: 40,
    text: "Личный некоммерческий концепт айдентики для сети кофеен: стаканчики, упаковка десертов, меню, абонементы. Сделан для себя и в работу не пошёл; логотип принадлежит «Кофе Культ» и использован только для демонстрации идеи.",
    tags: ["Айдентика", "Упаковка", "Полиграфия"],
    tagColor: "#FFD400",
  },
  {
    id: "merch",
    name: "Мерч",
    // полароиды мерча — одной строкой под «Кофе Культ»
    ...proj(PROJ_X0, 2040, 1490, 330),
    r: 0,
    text: PROJECTS.description,
  },
  {
    id: "forum",
    name: "Форум «Российское село»",
    ...rel("proj", 1940, 1580),
    w: 1500,
    h: 1264,
    r: 44,
    text: "Оформление экранов сцены для форума «Российское село — место силы»: заставки сессий, плашки спикеров и темы выступлений в двух форматах — под главный экран 3840×1080 и боковой 1920×1080.",
    tags: ["Брендинг мероприятия", "Экраны сцены", "Шаблоны"],
    tagColor: "#B8C7FF",
  },
  {
    id: "contact",
    name: "Связаться",
    // карточка во всю высоту острова — уравновешивает сцену с фигурой справа
    ...rel("contact", 100, 100),
    w: 640 * CONTACT_K,
    h: ROW4.h - 200,
    k: CONTACT_K,
    r: 36,
    text: "Пиши в Telegram — расскажи о задаче, обсудим сроки и формат работы.",
  },
];

export const frameById = (id: string) => FRAMES.find((f) => f.id === id)!;

export const narrowWallpapers = WALLPAPERS.rows.flatMap((r) => r.images.filter((_, i) => r.cols[i] === 1));
export const wideWallpapers = WALLPAPERS.rows.flatMap((r) => r.images.filter((_, i) => r.cols[i] === 2));

export const poster = (video: string) =>
  video.replace("/videos/", "/images/posters/").replace(".mp4", ".jpg");

/* ---------- гараж ---------- */

export type CarSpec = {
  id: string;
  name: string;
  color: string;
  w: number;
  h: number;
  max: number; // макс. скорость, мир. пикселей в секунду
  accel: number;
  turn: number; // радиан в секунду на полной скорости
  bounce: number; // доля скорости, с которой откидывает от блока
};

export const CARS: CarSpec[] = [
  { id: "sport", name: "Спорткар", color: "#FEFE78", w: 70, h: 124, max: 1100, accel: 1100, turn: 3.4, bounce: 0.45 },
  { id: "pickup", name: "Пикап", color: "#86DDFF", w: 78, h: 132, max: 760, accel: 700, turn: 2.6, bounce: 0.3 },
  { id: "bug", name: "Жук", color: "#FFB6E1", w: 72, h: 100, max: 860, accel: 900, turn: 4.4, bounce: 0.65 },
];

// Блоки, в которые можно врезаться: всё, кроме прозрачных коллажей (приветствие, обои, соцсети) и самого гаража.
// В спокойной версии вместо чата и истории стоит блок-визитка — и сталкиваться нужно с ним.
export const collidersFor = (calm: boolean) =>
  FRAMES.filter((f) => !["hero", "wall", "social", "garage", ...(calm ? ["chat", "history"] : ["about-calm"])].includes(f.id));
// Ленты кейсов слишком велики, чтобы рассыпаться: внутри живая карта и десятки экранов — на них остаются только трещины.
export const UNBREAKABLE = ["case-hr", "case-tour"];

/* ---------- достижения ---------- */

export type AchievementId = "sticker" | "react" | "map" | "drive" | "pile" | "orbit" | "slides" | "route" | "zoom" | "forum";

export const ACHIEVEMENTS: {
  id: AchievementId;
  name: string;
  hint: string;
  island: string;
  color: string;
}[] = [
  { id: "sticker", name: "Знакомство", hint: "Кликни по любой карточке с цифрой под моим именем", island: "about", color: "#FEFE78" },
  { id: "react", name: "Реакция", hint: "Поставь реакцию на любой мой ответ в переписке «Обо мне»", island: "about", color: "#FEFE78" },
  { id: "map", name: "Картограф", hint: "Отдались так, чтобы увидеть всё пространство целиком", island: "about", color: "#86DDFF" },
  { id: "drive", name: "Тест-драйв", hint: "Возьми машинку в гараже «Лаборатории» и врежься в любой блок", island: "plugins", color: "#86DDFF" },
  { id: "pile", name: "Сфера постов", hint: "Покрути сферу постов в «Соцсетях»", island: "social", color: "#FFB6E1" },
  { id: "orbit", name: "Коллекционер", hint: "Собери обои под курсором в «Обоях» и кликни по любым", island: "wall", color: "#ACF9A2" },
  { id: "slides", name: "Слайдшоу", hint: "Пролистай пять слайдов презентации в кейсе HR-платформы", island: "cases", color: "#B8C7FF" },
  { id: "route", name: "Свой маршрут", hint: "Собери маршрут в телефоне в кейсе «Шагай и точка»", island: "cases", color: "#B8C7FF" },
  { id: "zoom", name: "Под лупой", hint: "Приблизь любую работу в «Проектах» до 100%", island: "proj", color: "#FFC7B6" },
  { id: "forum", name: "Режиссёр эфира", hint: "Переключи шаблон экрана на сцене форума в «Проектах»", island: "proj", color: "#FFC7B6" },
];

// Секретное слово за все достижения: посетитель пишет его в Telegram и получает скидку.
export const SECRET_WORD = "ОРБИТА";
export const SECRET_DISCOUNT = "10%";
