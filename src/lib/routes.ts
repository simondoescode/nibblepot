
import type { Tab } from '../types';
import { recipes } from '../data';

export type PageRoute = { kind: 'tab'; tab: Tab } | { kind: 'recipe'; id: string } | { kind: 'cook'; id: string } | { kind: 'shared-week' } | { kind: 'shared-shopping' } | { kind: 'not-found' };
const segments: Record<Tab, string> = { home: '', favorites: 'favourites', larder: 'larder', planner: 'planner', shopping: 'shopping', settings: 'settings' };
// Vitest defaults BASE_URL to '/' even though the deployed Pages site lives under /nibblepot/.
export const basePath = import.meta.env.BASE_URL === '/' ? '/nibblepot/' : import.meta.env.BASE_URL;
export const tabPath = (tab: Tab) => basePath + (segments[tab] ? segments[tab] + '/' : '');
const slugById = new Map(recipes.map(recipe => [recipe.id, recipe.slug]));
const idBySlug = new Map(recipes.map(recipe => [recipe.slug, recipe.id]));
export const recipePath = (id: string) => basePath + 'recipes/' + encodeURIComponent(slugById.get(id) ?? id) + '/';
export const cookingPath = (id: string) => recipePath(id) + 'cook/';

export function parseRoute(pathname: string, base = basePath): PageRoute {
  const normalized = pathname.replace(/\/+$/, '/') || '/';
  if (!normalized.startsWith(base)) return { kind: 'not-found' };
  const route = normalized.slice(base.length).replace(/\/+$/, '');
  if (!route) return { kind: 'tab', tab: 'home' };
  if (route === 'planner/shared') return { kind: 'shared-week' };
  if (route === 'shopping/shared') return { kind: 'shared-shopping' };
  const tab = (Object.keys(segments) as Tab[]).find(key => segments[key] && segments[key] === route);
  if (tab) return { kind: 'tab', tab };
  const cook = /^recipes\/([a-z0-9-]+)\/cook$/.exec(route);
  if (cook) { const id = idBySlug.get(cook[1]); return id ? { kind: 'cook', id } : {kind:'not-found'}; }
  const match = /^recipes\/([a-z0-9-]+)$/.exec(route);
  if (!match) return { kind: 'not-found' };
  const id = idBySlug.get(match[1]);
  return id ? { kind: 'recipe', id } : { kind: 'not-found' };
}
