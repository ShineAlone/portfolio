"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { KIND_COLOR, PLACES, legOf, type Legs } from "./casesTour";

/*
 * Живая карта Тулы для кейса: MapLibre + векторные тайлы OpenFreeMap (данные OpenStreetMap),
 * без ключа и без рекламы. Карта в наклоне, с объёмными домами; маршрут — заранее посчитанные
 * пешеходные отрезки. «Пройти маршрут» ведёт камеру по улицам за точкой-туристом.
 *
 * Карта масштабируется вместе с холстом, как любой другой борд (MapLibre сам учитывает CSS-масштаб
 * контейнера), и рисуется в S раз крупнее — подписи улиц и метки читаются на общем плане.
 * Пока карту не «взяли» кликом, колесо и перетаскивание остаются у холста.
 */

const STYLE = "https://tiles.openfreemap.org/styles/positron";
const CENTER: [number, number] = [37.612, 54.197];
const VIEW = { zoom: 13.9, pitch: 42, bearing: -16 };
// во сколько раз карта крупнее своих пикселей
const S = 1.3;
export type Pad = { top: number; bottom: number; left: number; right: number };

type LngLat = [number, number];

// расстояние в метрах между двумя точками
function dist([x1, y1]: LngLat, [x2, y2]: LngLat) {
  const r = Math.PI / 180;
  const dx = (x2 - x1) * r * Math.cos(((y1 + y2) / 2) * r);
  const dy = (y2 - y1) * r;
  return Math.hypot(dx, dy) * 6371000;
}

function heading([x1, y1]: LngLat, [x2, y2]: LngLat) {
  return (Math.atan2((x2 - x1) * Math.cos((y1 * Math.PI) / 180), y2 - y1) * 180) / Math.PI;
}

function restyle(map: MlMap) {
  const paint: Record<string, [string, string | number]> = {
    background: ["background-color", "#F3EEE5"],
    water: ["fill-color", "#9DCBEB"],
    park: ["fill-color", "#CFE5B9"],
    landcover_wood: ["fill-color", "#CFE5B9"],
    landuse_residential: ["fill-color", "#EEE7DB"],
    building: ["fill-color", "#E4DACA"],
    waterway: ["line-color", "#9DCBEB"],
  };
  for (const [id, [prop, value]] of Object.entries(paint)) {
    try {
      if (map.getLayer(id)) map.setPaintProperty(id, prop, value);
    } catch {}
  }
  for (const l of map.getStyle().layers) {
    if (l.type !== "symbol" || !map.getLayoutProperty(l.id, "text-field")) continue;
    try {
      // подписи по-русски, а не латиницей, и чуть спокойнее
      map.setLayoutProperty(l.id, "text-field", ["coalesce", ["get", "name:ru"], ["get", "name"]]);
      map.setPaintProperty(l.id, "text-color", "#8A8173");
      map.setPaintProperty(l.id, "text-halo-color", "#F7F3EC");
    } catch {}
  }
  // объёмные дома
  try {
    map.addLayer(
      {
        id: "building-3d",
        type: "fill-extrusion",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 14,
        paint: {
          "fill-extrusion-color": "#EBE3D6",
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], 8],
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 0.92,
        },
      },
      map.getLayer("waterway_line_label") ? "waterway_line_label" : undefined
    );
  } catch {}
}

