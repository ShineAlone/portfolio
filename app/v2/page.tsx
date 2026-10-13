import type { Metadata } from "next";
import { Unbounded } from "next/font/google";
import { StudioApp } from "@/components/studio/StudioApp";
import "./studio.css";

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Портфолио v2 — прототип",
  robots: { index: false, follow: false },
};

export default function V2Page() {
  return (
    <div className={unbounded.variable}>
      <StudioApp />
    </div>
  );
}
