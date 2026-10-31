import { recipes } from '../data';
import type { SavedData, ShoppingEntry, WeekSlot } from '../types';

/** Local Monday, not UTC; avoid daylight-saving changes by anchoring at midday. */
export function mondayFor(date: Date): string {
  const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const delta = (noon.getDay() + 6) % 7;
  noon.setDate(noon.getDate() - delta);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${noon.getFullYear()}-${pad(noon.getMonth()+1)}-${pad(noon.getDate())}`;
}
export function validMondayKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [year, month, day] = key.split('-').map(Number);
  const d = new Date(year, month - 1, day, 12);
  return d.getFullYear() === year && d.getMonth() === month-1 && d.getDate() === day && d.getDay() === 1;
}
export function shiftWeek(key: string, weeks: number): string {
  if (!validMondayKey(key)) throw new Error('Invalid week');
  const [year, month, day] = key.split('-').map(Number);
  const d = new Date(year, month-1, day, 12);
  d.setDate(d.getDate() + weeks * 7);
  return mondayFor(d);
}
export const STARTER_PLAN: WeekSlot[] = [
  {kind:'recipe',id:'jacket'}, {kind:'recipe',id:'chicken-rice'},
  {kind:'recipe',id:'sausage-bean'}, {kind:'recipe',id:'cottage'},
  {kind:'recipe',id:'tuna-bake'}, {kind:'leftovers'}, {kind:'freezer'}
];
export const defaultWeek = (): WeekSlot[] => STARTER_PLAN.map(slot => ({...slot}));
export function shuffleWeek(slots: WeekSlot[], random = Math.random): WeekSlot[] {
  const used = new Set<string>();
  const available = recipes.map(x => x.id);
  // Keep special nights in their chosen positions. Each dinner has a distinct recipe.
  return slots.map(slot => {
    if (slot.kind !== 'recipe') return {...slot};
    const options = available.filter(id => !used.has(id));
    const id = options[Math.min(Math.floor(random()*options.length),options.length-1)];
    used.add(id);
    return {kind:'recipe',id};
  });
}
export function weekContributions(slots: WeekSlot[], larder: string[]): ShoppingEntry[] {
  const byIngredient = new Map<string, ShoppingEntry>();
  for (const slot of slots) {
    if (slot.kind !== 'recipe') continue;
    const recipe = recipes.find(item => item.id === slot.id);
    if (!recipe) continue;
    for (const ingredient of recipe.ing) {
      if (ingredient.optional || larder.includes(ingredient.id)) continue;
      const previous = byIngredient.get(ingredient.id);
      if (previous) {
        previous.weekCounts![recipe.id] = (previous.weekCounts![recipe.id] ?? 0) + 1;
      } else {
        byIngredient.set(ingredient.id, {
          id: ingredient.id, done: false, from: [],
          weekCounts: {[recipe.id]:1}, planGenerated:true
        });
      }
    }
  }
  return [...byIngredient.values()];
}
/** Replace only prior *planner* contributions. Keep hand-added shopping items/ticks. */
export function applyWeekToShopping(data: SavedData, slots: WeekSlot[]): SavedData {
  const manual: ShoppingEntry[] = data.shopping
    .filter(item => !(item.planGenerated && item.from.length === 0))
    .map(item => ({...item, from:[...item.from], weekCounts:undefined}));
  const byId = new Map(manual.map(item => [item.id, item]));
  for (const planned of weekContributions(slots,data.larder)) {
    const existing = byId.get(planned.id);
    if (existing) existing.weekCounts = planned.weekCounts;
    else {
      manual.push(planned);
      byId.set(planned.id,planned);
    }
  }
  return {...data, shopping:manual};
}
