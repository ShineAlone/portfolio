export const LINKS = {
  telegram: "https://t.me/sh1nealone",
  figmaPlugin: "https://www.figma.com/community/plugin/1637580282322341528",
};

export const HERO = {
  title: ["Привет,", "я Арсений Кононов"],
  paragraphs: [
    "С 2021 года занимаюсь дизайном и помогаю проектам становиться понятнее, аккуратнее и визуально сильнее. Работаю с интерфейсами, сайтами, презентациями, социальными сетями, брендингом мероприятий и рекламными материалами.",
    "Мне важно не просто выполнить задачу, а разобраться в её смысле: задаю вопросы, предлагаю идеи, внимательно отношусь к деталям и срокам. Опыт собственного стартапа и участия в грантовых конкурсах помогает мне смотреть на дизайн шире — как на часть продукта, коммуникации и пользовательского опыта.",
  ],
  contactLabel: "Связаться со мной",
  statusLabel: "Всегда открыт для сотрудничества",
};

export const STATS = [
  { value: "6", label: "лет в дизайне" },
  { value: "3", label: "гранта" },
  { value: ">30", label: "сайтов" },
  { value: ">50", label: "проектов" },
  { value: ">2000", label: "постов для соцсетей" },
  { value: ">2500", label: "слайдов" },
];

export const EDUCATION = {
  title: "Образование",
  years: ["2021", "– 2025"],
  lines: [
    "Бакалавр, ТГПУ им. Л. Н. Толстого",
    "Фундаментальная информатика и информационные технологии",
  ],
};

export const TOOLS = {
  title: "Инструменты",
  icons: [
    { src: "/icons/tool-figma.svg", alt: "Figma", boxed: true },
    { src: "/icons/tool-2.svg", alt: "Photoshop" },
    { src: "/icons/tool-3.svg", alt: "Illustrator" },
    { src: "/icons/tool-4.svg", alt: "ChatGPT" },
    { src: "/icons/tool-5.svg", alt: "Codex" },
    { src: "/icons/tool-6.svg", alt: "Claude" },
  ],
};

export type WorkItem = {
  period: string;
  company: string;
  role: string;
  description: React.ReactNode;
  tagColor: string;
  tags: string[];
};

export const WORK: WorkItem[] = [
  {
    period: "с 2025",
    company: "Федеральное ведомство",
    role: "Дизайнер широкого профиля",
    description:
      "Оформление визуальных материалов для федеральных и региональных мероприятий и партнёрских структур: брендинг мероприятий, оформление презентаций для отчётных сессий и публичных выступлений, разработка рекламных и полиграфических материалов — баннеров для сайтов, наружной рекламы и постов для социальных сетей",
    tagColor: "#86ddff",
    tags: [
      "Презентации",
      "Соцсети",
      "Инфографика",
      "Контент-дизайн",
      "Отчётные материалы",
      "Рекламные кампании",
      "Мероприятия",
    ],
  },
  {
    period: "2023\n– 2025",
    company: "Service Soft",
    role: "Продуктовый / UX-дизайнер",
    description:
      "Разработка веб-интерфейсов для промышленных и корпоративных систем автоматизации и управления\nВ мои задачи входят:\n — проектирование пользовательских сценариев взаимодействия;\n — разработка прототипов и визуальных интерфейсов;\n — адаптация решений под специфические требования каждой отрасли;\n — взаимодействие с командами аналитиков и разработчиков на всех этапах реализации проектов",
    tagColor: "#ffc7b6",
    tags: [
      "Веб-интерфейсы",
      "UX-сценарии",
      "Прототипирование",
      "B2B-системы",
      "Работа с аналитиками и разработкой",
    ],
  },
  {
    period: "с 2021",
    company: "Проекты и фриланс",
    role: "Дизайнер широкого профиля",
    description:
      "Комплексные дизайнерские услуги в роли универсального специалиста: от разработки айдентики и презентаций до проектирования интерфейсов для сайтов и приложений. Работа с частными клиентами, малым бизнесом и стартапами. Участие в грантовых конкурсах, реализация собственных проектов. Являюсь сооснователем и дизайнером стартапа, связанного с разработкой туристического сервиса, где отвечаю за пользовательский опыт и визуальный стиль",
    tagColor: "#acf9a2",
    tags: [
      "Сайты и лендинги",
      "Брендинг мероприятий",
      "Айдентика",
      "Наружная реклама",
      "Полиграфия",
      "Выставочные материалы",
      "Мобильные приложения",
      "Соцсети",
    ],
  },
];

