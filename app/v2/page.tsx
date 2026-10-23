import type { Metadata } from "next";
import { Montserrat, Unbounded } from "next/font/google";
import { StudioEntry } from "@/components/studio/StudioEntry";
import "./studio.css";
import "./mobile.css";
import "./case.css";

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

export const metadata: Metadata = {
  title: "Портфолио v2 — прототип",
  robots: { index: false, follow: false },
};

export default function V2Page() {
  return (
    <div className={`${unbounded.variable} ${montserrat.variable}`}>
      <StudioEntry />
    </div>
  );
}
