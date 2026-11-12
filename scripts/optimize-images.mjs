// Сжатие картинок сайта: всё из public/images переводится в WebP и уменьшается до размера,
// в котором реально показывается на холсте. Запуск: node scripts/optimize-images.mjs
// Скрипт можно запускать повторно — уже сжатые WebP он трогает, только если они больше лимита.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

sharp.cache(false);
const ROOT = "public/images";

// [часть пути, максимальная ширина, качество] — первое совпадение побеждает
const RULES = [
  ["wallpapers", 720, 76], // карточки поля обоев: 300–620 px, под курсором чуть крупнее
  ["social", 560, 78], // плитки сферы постов
  ["projects/forum", 1600, 80],
  ["projects", 1280, 80], // окна сайтов и коллажи: до 564 px на холсте, с запасом под приближение
  ["presentations", 1280, 78],
  ["posters", 1280, 78],
  ["cases", 1600, 76],
  ["scroll", 900, 82], // кадры крутящейся фигуры, с прозрачностью
  ["crew", 800, 82],
  ["", 1600, 82],
];
// уже готовые WebP пережимаем, только если они тяжелее этого порога
const WEBP_REPACK_OVER = 60 * 1024;

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(jpe?g|png|webp)$/i.test(e.name)) files.push(p);
  }
})(ROOT);

let before = 0;
let after = 0;
let changed = 0;
for (const file of files) {
  const rel = file.replace(/\\/g, "/");
  const size = fs.statSync(file).size;
  before += size;
  const isWebp = /\.webp$/i.test(file);
  if (isWebp && size < WEBP_REPACK_OVER) {
    after += size;
    continue;
  }
  const [, maxW, q] = RULES.find(([part]) => rel.includes(`/${part}`) || part === "");
  const input = fs.readFileSync(file);
  const meta = await sharp(input).metadata();
  let img = sharp(input);
  if (meta.width > maxW) img = img.resize({ width: maxW });
  const out = await img.webp({ quality: q, effort: 6, alphaQuality: 90 }).toBuffer();
  const target = file.replace(/\.(jpe?g|png|webp)$/i, ".webp");
  // пережатый WebP оставляем, только если он заметно легче исходного
  if (isWebp && out.length > size * 0.85) {
    after += size;
    continue;
  }
  fs.writeFileSync(target, out);
  if (target !== file) fs.unlinkSync(file);
  after += out.length;
  changed++;
}

const mb = (n) => (n / 1024 / 1024).toFixed(1);
console.log(`файлов: ${files.length}, изменено: ${changed}`);
console.log(`было ${mb(before)} МБ → стало ${mb(after)} МБ`);
