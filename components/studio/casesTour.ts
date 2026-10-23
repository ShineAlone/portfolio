/*
 * Кейс «Шагай и точка» — мой стартап, мобильный гид по Туле, на который выигран грант.
 * Экраны со страницы Figma «Тур — для сайта» (имя пользователя и аватарки заменены).
 * Внутри кейса — интерактивный телефон: экраны связаны зонами нажатия, конструктор маршрута
 * сделан живым (в макетах его экрана нет — это ключевая идея продукта).
 */

const DIR = "/images/cases/tour";
export const tourImg = (name: string) => `${DIR}/${name}.webp`;

export const TOUR_COLORS = {
  blue: "#1771D9",
  bright: "#017AFF",
  red: "#EE5D5C",
  green: "#7CCB49",
  yellow: "#FFC531",
  ink: "#141B2D",
  paper: "#F6F1E7",
};

export const TOUR_BOARDS = [
  { id: "hero", h: 1200 },
  { id: "idea", h: 760 },
  { id: "try", h: 1200 },
  { id: "map", h: 1100 },
  { id: "screens", h: 1150 },
  { id: "social", h: 1120 },
  { id: "system", h: 820 },
  { id: "outro", h: 1350 },
] as const;
export type TourBoardId = (typeof TOUR_BOARDS)[number]["id"];
export const TOUR_CASE_H = TOUR_BOARDS.reduce((s, b) => s + b.h, 0);

/* ---------- телефон: экраны и переходы ---------- */

// зона нажатия в координатах макета (ширина экрана 412)
export type Tap = { x: number; y: number; w: number; h: number; to: string; label: string };
export type PhoneScreen = { id: string; title: string; text: string; h: number; taps: Tap[] };

