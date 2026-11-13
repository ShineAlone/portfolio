import type { Metadata } from "next";
import { Montserrat, Unbounded } from "next/font/google";
import { StudioApp } from "@/components/studio/StudioApp";
import "../v2/studio.css";
import "../v2/mobile.css";
import "../v2/case.css";
import "../v2/tour.css";
import "../v2/ux.css";
import "../v2/about-preview/about.css";
import "../v2/calm.gen.css";
import "../v2/calm.css";

// Спокойная версия: тот же холст, что и /v2, в светлом монохроме и с блоком-визиткой «Обо мне».
// Unbounded и Montserrat нужны только лентам кейсов — у них свой фирменный стиль.
const unbounded = Unbounded({ subsets: ["latin", "cyrillic"], weight: ["500", "700", "800"], variable: "--font-display" });
const montserrat = Montserrat({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "700", "800"], variable: "--font-product" });

export const metadata: Metadata = { title: "Портфолио v3 — спокойная версия", robots: { index: false, follow: false } };

export default function V3Page() {
  return (
    <div className={`${unbounded.variable} ${montserrat.variable}`}>
      <StudioApp theme="calm" />
    </div>
  );
}
