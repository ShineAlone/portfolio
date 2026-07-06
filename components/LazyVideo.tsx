"use client";

import { useEffect, useRef } from "react";

// Видео начинает грузиться и играть только при приближении к вьюпорту,
// вне экрана — ставится на паузу.
export function LazyVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!video.src) video.src = src;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(video);
    return () => io.disconnect();
  }, [src]);

  return <video ref={ref} muted loop playsInline preload="none" />;
}
