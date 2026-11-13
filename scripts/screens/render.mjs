// Снимает scripts/screens/service-soft-2.html целиком и сохраняет как картинку для окна в «Проектах».
// Нужен установленный Microsoft Edge. Запуск: node scripts/screens/render.mjs
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const SRC = path.resolve("scripts/screens/service-soft-2.html");
const OUT = path.resolve("public/images/projects/service-soft-2-v2.webp");
const PORT = 9341;

const profile = mkdtempSync(path.join(tmpdir(), "ss2-"));
const proc = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`, "--hide-scrollbars", `--user-data-dir=${profile}`, "about:blank"]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ws;
for (let i = 0; i < 40; i++) {
  try {
    const page = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === "page");
    // ждём открытия сразу же: обработчик должен стоять до того, как соединение успеет открыться
    if (page) {
      ws = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise((r) => (ws.onopen = r));
      break;
    }
  } catch {}
  await sleep(250);
}
let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) pending.get(d.id)(d), pending.delete(d.id);
};
const send = (method, params = {}) => new Promise((r) => (pending.set(++id, r), ws.send(JSON.stringify({ id, method, params }))));

await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: pathToFileURL(SRC).href });
await sleep(2500);
const h = (await send("Runtime.evaluate", { expression: "document.body.scrollHeight", returnByValue: true })).result.result.value;
await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: h, deviceScaleFactor: 1, mobile: false });
await sleep(500);
const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1920, height: h, scale: 1 } });
ws.close();
proc.kill();

const png = Buffer.from(shot.result.data, "base64");
writeFileSync(path.join(profile, "preview.png"), await sharp(png).resize({ width: 960 }).png().toBuffer());
await sharp(png).resize({ width: 1200 }).webp({ quality: 82, effort: 6 }).toFile(OUT);
const meta = await sharp(OUT).metadata();
console.log(`готово: ${OUT} ${meta.width}×${meta.height}`);
process.exit(0);
