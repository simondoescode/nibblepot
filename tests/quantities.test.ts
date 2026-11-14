import { describe, expect, it } from 'vitest';
import { recipes } from '../src/data';
import { formatRecipeQuantity, shoppingQuantity, shoppingPackHint, parseQuantity, clampServings, formatMissingAmount } from '../src/lib/quantities';
import { addMissingIngredients } from '../src/lib/recipes';
import { parseSavedData } from '../src/lib/storage';

const find = (id: string) => recipes.find(recipe => recipe.id === id)!;
const shopping = (id: string, from: string[]) => ({ id, done: false, from });

describe('servings and shopping quantities', () => {
  it('scales grams, tins, single items and slices at different serving counts', () => {
    expect(formatRecipeQuantity(find('5sg6').ing[0], 2)).toBe('250 g');
    expect(formatRecipeQuantity(find('ruxx').ing[1], 2)).toBe('1 tin');
    expect(formatRecipeQuantity(find('0iaz').ing[0], 6)).toBe('12 slices');
    expect(formatRecipeQuantity(find('ruxx').ing[0], 1)).toBe('2');
    expect(formatRecipeQuantity(find('gf6b').ing[4], 8)).toBe('500 ml');
  });
  it('keeps descriptive measurements rather than inventing precision', () => {
    expect(formatRecipeQuantity(find('0iaz').ing[3], 8)).toBe('40 g');
    expect(formatRecipeQuantity(find('l4pm').ing[3], 2)).toBe('2 leaves');
    expect(formatRecipeQuantity(find('v8e7').ing.find(x=>x.id==='puff-pastry')!, 2)).toBe('½ sheet');
    expect(parseQuantity('A little')).toEqual({ raw: 'A little' });
    expect(shoppingPackHint(shopping('puff-pastry',['v8e7']),{'v8e7':2})).toBe('Buy 1 whole pastry sheet; check pack size');
    expect(shoppingPackHint(shopping('baked-beans',['dahn']),{'dahn':2})).toBeNull();
  });
  it('sums compatible quantities from several recipes without treating tins as grams', () => {
    expect(shoppingQuantity(shopping('pasta', ['gf6b', 'hdfl']))).toBe('700 g');
    expect(shoppingQuantity(shopping('chopped-tomatoes', ['ruxx', 'hdfl']))).toBe('3 tins');
    expect(shoppingQuantity(shopping('rice', ['5sg6', '41r8']))).toBe('600 g');
    expect(shoppingQuantity(shopping('potatoes', ['dahn', '4khq']))).toBe('4 large + 750 g');
  });
  it('responds to saved serving changes and does not duplicate recipe sources', () => {
    expect(shoppingQuantity(shopping('pasta', ['gf6b', 'hdfl']), { 'gf6b': 2, 'hdfl': 6 })).toBe('700 g');
    expect(shoppingQuantity(shopping('pasta', ['gf6b']), { 'gf6b': 2 })).toBe('175 g');
    const initial = { larder: [], favorites: [], shopping: [], servings: { 'dahn': 2 } };
    const first = addMissingIngredients(find('dahn'), initial);
    expect(first.shopping.map(x=>x.id)).toEqual(['potatoes', 'baked-beans']);
    const twice = addMissingIngredients(find('dahn'), { ...initial, shopping: first.shopping });
    expect(twice.added).toBe(0);
    expect(twice.shopping.find(x=>x.id === 'potatoes')?.from).toEqual(['dahn']);
    const withOptional = addMissingIngredients(find('dahn'), { ...initial, shopping: first.shopping }, ['cheese']);
    expect(withOptional.shopping.map(x=>x.id)).toContain('cheese');
    expect(shoppingQuantity(shopping('potatoes',['dahn']), initial.servings)).toBe('2 large');
  });
  it('converts compatible measured units and explains stock shortfalls', () => {
    expect(shoppingQuantity(shopping('pasta',['gf6b']), {}, {pasta:'0.1 kg'})).toBe('250 g');
    expect(formatMissingAmount(find('gf6b').ing[0], '0.1 kg', 4)).toBe('250 g');
    expect(shoppingQuantity(shopping('pasta',['gf6b']), {}, {pasta:'2 tins'})).toBe('350 g');
  });
  it('subtracts only matching measured stock without guessing unit conversions', () => {
    expect(shoppingQuantity(shopping('pasta',['gf6b']),{}, {pasta:'100 g'})).toBe('250 g');
    expect(shoppingQuantity(shopping('pasta',['gf6b']),{}, {pasta:'500 g'})).toBe('Already in larder');
    expect(shoppingQuantity(shopping('potatoes',['dahn','4khq']),{}, {potatoes:'2 large'})).toBe('2 large + 750 g');
    expect(shoppingQuantity(shopping('pasta',['gf6b']),{}, {pasta:'2 tins'})).toBe('350 g');
    const saved=parseSavedData({larder:['pasta'],favorites:[],shopping:[],larderQuantities:{pasta:'200 g',invalid:'3 g'}});
    expect(saved.larderQuantities).toEqual({pasta:'200 g'});
    const partial=addMissingIngredients(find('gf6b'),{...saved,shopping:[]});
    expect(partial.shopping.some(item=>item.id==='pasta')).toBe(true);
  });
  it('validates current saved servings and drops unknown IDs', () => {
    const legacy = parseSavedData({ larder: [], favorites: ['dahn'], shopping: [{ id: 'pasta', done: false, from: ['gf6b'] }] });
    expect(legacy.servings).toBeUndefined();
    expect(shoppingQuantity(legacy.shopping[0], legacy.servings)).toBe('350 g');
    const modern = parseSavedData({ ...legacy, servings: { 'dahn': 2, 'gf6b': 8, nope: 4, soup: 20 } });
    expect(modern.servings).toEqual({ 'dahn': 2, 'gf6b': 8 });
    expect(clampServings(999)).toBe(8);
  });
});
