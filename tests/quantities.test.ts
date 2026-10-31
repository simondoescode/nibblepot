import { describe, expect, it } from 'vitest';
import { recipes } from '../src/data';
import { formatRecipeQuantity, shoppingQuantity, parseQuantity, clampServings } from '../src/lib/quantities';
import { addMissingIngredients } from '../src/lib/recipes';
import { parseSavedData } from '../src/lib/storage';

const find = (id: string) => recipes.find(recipe => recipe.id === id)!;
const shopping = (id: string, from: string[]) => ({ id, done: false, from });

describe('servings and shopping quantities', () => {
  it('scales grams, tins, single items and slices at different serving counts', () => {
    expect(formatRecipeQuantity(find('chicken-rice').ing[0], 2)).toBe('250 g');
    expect(formatRecipeQuantity(find('sausage-bean').ing[1], 2)).toBe('1 tin');
    expect(formatRecipeQuantity(find('toasties').ing[0], 6)).toBe('12 slices');
    expect(formatRecipeQuantity(find('sausage-bean').ing[0], 1)).toBe('2');
    expect(formatRecipeQuantity(find('tuna-bake').ing[4], 8)).toBe('500 ml');
  });
  it('keeps descriptive measurements rather than inventing precision', () => {
    expect(formatRecipeQuantity(find('toasties').ing[3], 8)).toBe('A little');
    expect(formatRecipeQuantity(find('fish-butties').ing[3], 2)).toBe('A few leaves');
    expect(parseQuantity('A little')).toEqual({ raw: 'A little' });
  });
  it('sums compatible quantities from several recipes without treating tins as grams', () => {
    expect(shoppingQuantity(shopping('pasta', ['tuna-bake', 'tomato-pasta']))).toBe('700 g');
    expect(shoppingQuantity(shopping('chopped-tomatoes', ['sausage-bean', 'tomato-pasta']))).toBe('3 tins');
    expect(shoppingQuantity(shopping('rice', ['chicken-rice', 'egg-rice']))).toBe('600 g');
    expect(shoppingQuantity(shopping('potatoes', ['jacket', 'cottage']))).toBe('4 large + 750 g');
  });
  it('responds to saved serving changes and does not duplicate recipe sources', () => {
    expect(shoppingQuantity(shopping('pasta', ['tuna-bake', 'tomato-pasta']), { 'tuna-bake': 2, 'tomato-pasta': 6 })).toBe('700 g');
    expect(shoppingQuantity(shopping('pasta', ['tuna-bake']), { 'tuna-bake': 2 })).toBe('175 g');
    const initial = { larder: [], favorites: [], shopping: [], servings: { 'jacket': 2 } };
    const first = addMissingIngredients(find('jacket'), initial);
    expect(first.shopping.map(x=>x.id)).toEqual(['potatoes', 'baked-beans']);
    const twice = addMissingIngredients(find('jacket'), { ...initial, shopping: first.shopping });
    expect(twice.added).toBe(0);
    expect(twice.shopping.find(x=>x.id === 'potatoes')?.from).toEqual(['jacket']);
    const withOptional = addMissingIngredients(find('jacket'), { ...initial, shopping: first.shopping }, ['cheese']);
    expect(withOptional.shopping.map(x=>x.id)).toContain('cheese');
    expect(shoppingQuantity(shopping('potatoes',['jacket']), initial.servings)).toBe('2 large');
  });
  it('preserves legacy saves, and validates new serving settings', () => {
    const legacy = parseSavedData({ larder: [], favorites: ['jacket'], shopping: [{ id: 'pasta', done: false, from: ['tuna-bake'] }] });
    expect(legacy.servings).toBeUndefined();
    expect(shoppingQuantity(legacy.shopping[0], legacy.servings)).toBe('350 g');
    const modern = parseSavedData({ ...legacy, servings: { jacket: 2, 'tuna-bake': 8, nope: 4, soup: 20 } });
    expect(modern.servings).toEqual({ jacket: 2, 'tuna-bake': 8 });
    expect(clampServings(999)).toBe(8);
  });
});