export const PHONE_SCREENS: Record<string, PhoneScreen> = {
  splash: { id: "splash", title: "Запуск", text: "Фирменная «Ш» — шагай и точка.", h: 900, taps: [{ x: 0, y: 0, w: 412, h: 900, to: "onb-1", label: "Дальше" }] },
  "onb-1": {
    id: "onb-1",
    title: "Знакомство",
    text: "Три экрана онбординга — фото Тулы и коротко о сути.",
    h: 900,
    taps: [{ x: 40, y: 780, w: 332, h: 90, to: "onb-2", label: "Дальше" }],
  },
  "onb-2": { id: "onb-2", title: "Знакомство", text: "Путешествие в один клик.", h: 900, taps: [{ x: 40, y: 780, w: 332, h: 90, to: "onb-3", label: "Дальше" }] },
  "onb-3": { id: "onb-3", title: "Знакомство", text: "Приключения под контролем — даже в дороге.", h: 900, taps: [{ x: 40, y: 780, w: 332, h: 90, to: "home", label: "Начать путешествие" }] },
  home: {
    id: "home",
    title: "Главная",
    text: "Следующая точка маршрута, быстрые действия и популярные маршруты.",
    h: 1862,
    taps: [
      { x: 15, y: 402, w: 181, h: 160, to: "builder", label: "Построить маршрут" },
      { x: 208, y: 402, w: 183, h: 66, to: "routes", label: "Все маршруты" },
      { x: 208, y: 497, w: 183, h: 158, to: "routes", label: "Популярные маршруты" },
      { x: 15, y: 592, w: 181, h: 63, to: "history", label: "Мои путешествия" },
      { x: 27, y: 693, w: 63, h: 56, to: "map", label: "Карта" },
      { x: 122, y: 693, w: 63, h: 56, to: "rating", label: "Рейтинг" },
      { x: 15, y: 828, w: 181, h: 189, to: "route", label: "Маршрут" },
      { x: 19, y: 22, w: 46, h: 43, to: "menu", label: "Меню" },
      { x: 86, y: 1770, w: 234, h: 43, to: "builder", label: "Создать свой маршрут" },
    ],
  },
  routes: {
    id: "routes",
    title: "Все маршруты",
    text: "Готовые маршруты по категориям: культура, гастрономия, природа, шопинг.",
    h: 2205,
    taps: [{ x: 14, y: 310, w: 182, h: 260, to: "route", label: "Маршрут" }],
  },
  route: {
    id: "route",
    title: "Маршрут",
    text: "Сколько мест и часов, оценки, точки по порядку — и кнопка «Начать маршрут».",
    h: 1481,
    taps: [{ x: 15, y: 602, w: 186, h: 41, to: "map", label: "Начать маршрут" }],
  },
  map: {
    id: "map",
    title: "Карта",
    text: "Точки маршрута на карте города — нажми на точку.",
    h: 900,
    taps: [
      { x: 72, y: 738, w: 56, h: 56, to: "place", label: "Точка" },
      { x: 19, y: 22, w: 46, h: 43, to: "menu", label: "Меню" },
    ],
  },
  place: {
    id: "place",
    title: "Место",
    text: "Карточка места: фото, рейтинг, часы работы и контакты.",
    h: 1158,
    taps: [{ x: 15, y: 752, w: 376, h: 43, to: "map", label: "Маршрут" }],
  },
  menu: {
    id: "menu",
    title: "Меню",
    text: "Профиль, настройки, история и рейтинг туриста.",
    h: 870,
    taps: [
      { x: 16, y: 85, w: 60, h: 75, to: "settings", label: "Профиль" },
      { x: 94, y: 85, w: 60, h: 75, to: "settings", label: "Настройки" },
      { x: 174, y: 85, w: 64, h: 75, to: "history", label: "История путешествий" },
      { x: 25, y: 236, w: 105, h: 23, to: "rating", label: "Рейтинг" },
      { x: 122, y: 285, w: 168, h: 42, to: "map", label: "Открыть карту" },
    ],
  },
  rating: { id: "rating", title: "Рейтинг", text: "Таблица лидеров города: баллы за пройденные километры и места.", h: 870, taps: [] },
  history: { id: "history", title: "История", text: "Пройденные маршруты с датами и оценками.", h: 900, taps: [] },
  settings: { id: "settings", title: "Профиль", text: "О себе, соцсети, публичная ссылка и приватность.", h: 969, taps: [] },
  favorites: { id: "favorites", title: "Избранное", text: "Сохранённые маршруты.", h: 900, taps: [] },
  builder: { id: "builder", title: "Конструктор маршрута", text: "Интересы, время и бюджет — и маршрут готов.", h: 900, taps: [] },
};

// быстрые переходы рядом с телефоном
export const PHONE_JUMPS: { to: string; label: string }[] = [
  { to: "onb-1", label: "Онбординг" },
  { to: "home", label: "Главная" },
  { to: "builder", label: "Построить маршрут" },
  { to: "route", label: "Готовый маршрут" },
  { to: "map", label: "Карта" },
  { to: "menu", label: "Профиль" },
  { to: "rating", label: "Рейтинг" },
];

/* ---------- конструктор маршрута ---------- */

export const INTERESTS: { id: string; name: string; icon: string }[] = [
  { id: "culture", name: "Культура и искусство", icon: "🏛️" },
  { id: "food", name: "Гастрономия", icon: "🥨" },
  { id: "shop", name: "Шопинг", icon: "🛍️" },
  { id: "nature", name: "Природа и экология", icon: "🌳" },
  { id: "faith", name: "Паломничество", icon: "⛪" },
  { id: "active", name: "Спорт и активный отдых", icon: "🚴" },
];

export const DURATIONS: { id: string; name: string; stops: number }[] = [
  { id: "2h", name: "2 часа", stops: 3 },
  { id: "4h", name: "4 часа", stops: 5 },
  { id: "day", name: "Весь день", stops: 7 },
];

export const BUDGETS = ["Экономно", "Средний чек", "Не важно"];

