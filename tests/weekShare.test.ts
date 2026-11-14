import { describe, expect, it } from 'vitest';
import { createWeekShareLink, parseSharedWeek, importSharedWeek, sharedWeekTitle } from '../src/lib/weekShare';
import { defaultWeek } from '../src/lib/weeklyPlan';
import { parseRoute } from '../src/lib/routes';
import type { SavedData, WeekSlot } from '../src/types';

const make = (slots = defaultWeek(), servings: Record<string, number> = {'dahn': 2, '5sg6': 6, '65ej': 8}) =>
  createWeekShareLink('https://simondoescode.github.io', '2026-11-09', slots, servings);
const read = (link: string) => parseSharedWeek(new URL(link).hash);

describe('compact self-contained week share links', () => {
  it('uses a fixed 39-character token and a readable short route', () => {
    const link = make();
    const url = new URL(link);
    expect(url.pathname).toBe('/nibblepot/plan/');
    expect(parseRoute(url.pathname)).toEqual({kind: 'shared-week'});
    expect(url.hash).toMatch(/^#p=[A-Za-z0-9_-]{39}$/);
    expect(link.length).toBeLessThan(95);
    expect(url.search).toBe('');
    expect(parseRoute('/nibblepot/planner/shared/')).toEqual({kind: 'not-found'});
  });
  it('round-trips all seven days and their quantities, including the week', () => {
    const plan = read(make())!;
    expect(plan.week).toBe('2026-11-09');
    expect(plan.v).toBe(2);
    expect(plan.id).toMatch(/^[0-9a-f]{8}$/);
    expect(plan.slots).toEqual(defaultWeek());
    expect(plan.servings).toEqual({'dahn': 2, '5sg6': 6, 'ruxx': 4, '4khq': 4, 'gf6b': 4});
  });
  it('creates distinct immutable links without storing any snapshot on a backend', () => {
    const slots = defaultWeek();
    const servings = {'dahn': 2};
    const link = make(slots, servings);
    expect(make(slots, servings)).not.toBe(link);
    slots[0] = {kind: 'empty'}; servings.dahn = 8;
    expect(read(link)?.slots[0]).toEqual({kind: 'recipe', id: 'dahn'});
    expect(read(link)?.servings.dahn).toBe(2);
  });
  it('supports all eight serving counts, duplicates and non-recipe nights', () => {
    const slots: WeekSlot[] = [
      {kind:'recipe',id:'dahn'}, {kind:'recipe',id:'dahn'}, {kind:'recipe',id:'5sg6'},
      {kind:'empty'}, {kind:'freezer'}, {kind:'leftovers'}, {kind:'recipe',id:'gf6b'},
    ];
    const plan = read(make(slots, {'dahn':1,'5sg6':8,'gf6b':5}));
    expect(plan?.slots).toEqual(slots);
    expect(plan?.servings).toEqual({'dahn':1,'5sg6':8,'gf6b':5});
    expect(read(make(slots, {'dahn':8,'5sg6':2,'gf6b':7}))?.servings.dahn).toBe(8);
  });
  it('rejects malformed, mutated, old-format and incomplete links', () => {
    const hash = new URL(make()).hash;
    const original = hash[15];
    const damaged = hash.slice(0, 15) + (original === 'A' ? 'B' : 'A') + hash.slice(16);
    for (const bad of ['', '#plan=z.old', '#p=bad', '#p='+'a'.repeat(4000), '#p='+hash.slice(4), damaged]) {
      expect(parseSharedWeek(bad),bad).toBeNull();
    }
    expect(() => make(defaultWeek().slice(1))).toThrow();
    expect(() => make(defaultWeek(), {'dahn':9})).toThrow();
    expect(() => make([{kind:'recipe',id:'xxxx'}, ...defaultWeek().slice(1)])).toThrow();
  });
  it('supports future weekly dates and rejects unsupported ancient dates', () => {
    const future = createWeekShareLink('https://example.com','2099-11-02',defaultWeek(),{});
    expect(read(future)?.week).toBe('2099-11-02');
    expect(() => createWeekShareLink('https://example.com','1999-12-27',defaultWeek(),{})).toThrow();
    expect(() => createWeekShareLink('https://example.com','2026-11-10',defaultWeek(),{})).toThrow();
  });
});

describe('adopt shared week', () => {
  it('imports only the selected week and leaves shopping, serving sizes and other saved data alone by default', () => {
    const plan = parseSharedWeek(new URL(make()).hash)!;
    const data: SavedData = { larder: ['rice'], favorites: ['dahn'], servings: { dahn: 6 },
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
    expect(plan.slots[0]).toEqual({ kind: 'recipe', id: 'dahn' });
  });
  it('optionally rebuilds planned shopping using the recipient’s larder while preserving extras and purchased items', () => {
    const plan = parseSharedWeek(new URL(make()).hash)!;
    const data: SavedData = { larder: ['potatoes'], favorites: [], servings: { dahn: 6 },
      shopping: [{ id: 'pasta', done: true, from: [] }, { id: 'custom:milk', customName: 'Milk', done: false, from: [] }] };
    const imported = importSharedWeek(data, plan, true);
    expect(imported.shoppingPlan?.week).toBe(plan.week);
    expect(imported.shopping.find(item => item.id === 'pasta')?.done).toBe(true);
    expect(imported.shopping.find(item => item.customName === 'Milk')).toEqual(data.shopping[1]);
    expect(imported.shopping.find(item => item.id === 'baked-beans')?.weekCounts).toEqual({ dahn: 1, 'ruxx': 1 });
    expect(imported.shopping.some(item => item.id === 'potatoes')).toBe(false);
    expect(imported.servings).toEqual({ dahn: 6 });
  });
});

describe('shared week headings', () => {
  it('labels nearby weeks against the recipient’s local calendar, including Sundays and year boundaries', () => {
    const sunday = new Date(2026, 10, 15, 23, 59);
    expect(sharedWeekTitle('2026-11-09', sunday)).toBe('This week’s dinners');
    expect(sharedWeekTitle('2026-11-16', sunday)).toBe('Next week’s dinners');
    expect(sharedWeekTitle('2026-11-02', sunday)).toBe('Last week’s dinners');
    expect(sharedWeekTitle('2026-11-23', sunday)).toBe('Dinners for the week of 23 Nov 2026');
    expect(sharedWeekTitle('2027-01-04', new Date(2027, 0, 3))).toBe('Next week’s dinners');
    expect(sharedWeekTitle('2026-10-26', new Date(2026, 9, 25))).toBe('Next week’s dinners');
  });
});