export type MediaCard = {
  video?: string;
  image?: string;
  /** приблизить видео, чтобы скрыть системные панели в записи экрана */
  zoomVideo?: boolean;
  tag: string;
  tagColor: string;
  title: string;
  text: string;
  figmaButton?: boolean;
  /** ссылка на опубликованный плагин или сервис */
  link?: string;
};

export const AUTOMATION = {
  title: "Автоматизация и инструменты",
  subtitle: "Разрабатываю Figma-плагины и сервисы, которые ускоряют работу команды",
  description:
    "Последние несколько месяцев осваиваю AI-ассистированную разработку (вайб-кодинг) и превращаю её в рабочий инструмент: создаю Figma-плагины, которые автоматизируют рутину дизайн-команды и смежных отделов",
  cards: [
    {
      video: "/videos/plugin-geometry.mp4",
      tag: "Хобби-проект",
      tagColor: "#fefe78",
      title: "Генератор абстрактной геометрии",
      text: "Плагин + сайт для генерации абстрактных геометрических композиций",
      figmaButton: true,
    },
    {
      video: "/videos/plugin-patterns.mp4",
      zoomVideo: true,
      tag: "Часы → десятки минут",
      tagColor: "#86ddff",
      title: "Генератор новостных дайджестов",
      text: "Плагин собирает еженедельный дайджест на 10–20 страниц (даты, места, буллиты, фото) автоматически",
    },
    {
      video: "/videos/plugin-news-cards.mp4",
      tag: "Снял задачу с дизайн-команды",
      tagColor: "#ffc7b6",
      title: "Генератор карточек для новостей",
      text: "SMM-отдел выпускает шаблонные новостные карточки без участия дизайнера",
    },
    {
      video: "/videos/plugin-digest.mp4",
      tag: "Ускорение работы по брендбуку",
      tagColor: "#c791ff",
      title: "Генератор фирменных паттернов",
      text: "Генерация паттернов в обновлённом фирменном стиле компании",
    },
    {
      image: "/images/plugins/droptochat.jpg",
      tag: "Оптимизация времени и места на диске",
      tagColor: "#ffb6e1",
      title: "DropToChat — фреймы в Telegram и Discord",
      text: "Выделил фреймы, выбрал чат, нажал «Отправить» — макеты в Telegram или Discord за секунды. Без скачиваний и выхода из Figma",
      link: "https://www.figma.com/community/plugin/1677051070525805022/droptochat-send-frames-to-messengers-in-one-click",
    },
    {
      tag: "Еженедельный поток презентаций",
      tagColor: "#acf9a2",
      title: "Чек-лист презентаций",
      text: "Автопроверка перед отправкой руководителю: переименование фреймов по заголовкам, поиск текста вне библиотечных стилей, проверка отступов",
    },
  ] as MediaCard[],
};

export const SOCIAL = {
  title: "Социальные сети",
  subtitle: "Посты, карточки, рубрики и промо",
  description:
    "Ежедневный поток контента: информационные и развлекательные посты, карточки-инструкции, тематические рубрики и промо грантовых конкурсов. Работаю с готовыми текстами и контент-планом: нахожу визуальный ход, собираю графику и адаптирую её под форматы разных площадок",
  // 8 рядов по 6 плиток; ряды 2 и 8 — вертикальные форматы
  rows: [1, 2, 3, 4, 5, 6, 7, 8].map((r) =>
    [1, 2, 3, 4, 5, 6].map((c) => `/images/social/r${r}c${c}.jpg`)
  ),
};

const wp = (n: number) => `/images/wallpapers/wp-${String(n).padStart(2, "0")}.jpg`;

