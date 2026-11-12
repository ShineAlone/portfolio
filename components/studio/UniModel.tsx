"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/* eslint-disable @next/next/no-img-element */

/*
 * 3D-модель второго корпуса ТГПУ. До нажатия показана только заставка — библиотека, модель и декодер
 * грузятся по кнопке «Открыть 3D». Модель можно свободно крутить и приближать; камера не опускается
 * ниже горизонта, поэтому дна не видно.
 * «На весь экран» открывает то же окно поверх сайта: канвас переезжает туда вместе с камерой.
 */

const MODEL = "/models/university-v1.glb";
const POSTER = "/models/university-poster.jpg";
const DRACO = "/draco/";

// [азимут, наклон от вертикали] в градусах и дальность в долях стартовой
const HOME = { az: 12, pol: 70 };
const RAD = Math.PI / 180;

type Status = "idle" | "loading" | "ready" | "error" | "nogl";

type Rig = {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  controls: OrbitControls;
  base: number; // стартовая дальность камеры
  fly: (az: number, pol: number, dist: number) => void;
  zoom: (k: number) => void;
  /** канвас переехал в другое окно — заново проверяем, виден ли он, и продолжаем рисовать */
  wake: () => void;
  dispose: () => void;
};

const hasWebGL = () => {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
};

