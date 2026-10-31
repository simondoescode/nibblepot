export type IngredientId = string;
export type RecipeId = string;
export type Tab = 'home' | 'favorites' | 'larder' | 'planner' | 'shopping' | 'settings';
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
  /** Planner-only contributions, counted per scheduled dinner. */
  weekCounts?: Record<RecipeId, number>;
  /** Distinguish generated list entries from manually added items. */
  planGenerated?: boolean;
}

export interface SavedData {
  larder: IngredientId[];
  favorites: RecipeId[];
  shopping: ShoppingEntry[];
  /** Per-recipe serving choices; original recipes are written for four. */
  servings?: Record<RecipeId, number>;
  /** Per-Monday weekly meal plans. Unset weeks show a starter suggestion. */
  weekPlans?: Record<string, WeekSlot[]>;
  /** The week and planner inputs last used to populate the shopping list. */
  shoppingPlan?: { week: string; signature: string };
}

export interface RecipeModal {
  kind: 'random' | 'recipe';
  id: RecipeId;
}

export type WeekSlot = { kind: 'recipe'; id: RecipeId } | { kind: 'leftovers' | 'freezer' | 'empty' };
