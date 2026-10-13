import type { Metadata } from "next";
import { CanvasApp } from "@/components/canvas/CanvasApp";
import "./canvas.css";

export const metadata: Metadata = {
  title: "Холст — прототип",
  robots: { index: false, follow: false },
};

export default function CanvasPage() {
  return <CanvasApp />;
}
