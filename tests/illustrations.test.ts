import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { recipes } from '../src/data';

describe('illustrated recipe cards', () => {
  it('has a unique self-contained vector illustration for every recipe', () => {
    const images = new Set<string>();
    for (const recipe of recipes) {
      const file = `public/recipes/${recipe.id}.svg`;
      expect(existsSync(file), `${recipe.title} missing illustration`).toBe(true);
      const svg = readFileSync(file, 'utf8');
      expect(svg).toContain('<svg');
      expect(svg).toContain('viewBox="0 0 400 252"');
      expect(svg.replace('xmlns="http://www.w3.org/2000/svg"', '')).not.toMatch(/<image|https?:\/\//); // No remote image references.
      images.add(svg);
    }
    expect(images.size).toBe(recipes.length);
  });
});
