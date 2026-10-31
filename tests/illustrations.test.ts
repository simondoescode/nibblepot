import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { recipes } from '../src/data';

const WEBP_MAX_BYTES = 250_000;

describe('illustrated recipe cards', () => {
  it('has unique local artwork for every recipe, including optimised WebP when configured', () => {
    const images = new Set<string>();
    const svgContents = new Set<string>();
    for (const recipe of recipes) {
      const path = recipe.image ?? `recipes/${recipe.id}.svg`;
      if (recipe.image) {
        expect(path).toBe(`recipes/${recipe.id}.webp`);
      } else {
        expect(path).toBe(`recipes/${recipe.id}.svg`);
      }
      expect(images.has(path), `${recipe.title}: repeated image path`).toBe(false);
      images.add(path);
      const file = `public/${path}`;
      expect(existsSync(file), `${recipe.title}: image missing`).toBe(true);
      if (recipe.image) {
        expect(statSync(file).size, `${recipe.title}: WebP exceeds 250,000 bytes`).toBeLessThanOrEqual(WEBP_MAX_BYTES);
        const image = readFileSync(file);
        expect(image.toString('ascii', 0, 4)).toBe('RIFF');
        expect(image.toString('ascii', 8, 12)).toBe('WEBP');
        expect(image.toString('ascii', 12, 16), `${recipe.id}: extended WebP header`).toBe('VP8X');
        expect(image[20] & 0x10, `${recipe.id}: missing alpha transparency`).toBe(0x10);
        expect(image.readUIntLE(24, 3) + 1, `${recipe.id}: width`).toBe(800);
        expect(image.readUIntLE(27, 3) + 1, `${recipe.id}: height`).toBe(504);
        // Alpha is encoded; review transparency edges and food styling visually.
      } else {
        const svg = readFileSync(file, 'utf8');
        expect(svg).toContain('<svg');
        expect(svg).toContain('viewBox="0 0 400 252"');
        expect(svg.replace('xmlns="http://www.w3.org/2000/svg"', '')).not.toMatch(/<image|https?:\/\//);
        expect(svgContents.has(svg), `${recipe.title}: duplicate SVG artwork`).toBe(false);
        svgContents.add(svg);
      }
    }
  });
});
