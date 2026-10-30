import recipeData from './recipes.json';
import ingredientData from './ingredients.json';
import type { Recipe } from '../types';

export const recipes: Recipe[] = recipeData;
export const ingredients: Record<string, [string, 'Cupboard' | 'Fridge' | 'Freezer']> =
  ingredientData as Record<string, [string, 'Cupboard' | 'Fridge' | 'Freezer']>;

export const ingredientName = (id: string): string => ingredients[id]?.[0] ?? id;
