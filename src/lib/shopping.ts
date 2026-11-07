import { ingredientName } from '../data';
import type { ShoppingEntry } from '../types';

export const MAX_SHOPPING_ITEM_LENGTH = 80;

export function customShoppingItem(value: string): ShoppingEntry | null {
  const name = value.replace(/[\uD800-\uDFFF]/gu, '\uFFFD').replace(/\s+/g, ' ').trim();
  if (!name || name.length > MAX_SHOPPING_ITEM_LENGTH) return null;
  return { id: 'custom:' + name.toLowerCase(), customName: name, done: false, from: [] };
}

export function shoppingItemName(item: ShoppingEntry): string {
  return item.customName ?? ingredientName(item.id);
}
