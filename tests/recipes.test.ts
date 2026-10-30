import { describe, expect, it } from 'vitest';
import { ingredients, recipes } from '../src/data';
import { addMissingIngredients, chooseRandomRecipe, filterRecipes, inLarder, tescoSearchUrl } from '../src/lib/recipes';
import { DEFAULT_DATA, parseSavedData } from '../src/lib/storage';

describe('recipe catalogue', () => {
  it('has all 16 original recipes with valid ingredient IDs', () => {
    expect(recipes).toHaveLength(16);
    expect(new Set(recipes.map(recipe => recipe.id)).size).toBe(recipes.length);
    for (const recipe of recipes) {
      expect(recipe.steps.length).toBeGreaterThan(0);
      expect(recipe.ing.length).toBeGreaterThan(0);
      for (const item of recipe.ing) expect(ingredients[item.id]).toBeDefined();
    }
  });
  it('searches recipe titles and ingredient names', () => {
    expect(filterRecipes(recipes, 'baked beans', 'all', []).some(recipe => recipe.id === 'jacket')).toBe(true);
    expect(filterRecipes(recipes, 'soY SAUCE', 'all', []).map(recipe => recipe.id)).toContain('egg-rice');
  });
  it('filters quick, simple, and one-pot recipes', () => {
    expect(filterRecipes(recipes, '', 'quick', []).every(recipe => recipe.mins <= 30)).toBe(true);
    expect(filterRecipes(recipes, '', 'simple', []).every(recipe => recipe.ing.length <= 5)).toBe(true);
    expect(filterRecipes(recipes, '', 'onepot', []).every(recipe => recipe.onePot)).toBe(true);
  });
  it('ranks meals by percentage of ingredients in the larder', () => {
    const pantry = ['potatoes', 'baked-beans', 'cheese', 'butter'];
    const matches = filterRecipes(recipes, '', 'larder', pantry);
    expect(matches[0].id).toBe('jacket');
    expect(inLarder(matches[0], pantry)).toBe(4);
  });
  it('does not roll the same recipe twice in a row', () => {
    const first = recipes[0];
    expect(chooseRandomRecipe(recipes, first.id, () => 0).id).not.toBe(first.id);
  });
});

describe('saved data migration and shopping', () => {
  it('preserves valid original saved-state data', () => {
    const saved = parseSavedData({ larder: ['rice', 'rice'], favorites: ['jacket'], shopping: [{ id: 'chicken', done: true, from: ['chicken-rice'] }] });
    expect(saved.larder).toEqual(['rice']);
    expect(saved.favorites).toEqual(['jacket']);
    expect(saved.shopping[0]).toEqual({ id: 'chicken', done: true, from: ['chicken-rice'] });
  });
  it('uses the starter larder only when saved state is missing or malformed', () => {
    expect(parseSavedData(null).larder).toEqual(DEFAULT_DATA.larder);
    expect(parseSavedData({ larder: [] }).larder).toEqual([]);
  });
  it('adds only missing ingredients and never duplicates shopping entries', () => {
    const recipe = recipes.find(r => r.id === 'sausage-bean')!;
    const pantry = { larder: ['baked-beans'], favorites: [], shopping: [] };
    const added = addMissingIngredients(recipe, pantry);
    expect(added.added).toBe(4);
    const again = addMissingIngredients(recipe, { ...pantry, shopping: added.shopping });
    expect(again.added).toBe(0);
    expect(again.shopping).toHaveLength(4);
  });
  it('encodes Tesco searches instead of claiming basket integration', () => {
    expect(tescoSearchUrl('baked-beans')).toContain('query=Baked%20beans');
  });
});
