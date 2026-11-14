import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { parseRoute, recipePath, type PageRoute } from '../lib/routes';
import { dismissSheet } from '../lib/sheetHistory';
import type { Tab } from '../types';

type Intent = 'direct' | 'swipe' | 'tab' | 'forward' | 'back';
export function useAppNavigation() {
  const [route, setRoute] = useState<PageRoute>(() => parseRoute(location.pathname));
  const [motion, setMotion] = useState<Intent>('direct');
  const current = useRef(route);
  const path = useRef(location.pathname);
  const index = useRef<number>(history.state?.nibblepotIndex ?? 0);
  const positions = useRef(new Map<string, number>());
  const lastTab = useRef<Tab>(route.kind === 'tab' ? route.tab : 'home');
  const destinationScroll = useRef(0);
  const request = useRef(0);
  const returnRecipe = useRef<string | null>(null);
  const commit = useCallback((next: PageRoute, nextPath: string, intent: Intent) => {
    positions.current.set(path.current, window.scrollY);
    if (current.current.kind === 'recipe' && next.kind === 'tab') returnRecipe.current = current.current.id;
    if (next.kind === 'tab') lastTab.current = next.tab;
    destinationScroll.current = positions.current.get(nextPath) ?? 0;
    current.current = next;
    path.current = nextPath;
    setMotion(intent);
    setRoute(next);
  }, []);
  useLayoutEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    history.replaceState({ ...history.state, nibblepotIndex: index.current }, '', location.href);
    const sync = () => {
      if (location.pathname === path.current) return; // sheet-only history change
      request.current++;
      const nextIndex = history.state?.nibblepotIndex ?? 0;
      const intent = nextIndex < index.current ? 'back' : 'forward';
      index.current = nextIndex;
      commit(parseRoute(location.pathname), location.pathname, intent);
    };
    window.addEventListener('popstate', sync);
    return () => {
      history.scrollRestoration = previous;
      window.removeEventListener('popstate', sync);
    };
  }, [commit]);
  useLayoutEffect(() => {
    window.scrollTo({ top: destinationScroll.current, behavior: 'instant' });
    if (motion === 'direct') return;
    const link = returnRecipe.current && document.querySelector<HTMLElement>(`a.recipe-card-link[href="${recipePath(returnRecipe.current)}"]`);
    const main = document.querySelector<HTMLElement>('main');
    const focus = link || main?.querySelector<HTMLElement>('h1, h2') || main;
    if (focus) { if (!link) focus.tabIndex = -1; focus.focus({ preventScroll: true }); }
    returnRecipe.current = null;
  }, [route, motion]);
  const changeRoute = useCallback(async (nextPath: string, next: PageRoute, intent?: Intent) => {
    const ticket = ++request.current;
    await dismissSheet();
    if (ticket !== request.current || nextPath === path.current) return;
    const parent = path.current;
    index.current++;
    history.pushState({ nibblepotIndex: index.current, nibblepotParent: parent, nibblepotTab: lastTab.current }, '', nextPath);
    commit(next, nextPath, intent ?? (next.kind === 'tab' ? 'tab' : 'forward'));
  }, [commit]);
  const back = useCallback((fallback: string, next: PageRoute) => {
    if (history.state?.nibblepotParent) history.back();
    else void changeRoute(fallback, next, 'back');
  }, [changeRoute]);
  const tabScrollPosition = (tabPath: string) => positions.current.get(tabPath) ?? 0;
  return { route, motion, lastTab, changeRoute, back, tabScrollPosition };
}
