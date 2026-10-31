import type { SavedData, ShoppingEntry } from '../types';
import { ingredients, recipes } from '../data';

// Keep the existing storage key: returning users retain their original demo data.
export const STORAGE_KEY = 'nibblepot-demo-v1';
export const DEFAULT_DATA: SavedData = {
  larder: ['potatoes', 'baked-beans', 'rice', 'pasta', 'chopped-tomatoes', 'eggs', 'cheese'],
  favorites: [],
  shopping: [],
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseSavedData(value: unknown): SavedData {
  if (!isObject(value) || !Array.isArray(value.larder)) {
    return { ...DEFAULT_DATA, larder: [...DEFAULT_DATA.larder], favorites: [], shopping: [] };
  }
  const validIngredientIds = new Set(Object.keys(ingredients));
  const validRecipeIds = new Set(recipes.map(recipe => recipe.id));
  const larder = [...new Set(value.larder.filter((id): id is string => typeof id === 'string' && validIngredientIds.has(id)))];
  const favorites = Array.isArray(value.favorites)
    ? [...new Set(value.favorites.filter((id): id is string => typeof id === 'string' && validRecipeIds.has(id)))]
    : [];
  const shopping: ShoppingEntry[] = Array.isArray(value.shopping)
    ? value.shopping.filter(isObject).filter(item => typeof item.id === 'string' && validIngredientIds.has(item.id))
      .map(item => ({
        id: String(item.id),
        done: item.done === true,
        from: Array.isArray(item.from)
          ? [...new Set(item.from.filter((id): id is string => typeof id === 'string' && validRecipeIds.has(id)))]
          : [],
      }))
    : [];
  // Invalid or unknown recipe serving settings are ignored rather than corrupting existing saves.
  const servings: Record<string, number> = {};
  if (isObject(value.servings)) {
    for (const [id, count] of Object.entries(value.servings)) {
      if (validRecipeIds.has(id) && typeof count === 'number' && Number.isInteger(count) && count >= 1 && count <= 8) {
        servings[id] = count;
      }
    }
  }
  return {
    larder, favorites, shopping: [...new Map(shopping.map(item => [item.id, item])).values()],
    ...(Object.keys(servings).length ? { servings } : {}),
  };
}

export function readSavedData(): SavedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return parseSavedData(raw ? JSON.parse(raw) : null);
  } catch {
    return parseSavedData(null);
  }
}

export function writeSavedData(data: SavedData): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* Private browsing or blocked storage */ }
}
