import type { Metadata } from "next";
import { Montserrat, Unbounded } from "next/font/google";
import { StudioEntry } from "@/components/studio/StudioEntry";
import "./v2/studio.css";
import "./v2/mobile.css";
import "./v2/case.css";
import "./v2/tour.css";

// Главная — холст-портфолио. Прежняя версия сайта осталась по адресу /old.

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700", "800"],
  variable: "--font-display",
});

// шрифт продуктов из кейсов — живые элементы интерфейса набраны им же, как в макетах
const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-product",
});

export default function HomePage() {
  return (
    <div className={`${unbounded.variable} ${montserrat.variable}`}>
      <StudioEntry />
    </div>
  );
}
