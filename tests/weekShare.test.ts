import { describe, expect, it } from 'vitest';
import { createWeekShareLink, parseSharedWeek } from '../src/lib/weekShare';
import { defaultWeek } from '../src/lib/weeklyPlan';
import { parseRoute } from '../src/lib/routes';
import { encodeShareData } from '../src/lib/shareCodec';

const create = () => createWeekShareLink('https://example.com', '2026-11-09', defaultWeek(), { 'dahn': 2, '5sg6': 6, '65ej': 8 });
const encode = (value: unknown) => '#plan=' + encodeShareData(value);

describe('week share snapshots', () => {
  it('round-trips seven dated slots and only serving counts for the shared recipes', () => {
    const url = new URL(create());
    expect(parseRoute(url.pathname)).toEqual({ kind: 'shared-week' });
    expect(url.search).toBe('');
    expect(url.hash).toMatch(/^#plan=z\./);
    const plan = parseSharedWeek(url.hash)!;
    expect(plan.week).toBe('2026-11-09');
    expect(plan.slots).toEqual(defaultWeek());
    expect(plan.servings).toEqual({ 'dahn': 2, '5sg6': 6, 'ruxx': 4, '4khq': 4, 'gf6b': 4 });
    expect(Object.keys(plan).sort()).toEqual(['id', 'servings', 'slots', 'v', 'week']);
  });
  it('creates a unique link each time and keeps earlier snapshots unchanged', () => {
    const slots = defaultWeek();
    const servings = { 'dahn': 2 };
    const link = createWeekShareLink('https://example.com', '2026-11-09', slots, servings);
    expect(link).not.toBe(create());
    slots[0] = { kind: 'empty' }; servings['dahn'] = 8;
    const plan = parseSharedWeek(new URL(link).hash)!;
    expect(plan.slots[0]).toEqual({ kind: 'recipe', id: 'dahn' });
    expect(plan.servings['dahn']).toBe(2);
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
      encode({ ...valid, servings: { ...valid.servings, 'dahn': 9 } }),
      encode({ ...valid, servings: { ...valid.servings, 'dahn': 1.5 } })]) expect(parseSharedWeek(hash)).toBeNull();
  });
});
