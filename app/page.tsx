import { Montserrat, Unbounded } from "next/font/google";
import { StudioEntry } from "@/components/studio/StudioEntry";
import "./v2/mobile.css";

// Главная — холст-портфолио. Прежняя версия сайта осталась по адресу /old.

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700", "800"],
  variable: "--font-display",
  preload: false,
});

// шрифт продуктов из кейсов — живые элементы интерфейса набраны им же, как в макетах
const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-product",
  preload: false,
});

export default function HomePage() {
  return (
    <div className={`${unbounded.variable} ${montserrat.variable}`}>
      <StudioEntry />
    </div>
  );
}
