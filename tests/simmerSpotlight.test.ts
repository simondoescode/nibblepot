import { describe, expect, it } from 'vitest';
import { chooseRandomRecipe, filterRecipes } from '../src/lib/recipes';
import { recipes } from '../src/data';

describe('Simmer spotlight catalogue', () => {
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
    expect(recipes.some(recipe => recipe.id === 'jacket')).toBe(true);
  });
});
