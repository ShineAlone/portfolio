// Собирает автоматическую часть спокойной темы холста (app/v2/calm.gen.css) из app/v2/studio.css:
// для каждого правила с «игровыми» приёмами — чёрной обводкой, жёсткой тенью со сдвигом,
// жирным дисплейным шрифтом — выпускает переопределение под .th-calm.
// Запуск: node scripts/gen-calm-theme.mjs
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("app/v2/studio.css", "utf8").replace(/\r\n/g, "\n").replace(/\/\*[\s\S]*?\*\//g, "");
// город, машинка и эффекты езды остаются как есть
const SKIP = /st-city|st-car|st-fx|st-hud|st-ruin|st-shard|st-crack|st-joy|st-notice|st-agent|stg__car|st-map__car/;
const out = [];
let depth = 0;
let i = 0;
while (i < src.length) {
  const open = src.indexOf("{", i);
  if (open < 0) break;
  const close = src.indexOf("}", i);
  if (close >= 0 && close < open) {
    depth = Math.max(0, depth - 1);
    i = close + 1;
    continue;
  }
  const sel = src.slice(i, open).trim();
  if (sel.startsWith("@")) {
    // @media — заходим внутрь, @keyframes — пропускаем целиком
    if (sel.startsWith("@keyframes")) {
      let d = 1;
      let j = open + 1;
      while (d && j < src.length) {
        if (src[j] === "{") d++;
        if (src[j] === "}") d--;
        j++;
      }
      i = j;
    } else {
      depth++;
      i = open + 1;
    }
    continue;
  }
  const end = src.indexOf("}", open);
  const body = src.slice(open + 1, end);
  i = end + 1;
  if (depth || SKIP.test(sel) || !/\.st/.test(sel)) continue;
  const rules = [];
  const imp = (v) => (/!important/.test(v) ? " !important" : "");
  for (const decl of body.split(";")) {
    const m = decl.match(/^\s*([\w-]+)\s*:\s*([\s\S]+)$/);
    if (!m) continue;
    const [, prop, val] = m;
    if (/^border(-(top|bottom|left|right))?$/.test(prop) && /solid #111\b/.test(val)) rules.push(`${prop}-color: var(--calm-line)${imp(val)}`);
    if (prop === "border-color" && /#111\b/.test(val)) rules.push(`border-color: var(--calm-line)${imp(val)}`);
    if (prop === "box-shadow") {
      // жёсткая тень со сдвигом («наклейка») — убираем; чёрное кольцо — тонкая линия
      if (/-?\d+px -?\d+px 0 (-?\d+px )?#(111|000)\b/.test(val) && !/^0 0 0/.test(val.trim())) rules.push(`box-shadow: none${imp(val)}`);
      else if (/0 0 0 \d+(\.\d+)?px #111\b/.test(val) && !/var\(--z\)/.test(val)) rules.push(`box-shadow: 0 0 0 1px var(--calm-line)${imp(val)}`);
    }
    if (prop === "font-weight" && /^(700|800)/.test(val.trim()) && /font-family:\s*var\(--display\)/.test(body)) rules.push(`font-weight: 500`, `letter-spacing: -0.02em`);
    if (prop === "text-transform" && /uppercase/.test(val) && /var\(--display\)/.test(body)) rules.push(`text-transform: none`);
  }
  if (!rules.length) continue;
  const scoped = sel
    .split(",")
    .map((s) => `.th-calm ${s.trim()}`)
    .join(",\n");
  out.push(`${scoped} {\n  ${[...new Set(rules)].join(";\n  ")};\n}`);
}
writeFileSync(
  "app/v2/calm.gen.css",
  `/* Сгенерировано scripts/gen-calm-theme.mjs из studio.css — руками не править. */\n\n${out.join("\n\n")}\n`
);
console.log("rules:", out.length);