// реальные места Тулы; x/y — положение на нарисованной карте (0–1)
export type TourPlace = { name: string; kind: string; tag: string; x: number; y: number; time: string };
export const PLACES: TourPlace[] = [
  { name: "Тульский кремль", kind: "culture", tag: "Историческое место", x: 0.52, y: 0.46, time: "1 ч" },
  { name: "Музей оружия", kind: "culture", tag: "Музей", x: 0.36, y: 0.38, time: "1,5 ч" },
  { name: "Музей «Тульские самовары»", kind: "culture", tag: "Музей", x: 0.58, y: 0.56, time: "40 мин" },
  { name: "Музей «Тульский пряник»", kind: "food", tag: "Музей и дегустация", x: 0.66, y: 0.34, time: "1 ч" },
  { name: "Белёвские сладости", kind: "food", tag: "Кондитерская", x: 0.72, y: 0.6, time: "30 мин" },
  { name: "Bottega Italiana", kind: "food", tag: "Ресторан · 1500–2500 ₽", x: 0.44, y: 0.64, time: "1 ч" },
  { name: "ТЦ «Гостиный двор»", kind: "shop", tag: "Торговый центр", x: 0.48, y: 0.3, time: "1 ч" },
  { name: "Ярмарка на Казанской", kind: "shop", tag: "Ярмарка", x: 0.62, y: 0.44, time: "40 мин" },
  { name: "Казанская набережная", kind: "nature", tag: "Прогулка у Упы", x: 0.6, y: 0.5, time: "40 мин" },
  { name: "Центральный парк им. Белоусова", kind: "nature", tag: "Парк", x: 0.24, y: 0.7, time: "1 ч" },
  { name: "Свято-Успенский собор", kind: "faith", tag: "Православный храм", x: 0.5, y: 0.5, time: "30 мин" },
  { name: "Храм Двенадцати Апостолов", kind: "faith", tag: "Храм", x: 0.3, y: 0.52, time: "30 мин" },
  { name: "Парк активного отдыха", kind: "active", tag: "Активный отдых", x: 0.2, y: 0.62, time: "1,5 ч" },
];

// маршрут по выбранным интересам: по очереди берём места из каждой категории
export function buildRoute(interests: string[], stops: number): TourPlace[] {
  const pool = interests.length ? interests : ["culture", "food"];
  const lists = pool.map((k) => PLACES.filter((p) => p.kind === k));
  const out: TourPlace[] = [];
  for (let i = 0; out.length < stops && i < 10; i++) for (const l of lists) if (l[i] && out.length < stops) out.push(l[i]);
  // если категорий мало — добираем центром города
  for (const p of PLACES) if (out.length < stops && !out.includes(p)) out.push(p);
  // порядок обхода: от кремля по ходу часовой стрелки — так линия не путается
  const c = { x: 0.5, y: 0.48 };
  return out.sort((a, b) => Math.atan2(a.y - c.y, a.x - c.x) - Math.atan2(b.y - c.y, b.x - c.x));
}

/* ---------- борды ---------- */

export const TOUR_STEPS: { n: string; title: string; text: string }[] = [
  { n: "01", title: "Расскажи о себе", text: "Интересы, сколько есть времени и какой бюджет" },
  { n: "02", title: "Получи маршрут", text: "Приложение собирает точки под тебя и считает время" },
  { n: "03", title: "Шагай по точкам", text: "Карта ведёт от места к месту, а за пройденное копится рейтинг" },
];

export const TOUR_PALETTE: { name: string; hex: string; role: string }[] = [
  { name: "Небо", hex: TOUR_COLORS.blue, role: "главный цвет, кнопки" },
  { name: "Маршрут", hex: TOUR_COLORS.bright, role: "активные элементы, точки" },
  { name: "Кирпич", hex: TOUR_COLORS.red, role: "рейтинг, важное" },
  { name: "Парк", hex: TOUR_COLORS.green, role: "карта, природа" },
  { name: "Купола", hex: TOUR_COLORS.yellow, role: "лидеры, акценты" },
  { name: "Чернила", hex: TOUR_COLORS.ink, role: "текст" },
];
