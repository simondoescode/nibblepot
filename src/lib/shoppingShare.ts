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
export interface SharedShopping { v: 1; id: string; items: SharedShoppingItem[] }
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
  const link = origin + sharedShoppingPath() + '#list=' + encodeShareData({ v: 1, id: crypto.randomUUID(), items });
  if (!parseSharedShopping(new URL(link).hash)) throw new Error('Could not share this list. Use Copy list instead.');
  return link;
}

export function parseSharedShopping(hash: string): SharedShopping | null {
  const value = decodeShareData(hash, 'list') as SharedShopping;
  if (!value || value.v !== 1 || typeof value.id !== 'string' || !/^[a-f0-9-]{36}$/.test(value.id) ||
    !Array.isArray(value.items) || !value.items.length || value.items.length > 100) return null;
  const items: SharedShoppingItem[] = [];
  for (const item of value.items) {
    if (!item || typeof item !== 'object' || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 80 ||
      typeof item.quantity !== 'string' || item.quantity.length > 160 || typeof item.hint !== 'string' || item.hint.length > 160 ||
      typeof item.done !== 'boolean' || !SHOPPING_SECTIONS.includes(item.section)) return null;
    items.push({ name: item.name, quantity: item.quantity, section: item.section, done: item.done, hint: item.hint });
  }
  return { v: 1, id: value.id, items };
}
