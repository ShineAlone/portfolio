import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-open-sans-var",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kononov-design.ru"),
  title: "Кононов Арсений — дизайнер",
  description:
    "Портфолио дизайнера: интерфейсы, сайты, презентации, соцсети, брендинг мероприятий и Figma-плагины",
  openGraph: {
    title: "Кононов Арсений — дизайнер",
    description:
      "Продуктовый и коммуникационный дизайнер. Проектирую цифровые продукты от идеи до интерфейса: веб-платформы, мобильные приложения, B2B-системы",
    type: "website",
    locale: "ru_RU",
    images: [{ url: "/og.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Кононов Арсений — дизайнер",
    description:
      "Продуктовый и коммуникационный дизайнер. Проектирую цифровые продукты от идеи до интерфейса: веб-платформы, мобильные приложения, B2B-системы",
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className={openSans.variable}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
