import { describe, expect, it } from 'vitest';
import { createShoppingShareLink, parseSharedShopping } from '../src/lib/shoppingShare';
import { createWeekShareLink, parseSharedWeek } from '../src/lib/weekShare';
import { encodeShareData, decodeShareData } from '../src/lib/shareCodec';
import { defaultWeek } from '../src/lib/weeklyPlan';
import { parseRoute } from '../src/lib/routes';
import type { ShoppingEntry } from '../src/types';

const entries = (): ShoppingEntry[] => [
  { id: 'pasta', from: ['tomato-pasta'], done: false },
  { id: 'milk', from: [], done: true },
  { id: 'custom:café', customName: 'Café crème & 牛奶', from: [], done: false },
];
const create = () => createShoppingShareLink('https://example.com', entries(), { 'tomato-pasta': 2 }, { pasta: '100 g' });
const read = (link: string) => parseSharedShopping(new URL(link).hash)!;
const encode = (value: unknown) => '#list=' + encodeShareData(value);

describe('compressed shopping snapshots', () => {
  it('captures displayed stock-adjusted quantities, groups, custom Unicode names and purchased status', () => {
    const url = new URL(create());
    expect(parseRoute(url.pathname)).toEqual({ kind: 'shared-shopping' });
    expect(url.hash).toMatch(/^#list=z\./);
    expect(read(url.href).items).toEqual([
      { name: 'Pasta', quantity: '75 g', section: 'Cupboard', done: false, hint: '' },
      { name: 'Milk', quantity: '', section: 'Fridge', done: true, hint: '' },
      { name: 'Café crème & 牛奶', quantity: '', section: 'Other items', done: false, hint: '' },
    ]);
  });
  it('creates unique immutable snapshots and includes whole-pack guidance', () => {
    expect(create()).not.toBe(create());
    const list = entries();
    const link = createShoppingShareLink('https://example.com', list, {});
    list[0].done = true; list[2].customName = 'Changed';
    expect(read(link).items[0].done).toBe(false);
    expect(read(link).items[2].name).toBe('Café crème & 牛奶');
    const pastry = read(createShoppingShareLink('https://example.com', [{ id: 'puff-pastry', from: ['chicken-pie'], done: false }], { 'chicken-pie': 1 }));
    expect(pastry.items[0].hint).toContain('whole pastry sheet');
  });
  it('rejects invalid items, types, versions, sections and oversized lists', () => {
    const good = read(create());
    for (const value of [null, { ...good, v: 2 }, { ...good, items: [] }, { ...good, items: Array(101).fill(good.items[0]) },
      ...[{ name: 'x'.repeat(81) }, { done: 'true' }, { section: 'Elsewhere' }, { quantity: 20 }, { hint: null }].map(change => ({ ...good, items: [{ ...good.items[0], ...change }] }))]) {
      expect(parseSharedShopping(encode(value))).toBeNull();
    }
    expect(parseSharedShopping('#list=z.broken')).toBeNull();
    expect(() => createShoppingShareLink('https://example.com', [], {})).toThrow();
    expect(() => createShoppingShareLink('https://example.com', Array(101).fill(entries()[0]), {})).toThrow(/Copy list/);
  });
});

describe('URL compression', () => {
  it('makes realistic weekly and shopping payloads smaller than base64 JSON', () => {
    const week = parseSharedWeek(new URL(createWeekShareLink('https://example.com', '2026-11-09', defaultWeek(), {})).hash)!;
    const shopping = read(create());
    for (const value of [week, shopping]) {
      const token = encodeShareData(value);
      const oldLength = Buffer.from(JSON.stringify(value)).toString('base64url').length;
      expect(token.length).toBeLessThan(oldLength * 0.8);
      expect(decodeShareData('#data=' + token, 'data')).toEqual(value);
    }
  });
  it('retains every item in a larger list and fails clearly above encoding limits', () => {
    const items: ShoppingEntry[] = Array.from({ length: 100 }, (_, i) => ({ id: 'custom:' + i, customName: 'Family shopping item ' + i, from: [], done: false }));
    expect(read(createShoppingShareLink('https://example.com', items, {})).items).toHaveLength(100);
    expect(() => encodeShareData('x'.repeat(40_001))).toThrow(/too long/);
    expect(decodeShareData('#data=z.' + 'a'.repeat(12_001), 'data')).toBeNull();
    expect(decodeShareData('#data=' + btoa('{}'), 'data')).toBeNull();
  });
});
