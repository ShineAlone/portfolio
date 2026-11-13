import type { NextConfig } from "next";

/*
 * Сайт собирается в папку готовых файлов (out/) и лежит на обычном хостинге reg.ru.
 * Серверной части нет: кэш, переадресации и типы файлов настроены в public/.htaccess.
 * trailingSlash: страницы ложатся как /cases/hr/index.html — Apache отдаёт их по адресу /cases/hr/ без настроек.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  // значок Next.js в углу показывается только в режиме разработки — отключаем, чтобы не мешал смотреть сайт
  devIndicators: false,
};

export default nextConfig;
