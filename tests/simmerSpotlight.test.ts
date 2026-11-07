import { describe, expect, it } from 'vitest';
import { chooseRandomRecipe, filterRecipes } from '../src/lib/recipes';
import { recipes } from '../src/data';

describe('Simmer spotlight catalogue', () => {
  it('has image-backed recipes to feature', () => {
    expect(recipes.some(recipe => Boolean(recipe.image))).toBe(true);
  });
  it('avoids an immediate duplicate when other recipes exist', () => {
    const available = recipes.filter(recipe => Boolean(recipe.image));
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
    expect(recipes.some(recipe => recipe.id === 'jacket')).toBe(true);
  });
});
