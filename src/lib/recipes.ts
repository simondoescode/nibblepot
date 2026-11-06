import { ingredientName } from '../data';
import type { Filter, Recipe, SavedData, ShoppingEntry } from '../types';
import { shoppingQuantity } from './quantities';
import { matchesFoodType, type FoodType } from './foodTypes';

/** Only required ingredients affect whether dinner can be made. */
export const missingRequired = (recipe: Recipe, larder: readonly string[]) =>
  recipe.ing.filter(item => !item.optional && !larder.includes(item.id)).length;

export const inLarder = (recipe: Recipe, larder: readonly string[]) =>
  recipe.ing.filter(({ id }) => larder.includes(id)).length;

export function filterRecipes(recipes: readonly Recipe[], search: string, filter: Filter, larder: readonly string[], foodType: FoodType = 'all'): Recipe[] {
  const q = search.trim().toLocaleLowerCase('en-GB');
  let found = recipes.filter(recipe =>
    matchesFoodType(recipe, foodType) && (!q || [recipe.title, recipe.description, ...recipe.ing.map(({ id }) => ingredientName(id))]
      .join(' ').toLocaleLowerCase('en-GB').includes(q))
  );
  if (filter === 'quick') found = found.filter(recipe => recipe.mins <= 30);
  if (filter === 'simple') found = found.filter(recipe => recipe.ing.length <= 5);
  if (filter === 'onepot') found = found.filter(recipe => recipe.onePot);
  if (filter === 'larder') {
    found = [...found].sort((a, b) =>
      missingRequired(a, larder) - missingRequired(b, larder) ||
      a.mins - b.mins
    );
  }
  return found;
}

export function chooseRandomRecipe(recipes: readonly Recipe[], previousId?: string, random = Math.random): Recipe {
  if (!recipes.length) throw new Error('No recipes to choose from');
  const options = recipes.length > 1 ? recipes.filter(recipe => recipe.id !== previousId) : [...recipes];
  return options[Math.min(Math.floor(random() * options.length), options.length - 1)];
}

export function addMissingIngredients(
  recipe: Recipe, data: SavedData, optionalIds: readonly string[] = [],
): { shopping: ShoppingEntry[]; added: number } {
  const shopping = data.shopping.map(item => ({ ...item, from: [...item.from] }));
  const optional = new Set(optionalIds);
  let added = 0;
  for (const ingredient of recipe.ing) {
    if ((data.larder.includes(ingredient.id) && !data.larderQuantities?.[ingredient.id]) || (ingredient.optional && !optional.has(ingredient.id))) continue;
    if (shoppingQuantity({id:ingredient.id,done:false,from:[recipe.id]},data.servings,data.larderQuantities)==='Already in larder') continue;
    const existing = shopping.find(item => item.id === ingredient.id);
    if (existing) {
      if (!existing.from.includes(recipe.id)) existing.from.push(recipe.id);
    } else {
      shopping.push({ id: ingredient.id, done: false, from: [recipe.id] });
      added++;
    }
  }
  return { shopping, added };
}

export const tescoSearchUrl = (id: string) =>
  `https://www.tesco.com/shop/en-GB/search?query=${encodeURIComponent(ingredientName(id))}`;

export function useItUpRecipes(catalogue: readonly Recipe[], larder: readonly string[], dates: Record<string,string>, today: string): Recipe[] {
  const soon = new Set(Object.entries(dates).filter(([id,date]) => larder.includes(id) && date >= today && (Date.parse(date + 'T12:00:00Z') - Date.parse(today + 'T12:00:00Z')) / 86400000 <= 3).map(([id])=>id));
  return catalogue.filter(recipe=>recipe.ing.some(item=>!item.optional && soon.has(item.id)))
    .sort((a,b)=> b.ing.filter(item=>!item.optional && soon.has(item.id)).length - a.ing.filter(item=>!item.optional && soon.has(item.id)).length || missingRequired(a,larder)-missingRequired(b,larder) || a.mins-b.mins);
}
