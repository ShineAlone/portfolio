import { useEffect, type RefObject } from "react";

/*
 * Тяжёлые 3D-украшения (сфера постов, кольца букв и фигура в «Контактах») держат в видеопамяти
 * сотни слоёв, даже когда блок далеко за экраном. Пока блок вне кадра (с запасом в полэкрана),
 * помечаем его data-off — CSS убирает содержимое из отрисовки, и память достаётся видимым блокам и меню.
 */
export function useOffscreen(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => el.toggleAttribute("data-off", !e.isIntersecting),
      { rootMargin: "50%" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}
