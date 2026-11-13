export type IngredientId = string;
export type RecipeId = string;
export type Tab = 'home' | 'favorites' | 'larder' | 'planner' | 'shopping' | 'settings';
export type Filter = 'all' | 'quick' | 'simple' | 'onepot' | 'larder';

export interface RecipeIngredient {
  id: IngredientId;
  /** Numeric recipe quantity for four servings. */
  amount: number;
  unit: 'each' | 'large' | 'g' | 'kg' | 'ml' | 'l' | 'tsp' | 'tbsp' | 'tin' | 'small tin' | 'slice' | 'clove' | 'cube' | 'sheet' | 'leaf';
  note?: 'dry';
  /** Optional toppings or accompaniments are excluded from shopping unless chosen. */
  optional?: boolean;
}

export interface Recipe {
  id: RecipeId;
  /** Human-readable, stable route segment. */
  slug: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  /** Local image relative to the Vite base (e.g. recipes/jacket.webp). */
  image?: string;
  mins: number;
  prepMins: number;
  cookMins: number;
  tags: Array<'budget' | 'batch-friendly' | 'freezer-friendly' | 'kid-friendly' | 'minimal-prep'>;
  ing: RecipeIngredient[];
  steps: string[];
  onePot: boolean;
  /** Specific preparation/food-safety caution, displayed with the recipe and cooking mode. */
  safety: string;
  /** Storage instructions (rice has stricter guidance than other leftovers). */
  storage: string;
  /** Explicit editorial review date for our recipes, not an automated certification. */
  reviewedOn: string;
}

export interface ShoppingEntry {
  id: IngredientId;
  customName?: string;
  done: boolean;
  from: RecipeId[];
  /** Planner-only contributions, counted per scheduled dinner. */
  weekCounts?: Record<RecipeId, number>;
  /** Distinguish generated list entries from manually added items. */
  planGenerated?: boolean;
}

export interface SavedData {
  larder: IngredientId[];
  /** Optional measured stock; legacy larder ticks remain supported. */
  larderQuantities?: Record<IngredientId, string>;
  /** User-entered use-by dates (YYYY-MM-DD); never infer food safety from these. */
  larderDates?: Record<IngredientId, string>;
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
