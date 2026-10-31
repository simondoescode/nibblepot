import { recipes } from '../data';
import type { RecipeIngredient, ShoppingEntry } from '../types';

export const BASE_SERVINGS = 4;
export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 8;
export const clampServings = (value: number): number =>
  Number.isFinite(value) ? Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, Math.round(value))) : BASE_SERVINGS;

type ParsedQuantity = { value: number; unit: string; raw: string } | { raw: string; value?: never; unit?: never };

/** No speculative gram conversions for tins, whole potatoes or "a little". */
export function parseQuantity(text: string): ParsedQuantity {
  const raw = text.trim();
  const match = /^(\d+(?:\.\d+)?)\s*(.*)$/.exec(raw);
  if (!match) return { raw };
  const value = Number(match[1]);
  const suffix = match[2].toLowerCase().trim();
  const units: Record<string, string> = {
    'g': 'g', 'kg': 'kg', 'ml': 'ml', 'l': 'l', 'tsp': 'tsp', 'tbsp': 'tbsp',
    'tin': 'tin', 'tins': 'tin', 'small tin': 'small tin', 'small tins': 'small tin',
    'slices': 'slice', 'slice': 'slice', 'clove': 'clove', 'cloves': 'clove',
    'cube': 'cube', 'cubes': 'cube', 'large': 'large', 'dry': 'dry', '': 'each',
  };
  // Existing "300g dry" is the same dry weight as "300g" in another recipe.
  const normalized = suffix === 'g dry' ? 'g' : suffix;
  if (!(normalized in units) || !Number.isFinite(value)) return { raw };
  return { value, unit: units[normalized], raw };
}

function fraction(value: number): string {
  const rounded = Math.round(value * 4) / 4;
  const whole = Math.floor(rounded);
  const quarter = Math.round((rounded - whole) * 4);
  const fracs = ['', '¼', '½', '¾'];
  if (quarter === 0) return String(whole);
  return (whole ? whole + ' ' : '') + fracs[quarter];
}
function amountLabel(amount: number, unit: string): string {
  const count = fraction(amount);
  if (unit === 'each') return count;
  if (unit === 'g' || unit === 'kg' || unit === 'ml' || unit === 'l' || unit === 'tsp' || unit === 'tbsp') {
    return count + (['g', 'kg', 'ml', 'l'].includes(unit) ? ' ' : ' ') + unit;
  }
  if (unit === 'large') return count + ' large';
  if (unit === 'dry') return count + ' dry';
  if (unit === 'small tin') return count + (amount === 1 ? ' small tin' : ' small tins');
  return count + ' ' + (amount === 1 ? unit : unit + 's');
}
export function formatRecipeQuantity(ingredient: RecipeIngredient, servings: number): string {
  const parsed = parseQuantity(ingredient.qty);
  if (parsed.value === undefined) return parsed.raw;
  return amountLabel(parsed.value * clampServings(servings) / BASE_SERVINGS, parsed.unit);
}

/** Combine compatible units while preserving distinct quantities (e.g. 4 large + 750 g potatoes). */
export function shoppingQuantity(entry: ShoppingEntry, servings: Record<string, number> = {}): string {
  const amounts = new Map<string, number>();
  const unknown: string[] = [];
  const sourceIds = new Set([...entry.from, ...Object.keys(entry.weekCounts ?? {})]);
  for (const sourceId of sourceIds) {
    const recipe = recipes.find(item => item.id === sourceId);
    const ingredient = recipe?.ing.find(item => item.id === entry.id);
    if (!ingredient) continue;
    const p = parseQuantity(ingredient.qty);
    if (p.value === undefined) {
      if (!unknown.includes(p.raw)) unknown.push(p.raw);
      continue;
    }
    amounts.set(p.unit, (amounts.get(p.unit) ?? 0) + p.value * Math.max(entry.from.includes(sourceId) ? 1 : 0, entry.weekCounts?.[sourceId] ?? 0) * clampServings(servings[sourceId] ?? BASE_SERVINGS) / BASE_SERVINGS);
  }
  const formatted = [...amounts].map(([unit, total]) => amountLabel(total, unit));
  return [...formatted, ...unknown].join(' + ') || 'Quantity not set';
}
