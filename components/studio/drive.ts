/*
 * Режим езды: пока машинка на холсте, всё тяжёлое в блоках (видео, сфера постов, поле обоев)
 * встаёт на паузу — кадры нужны камере, городу и самой машинке. Блоки узнают о езде через событие.
 */
const DRIVE_EVENT = "st-drive";
let driving = false;

export const isDriving = () => driving;

export function setDriving(on: boolean) {
  if (driving === on) return;
  driving = on;
  window.dispatchEvent(new CustomEvent(DRIVE_EVENT));
}

/** Подписка на начало и конец езды; возвращает отписку. */
export function onDriveChange(cb: (driving: boolean) => void) {
  const h = () => cb(driving);
  window.addEventListener(DRIVE_EVENT, h);
  return () => window.removeEventListener(DRIVE_EVENT, h);
}
