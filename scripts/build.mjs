import { readFile, writeFile, copyFile, mkdir, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { deflateSync } from 'node:zlib';

const root = resolve(import.meta.dirname, '..');
const from = path => join(root, 'src', path);
const out = path => join(root, 'dist', path);

// Encode a small, crisp app icon in pure Node: no heavyweight build dependencies.
const makeCRC = bytes => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let n = 0; n < 8; n++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const label = Buffer.from(type);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(makeCRC(Buffer.concat([label, data])));
  return Buffer.concat([size, label, data, crc]);
};
const insideRoundRect = (x, y, x1, y1, x2, y2, r) => {
  if (x < x1 || x >= x2 || y < y1 || y >= y2) return false;
  const cx = Math.max(x1 + r, Math.min(x, x2 - r));
  const cy = Math.max(y1 + r, Math.min(y, y2 - r));
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};
const insideEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const hex = h => [1, 3, 5].map(i => Number.parseInt(h.slice(i, i + 2), 16));
function potIcon(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const dark = hex('#25231e'), yellow = hex('#ffd861'), orange = hex('#fc724e');
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Draw at a fixed virtual 80x80 scale, independent of the PNG resolution.
      const xx = (x + .5) * 80 / size, yy = (y + .5) * 80 / size;
      let col = [0, 0, 0, 0];
      if (insideRoundRect(xx, yy, 1, 1, 79, 79, 19)) col = dark;
      if (insideRoundRect(xx, yy, 3, 3, 77, 77, 17)) col = yellow;
      const halfWidth = 27 - Math.max(0, yy - 27) * .14;
      if (yy >= 24 && yy <= 70 && Math.abs(xx - 40) <= halfWidth + 2) col = dark;
      if (yy >= 28 && yy <= 67 && Math.abs(xx - 40) <= halfWidth - 2) col = orange;
      if (insideRoundRect(xx, yy, 8, 23, 72, 29, 3)) col = dark;
      if (insideEllipse(xx, yy, 31, 45, 3.3, 3.3) || insideEllipse(xx, yy, 51, 45, 3.3, 3.3)) col = dark;
      if (yy > 52 && yy < 62) {
        const smileY = 54 + 5 * (1 - ((xx - 41) / 9) ** 2);
        if (xx >= 33 && xx <= 49 && Math.abs(yy - smileY) < 1.5) col = dark;
      }
      const p = y * (size * 4 + 1) + 1 + x * 4;
      raw[p] = col[0]; raw[p + 1] = col[1]; raw[p + 2] = col[2]; raw[p + 3] = col[3];
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4);
  header[8] = 8; header[9] = 6; // 8-bit RGBA PNG
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', header), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]);
}

await rm(out(''), { recursive: true, force: true });
await mkdir(out('icons'), { recursive: true });
await copyFile(from('index.html'), out('index.html'));
await copyFile(from('manifest.webmanifest'), out('manifest.webmanifest'));
await copyFile(from('icons/favicon.svg'), out('icons/favicon.svg'));
const build = (process.env.GITHUB_SHA || 'local').slice(0, 12).replace(/[^a-zA-Z0-9_-]/g, '') || 'local';
await writeFile(out('sw.js'), (await readFile(from('sw.js'), 'utf8')).replaceAll('__CACHE_VERSION__', build));
for (const size of [192, 512]) await writeFile(out('icons/icon-' + size + '.png'), potIcon(size));
console.log('Built Nibblepot for GitHub Pages → dist/ (cache: ' + build + ')');
