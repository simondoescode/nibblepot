export type IngredientId = string;
export type RecipeId = string;
export type Tab = 'home' | 'favorites' | 'larder' | 'shopping' | 'settings';
export type Filter = 'all' | 'quick' | 'simple' | 'onepot' | 'larder';

export interface RecipeIngredient {
  id: IngredientId;
  qty: string;
  /** Optional toppings or accompaniments are excluded from shopping unless chosen. */
  optional?: boolean;
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
  /** Per-recipe serving choices; original recipes are written for four. */
  servings?: Record<RecipeId, number>;
}

export interface RecipeModal {
  kind: 'random' | 'recipe';
  id: RecipeId;
}
