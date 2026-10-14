import type { Metadata } from "next";
import { Unbounded } from "next/font/google";
import { StudioEntry } from "@/components/studio/StudioEntry";
import "./studio.css";
import "./mobile.css";

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
      <StudioEntry />
    </div>
  );
}
