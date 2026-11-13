/*
 * Видео, сфера и поле обоев приостанавливаются, пока движется камера или идёт игра.
 */
const ACTIVITY_EVENT = "st-activity";
let driving = false;
let flying = false;

export const isStudioBusy = () => driving || flying;

export function setDriving(on: boolean) {
  if (driving === on) return;
  driving = on;
  window.dispatchEvent(new Event(ACTIVITY_EVENT));
}

export function setFlying(on: boolean) {
  if (flying === on) return;
  flying = on;
  window.dispatchEvent(new Event(ACTIVITY_EVENT));
}

export function onStudioActivity(cb: () => void) {
  window.addEventListener(ACTIVITY_EVENT, cb);
  return () => window.removeEventListener(ACTIVITY_EVENT, cb);
}
