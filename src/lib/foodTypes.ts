import type { Recipe } from '../types';

export const foodTypes = [
  { id: 'all', label: 'All food' },
  { id: 'chicken', label: 'Chicken' },
  { id: 'beef', label: 'Beef' },
  { id: 'pork', label: 'Sausage & ham' },
  { id: 'fish', label: 'Fish' },
  { id: 'meat-free', label: 'Meat-free' },
  { id: 'vegan', label: 'Vegan-friendly' },
  { id: 'pasta', label: 'Pasta & noodles' },
  { id: 'rice', label: 'Rice' },
  { id: 'potatoes', label: 'Potatoes' },
] as const;
export type FoodType = typeof foodTypes[number]['id'];

const ingredientsByType = {
  chicken: ['chicken', 'cooked-chicken', 'chicken-mince'], beef: ['beef'], pork: ['sausages', 'ham'],
  fish: ['tuna', 'fish-fingers', 'salmon', 'white-fish'], pasta: ['pasta', 'noodles'],
  rice: ['rice'], potatoes: ['potatoes'],
};
/** Packaged stock, sauces and pasta need their labels checked by the cook.
 * Exclude all explicitly animal-derived ingredients, including optional toppings,
 * so the default recipe ingredients do not imply a vegan dish incorrectly.
 * Vegan-friendly is not a certification; see the picker guidance.
 */
const animalProducts = new Set(['cheese','butter','eggs','milk','cream-cheese','mayo','chicken','cooked-chicken','beef','sausages','ham','meatballs','tuna','fish-fingers','puff-pastry','stuffing-mix','gravy','chicken-mince','lamb-mince','diced-lamb','salmon','white-fish','yoghurt']);
export const dietaryFoodTypes: readonly FoodType[] = ['meat-free','vegan'];

const meatAndFish = new Set(['chicken', 'cooked-chicken', 'beef', 'sausages', 'ham', 'meatballs', 'tuna', 'fish-fingers', 'chicken-mince', 'lamb-mince', 'diced-lamb', 'salmon', 'white-fish']);

/** Categories can overlap: chicken pasta belongs to both Chicken and Pasta.
 * Match catalogue IDs rather than titles, and do not infer a meatball's meat.
 * Optional meat/fish still excludes a recipe from the meat-free category.
 */
export function matchesFoodType(recipe: Recipe, type: FoodType): boolean {
  if (type === 'all') return true;
  if (type === 'meat-free') return !recipe.ing.some(item=>meatAndFish.has(item.id));
  if (type === 'vegan') return !recipe.ing.some(item=>animalProducts.has(item.id));
  return recipe.ing.some(item=>ingredientsByType[type].includes(item.id));
}
