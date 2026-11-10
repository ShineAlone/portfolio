import type { Metadata } from "next";
import { AboutCalm } from "@/components/studio/AboutCalm";
import "./about.css";

// Служебная страница: спокойный вариант блока «Обо мне» отдельно от холста. В навигации её нет.
export const metadata: Metadata = { title: "Обо мне — спокойный вариант", robots: { index: false, follow: false } };

export default function AboutPreviewPage() {
  return <AboutCalm />;
}
