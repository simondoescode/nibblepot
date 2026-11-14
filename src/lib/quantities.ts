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
    'each': 'each', 'g': 'g', 'kg': 'kg', 'ml': 'ml', 'l': 'l', 'tsp': 'tsp', 'tbsp': 'tbsp',
    'tin': 'tin', 'tins': 'tin', 'small tin': 'small tin', 'small tins': 'small tin',
    'slices': 'slice', 'slice': 'slice', 'clove': 'clove', 'cloves': 'clove',
    'cube': 'cube', 'cubes': 'cube', 'large': 'large', 'dry': 'dry',
    'sheet': 'sheet', 'sheets': 'sheet', 'leaf': 'leaf', 'leaves': 'leaf', '': 'each',
  };
  // Existing "300g dry" is the same dry weight as "300g" in another recipe.
  const normalized = suffix === 'g dry' ? 'g' : suffix;
  if (!(normalized in units) || !Number.isFinite(value)) return { raw };
  const unit = units[normalized];
  return unit === 'kg' ? {value:value*1000,unit:'g',raw} : unit === 'l' ? {value:value*1000,unit:'ml',raw} : {value,unit,raw};
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
  if (unit === 'small tin') return count + (amount <= 1 ? ' small tin' : ' small tins');
  if (unit === 'leaf') return count + (amount <= 1 ? ' leaf' : ' leaves');
  return count + ' ' + (amount <= 1 ? unit : unit + 's');
}
/** Numeric ingredient measurements are canonical in the recipe catalogue. */
export function ingredientQuantity(ingredient: RecipeIngredient) {
  return ingredient.unit === 'kg' ? {value: ingredient.amount*1000, unit:'g'}
    : ingredient.unit === 'l' ? {value:ingredient.amount*1000, unit:'ml'}
    : {value:ingredient.amount, unit:ingredient.unit};
}
export function formatRecipeQuantity(ingredient: RecipeIngredient, servings: number): string {
  const parsed = ingredientQuantity(ingredient);
  return amountLabel(parsed.value * clampServings(servings) / BASE_SERVINGS, parsed.unit) + (ingredient.note ? ' ' + ingredient.note : '');
}

/** Combine compatible units while preserving distinct quantities (e.g. 4 large + 750 g potatoes). */
export function shoppingQuantity(entry: ShoppingEntry, servings: Record<string, number> = {}, stock?: Record<string, string>): string {
  const amounts = new Map<string, number>();
  const sourceIds = new Set([...entry.from, ...Object.keys(entry.weekCounts ?? {})]);
  for (const sourceId of sourceIds) {
    const recipe = recipes.find(item => item.id === sourceId);
    const ingredient = recipe?.ing.find(item => item.id === entry.id);
    if (!ingredient) continue;
    const p = ingredientQuantity(ingredient);
    amounts.set(p.unit, (amounts.get(p.unit) ?? 0) + p.value * Math.max(entry.from.includes(sourceId) ? 1 : 0, entry.weekCounts?.[sourceId] ?? 0) * clampServings(servings[sourceId] ?? BASE_SERVINGS) / BASE_SERVINGS);
  }
  const owned = stock?.[entry.id] ? parseQuantity(stock[entry.id]) : undefined;
  if (owned?.value !== undefined) {
    const needed = amounts.get(owned.unit);
    if (needed !== undefined) amounts.set(owned.unit, Math.max(0, needed - owned.value));
  }
  const formatted = [...amounts].filter(([,total])=>total>0).map(([unit, total]) => amountLabel(total, unit));
  return formatted.join(' + ') || (amounts.size ? 'Already in larder' : 'Quantity not set');
}

/**
 * Practical packaging advice, only for countable tins or ready-rolled sheets.
 * Never make up gram conversions between different tins/brands.
 */
export function shoppingPackHint(entry: ShoppingEntry, servings: Record<string, number> = {}): string | null {
  const quantities = new Map<string, number>();
  for (const id of new Set([...entry.from, ...Object.keys(entry.weekCounts ?? {})])) {
    const ingredient = recipes.find(r => r.id === id)?.ing.find(i => i.id === entry.id);
    if (!ingredient) continue;
    const parsed = ingredientQuantity(ingredient);
    if (parsed.value === undefined) return null;
    const factor = Math.max(entry.from.includes(id) ? 1 : 0, entry.weekCounts?.[id] ?? 0);
    quantities.set(parsed.unit, (quantities.get(parsed.unit) ?? 0) +
      parsed.value * factor * clampServings(servings[id] ?? BASE_SERVINGS) / BASE_SERVINGS);
  }
  if (quantities.size !== 1) return null;
  const [[unit, amount]] = [...quantities];
  if (!['tin', 'small tin', 'sheet'].includes(unit) || amount <= 0 || Number.isInteger(amount)) return null;
  const label = unit === 'sheet' ? 'pastry sheet' : unit === 'small tin' ? 'small tin' : 'tin';
  const count = Math.ceil(amount);
  return 'Buy ' + count + ' whole ' + (count === 1 ? label : label + 's') + '; check pack size';
}

/** Explain exact missing amounts when stock is measured, without inventing pack conversions. */
export function formatMissingAmount(item: RecipeIngredient, stock: string | undefined, servings = BASE_SERVINGS): string {
  const wanted = ingredientQuantity(item);
  const needed = wanted.value * clampServings(servings) / BASE_SERVINGS;
  const owned = stock ? parseQuantity(stock) : undefined;
  if (owned?.value !== undefined && owned.unit === wanted.unit)
    return amountLabel(Math.max(0, needed - owned.value), wanted.unit);
  return formatRecipeQuantity(item, servings);
}
