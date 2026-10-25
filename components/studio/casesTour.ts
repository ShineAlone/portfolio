/*
 * Кейс «Шагай и точка» — мой стартап, мобильный гид по Туле, на который выигран грант.
 * Экраны со страницы Figma «Тур — для сайта» (имя пользователя и аватарки заменены),
 * фото Тулы — исходники из макетов, рамка телефона — iPhone 17 Pro из Apple Design Resources.
 * Пешеходные отрезки между местами посчитаны заранее (OSRM, профиль foot) и лежат в tourLegs.json.
 */

const DIR = "/images/cases/tour";
export const tourImg = (name: string) => `${DIR}/${name}.webp`;
export const tourPhoto = (name: string) => `${DIR}/photo/${name}.webp`;
export const deckSlide = (n: number, thumb = false) => `${DIR}/deck/${String(n).padStart(2, "0")}${thumb ? "-t" : ""}.webp`;
export const DECK = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
export const BEZEL = { silver: "/images/mockups/iphone-17-pro-silver.webp", blue: "/images/mockups/iphone-17-pro-blue.webp" };

export const TOUR_COLORS = {
  blue: "#1771D9",
  bright: "#017AFF",
  red: "#EE5D5C",
  green: "#7CCB49",
  yellow: "#FFC531",
  ink: "#141B2D",
  paper: "#F4EFE6",
};

export const TOUR_BOARDS = [
  { id: "hero", h: 1250 },
  { id: "about", h: 1180 },
  { id: "try", h: 1250 },
  { id: "map", h: 1250 },
  { id: "screens", h: 1130 },
  { id: "social", h: 1200 },
  { id: "system", h: 850 },
  { id: "outro", h: 1450 },
] as const;
export type TourBoardId = (typeof TOUR_BOARDS)[number]["id"];
export const TOUR_CASE_H = TOUR_BOARDS.reduce((s, b) => s + b.h, 0);

/* ---------- телефон: экраны и переходы ---------- */

// зона нажатия в координатах макета (ширина экрана 412)
export type Tap = { x: number; y: number; w: number; h: number; to: string; label: string };
// photo — экран начинается с фото под статус-баром (белые часы); иначе сверху белая полоса статус-бара
export type PhoneScreen = { id: string; title: string; text: string; h: number; photo?: boolean; taps: Tap[] };

export const PHONE_SCREENS: Record<string, PhoneScreen> = {
  splash: { id: "splash", title: "Запуск", text: "Фирменная «Ш» — шагай и точка.", h: 900, taps: [{ x: 0, y: 0, w: 412, h: 900, to: "onb-1", label: "Дальше" }] },
  "onb-1": {
    id: "onb-1",
    title: "Знакомство",
    text: "Три экрана онбординга — фото Тулы и коротко о сути.",
    h: 900,
    photo: true,
    taps: [{ x: 40, y: 780, w: 332, h: 90, to: "onb-2", label: "Дальше" }],
  },
  "onb-2": { id: "onb-2", title: "Знакомство", text: "Путешествие в один клик.", h: 900, photo: true, taps: [{ x: 40, y: 780, w: 332, h: 90, to: "onb-3", label: "Дальше" }] },
  "onb-3": {
    id: "onb-3",
    title: "Знакомство",
    text: "Приключения под контролем — даже в дороге.",
    h: 900,
    photo: true,
    taps: [{ x: 40, y: 780, w: 332, h: 90, to: "home", label: "Начать путешествие" }],
  },
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
    h: 1479,
    photo: true,
    taps: [{ x: 15, y: 614, w: 186, h: 44, to: "map", label: "Начать маршрут" }],
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
    h: 1138,
    photo: true,
    taps: [{ x: 15, y: 668, w: 376, h: 44, to: "map", label: "Маршрут" }],
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
  builder: { id: "builder", title: "Конструктор маршрута", text: "Интересы, время и бюджет — и маршрут готов.", h: 900, taps: [] },
};

// сценарии рядом с живым телефоном
export const SCENARIOS: { to: string; title: string; text: string }[] = [
  { to: "builder", title: "Собрать свой маршрут", text: "Интересы, время, бюджет — и маршрут появится на карте ниже" },
  { to: "route", title: "Пройти готовый маршрут", text: "Карточка маршрута, карта и место" },
  { to: "menu", title: "Профиль и рейтинг", text: "Километры, история и таблица лидеров" },
  { to: "onb-1", title: "Первый запуск", text: "Онбординг из трёх экранов" },
];

/* ---------- места и маршруты ---------- */

export const INTERESTS: { id: string; name: string }[] = [
  { id: "culture", name: "Культура и искусство" },
  { id: "food", name: "Гастрономия" },
  { id: "shop", name: "Шопинг" },
  { id: "nature", name: "Природа и прогулки" },
  { id: "faith", name: "Паломничество" },
  { id: "active", name: "Активный отдых" },
];

export const KIND_COLOR: Record<string, string> = {
  culture: TOUR_COLORS.blue,
  food: TOUR_COLORS.red,
  shop: "#E0A400",
  nature: "#4FA92A",
  faith: "#9B6BE0",
  active: "#17A9A2",
};

export const DURATIONS: { id: string; name: string; stops: number }[] = [
  { id: "2h", name: "2 часа", stops: 3 },
  { id: "4h", name: "4 часа", stops: 5 },
  { id: "day", name: "Весь день", stops: 7 },
];

export const BUDGETS = ["Экономно", "Средний чек", "Не важно"];