export function TourMap({
  stops,
  legs,
  hover,
  onHover,
  focus,
  playing,
  onPlayStop,
  onPlayEnd,
  pad,
  w,
  h,
}: {
  stops: number[];
  legs: Legs;
  hover: number | null;
  onHover: (i: number | null) => void;
  focus: number | null;
  playing: boolean;
  onPlayStop: (i: number) => void;
  onPlayEnd: () => void;
  pad: Pad;
  w: number;
  h: number;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const mlRef = useRef<typeof import("maplibre-gl") | null>(null);
  const markers = useRef<Marker[]>([]);
  const route = useRef<{ coords: LngLat[]; stopAt: number[] }>({ coords: [], stopAt: [] });
  const cb = useRef({ onHover, onPlayStop, onPlayEnd });
  cb.current = { onHover, onPlayStop, onPlayEnd };
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);
  const [seen, setSeen] = useState(false);

  const padS = (): Pad => ({ top: pad.top / S, bottom: pad.bottom / S, left: pad.left / S, right: pad.right / S });
  const fit = (duration = 1100) => {
    const map = mapRef.current;
    const ml = mlRef.current;
    const coords = route.current.coords;
    if (!map || !ml || !coords.length) return;
    const b = new ml.LngLatBounds();
    coords.forEach((c) => b.extend(c));
    const cam = map.cameraForBounds(b, { padding: padS(), bearing: VIEW.bearing, maxZoom: 15.6 });
    if (cam) map.easeTo({ ...cam, pitch: VIEW.pitch, bearing: VIEW.bearing, duration });
  };

  // плотность пикселей следует за масштабом холста: отдалили — рисуем дешевле, приблизили — чётко
  const pixelRatio = () => {
    const world = outer.current?.closest<HTMLElement>(".st-world");
    const z = world ? parseFloat(getComputedStyle(world).getPropertyValue("--z")) || 1 : 1;
    return Math.min(3, (window.devicePixelRatio || 1) * Math.min(1.75, Math.max(0.4, z)) * S);
  };
  useEffect(() => {
    const world = outer.current!.closest<HTMLElement>(".st-world");
    if (!world || !ready) return;
    let t = 0;
    let last = 0;
    const apply = () => {
      const pr = pixelRatio();
      if (Math.abs(pr - last) > 0.05) {
        last = pr;
        mapRef.current?.setPixelRatio(pr);
      }
    };
    const mo = new MutationObserver(() => (clearTimeout(t), (t = window.setTimeout(apply, 160))));
    mo.observe(world, { attributes: true, attributeFilter: ["style"] });
    return () => {
      mo.disconnect();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  // карта поднимается, только когда борд впервые попал в кадр
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setSeen(true), { rootMargin: "400px" });
    io.observe(outer.current!);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!seen) return;
    let dead = false;
    import("maplibre-gl").then((mod) => {
      if (dead || !inner.current) return;
      const ml = mod.default;
      mlRef.current = mod;
      const map = new ml.Map({
        container: inner.current,
        style: STYLE,
        center: CENTER,
        zoom: VIEW.zoom,
        pixelRatio: pixelRatio(),
        pitch: VIEW.pitch,
        bearing: VIEW.bearing,
        maxPitch: 70,
        attributionControl: { compact: true },
        fadeDuration: 0,
      });
      map.scrollZoom.disable();
      map.dragPan.disable();
      map.dragRotate.disable();
      map.on("load", () => {
        restyle(map);
        const empty = { type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: [] } };
        map.addSource("route", { type: "geojson", data: empty });
        map.addSource("trail", { type: "geojson", data: empty });
        map.addLayer({ id: "route-glow", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#1771D9", "line-width": 22, "line-opacity": 0.14, "line-blur": 6 } });
        map.addLayer({ id: "route-casing", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#fff", "line-width": 10 } });
        map.addLayer({ id: "route", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#1771D9", "line-width": 5 } });
        // пройденная часть при «прогулке»
        map.addLayer({ id: "trail", type: "line", source: "trail", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#EE5D5C", "line-width": 6 } });
        setReady(true);
      });
      mapRef.current = map;
    });
    return () => {
      dead = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [seen]);

  // маршрут: метки, линия с прорисовкой, охват
  useEffect(() => {
    const map = mapRef.current;
    const ml = mlRef.current;
    if (!ready || !map || !ml) return;
    markers.current.forEach((m) => m.remove());
    markers.current = stops.map((id, i) => {
      const p = PLACES[id];
      const el = document.createElement("div");
      el.className = "tb-mk";
      el.style.setProperty("--c", KIND_COLOR[p.kind]);
      el.style.setProperty("--i", String(i));
      el.innerHTML = `<i>${i + 1}</i><span><b>${p.name}</b><small>${p.tag} · ${p.time}</small></span>`;
      el.addEventListener("pointerenter", () => cb.current.onHover(i));
      el.addEventListener("pointerleave", () => cb.current.onHover(null));
      return new ml.Marker({ element: el, anchor: "center" }).setLngLat([p.lon, p.lat]).addTo(map);
    });

    const coords: LngLat[] = [];
    const stopIdx = [0];
    for (let i = 1; i < stops.length; i++) {
      const seg = legOf(legs, stops[i - 1], stops[i]).line.map(([lat, lon]) => [lon, lat] as LngLat);
      coords.push(...(i > 1 ? seg.slice(1) : seg));
      stopIdx.push(coords.length - 1);
    }
    const cum = [0];
    for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + dist(coords[i - 1], coords[i]));
    route.current = { coords, stopAt: stopIdx.map((i) => cum[i] ?? 0) };

    const src = map.getSource("route") as unknown as { setData: (d: unknown) => void };
    (map.getSource("trail") as unknown as { setData: (d: unknown) => void }).setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } });
    let raf = 0;
    const t0 = performance.now();
    const draw = (now: number) => {
      const f = Math.min(1, (now - t0) / 1600);
      const n = Math.max(2, Math.round(coords.length * (1 - Math.pow(1 - f, 3))));
      src.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords.slice(0, n) } });
      if (f < 1) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    fit(1000);
    return () => cancelAnimationFrame(raf);
    // fit читает актуальные значения через ref-ы
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, stops, legs]);

  useEffect(() => {
    markers.current.forEach((m, i) => m.getElement().classList.toggle("is-on", i === hover));
  }, [hover, stops]);

  // приблизиться к точке из списка
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || playing) return;
    if (focus === null) return;
    const p = PLACES[stops[focus]];
    if (!p) return;
    map.easeTo({ center: [p.lon, p.lat], zoom: 16, pitch: 56, bearing: VIEW.bearing + 10, padding: padS(), duration: 1100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, ready]);

  // «пройти маршрут»: камера едет по улицам за точкой-туристом
  useEffect(() => {
    const map = mapRef.current;
    const ml = mlRef.current;
    if (!playing || !ready || !map || !ml) return;
    const { coords, stopAt } = route.current;
    if (coords.length < 2) return;
    const cum = [0];
    for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + dist(coords[i - 1], coords[i]));
    const total = cum[cum.length - 1];
    const dur = Math.min(26000, Math.max(9000, total * 3.2));
    const el = document.createElement("div");
    el.className = "tb-walker";
    const walker = new ml.Marker({ element: el }).setLngLat(coords[0]).addTo(map);
    const trail = map.getSource("trail") as unknown as { setData: (d: unknown) => void };
    const at = (d: number): [LngLat, number] => {
      let i = 1;
      while (i < cum.length - 1 && cum[i] < d) i++;
      const f = (d - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
      const [a, b] = [coords[i - 1], coords[i]];
      return [[a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], i];
    };
    let raf = 0;
    let t0 = 0;
    let bearing = map.getBearing();
    let next = 0;
    const frame = (now: number) => {
      if (!t0) t0 = now;
      const f = Math.min(1, (now - t0) / dur);
      const d = f * total;
      const [pos, i] = at(d);
      const [ahead] = at(Math.min(total, d + 90));
      const target = heading(pos, ahead);
      let diff = ((target - bearing + 540) % 360) - 180;
      if (Math.abs(diff) < 0.5) diff = 0;
      bearing += diff * 0.05;
      map.jumpTo({ center: pos, zoom: 16.2, pitch: 60, bearing, padding: padS() });
      walker.setLngLat(pos);
      trail.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [...coords.slice(0, i), pos] } });
      while (next < stopAt.length && stopAt[next] <= d + 1) cb.current.onPlayStop(next++);
      if (f < 1) raf = requestAnimationFrame(frame);
      else cb.current.onPlayEnd();
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      walker.remove();
      trail.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } });
      fit(1400);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, ready]);

  // «взять» карту: колесо и перетаскивание переходят к ней, пока курсор над картой
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (active) {
      map.scrollZoom.enable();
      map.dragPan.enable();
      map.dragRotate.enable();
    } else {
      map.scrollZoom.disable();
      map.dragPan.disable();
      map.dragRotate.disable();
    }
    const el = outer.current!;
    const stop = (e: Event) => active && e.stopPropagation();
    el.addEventListener("wheel", stop);
    return () => el.removeEventListener("wheel", stop);
  }, [active, ready]);

  return (
    <div
      ref={outer}
      className={`tb-mapbox${active ? " is-active" : ""}`}
      style={{ width: w, height: h }}
      data-ui=""
      onPointerDown={(e) => active && e.stopPropagation()}
      onPointerLeave={() => setActive(false)}
      onClick={() => setActive(true)}
    >
      <div ref={inner} className="tb-mapbox__inner" style={{ width: w / S, height: h / S, transform: `scale(${S})` }} />
      <span className="tb-mapbox__hint">
        {active ? "Колесо — масштаб, тяни — двигай, правой кнопкой — поворот" : "Нажми на карту, чтобы её двигать"}
      </span>
      {!ready && <span className="tb-mapbox__load">Загружаем карту Тулы…</span>}
    </div>
  );
}
