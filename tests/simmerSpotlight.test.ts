import { describe, expect, it } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { chooseRandomRecipe, filterRecipes } from '../src/lib/recipes';
import { recipes } from '../src/data';

describe('Simmer spotlight catalogue', () => {
  it('ships the four reusable photographic backgrounds', () => {
    for (const name of ['golden-stone', 'cream-linen', 'honey-wood', 'navy-tartan']) {
      const file = resolve(process.cwd(), 'public', 'backgrounds', `${name}.webp`);
      expect(existsSync(file), `${name}.webp must be committed`).toBe(true);
      expect(statSync(file).size).toBeGreaterThan(1000);
    }
  });
  it('supports the complete recipe catalogue including illustrated fallbacks', () => {
    expect(recipes.length).toBeGreaterThan(1);
    expect(recipes.every(recipe => Boolean(recipe.id))).toBe(true);
  });
  it('avoids an immediate duplicate when other recipes exist', () => {
    const available = recipes;
    expect(available.length).toBeGreaterThan(1);
    for (const recipe of available) {
      expect(chooseRandomRecipe(available, recipe.id, () => 0).id).not.toBe(recipe.id);
    }
  });
  it('respects the current food and quick-meal filters', () => {
    const quick = filterRecipes(recipes, '', 'quick', [], []);
    expect(quick.every(recipe => recipe.mins <= 30)).toBe(true);
  });
  it('does not change legacy recipe identifiers used by saved plans', () => {
    expect(recipes.some(recipe => recipe.id === 'dahn')).toBe(true);
  });
});
