export type IngredientId = string;
export type RecipeId = string;
export type Tab = 'home' | 'favorites' | 'larder' | 'shopping' | 'settings';
export type Filter = 'all' | 'quick' | 'simple' | 'onepot' | 'larder';

export interface RecipeIngredient {
  id: IngredientId;
  qty: string;
}

export interface Recipe {
  id: RecipeId;
  title: string;
  description: string;
  emoji: string;
  color: string;
  /** Local image relative to the Vite base (e.g. recipes/jacket.webp). */
  image?: string;
  mins: number;
  ing: RecipeIngredient[];
  steps: string[];
  onePot: boolean;
}

export interface ShoppingEntry {
  id: IngredientId;
  done: boolean;
  from: RecipeId[];
}

export interface SavedData {
  larder: IngredientId[];
  favorites: RecipeId[];
  shopping: ShoppingEntry[];
}

export interface RecipeModal {
  kind: 'random' | 'recipe';
  id: RecipeId;
}
