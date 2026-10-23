import type { Metadata } from "next";
import { Montserrat, Unbounded } from "next/font/google";
import { CasePreview } from "@/components/studio/CasePreview";
import "../studio.css";
import "../case.css";
import "../tour.css";

// Служебная страница: кейс отдельно от холста — для проверки вёрстки. В навигации её нет.
const unbounded = Unbounded({ subsets: ["latin", "cyrillic"], weight: ["500", "700", "800"], variable: "--font-display" });
const montserrat = Montserrat({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "700", "800"], variable: "--font-product" });

export const metadata: Metadata = { title: "Кейс — предпросмотр", robots: { index: false, follow: false } };

export default function CasePreviewPage() {
  return (
    <div className={`${unbounded.variable} ${montserrat.variable}`}>
      <CasePreview />
    </div>
  );
}
