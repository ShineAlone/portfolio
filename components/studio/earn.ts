import type { AchievementId } from "./data";

// Блоки в глубине холста сообщают о достижении событием — приложение слушает его в одном месте,
// и колбэки не нужно протаскивать через все компоненты.
export const EARN_EVENT = "st-earn";

export const earnAch = (id: AchievementId) => {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent<AchievementId>(EARN_EVENT, { detail: id }));
};
