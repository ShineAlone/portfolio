export const portfolioCases = {
  "hr": {
    title: "Адаптация, в которую хочется играть",
    category: "HR Tech · веб-платформа",
    role: "Дизайн продукта: сценарии, интерфейсы, персонажи",
    summary: "Платформа превращает первые месяцы в компании в игровой сезон с миссиями, уровнями и наградами. HR настраивает треки и следит за прогрессом сотрудников в отдельном кабинете.",
    sections: [
      { title: "Путь сотрудника", text: "Треки по неделям показывают, с чего начать и что делать дальше. В личном кабинете сотрудник видит текущую миссию, прогресс и награды.", width: 1440, height: 1024, image: "/images/cases/hr/emp-main.webp" },
      { title: "Кабинет HR", text: "HR собирает задания и сезоны, проверяет отчёты и видит, кому требуется помощь.", width: 1440, height: 1024, image: "/images/cases/hr/hr-main.webp" },
    ],
    preview: "/images/cases/hr/emp-main-thumb.webp",
  },
  "tour": {
    title: "Шагай и точка",
    category: "Туризм · мобильное приложение",
    role: "Сооснователь и дизайнер продукта",
    summary: "Приложение собирает пешие маршруты по Туле из реальных мест по интересам пользователя. Проект выиграл грант.",
    sections: [
      { title: "Персональный маршрут", text: "Пользователь выбирает интересы, а приложение предлагает места, порядок остановок и время прогулки.", width: 1600, height: 900, image: "/images/cases/tour/deck/04.webp" },
      { title: "Прогулка по городу", text: "На карте можно проверить маршрут, посмотреть остановки и понять, сколько времени займёт каждый отрезок.", width: 1600, height: 900, image: "/images/cases/tour/deck/07.webp" },
    ],
    preview: "/images/cases/tour/photo/cathedral-preview.webp",
  },
} as const;

export type PortfolioCaseId = keyof typeof portfolioCases;
export const portfolioCaseIds = Object.keys(portfolioCases) as PortfolioCaseId[];
