export type Cam = { x: number; y: number; z: number };

// Дальше 200% картинки в текущем разрешении начинают мылить.
export const MIN_Z = 0.12;
export const MAX_Z = 2;

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// Камера живёт вне React-состояния: панорамирование не перерисовывает сотни картинок.
export function createCameraStore() {
  let cam: Cam = { x: 0, y: 0, z: 1 };
  const listeners = new Set<() => void>();
  return {
    get: () => cam,
    set(next: Cam) {
      cam = next;
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}

export type CameraStore = ReturnType<typeof createCameraStore>;
