import { ingredients } from '../data';
import type { ShoppingEntry } from '../types';
import { shoppingPackHint, shoppingQuantity } from './quantities';
import { shoppingItemName } from './shopping';
import { basePath } from './routes';
import { decodeShareData, encodeShareData } from './shareCodec';

export const SHOPPING_SECTIONS = ['Cupboard', 'Fridge', 'Freezer', 'Other items'] as const;
export interface SharedShoppingItem {
  name: string;
  quantity: string;
  section: typeof SHOPPING_SECTIONS[number];
  done: boolean;
  hint: string;
}
export interface SharedShopping { v: 2; id: string; items: SharedShoppingItem[] }
export const sharedShoppingPath = () => basePath + 'shopping/shared/';

export function createShoppingShareLink(origin: string, shopping: ShoppingEntry[], servings: Record<string, number>, stock?: Record<string, string>): string {
  if (!shopping.length || shopping.length > 100) throw new Error('Share up to 100 items with a link. Use Copy list for longer lists.');
  const items: SharedShoppingItem[] = shopping.map(item => ({
    name: shoppingItemName(item),
    quantity: item.from.length || item.weekCounts ? shoppingQuantity(item, servings, stock) : '',
    section: ingredients[item.id]?.[1] ?? 'Other items',
    done: item.done,
    hint: shoppingPackHint(item, servings) ?? '',
  }));
  // Compact wire format: [ingredient ID, quantity, done, pack hint, custom name?].
  // Catalogue-backed names and sections need not be repeated in every shared URL.
  const compact = shopping.map((item, index) => [
    item.id, items[index].quantity, items[index].done ? 1 : 0, items[index].hint,
    ...(ingredients[item.id] ? [] : [items[index].name]),
  ]);
  const link = origin + sharedShoppingPath() + '#list=' + encodeShareData({ v: 2, id: crypto.randomUUID(), items: compact });
  if (!parseSharedShopping(new URL(link).hash)) throw new Error('Could not share this list. Use Copy list instead.');
  return link;
}

export function parseSharedShopping(hash: string): SharedShopping | null {
  const value = decodeShareData(hash, 'list') as {v?:number; id?:string; items?:unknown[]}|null;
  if(!value || value.v !== 2 || typeof value.id !== 'string' || !/^[a-f0-9-]{36}$/.test(value.id) ||
    !Array.isArray(value.items) || !value.items.length || value.items.length > 100) return null;
  const items: SharedShoppingItem[] = [];
  for(const row of value.items) {
    if(!Array.isArray(row) || row.length < 4 || row.length > 5) return null;
    const [id, quantity, done, hint, customName] = row;
    if(typeof id !== 'string' || id.length > 100 || typeof quantity !== 'string' || quantity.length > 160 ||
      (done !== 0 && done !== 1) || typeof hint !== 'string' || hint.length > 160) return null;
    const known = ingredients[id];
    if(!known && (!id.startsWith('custom:') || typeof customName !== 'string' ||
      !customName.trim() || customName.length > 80)) return null;
    if(known && row.length !== 4) return null;
    items.push({
      name: known ? known[0] : customName as string,
      quantity, done: done === 1, hint,
      section: known ? known[1] : 'Other items',
    });
  }
  return { v:2, id:value.id, items };
}
