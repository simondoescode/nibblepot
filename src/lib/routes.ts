
import type { Tab } from '../types';

export type PageRoute = { kind: 'tab'; tab: Tab } | { kind: 'recipe'; id: string } | { kind: 'not-found' };
const segments: Record<Tab, string> = { home: '', favorites: 'favourites', larder: 'larder', shopping: 'shopping', settings: 'settings' };
// Vitest defaults BASE_URL to '/' even though the deployed Pages site lives under /nibblepot/.
export const basePath = import.meta.env.BASE_URL === '/' ? '/nibblepot/' : import.meta.env.BASE_URL;
export const tabPath = (tab: Tab) => basePath + (segments[tab] ? segments[tab] + '/' : '');
export const recipePath = (id: string) => basePath + 'recipes/' + encodeURIComponent(id) + '/';

export function parseRoute(pathname: string, base = basePath): PageRoute {
  const normalized = pathname.replace(/\/+$/, '/') || '/';
  if (!normalized.startsWith(base)) return { kind: 'not-found' };
  const route = normalized.slice(base.length).replace(/\/+$/, '');
  if (!route) return { kind: 'tab', tab: 'home' };
  const tab = (Object.keys(segments) as Tab[]).find(key => segments[key] && segments[key] === route);
  if (tab) return { kind: 'tab', tab };
  const match = /^recipes\/([a-z0-9-]+)$/.exec(route);
  return match ? { kind: 'recipe', id: match[1] } : { kind: 'not-found' };
}
