import type { Recipe } from '../types';

export const foodTypes = [
  { id: 'all', label: 'All food' },
  { id: 'chicken', label: 'Chicken' },
  { id: 'beef', label: 'Beef' },
  { id: 'pork', label: 'Sausage & ham' },
  { id: 'fish', label: 'Fish' },
  { id: 'meat-free', label: 'Meat-free' },
  { id: 'pasta', label: 'Pasta & noodles' },
  { id: 'rice', label: 'Rice' },
  { id: 'potatoes', label: 'Potatoes' },
] as const;
export type FoodType = typeof foodTypes[number]['id'];

const ingredientsByType = {
  chicken: ['chicken', 'cooked-chicken'], beef: ['beef'], pork: ['sausages', 'ham'],
  fish: ['tuna', 'fish-fingers'], pasta: ['pasta', 'noodles'],
  rice: ['rice'], potatoes: ['potatoes'],
};
const meatAndFish = new Set(['chicken', 'cooked-chicken', 'beef', 'sausages', 'ham', 'meatballs', 'tuna', 'fish-fingers']);

/** Categories can overlap: chicken pasta belongs to both Chicken and Pasta.
 * Match catalogue IDs rather than titles, and do not infer a meatball's meat.
 * Optional meat/fish still excludes a recipe from the meat-free category.
 */
export function matchesFoodType(recipe: Recipe, type: FoodType): boolean {
  if (type === 'all') return true;
  if (type === 'meat-free') return !recipe.ing.some(item=>meatAndFish.has(item.id));
  return recipe.ing.some(item=>ingredientsByType[type].includes(item.id));
}
