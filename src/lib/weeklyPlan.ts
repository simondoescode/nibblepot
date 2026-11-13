import { recipes } from '../data';
import { shoppingQuantity } from './quantities';
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
export const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export function dateForWeekDay(week: string, index: number): Date {
  const [year, month, day] = week.split('-').map(Number);
  return new Date(year, month - 1, day + index, 12);
}

export function weekSlotTitle(slot: WeekSlot): string {
  if (slot.kind === 'recipe') return recipes.find(recipe => recipe.id === slot.id)?.title ?? 'Choose a meal';
  if (slot.kind === 'leftovers') return 'Leftovers night';
  if (slot.kind === 'freezer') return 'Freezer / easy night';
  return 'Choose a dinner';
}

export const STARTER_PLAN: WeekSlot[] = [
  {kind:'recipe',id:'dahn'}, {kind:'recipe',id:'5sg6'},
  {kind:'recipe',id:'ruxx'}, {kind:'recipe',id:'4khq'},
  {kind:'recipe',id:'gf6b'}, {kind:'leftovers'}, {kind:'freezer'}
];
export const defaultWeek = (): WeekSlot[] => STARTER_PLAN.map(slot => ({...slot}));
/** A weekly plan should reuse ingredients, not just optimise each dinner in isolation. */
export function shuffleWeek(slots: WeekSlot[], random = Math.random, larder: readonly string[] = []): WeekSlot[] {
  const selected = new Set<string>();
  const shared = new Set<string>();
  const catalogue = recipes.map(recipe => ({
    recipe,
    required: recipe.ing.filter(item => !item.optional).map(item => item.id),
  }));
  return slots.map(slot => {
    if (slot.kind !== 'recipe') return {...slot};
    const options = catalogue.filter(({recipe})=>!selected.has(recipe.id));
    if (!options.length) return {...slot};
    const scored = options.map(({recipe,required})=>{
      const missing = required.filter(id=>!larder.includes(id));
      const newItems = missing.filter(id=>!shared.has(id)).length;
      const overlap = missing.length-newItems;
      // Penalise new purchases; reuse previously selected ingredients as a tie-breaker.
      return {recipe,required,score:newItems*10 + missing.length*2 - overlap};
    });
    const best = Math.min(...scored.map(option=>option.score));
    const tied = scored.filter(option=>option.score===best);
    const picked = tied[Math.min(Math.floor(Math.max(0,random())*tied.length),tied.length-1)];
    selected.add(picked.recipe.id);
    picked.required.forEach(id=>{if(!larder.includes(id))shared.add(id);});
    return {kind:'recipe',id:picked.recipe.id};
  });
}
export function weekContributions(slots: WeekSlot[], larder: string[], stock: Record<string,string> = {}, servings: Record<string,number> = {}): ShoppingEntry[] {
  const byIngredient = new Map<string, ShoppingEntry>();
  for (const slot of slots) {
    if (slot.kind !== 'recipe') continue;
    const recipe = recipes.find(item => item.id === slot.id);
    if (!recipe) continue;
    for (const ingredient of recipe.ing) {
      if (ingredient.optional || (larder.includes(ingredient.id) && !stock[ingredient.id])) continue;
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
  return [...byIngredient.values()].filter(entry=>shoppingQuantity(entry,servings,stock)!=='Already in larder');
}
/** Track which inputs the shopper last confirmed; editing a plan never silently overwrites a list. */
export function shoppingPlanSignature(week: string, slots: WeekSlot[], larder: string[], servings: Record<string, number> = {}, stock: Record<string, string> = {}): string {
  const inPlan = [...new Set(slots.filter((slot): slot is Extract<WeekSlot, {kind:'recipe'}> => slot.kind === 'recipe')
    .map(slot => slot.id))].sort();
  const required = new Set(recipes.filter(recipe => inPlan.includes(recipe.id))
    .flatMap(recipe => recipe.ing.filter(item => !item.optional).map(item => item.id)));
  const quantities = Object.entries(stock).filter(([id, amount]) => required.has(id) && amount)
    .sort(([a], [b]) => a.localeCompare(b));
  const signature = [week, slots, [...larder].sort(), inPlan.map(id => [id, servings[id] ?? 4])];
  if (quantities.length) signature.push(quantities);
  return JSON.stringify(signature);
}
export function applyWeekToShopping(data: SavedData, slots: WeekSlot[], week?: string): SavedData {
  // Preserve purchased items when refreshing a plan: they remain visible and ticked.
  // Unchecked, planner-only items are rebuilt from the new plan.
  const manual: ShoppingEntry[] = data.shopping
    .filter(item => !(item.planGenerated && item.from.length === 0 && !item.done))
    .map(item => ({...item, from:[...item.from], weekCounts:item.done && item.planGenerated && item.from.length === 0 ? item.weekCounts : undefined}));
  const byId = new Map(manual.map(item => [item.id, item]));
  for (const planned of weekContributions(slots,data.larder,data.larderQuantities,data.servings)) {
    const existing = byId.get(planned.id);
    if (existing) existing.weekCounts = planned.weekCounts;
    else {
      manual.push(planned);
      byId.set(planned.id,planned);
    }
  }
  return {...data, shopping:manual, shoppingPlan: week ? {
    week, signature: shoppingPlanSignature(week,slots,data.larder,data.servings,data.larderQuantities),
  } : undefined};
}
