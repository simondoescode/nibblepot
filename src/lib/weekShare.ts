import { recipes } from '../data';
import type { WeekSlot } from '../types';
import { basePath } from './routes';
import { validMondayKey } from './weeklyPlan';

/**
 * Each shared week is self-contained: one version byte, two bytes for the week,
 * four random snapshot bytes, seven 24-bit meal slots, and a CRC-8 check byte.
 * A recipe slot encodes its four-character base36 ID (21 bits) and servings
 * (3 bits). Three reserved IDs represent empty / leftovers / freezer nights.
 * The result is a fixed 39-character URL-safe token, without a server.
 */
export interface SharedWeek {
  v: 2;
  id: string;
  week: string;
  slots: WeekSlot[];
  servings: Record<string, number>;
}
export const sharedWeekPath = () => basePath + 'plan/';

const EPOCH = Date.UTC(2000, 0, 3); // Monday
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ID_SPACE = 36 ** 4;
const LENGTH = 29;
const recipeIds = new Set(recipes.map(recipe => recipe.id));
const specialCodes: Record<'empty' | 'leftovers' | 'freezer', number> = {
  empty: 0, leftovers: 1, freezer: 2,
};
const specialKinds = ['empty', 'leftovers', 'freezer'] as const;

function checksum(bytes: Uint8Array): number {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x80 ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff;
    }
  }
  return crc;
}
function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromBase64Url(token: string): Uint8Array {
  const encoded = token.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = atob(encoded + '='.repeat((4 - encoded.length % 4) % 4));
  return Uint8Array.from(decoded, character => character.charCodeAt(0));
}
function codeForSlot(slot: WeekSlot, servings: Record<string, number>): number {
  if (slot.kind === 'recipe') {
    if (!/^[a-z0-9]{4}$/.test(slot.id) || !recipeIds.has(slot.id)) {
      throw new Error('Unknown recipe in week plan');
    }
    const count = servings[slot.id] ?? 4;
    if (!Number.isInteger(count) || count < 1 || count > 8) {
      throw new Error('Invalid serving count in week plan');
    }
    return Number.parseInt(slot.id, 36) * 8 + count - 1;
  }
  if (!Object.hasOwn(specialCodes, slot.kind)) throw new Error('Invalid week slot');
  return (ID_SPACE + specialCodes[slot.kind]) * 8;
}

/** Each new link is a unique immutable snapshot, not a pointer to browser storage. */
export function createWeekShareLink(origin: string, week: string, slots: WeekSlot[], servings: Record<string, number>): string {
  if (!validMondayKey(week) || slots.length !== 7) throw new Error('Invalid week plan');
  const weekIndex = (Date.parse(week + 'T00:00:00Z') - EPOCH) / WEEK_MS;
  if (!Number.isInteger(weekIndex) || weekIndex < 0 || weekIndex > 65535) {
    throw new Error('Week outside supported range');
  }
  const bytes = new Uint8Array(LENGTH);
  bytes[0] = 2;
  bytes[1] = weekIndex >>> 8;
  bytes[2] = weekIndex & 0xff;
  crypto.getRandomValues(bytes.subarray(3, 7));
  slots.forEach((slot, i) => {
    const value = codeForSlot(slot, servings);
    const offset = 7 + 3 * i;
    bytes[offset] = value >>> 16;
    bytes[offset + 1] = (value >>> 8) & 0xff;
    bytes[offset + 2] = value & 0xff;
  });
  bytes[LENGTH - 1] = checksum(bytes.subarray(0, LENGTH - 1));
  return origin.replace(/\/$/, '') + sharedWeekPath() + '#p=' + toBase64Url(bytes);
}

export function parseSharedWeek(hash: string): SharedWeek | null {
  try {
    const match = /^#p=([A-Za-z0-9_-]{39})$/.exec(hash);
    if (!match) return null;
    const bytes = fromBase64Url(match[1]);
    if (bytes.length !== LENGTH || bytes[0] !== 2 ||
      checksum(bytes.subarray(0, LENGTH - 1)) !== bytes[LENGTH - 1]) return null;

    const weekIndex = (bytes[1] << 8) | bytes[2];
    const week = new Date(EPOCH + weekIndex * WEEK_MS).toISOString().slice(0, 10);
    if (!validMondayKey(week)) return null;
    const id = Array.from(bytes.subarray(3, 7), byte => byte.toString(16).padStart(2, '0')).join('');
    const slots: WeekSlot[] = [];
    const servings: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const offset = 7 + i * 3;
      const value = bytes[offset] * 65536 + bytes[offset + 1] * 256 + bytes[offset + 2];
      const recipeCode = Math.floor(value / 8);
      if (recipeCode < ID_SPACE) {
        const recipeId = recipeCode.toString(36).padStart(4, '0');
        if (!recipeIds.has(recipeId)) return null;
        const count = (value % 8) + 1;
        slots.push({kind: 'recipe', id: recipeId});
        servings[recipeId] = count;
      } else {
        const special = recipeCode - ID_SPACE;
        if (value % 8 !== 0 || special > 2) return null;
        slots.push({kind: specialKinds[special]});
      }
    }
    return {v: 2, id, week, slots, servings};
  } catch { return null; }
}
