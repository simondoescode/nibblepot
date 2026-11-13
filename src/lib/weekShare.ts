import { recipes } from '../data';
import type { WeekSlot } from '../types';
import { basePath } from './routes';
import { validMondayKey } from './weeklyPlan';

export interface SharedWeek {
  v: 1;
  id: string;
  week: string;
  slots: WeekSlot[];
  servings: Record<string, number>;
}
export const sharedWeekPath = () => basePath + 'planner/shared/';
const recipeIds = new Set(recipes.map(recipe => recipe.id));

/** A self-contained snapshot: only this week's meals and serving counts leave the device. */
export function createWeekShareLink(origin: string, week: string, slots: WeekSlot[], servings: Record<string, number>): string {
  const counts: Record<string, number> = {};
  slots.forEach(slot => { if (slot.kind === 'recipe') counts[slot.id] = servings[slot.id] ?? 4; });
  const snapshot: SharedWeek = { v: 1, id: crypto.randomUUID(), week, slots: slots.map(slot => ({ ...slot })), servings: counts };
  const encoded = btoa(JSON.stringify(snapshot)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  if (!parseSharedWeek('#plan=' + encoded)) throw new Error('Invalid week plan');
  return origin + sharedWeekPath() + '#plan=' + encoded;
}

export function parseSharedWeek(hash: string): SharedWeek | null {
  try {
    const encoded = new URLSearchParams(hash.replace(/^#/, '')).get('plan');
    if (!encoded || encoded.length > 4000 || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
    const value = JSON.parse(atob(encoded.replaceAll('-', '+').replaceAll('_', '/'))) as SharedWeek;
    if (!value || value.v !== 1 || typeof value.id !== 'string' || !/^[a-f0-9-]{36}$/.test(value.id) ||
      typeof value.week !== 'string' || !validMondayKey(value.week) || !Array.isArray(value.slots) || value.slots.length !== 7 ||
      !value.servings || typeof value.servings !== 'object' || Array.isArray(value.servings)) return null;
    const slots: WeekSlot[] = [];
    const servings: Record<string, number> = {};
    for (const slot of value.slots) {
      if (!slot || typeof slot !== 'object') return null;
      if (slot.kind === 'recipe') {
        if (!recipeIds.has(slot.id)) return null;
        const count = value.servings[slot.id];
        if (!Number.isInteger(count) || count < 1 || count > 8) return null;
        slots.push({ kind: 'recipe', id: slot.id });
        servings[slot.id] = count;
      } else if (slot.kind === 'leftovers' || slot.kind === 'freezer' || slot.kind === 'empty') slots.push({ kind: slot.kind });
      else return null;
    }
    return { v: 1, id: value.id, week: value.week, slots, servings };
  } catch { return null; }
}
