// Ресайз изображений в public/images под реальные размеры отображения (с запасом 2x
// под retina). Оригиналы остаются в _materials — скрипт можно перезапускать безопасно.
import sharp from "sharp";
import { readdir, stat, rename, unlink } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("public/images");

// Максимальная ширина по секциям: плитка в вёрстке × 2 (retina) с запасом
const LIMITS = [
  { dir: "social", maxW: 640 }, // плитка 152px
  { dir: "wallpapers", maxW: 1200 }, // широкая плитка 291px, но обои скачивают — оставим запас
  { dir: "presentations", maxW: 800 }, // слайд 307px
  { dir: "projects", maxW: 1200 }, // колонка 470px
  { dir: ".", maxW: 1200 }, // photo.png (hero 470px)
];

const fmt = (b) => (b / 1024 / 1024).toFixed(2) + " MB";

let totalBefore = 0;
let totalAfter = 0;

for (const { dir, maxW } of LIMITS) {
  const abs = path.join(ROOT, dir);
  const files = (await readdir(abs, { withFileTypes: true }))
    .filter((e) => e.isFile() && /\.(jpe?g|png)$/i.test(e.name))
    .map((e) => path.join(abs, e.name));

  for (const file of files) {
    const before = (await stat(file)).size;
    const isPng = /\.png$/i.test(file);
    const tmp = file + ".tmp";

    const img = sharp(file);
    const meta = await img.metadata();
    const pipeline = img.resize({
      width: Math.min(meta.width ?? maxW, maxW),
      withoutEnlargement: true,
    });

    if (isPng) {
      await pipeline.png({ compressionLevel: 9, palette: false }).toFile(tmp);
    } else {
      await pipeline.jpeg({ quality: 80, mozjpeg: true }).toFile(tmp);
    }

    const after = (await stat(tmp)).size;
    if (after < before) {
      await unlink(file);
      await rename(tmp, file);
    } else {
      await unlink(tmp); // уже оптимален — оставляем как есть
    }
    totalBefore += before;
    totalAfter += Math.min(after, before);
  }
  console.log(`${dir}: done (${files.length} files)`);
}

console.log(`\nTotal: ${fmt(totalBefore)} -> ${fmt(totalAfter)}`);
