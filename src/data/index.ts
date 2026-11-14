import recipeData from './recipes.json';
import ingredientData from './ingredients.json';
import type { Recipe } from '../types';

// Runtime shape is verified by npm run check:recipes before every build.
export const recipes: Recipe[] = recipeData as unknown as Recipe[];
export const ingredients: Record<string, [string, 'Cupboard' | 'Fridge' | 'Freezer']> =
  ingredientData as unknown as Record<string, [string, 'Cupboard' | 'Fridge' | 'Freezer']>;

export const ingredientName = (id: string): string => ingredients[id]?.[0] ?? id;
