import { describe, expect, it } from 'vitest';
import { createWeekShareLink, parseSharedWeek } from '../src/lib/weekShare';
import { defaultWeek } from '../src/lib/weeklyPlan';
import { parseRoute } from '../src/lib/routes';
import type { WeekSlot } from '../src/types';

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
    const original = hash.slice(-1);
    const damaged = hash.slice(0, -1) + (original === 'A' ? 'B' : 'A');
    for (const bad of ['', '#plan=z.old', '#p=bad', '#p='+'a'.repeat(4000), '#p='+hash.slice(3), damaged]) {
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