export function UniModel() {
  const [status, setStatus] = useState<Status>("idle");
  const [full, setFull] = useState(false);
  const rig = useRef<Rig | null>(null);
  const host = useRef<HTMLDivElement | null>(null);
  const openBtn = useRef<HTMLButtonElement>(null);
  const fullBtn = useRef<HTMLButtonElement | null>(null);

  // канвас живёт в текущем окне — обычном или полноэкранном — и подстраивается под его размер
  const mount = useCallback((el: HTMLDivElement | null) => {
    host.current = el;
    const r = rig.current;
    if (!el || !r) return;
    el.appendChild(r.renderer.domElement);
    r.wake();
    const fit = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      r.renderer.setSize(w, h, false);
      r.camera.aspect = w / h;
      r.camera.updateProjectionMatrix();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const open = useCallback(async () => {
    if (!hasWebGL()) return setStatus("nogl");
    setStatus("loading");
    try {
      const [THREE, { GLTFLoader }, { DRACOLoader }, { OrbitControls: Orbit }, { RoomEnvironment }] = await Promise.all([
        import("three"),
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("three/examples/jsm/loaders/DRACOLoader.js"),
        import("three/examples/jsm/controls/OrbitControls.js"),
        import("three/examples/jsm/environments/RoomEnvironment.js"),
      ]);
      const draco = new DRACOLoader().setDecoderPath(DRACO);
      const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync(MODEL);
      draco.dispose();

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 760 ? 1.5 : 2));
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.domElement.setAttribute("aria-label", "Трёхмерная модель корпуса университета");
      renderer.domElement.setAttribute("role", "img");

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      // свет приглушён, чтобы стены остались бежевыми, а крыша серо-голубой — без пересвета
      scene.environmentIntensity = 0.5;
      const sun = new THREE.DirectionalLight(0xffffff, 0.9);
      sun.position.set(4, 8, 6);
      scene.add(sun);
      // заполняющий свет, чтобы двор и задние стены не проваливались в тень
      scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 0.7));

      // модель ставим центром в начало координат, основанием на землю
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.set(-center.x, -box.min.y, -center.z);
      scene.add(model);

      // площадка с мягкой тенью под зданием
      const cv = document.createElement("canvas");
      cv.width = cv.height = 256;
      const g = cv.getContext("2d")!;
      const grad = g.createRadialGradient(128, 128, 20, 128, 128, 128);
      grad.addColorStop(0, "rgba(20,30,50,0.34)");
      grad.addColorStop(0.6, "rgba(20,30,50,0.1)");
      grad.addColorStop(1, "rgba(20,30,50,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 256, 256);
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(size.x * 1.9, size.z * 3.4),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.002 * size.y;
      scene.add(ground);

      const camera = new THREE.PerspectiveCamera(30, 1.78, 0.1, 5000);
      const target = new THREE.Vector3(0, size.y * 0.38, 0);
      // дальность, с которой здание целиком помещается по ширине и в узком, и в широком окне
      const base = (Math.max(size.x, size.z * 1.4) / 2 / Math.tan((camera.fov * RAD) / 2)) * 0.82;

      const controls = new Orbit(camera, renderer.domElement);
      controls.target.copy(target);
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.09;
      controls.rotateSpeed = 0.7;
      // камера не опускается ниже горизонта — дна модели не видно
      controls.minPolarAngle = 12 * RAD;
      controls.maxPolarAngle = 84 * RAD;
      controls.minDistance = base * 0.32;
      controls.maxDistance = base * 1.5;

      const place = (az: number, pol: number, dist: number) => {
        const s = new THREE.Spherical(dist, pol, az);
        camera.position.setFromSpherical(s).add(target);
        camera.lookAt(target);
      };
      place(HOME.az * RAD, HOME.pol * RAD, base);
      controls.update();

      // плавный перелёт к ракурсу: азимут идёт кратчайшей дугой
      let flight = 0;
      const fly = (az: number, pol: number, dist: number) => {
        cancelAnimationFrame(flight);
        const from = new THREE.Spherical().setFromVector3(camera.position.clone().sub(target));
        let d = az - from.theta;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        const t0 = performance.now();
        const step = (now: number) => {
          const f = Math.min(1, (now - t0) / 800);
          const e = f * f * (3 - 2 * f);
          place(from.theta + d * e, from.phi + (pol - from.phi) * e, from.radius + (dist - from.radius) * e);
          if (f < 1) flight = requestAnimationFrame(step);
        };
        flight = requestAnimationFrame(step);
      };
      const zoom = (k: number) => {
        const s = new THREE.Spherical().setFromVector3(camera.position.clone().sub(target));
        fly(s.theta, s.phi, Math.max(controls.minDistance, Math.min(controls.maxDistance, s.radius * k)));
      };
      // начал крутить сам — перелёт отменяется
      controls.addEventListener("start", () => cancelAnimationFrame(flight));

      // рисуем, только пока окно с моделью в кадре
      let raf = 0;
      let visible = true;
      const loop = () => {
        controls.update();
        renderer.render(scene, camera);
        if (visible) raf = requestAnimationFrame(loop);
      };
      const io = new IntersectionObserver(([e]) => {
        const on = e.isIntersecting;
        if (on && !visible) {
          visible = true;
          raf = requestAnimationFrame(loop);
        } else if (!on) {
          visible = false;
          cancelAnimationFrame(raf);
        }
      });
      io.observe(renderer.domElement);
      raf = requestAnimationFrame(loop);

      rig.current = {
        renderer,
        scene,
        camera,
        controls,
        base,
        fly,
        zoom,
        wake: () => {
          io.unobserve(renderer.domElement);
          io.observe(renderer.domElement);
        },
        dispose: () => {
          io.disconnect();
          cancelAnimationFrame(raf);
          cancelAnimationFrame(flight);
          controls.dispose();
          pmrem.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        },
      };
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => () => rig.current?.dispose(), []);

  // в полноэкранном окне Escape закрывает его и возвращает фокус на кнопку
  useEffect(() => {
    if (!full) return;
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setFull(false);
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [full]);
  const wasFull = useRef(false);
  useEffect(() => {
    if (wasFull.current && !full) fullBtn.current?.focus();
    wasFull.current = full;
  }, [full]);

  // колесо над открытой моделью приближает её, а не холст
  const stage = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener("wheel", stop);
    el.addEventListener("pointerdown", stop);
    return () => {
      el.removeEventListener("wheel", stop);
      el.removeEventListener("pointerdown", stop);
    };
  }, []);

  const ready = status === "ready";
  const view = (
    <div className={`st-uni__view${full ? " is-full" : ""}`}>
      {ready && <div ref={stage} className="st-uni__stage" data-ui><div ref={mount} className="st-uni__canvas" /></div>}
      {!ready && <img className="st-uni__poster" src={POSTER} alt="Второй корпус ТГПУ — вид на фасад" loading="lazy" draggable={false} />}

      {!ready && (
        <div className="st-uni__start">
          {status === "nogl" ? (
            <span className="st-uni__msg">Интерактивный просмотр недоступен в этом браузере</span>
          ) : (
            <button ref={openBtn} type="button" data-ui className="st-uni__open" onClick={open} disabled={status === "loading"}>
              {status === "loading" ? "Загружаем модель…" : status === "error" ? "Повторить загрузку" : "Открыть 3D"}
            </button>
          )}
          {status === "error" && <span className="st-uni__msg">Не получилось загрузить модель</span>}
        </div>
      )}
      <span className="st-uni__sr" aria-live="polite">
        {status === "loading" ? "Загружаем модель…" : status === "error" ? "Не получилось загрузить модель" : status === "nogl" ? "Интерактивный просмотр недоступен" : ""}
      </span>

      {ready && (
        <>
          <div className="st-uni__tools" data-ui>
            <button type="button" aria-label="Приблизить" onClick={() => rig.current?.zoom(0.75)}>
              +
            </button>
            <button type="button" aria-label="Отдалить" onClick={() => rig.current?.zoom(1.33)}>
              −
            </button>
            <button
              type="button"
              aria-label="Сбросить вид"
              title="Сбросить вид"
              onClick={() => rig.current?.fly(HOME.az * RAD, HOME.pol * RAD, rig.current.base)}
            >
              ↺
            </button>
            <button
              ref={(el) => {
                if (!full) fullBtn.current = el;
              }}
              type="button"
              aria-label={full ? "Закрыть полноэкранный просмотр" : "На весь экран"}
              title={full ? "Закрыть" : "На весь экран"}
              onClick={() => setFull((f) => !f)}
            >
              {full ? "✕" : "⤢"}
            </button>
          </div>
          <span className="st-uni__hint">Крути мышью · колесо — масштаб</span>
        </>
      )}
    </div>
  );

  return (
    <>
      {full ? <div className="st-uni__view is-away">Модель открыта на весь экран</div> : view}
      {full && createPortal(<div className="st-uni__modal" role="dialog" aria-modal="true" aria-label="3D-модель корпуса">{view}</div>, document.body)}
    </>
  );
}
