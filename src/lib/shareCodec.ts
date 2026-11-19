import LZString from 'lz-string';

/** URL-safe compression, including Unicode custom shopping names. */
export function encodeShareData(value: unknown): string {
  const json = JSON.stringify(value);
  if (json.length > 40_000) throw new Error('This list is too long for a share link. Use Copy list instead.');
  const encoded = 'z.' + LZString.compressToEncodedURIComponent(json).replaceAll('+', '~');
  if (encoded.length > 12_000) throw new Error('This list is too long for a share link. Use Copy list instead.');
  return encoded;
}

export function decodeShareData(hash: string, key: string, maxEncoded = 12_000, maxDecoded = 40_000): unknown {
  try {
    const token = new URLSearchParams(hash.replace(/^#/, '')).get(key);
    if (!token || token.length > maxEncoded || !token.startsWith('z.') || !/^[A-Za-z0-9~$-]+$/.test(token.slice(2))) return null;
    const json = LZString.decompressFromEncodedURIComponent(token.slice(2).replaceAll('~', '+'));
    if (!json || json.length > maxDecoded) return null;
    return JSON.parse(json);
  } catch { return null; }
}
