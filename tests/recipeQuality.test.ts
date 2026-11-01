import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { ingredients, recipes } from '../src/data';
import { formatRecipeQuantity, parseQuantity, shoppingQuantity, shoppingPackHint } from '../src/lib/quantities';
import { recipePath, cookingPath } from '../src/lib/routes';

const originalIds = ['jacket','sausage-bean','chicken-rice','cottage','tuna-bake','tomato-pasta','egg-rice','quesadilla','mash','butter-stew','traybake','toasties','meatball','fish-butties','soup','chilli-jacket'];
describe('recipe quality gate', () => {
  it('preserves all original recipe IDs and has fourteen additions', () => {
    expect(recipes).toHaveLength(30);
    const ids = recipes.map(r => r.id);
    expect(new Set(ids).size).toBe(30);
    expect(ids.slice(0,16)).toEqual(originalIds);
    expect(ids.slice(16)).toHaveLength(14);
  });
  for (const recipe of recipes) {
    it('checks quantities, references and safety: ' + recipe.id, () => {
      expect(recipe.title.length).toBeGreaterThan(6);
      expect(recipe.mins).toBeGreaterThanOrEqual(10);
      expect(recipe.mins).toBeLessThanOrEqual(75);
      expect(recipe.steps.length).toBeGreaterThanOrEqual(3);
      expect(recipe.steps.every(step => step.length >= 35 && !/enough water for your rice/i.test(step))).toBe(true);
      expect(recipe.ing.length).toBeGreaterThanOrEqual(3);
      expect(recipe.ing.length).toBeLessThanOrEqual(7);
      expect(new Set(recipe.ing.map(i => i.id)).size).toBe(recipe.ing.length);
      expect(recipe.safety.length).toBeGreaterThan(32);
      expect(recipe.storage.length).toBeGreaterThan(65);
      expect(recipe.reviewedOn).toBe('2026-11-01');
      expect(recipePath(recipe.id)).toBe('/nibblepot/recipes/' + recipe.id + '/');
      expect(cookingPath(recipe.id)).toBe('/nibblepot/recipes/' + recipe.id + '/cook/');
      expect(existsSync('public/' + (recipe.image ?? 'recipes/' + recipe.id + '.svg'))).toBe(true);
      for(const item of recipe.ing) {
        expect(ingredients[item.id]).toBeDefined();
        const parsed = parseQuantity(item.qty);
        expect(parsed.value, recipe.id + '/' + item.id).toBeGreaterThan(0);
        expect(Number.isFinite(parsed.value)).toBe(true);
        expect(formatRecipeQuantity(item,1)).not.toMatch(/NaN|undefined/);
        expect(formatRecipeQuantity(item,8)).not.toMatch(/NaN|undefined/);
      }
    });
  }
  it('preserves compatible arithmetic and never invents tin conversions', () => {
    expect(shoppingQuantity({ id:'pasta', done:false, from:['tomato-pasta'], weekCounts:{'sausage-pasta':2} })).toBe('1050 g');
    expect(shoppingQuantity({ id:'chopped-tomatoes', done:false, from:[], weekCounts:{'chickpea-curry':1,'tomato-pasta':1} })).toBe('4 tins');
    const pastry = { id:'puff-pastry',done:false,from:['chicken-pie'] };
    expect(shoppingQuantity(pastry,{'chicken-pie':1})).toBe('¼ sheet');
    expect(shoppingPackHint(pastry,{'chicken-pie':1})).toContain('Buy 1 whole pastry sheet');
    expect(shoppingQuantity({id:'potatoes',done:false,from:['jacket','sausage-traybake']})).toBe('4 large + 800 g');
  });
  it('includes fourteen bundled offline illustrations', () => {
    for (const recipe of recipes.slice(16)) {
      const path='public/recipes/' + recipe.id + '.svg';
      const svg = readFileSync(path,'utf8');
      expect(svg).toContain('<svg ');
      expect(svg).toContain('<title ');
      expect(svg.length).toBeGreaterThan(300);
    }
  });
  it('shows the stricter chilled rice guidance whenever rice is used', () => {
    for (const recipe of recipes.filter(r => r.ing.some(i => i.id==='rice'))) {
      expect(recipe.storage).toContain('within one hour');
      expect(recipe.storage).toContain('24 hours');
      expect(recipe.storage).toContain('reheat only once');
    }
  });
});