export const WALLPAPERS = {
  title: "Обои для телефонов и ПК",
  description:
    "Ежемесячная рубрика: серия обоев в едином стиле к каждому месяцу — для телефонов и рабочих столов. Регулярный формат, который аудитория ждёт и забирает себе на устройства. Почти во всех дизайнах использовался ИИ",
  // Ряды мозаики из макета: 2 — широкая плитка (обои для ПК), 1 — узкая (для телефона)
  rows: [
    { cols: [2, 1, 2, 1, 1], from: 1 },
    { cols: [1, 1, 2, 1, 2], from: 6 },
    { cols: [2, 1, 2, 1, 1], from: 11 },
    { cols: [1, 1, 2, 2, 1], from: 16 },
    { cols: [2, 2, 1, 2], from: 21 },
    { cols: [1, 2, 2, 2], from: 25 },
    { cols: [2, 1, 2, 2], from: 29 },
    { cols: [2, 1, 1, 2, 1], from: 33 },
    { cols: [2, 1, 2, 2], from: 38 },
  ].map((row) => ({
    cols: row.cols,
    images: row.cols.map((_, i) => wp(row.from + i)),
  })),
};

export const PRESENTATIONS = {
  title: "Презентации",
  subtitle: "От отчётных сессий до выступлений федерального уровня",
  description:
    "Презентации разных жанров: отчётные, продуктовые, питчи для защит, имиджевые для выступлений на сцене. Под каждую задачу — свой визуальный язык, от строгого делового до яркого сценического",
  cards: [
    {
      video: "/videos/construction-ai.mp4",
      zoomVideo: true,
      tag: "Презентация к решению кейса",
      tagColor: "#ffc7b6",
      title: "",
      text: "Автоматизация выявления строительных объектов с использованием ИИ",
    },
    {
      video: "/videos/kudach.mp4",
      tag: "Собственный стартап-проект",
      tagColor: "#c791ff",
      title: "",
      text: "Туристическое приложение с построением индивидуальных маршрутов «Кудач»",
    },
  ] as MediaCard[],
  slideGroups: [
    Array.from({ length: 18 }, (_, i) => `/images/presentations/cosmo-${String(i + 1).padStart(2, "0")}.jpg`),
    [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(
      (n) => `/images/presentations/tochka-${String(n).padStart(2, "0")}.jpg`
    ),
    Array.from({ length: 12 }, (_, i) => `/images/presentations/camp-${String(i + 1).padStart(2, "0")}.jpg`),
  ],
};

export const PROJECTS = {
  title: "Проекты",
  subtitle: "Сайты, брендинг, мерч и оформление мероприятий",
  description:
    "Комплексные задачи, где дизайн живёт сразу на многих носителях: айдентика мероприятий и спецпроектов, лендинги, мерч, наружная реклама и выставочные материалы. От концепции до подготовки макетов к печати и публикации",
  coffeeGrid: Array.from({ length: 9 }, (_, i) => `/images/projects/coffee-${i + 1}.jpg`),
  sites: {
    tzVk: "/images/projects/tz-vk.png",
    platforma: "/images/projects/platforma.png",
    binghatti: "/images/projects/binghatti.png",
    serviceSoft1: "/images/projects/service-soft-1.jpg",
    serviceSoft2: "/images/projects/service-soft-2.jpg",
    site1920: "/images/projects/site-1920.jpg",
    androidCompact: "/images/projects/android-compact.jpg",
  },
  merch: [
    "/images/projects/tshirt.jpg",
    "/images/projects/badges.jpg",
    "/images/projects/notebook.jpg",
    "/images/projects/shopper.jpg",
  ],
  transarctic: "/images/projects/transarctic.jpg",
  er: {
    photos: ["/images/projects/er-150.jpg", "/images/projects/er-151.jpg"],
    banners: ["/images/projects/er-39192.jpg", "/images/projects/er-39192-1.jpg"],
    templates: Array.from({ length: 6 }, (_, i) => `/images/projects/er-tpl-${i + 1}.jpg`),
  },
};
