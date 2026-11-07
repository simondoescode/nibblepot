import { describe, expect, it } from 'vitest';
import { ingredients, recipes } from '../src/data';
import { addMissingIngredients, chooseRandomRecipe, filterRecipes, inLarder, missingRequired, useItUpRecipes, tescoSearchUrl } from '../src/lib/recipes';
import { DEFAULT_DATA, parseSavedData } from '../src/lib/storage';

describe('recipe catalogue', () => {
  it('has 40 recipes including all 16 original IDs with valid ingredient IDs', () => {
    expect(recipes).toHaveLength(40);
    for(const id of ['jacket','sausage-bean','chicken-rice','cottage','tuna-bake','tomato-pasta','egg-rice','quesadilla','mash','butter-stew','traybake','toasties','meatball','fish-butties','soup','chilli-jacket']) {
      expect(recipes.some(recipe=>recipe.id===id)).toBe(true);
    }
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
  it('only shows recipes with every required ingredient in the larder', () => {
    const pantry = ['potatoes', 'baked-beans', 'cheese', 'butter'];
    const matches = filterRecipes(recipes, '', 'larder', pantry);
    expect(matches.some(recipe => recipe.id === 'jacket')).toBe(true);
    expect(matches.every(recipe => missingRequired(recipe, pantry) === 0)).toBe(true);
    expect(inLarder(recipes.find(recipe => recipe.id === 'jacket')!, pantry)).toBe(4);
    expect(filterRecipes(recipes, '', 'larder', [])).toEqual([]);
    expect(filterRecipes(recipes, '', 'all', [])).toHaveLength(recipes.length);
  });
  it('ignores optional toppings when ranking dinner availability', () => {
    const sample = recipes.find(r => r.ing.some(i=>i.optional))!;
    const owned = sample.ing.filter(i=>!i.optional).map(i=>i.id);
    expect(missingRequired(sample,owned)).toBe(0);
  });
  it('recommends meals using soon-dated ingredients but not expired stock', () => {
    const suggestions = useItUpRecipes(recipes,['potatoes','baked-beans'],{potatoes:'2026-11-06','baked-beans':'2026-11-01'},'2026-11-04');
    expect(suggestions.some(recipe=>recipe.id==='jacket')).toBe(true);
    expect(useItUpRecipes(recipes,['potatoes'],{potatoes:'2026-11-03'},'2026-11-04')).toEqual([]);
    expect(useItUpRecipes(recipes,['potatoes'],{potatoes:'2026-12-01'},'2026-11-04')).toEqual([]);
  });
  it('restores valid use-by dates without changing legacy saves', () => {
    const data=parseSavedData({larder:['potatoes'],favorites:[],shopping:[],larderDates:{potatoes:'2026-11-06',eggs:'2026-11-06'}});
    expect(data.larderDates).toEqual({potatoes:'2026-11-06'});
    expect(parseSavedData({larder:[],favorites:[],shopping:[]}).larderDates).toBeUndefined();
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
