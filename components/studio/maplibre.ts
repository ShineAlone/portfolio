export async function loadMapLibre() {
  const maplibre = await import("maplibre-gl");
  maplibre.setWorkerUrl("/maplibre/worker-6.18.0.mjs");
  return maplibre;
}
