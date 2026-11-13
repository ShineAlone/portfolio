/*
 * Слабое устройство: iPad или компьютер с ≤ 4 ядрами / ≤ 4 ГБ памяти (если браузер это сообщает).
 * На таких устройствах сфера и поле обоев обновляются через кадр — 30 раз в секунду вместо 60:
 * глазу почти незаметно, а процессору вдвое легче.
 */
let cached: boolean | null = null;

export function isLowPower() {
  if (cached !== null) return cached;
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const ipad = /iPad/.test(nav.userAgent) || (/Macintosh/.test(nav.userAgent) && nav.maxTouchPoints > 1);
  const cores = nav.hardwareConcurrency || 8;
  const memory = nav.deviceMemory ?? 8;
  cached = ipad || cores <= 4 || memory <= 4;
  return cached;
}
