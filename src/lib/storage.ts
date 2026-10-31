import type { SavedData, ShoppingEntry, WeekSlot } from '../types';
import { ingredients, recipes } from '../data';
import { validMondayKey } from './weeklyPlan';

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
      .map(item => {
        const weekCounts: Record<string, number> = {};
        if (isObject(item.weekCounts)) for (const [id, count] of Object.entries(item.weekCounts)) {
          if (validRecipeIds.has(id) && typeof count === 'number' && Number.isInteger(count) && count >= 1 && count <= 7) {
            weekCounts[id] = count;
          }
        }
        return {
          id: String(item.id),
          done: item.done === true,
          from: Array.isArray(item.from)
            ? [...new Set(item.from.filter((id): id is string => typeof id === 'string' && validRecipeIds.has(id)))]
            : [],
          ...(Object.keys(weekCounts).length ? { weekCounts } : {}),
          ...(item.planGenerated === true ? { planGenerated: true } : {}),
        };
      })
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
  const weekPlans: Record<string, WeekSlot[]> = {};
  if (isObject(value.weekPlans)) {
    for (const [week, slots] of Object.entries(value.weekPlans).slice(-52)) {
      if (!validMondayKey(week) || !Array.isArray(slots) || slots.length !== 7) continue;
      const cleaned: WeekSlot[] = [];
      for (const slot of slots) {
        if (!isObject(slot)) break;
        if (slot.kind === 'recipe' && typeof slot.id === 'string' && validRecipeIds.has(slot.id)) {
          cleaned.push({ kind: 'recipe', id: slot.id });
        } else if (slot.kind === 'leftovers' || slot.kind === 'freezer' || slot.kind === 'empty') {
          cleaned.push({ kind: slot.kind });
        } else break;
      }
      if (cleaned.length === 7) weekPlans[week] = cleaned;
    }
  }
  return {
    ...(Object.keys(weekPlans).length ? { weekPlans } : {}),
    ...(isObject(value.shoppingPlan) && typeof value.shoppingPlan.week === 'string' &&
      validMondayKey(value.shoppingPlan.week) && typeof value.shoppingPlan.signature === 'string' &&
      value.shoppingPlan.signature.length > 0 && value.shoppingPlan.signature.length < 4096
      ? { shoppingPlan: { week: value.shoppingPlan.week, signature: value.shoppingPlan.signature } } : {}),
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
