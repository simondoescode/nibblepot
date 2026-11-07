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
const insideEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
// Every painted colour needs an explicit opaque alpha channel.
const hex = h => [...[1, 3, 5].map(i => Number.parseInt(h.slice(i, i + 2), 16)), 255];
function potIcon(size, maskable = false, opaque = false) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const dark = hex('#103b32'), yellow = hex('#103b32'), orange = hex('#f35b20');
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Draw at a fixed virtual 80x80 scale, independent of the PNG resolution.
      const scale = maskable ? .62 : 1;
      const xx = ((x + .5) * 80 / size - 40) / scale + 40;
      const yy = ((y + .5) * 80 / size - 40) / scale + 40;
      // Maskable icons have a full-bleed background and artwork inside the safe circle.
      let col = maskable || opaque ? yellow : [0, 0, 0, 0];
      if (insideRoundRect(xx, yy, 1, 1, 79, 79, 19)) col = dark;
      if (insideRoundRect(xx, yy, 3, 3, 77, 77, 17)) col = yellow;
      const halfWidth = 27 - Math.max(0, yy - 27) * .14;
      if (yy >= 24 && yy <= 70 && Math.abs(xx - 40) <= halfWidth + 2) col = dark;
      if (yy >= 28 && yy <= 67 && Math.abs(xx - 40) <= halfWidth - 2) col = orange;
      if (insideRoundRect(xx, yy, 8, 23, 72, 29, 3)) col = dark;
      // Simmer's pot is intentionally minimal rather than a character mascot.
      // Three soft steam strokes above the lid.
      if (yy >= 9 && yy < 22 && [29,40,51].some(cx => Math.abs(xx - (cx + Math.sin(yy * .38) * 2)) < 1.8)) col = hex('#fff7eb');
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
for (const size of [192, 512]) {
  // Keep original URLs working for older manifests and installed shortcuts.
  await writeFile(out(`icon-${size}.png`), potIcon(size));
  await writeFile(out(`icon-${size}-v2.png`), potIcon(size));
}
await writeFile(out('icon-maskable-512-v2.png'), potIcon(512, true));
await writeFile(out('apple-touch-180-v2.png'), potIcon(180, false, true));
console.log('Generated visible PWA, maskable and Apple touch icons');
