import { describe, expect, it } from 'vitest';
import { createWeekShareLink, importSharedWeek, parseSharedWeek } from '../src/lib/weekShare';
import type { SavedData } from '../src/types';
import { defaultWeek } from '../src/lib/weeklyPlan';
import { parseRoute } from '../src/lib/routes';
import { encodeShareData } from '../src/lib/shareCodec';

const create = () => createWeekShareLink('https://example.com', '2026-11-09', defaultWeek(), { jacket: 2, 'chicken-rice': 6, 'beef-chilli': 8 });
const encode = (value: unknown) => '#plan=' + encodeShareData(value);

describe('week share snapshots', () => {
  it('imports only the selected week and leaves shopping, serving sizes and other saved data alone by default', () => {
    const plan = parseSharedWeek(new URL(create()).hash)!;
    const data: SavedData = { larder: ['rice'], favorites: ['jacket'], servings: { jacket: 6 },
      shopping: [{ id: 'pasta', done: true, from: [] }],
      weekPlans: { '2026-11-02': defaultWeek(), [plan.week]: Array.from({ length: 7 }, () => ({ kind: 'empty' })) } };
    const imported = importSharedWeek(data, plan, false);
    expect(imported.weekPlans?.[plan.week]).toEqual(plan.slots);
    expect(imported.weekPlans?.['2026-11-02']).toEqual(data.weekPlans?.['2026-11-02']);
    expect(imported.shopping).toBe(data.shopping);
    expect(imported.servings).toBe(data.servings);
    expect(imported.larder).toBe(data.larder);
    expect(imported.favorites).toBe(data.favorites);
    expect(data.weekPlans?.[plan.week][0]).toEqual({ kind: 'empty' });
    imported.weekPlans![plan.week][0] = { kind: 'freezer' };
    expect(plan.slots[0]).toEqual({ kind: 'recipe', id: 'jacket' });
  });
  it('optionally rebuilds planned shopping using the recipient’s larder while preserving extras and purchased items', () => {
    const plan = parseSharedWeek(new URL(create()).hash)!;
    const data: SavedData = { larder: ['potatoes'], favorites: [], servings: { jacket: 6 },
      shopping: [{ id: 'pasta', done: true, from: [] }, { id: 'custom:milk', customName: 'Milk', done: false, from: [] }] };
    const imported = importSharedWeek(data, plan, true);
    expect(imported.shoppingPlan?.week).toBe(plan.week);
    expect(imported.shopping.find(item => item.id === 'pasta')?.done).toBe(true);
    expect(imported.shopping.find(item => item.customName === 'Milk')).toEqual(data.shopping[1]);
    expect(imported.shopping.find(item => item.id === 'baked-beans')?.weekCounts).toEqual({ jacket: 1, 'sausage-bean': 1 });
    expect(imported.shopping.some(item => item.id === 'potatoes')).toBe(false);
    expect(imported.servings).toEqual({ jacket: 6 });
  });
  it('round-trips seven dated slots and only serving counts for the shared recipes', () => {
    const url = new URL(create());
    expect(parseRoute(url.pathname)).toEqual({ kind: 'shared-week' });
    expect(url.search).toBe('');
    expect(url.hash).toMatch(/^#plan=z\./);
    const plan = parseSharedWeek(url.hash)!;
    expect(plan.week).toBe('2026-11-09');
    expect(plan.slots).toEqual(defaultWeek());
    expect(plan.servings).toEqual({ jacket: 2, 'chicken-rice': 6, 'sausage-bean': 4, cottage: 4, 'tuna-bake': 4 });
    expect(Object.keys(plan).sort()).toEqual(['id', 'servings', 'slots', 'v', 'week']);
  });
  it('creates a unique link each time and keeps earlier snapshots unchanged', () => {
    const slots = defaultWeek();
    const servings = { jacket: 2 };
    const link = createWeekShareLink('https://example.com', '2026-11-09', slots, servings);
    expect(link).not.toBe(create());
    slots[0] = { kind: 'empty' }; servings.jacket = 8;
    const plan = parseSharedWeek(new URL(link).hash)!;
    expect(plan.slots[0]).toEqual({ kind: 'recipe', id: 'jacket' });
    expect(plan.servings.jacket).toBe(2);
  });
  it('retains empty, leftover and freezer nights, including repeated recipes', () => {
    const slots = defaultWeek(); slots[1] = slots[0]; slots[2] = { kind: 'empty' };
    const link = createWeekShareLink('https://example.com', '2026-11-09', slots, {});
    expect(parseSharedWeek(new URL(link).hash)?.slots).toEqual(slots);
  });
  it('rejects malformed, oversized, unknown-version, invalid-date and invalid-recipe links', () => {
    const valid = parseSharedWeek(new URL(create()).hash)!;
    for (const hash of ['', '#plan=??', '#plan='+'a'.repeat(4001), encode(null), encode({ ...valid, v: 2 }),
      encode({ ...valid, week: '2026-11-10' }), encode({ ...valid, week: '2026-02-30' }),
      encode({ ...valid, slots: valid.slots.slice(1) }),
      encode({ ...valid, slots: [{ kind: 'recipe', id: 'missing' }, ...valid.slots.slice(1)] }),
      encode({ ...valid, servings: { ...valid.servings, jacket: 9 } }),
      encode({ ...valid, servings: { ...valid.servings, jacket: 1.5 } })]) expect(parseSharedWeek(hash)).toBeNull();
  });
});
