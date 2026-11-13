"use client";

import { useEffect } from "react";

// Холст переехал на главную — старые ссылки на /v2 ведут туда же.
// Основная переадресация (301) — в public/.htaccess; эта страница — запасной вариант.
export default function V2Page() {
  useEffect(() => {
    window.location.replace("/");
  }, []);
  return (
    <p style={{ padding: 24 }}>
      Сайт переехал на <a href="/">главную</a>.
    </p>
  );
}
