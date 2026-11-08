import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = name => join(root, 'public', 'icons', name);
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
// Shared silhouette for the header, favicon and raster install icons.
const body = [[15, 41], [65, 41], [60, 62], [58, 66], [54, 70], [47, 71], [33, 71], [26, 70], [22, 66], [20, 62]];
const lid = [[10, 41], [70, 41]];
const steam = [32, 47].map(x => [[x, 30], [x - 2, 26], [x - 2, 23], [x + 2, 16], [x + 2, 11]]);
const brand = '#153c32';
const highlight = '#f5d2aa';
const path = points => points.map(([x, y], i) => (i === 0 ? 'M' : 'L') + x + ' ' + y).join(' ');
const mark = `<path fill="${highlight}" d="${path(body)} Z"/><path fill="none" stroke="${highlight}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" d="${[lid, ...steam].map(path).join(' ')}"/>`;
const hasFill = (x, y) => body.reduce((inside, [ax, ay], i) => {
  const [bx, by] = body[(i + 1) % body.length];
  const crosses = (ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax;
  return crosses ? !inside : inside;
}, false);
const segments = [lid, ...steam].flatMap(points => points.slice(1).map((end, i) => [points[i], end]));
const hasStroke = (x, y) => segments.some(([[ax, ay], [bx, by]]) => {
  const dx = bx - ax;
  const dy = by - ay;
  const progress = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return (x - ax - progress * dx) ** 2 + (y - ay - progress * dy) ** 2 <= 2.25 ** 2;
});
// Every painted colour needs an explicit opaque alpha channel.
const hex = h => [...[1, 3, 5].map(i => Number.parseInt(h.slice(i, i + 2), 16)), 255];
function potIcon(size, maskable = false, opaque = false) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const tile = hex(brand);
  const ink = hex(highlight);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const scale = maskable ? .82 : 1;
      const tileX = (x + .5) * 80 / size;
      const tileY = (y + .5) * 80 / size;
      const xx = (tileX - 40) / scale + 40;
      const yy = (tileY - 40) / scale + 40;
      let col = maskable || opaque || insideRoundRect(tileX, tileY, 1, 1, 79, 79, 19) ? tile : [0, 0, 0, 0];
      if (hasFill(xx, yy) || hasStroke(xx, yy)) col = ink;
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


await mkdir(out(''), { recursive: true });
const svg = contents => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">${contents}</svg>
`;
await writeFile(out('simmer-pot.svg'), svg(mark));
await writeFile(out('favicon.svg'), svg(`<rect width="80" height="80" rx="19" fill="${brand}"/>${mark}`));
for (const size of [192, 512]) {
  // Keep original URLs working for older manifests and installed shortcuts.
  await writeFile(out(`icon-${size}.png`), potIcon(size));
  await writeFile(out(`icon-${size}-v2.png`), potIcon(size));
  await writeFile(out(`icon-${size}-v3.png`), potIcon(size));
}
await writeFile(out('icon-maskable-512-v2.png'), potIcon(512, true));
await writeFile(out('apple-touch-180-v2.png'), potIcon(180, false, true));
await writeFile(out('icon-maskable-512-v3.png'), potIcon(512, true));
await writeFile(out('apple-touch-180-v3.png'), potIcon(180, false, true));
console.log('Generated visible PWA, maskable and Apple touch icons');
