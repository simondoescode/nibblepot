import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { Script } from 'node:vm';

const root = new URL('../dist/', import.meta.url);
const get = path => readFile(new URL(path, root), 'utf8');

test('homepage has recipes, random dinner, favourites, larder and shopping', async () => {
  const html = await get('index.html');
  for (const name of ['nibblepot', 'data-random', 'favorites', 'larder', 'shopping', 'tesco.com']) {
    assert.ok(html.toLowerCase().includes(name.toLowerCase()), 'Missing ' + name);
  }
  assert.match(html, /rel="manifest" href="\.\/manifest\.webmanifest"/);
  assert.match(html, /serviceWorker\.register\('\.\/sw\.js'\)/);
});

test('inline application javascript parses', async () => {
  const html = await get('index.html');
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length, 'Expected inline app script');
  for (const [, script] of scripts) assert.doesNotThrow(() => new Script(script));
});

test('manifest and service worker use repository-relative paths', async () => {
  const manifest = JSON.parse(await get('manifest.webmanifest'));
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.deepEqual(manifest.icons.map(icon => icon.sizes), ['192x192', '512x512']);
  for (const icon of manifest.icons) assert.match(icon.src, /^\.\/icons\//);
  const sw = await get('sw.js');
  assert.doesNotMatch(sw, /__CACHE_VERSION__/);
  assert.match(sw, /event\.request\.mode === 'navigate'/);
  assert.match(sw, /\.\/icons\/icon-512\.png/);
});

test('build produces both correctly sized PNG app icons', async () => {
  for (const size of [192, 512]) {
    const png = await readFile(new URL('icons/icon-' + size + '.png', root));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
  assert.ok((await stat(new URL('icons/favicon.svg', root))).size > 100);
});
