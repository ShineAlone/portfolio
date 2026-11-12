import type { NextConfig } from "next";

// значок Next.js в углу показывается только в режиме разработки — отключаем, чтобы не мешал смотреть сайт
// Картинки, видео и модели меняются редко: сутки браузер берёт их из кеша без обращения к серверу,
// а потом ещё месяц показывает сохранённую копию сразу и обновляет её в фоне.
const STATIC_CACHE = "public, max-age=86400, stale-while-revalidate=2592000";

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return ["images", "videos", "models", "draco", "icons", "fonts"].map((dir) => ({
      source: `/${dir}/:path*`,
      headers: [{ key: "Cache-Control", value: STATIC_CACHE }],
    }));
  },
};

export default nextConfig;
