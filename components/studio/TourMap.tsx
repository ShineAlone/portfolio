"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { KIND_COLOR, PLACES, legOf, type Legs } from "./casesTour";

/*
 * Живая карта Тулы для кейса: MapLibre + векторные тайлы OpenFreeMap (данные OpenStreetMap),
 * без ключа и без рекламы. Маршрут — заранее посчитанные пешеходные отрезки.
 *
 * Карта лежит внутри холста, а холст масштабируется transform-ом — MapLibre этого не понимает
 * и путает координаты мыши. Поэтому внутренний контейнер растягивается на масштаб холста
 * и сжимается обратно scale(1/z): итоговый масштаб карты всегда 1:1 к экрану.
 * Пока карту не «взяли» кликом, колесо и перетаскивание остаются у холста.
 */

const STYLE = "https://tiles.openfreemap.org/styles/positron";
const CENTER: [number, number] = [37.612, 54.197];
const ZOOM = 13.4;

function restyle(map: MlMap) {
  const paint: Record<string, [string, string]> = {
    background: ["background-color", "#F4EFE6"],
    water: ["fill-color", "#A8D2EE"],
    park: ["fill-color", "#D3E8BE"],
    landcover_wood: ["fill-color", "#D3E8BE"],
    landuse_residential: ["fill-color", "#EFE8DC"],
    building: ["fill-color", "#E6DDCD"],
    waterway: ["line-color", "#A8D2EE"],
  };
  for (const [id, [prop, value]] of Object.entries(paint)) {
    try {
      if (map.getLayer(id)) map.setPaintProperty(id, prop, value);
    } catch {}
  }
  // подписи по-русски, а не латиницей
  for (const l of map.getStyle().layers) {
    if (l.type !== "symbol" || !map.getLayoutProperty(l.id, "text-field")) continue;
    try {
      map.setLayoutProperty(l.id, "text-field", ["coalesce", ["get", "name:ru"], ["get", "name"]]);
    } catch {}
  }
}

export function TourMap({
  stops,
  legs,
  hover,
  onHover,
  w,
  h,
}: {
  stops: number[];
  legs: Legs;
  hover: number | null;
  onHover: (i: number | null) => void;
  w: number;
  h: number;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const k = useRef(1);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);

  // масштаб холста → размер внутреннего контейнера
  useEffect(() => {
    const world = outer.current!.closest<HTMLElement>(".st-world");
    const apply = () => {
      const z = world ? parseFloat(getComputedStyle(world).getPropertyValue("--z")) || 1 : 1;
      const nk = Math.min(2, Math.max(0.3, z));
      const el = inner.current!;
      if (Math.abs(nk - k.current) < 0.02 && el.style.width) return;
      const map = mapRef.current;
      // при смене размера сохраняем видимый охват: зум сдвигается на log2 отношения
      const dz = Math.log2(nk / k.current);
      k.current = nk;
      el.style.width = `${w * nk}px`;
      el.style.height = `${h * nk}px`;
      el.style.transform = `scale(${1 / nk})`;
      if (map) {
        map.resize();
        map.jumpTo({ zoom: map.getZoom() + dz });
      }
    };
    apply();
    let t = 0;
    const mo = world ? new MutationObserver(() => (clearTimeout(t), (t = window.setTimeout(apply, 140)))) : null;
    mo?.observe(world!, { attributes: true, attributeFilter: ["style"] });
    return () => {
      mo?.disconnect();
      clearTimeout(t);
    };
  }, [w, h]);

  // карта поднимается, только когда борд впервые попал в кадр
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setSeen(true), { rootMargin: "400px" });
    io.observe(outer.current!);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!seen) return;
    let dead = false;
    import("maplibre-gl").then(({ default: ml }) => {
      if (dead || !inner.current) return;
      const map = new ml.Map({
        container: inner.current,
        style: STYLE,
        center: CENTER,
        zoom: ZOOM + Math.log2(k.current),
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
        fadeDuration: 0,
      });
      map.scrollZoom.disable();
      map.dragPan.disable();
      map.touchZoomRotate.disableRotation();
      map.on("load", () => {
        restyle(map);
        map.addSource("route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } } });
        map.addLayer({ id: "route-casing", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#fff", "line-width": 11 } });
        map.addLayer({ id: "route", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#1771D9", "line-width": 6 } });
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
    if (!ready || !map) return;
    let raf = 0;
    import("maplibre-gl").then(({ default: ml }) => {
      markers.current.forEach((m) => m.remove());
      markers.current = stops.map((id, i) => {
        const p = PLACES[id];
        const el = document.createElement("div");
        el.className = "tb-mk";
        el.style.setProperty("--c", KIND_COLOR[p.kind]);
        el.style.setProperty("--i", String(i));
        el.innerHTML = `<b>${i + 1}</b><span>${p.name}<small>${p.tag} · ${p.time}</small></span>`;
        el.addEventListener("pointerenter", () => onHover(i));
        el.addEventListener("pointerleave", () => onHover(null));
        return new ml.Marker({ element: el, anchor: "bottom" }).setLngLat([p.lon, p.lat]).addTo(map);
      });

      const line: [number, number][] = [];
      for (let i = 1; i < stops.length; i++) {
        const seg = legOf(legs, stops[i - 1], stops[i]).line;
        line.push(...(i > 1 ? seg.slice(1) : seg));
      }
      const coords = line.map(([lat, lon]) => [lon, lat]);
      const src = map.getSource("route") as unknown as { setData: (d: unknown) => void };
      const t0 = performance.now();
      const draw = (now: number) => {
        const f = Math.min(1, (now - t0) / 1600);
        const e = 1 - Math.pow(1 - f, 3);
        const n = Math.max(2, Math.round(coords.length * e));
        src.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords.slice(0, n) } });
        if (f < 1) raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);

      const b = new ml.LngLatBounds();
      coords.forEach((c) => b.extend(c as [number, number]));
      if (!b.isEmpty()) map.fitBounds(b, { padding: 90 * k.current, duration: 900, maxZoom: 15.5 + Math.log2(k.current) });
    });
    return () => cancelAnimationFrame(raf);
    // onHover стабилен по смыслу — пересоздавать метки из-за него не нужно
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, stops, legs]);

  useEffect(() => {
    markers.current.forEach((m, i) => m.getElement().classList.toggle("is-on", i === hover));
  }, [hover, stops]);

  // «взять» карту: колесо и перетаскивание переходят к ней, пока курсор над картой
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (active) {
      map.scrollZoom.enable();
      map.dragPan.enable();
    } else {
      map.scrollZoom.disable();
      map.dragPan.disable();
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
      <div ref={inner} className="tb-mapbox__inner" />
      <span className="tb-mapbox__hint">{active ? "Колесо — масштаб, тяни — двигай" : "Нажми на карту, чтобы её двигать"}</span>
      {!ready && <span className="tb-mapbox__load">Загружаем карту Тулы…</span>}
    </div>
  );
}