// реальные места Тулы (координаты OSM); порядок совпадает с ключами tourLegs.json
export type TourPlace = { id: number; name: string; kind: string; tag: string; time: string; lat: number; lon: number };
export const PLACES: TourPlace[] = [
  { id: 0, name: "Тульский кремль", kind: "culture", tag: "Историческое место", time: "1 ч", lat: 54.1951, lon: 37.6204 },
  { id: 1, name: "Музей оружия", kind: "culture", tag: "Музей", time: "1,5 ч", lat: 54.2041, lon: 37.61636 },
  { id: 2, name: "Музей «Тульские самовары»", kind: "culture", tag: "Музей", time: "40 мин", lat: 54.19427, lon: 37.61894 },
  { id: 3, name: "Краеведческий музей", kind: "culture", tag: "Музей", time: "1 ч", lat: 54.19107, lon: 37.61857 },
  { id: 4, name: "Музей «Тульский пряник»", kind: "food", tag: "Музей и дегустация", time: "1 ч", lat: 54.21154, lon: 37.62231 },
  { id: 5, name: "Ресторан «Большой Кремлёвский»", kind: "food", tag: "Русская кухня", time: "1 ч", lat: 54.19557, lon: 37.61961 },
  { id: 6, name: "Ресторан «Графъ Нулинъ»", kind: "food", tag: "Тульская кухня", time: "1 ч", lat: 54.19578, lon: 37.61547 },
  { id: 7, name: "Улица Металлистов", kind: "shop", tag: "Пешеходная улица, сувениры", time: "40 мин", lat: 54.18889, lon: 37.61321 },
  { id: 8, name: "Казанская набережная", kind: "nature", tag: "Прогулка у Упы", time: "40 мин", lat: 54.19644, lon: 37.62071 },
  { id: 9, name: "Кремлёвский сад", kind: "nature", tag: "Сквер", time: "20 мин", lat: 54.19388, lon: 37.6219 },
  { id: 10, name: "Тульский экзотариум", kind: "nature", tag: "Экзотариум", time: "1 ч", lat: 54.2087, lon: 37.61953 },
  { id: 11, name: "Парк имени Белоусова", kind: "active", tag: "Центральный парк", time: "1,5 ч", lat: 54.18089, lon: 37.5864 },
  { id: 12, name: "Некрополь Демидовых", kind: "faith", tag: "Храм и усыпальница", time: "30 мин", lat: 54.20517, lon: 37.61566 },
];

export type Leg = { d: number; t: number; line: [number, number][] };
export type Legs = Record<string, Leg>;
export const legOf = (legs: Legs, a: number, b: number): Leg => {
  const l = legs[a < b ? `${a}-${b}` : `${b}-${a}`];
  return a < b ? l : { ...l, line: [...l.line].reverse() };
};

// порядок обхода: от кремля (или первой точки) к ближайшей непосещённой по пешеходному расстоянию
export function orderStops(legs: Legs, ids: number[]): number[] {
  if (ids.length < 3) return ids;
  const left = new Set(ids);
  let cur = ids.includes(0) ? 0 : ids[0];
  const out = [cur];
  left.delete(cur);
  while (left.size) {
    let best = -1;
    let bd = Infinity;
    for (const j of left) {
      const d = legOf(legs, cur, j).d;
      if (d < bd) [best, bd] = [j, d];
    }
    out.push(best);
    left.delete(best);
    cur = best;
  }
  return out;
}

// маршрут по интересам: по очереди берём места каждой выбранной категории
export function buildRoute(interests: string[], stops: number): number[] {
  const pool = interests.length ? interests : ["culture", "food"];
  const lists = pool.map((k) => PLACES.filter((p) => p.kind === k));
  const out: number[] = [];
  for (let i = 0; out.length < stops && i < 10; i++) for (const l of lists) if (l[i] && out.length < stops) out.push(l[i].id);
  // если категорий мало — добираем центром города
  for (const p of PLACES) if (out.length < stops && !out.includes(p.id)) out.push(p.id);
  return out;
}

export const PRESETS: { id: string; name: string; ids: number[] }[] = [
  { id: "classic", name: "Классика", ids: [0, 2, 8, 1] },
  { id: "sweet", name: "Пряничный", ids: [0, 5, 2, 9, 4] },
  { id: "day", name: "Вся Тула за день", ids: [11, 7, 3, 2, 0, 9, 8, 6, 1, 12, 10, 4] },
];

/* ---------- борды ---------- */

export const ABOUT_CARDS: { photo: string; label: string; title: string; text: string }[] = [
  {
    photo: "embankment",
    label: "Задача",
    title: "Полдня уходит на то, чтобы понять, куда идти",
    text: "Информация о городе разбросана по картам, пабликам и путеводителям — турист собирает её сам.",
  },
  {
    photo: "kremlin-park",
    label: "Решение",
    title: "Маршрут за минуту — под тебя",
    text: "Приложение спрашивает об интересах, времени и бюджете и собирает пешую прогулку из реальных мест.",
  },
  {
    photo: "pryanik",
    label: "Город",
    title: "Тула целиком: от кремля до пряника",
    text: "Готовые маршруты по категориям, карточки мест с часами работы и рейтинг тех, кто прошёл больше всех.",
  },
];

export const TOUR_PALETTE: { name: string; hex: string; role: string }[] = [
  { name: "Небо", hex: TOUR_COLORS.blue, role: "главный цвет, кнопки" },
  { name: "Маршрут", hex: TOUR_COLORS.bright, role: "активные элементы" },
  { name: "Кирпич", hex: TOUR_COLORS.red, role: "рейтинг, важное" },
  { name: "Парк", hex: TOUR_COLORS.green, role: "природа, успех" },
  { name: "Купола", hex: TOUR_COLORS.yellow, role: "лидеры, акценты" },
  { name: "Чернила", hex: TOUR_COLORS.ink, role: "текст" },
];
