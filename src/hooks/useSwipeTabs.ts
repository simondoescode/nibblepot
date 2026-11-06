import { useCallback, useEffect, useRef } from 'react';
import type { TouchEvent } from 'react';
import type { Tab } from '../types';

export const SWIPE_TABS: readonly Tab[] = ['home', 'planner', 'larder', 'shopping'];
const BLOCKED = 'input,textarea,select,button,[role="slider"],[role="dialog"],[contenteditable="true"],[data-no-tab-swipe]';
export function swipeDestination(tab: Tab, delta: number): Tab | null {
  const index = SWIPE_TABS.indexOf(tab);
  if (index < 0 || !delta) return null;
  return SWIPE_TABS[index + (delta < 0 ? 1 : -1)] ?? null;
}

export function useSwipeTabs(tab: Tab | null, navigate: (tab: Tab) => void, blocked = false) {
  const element = useRef<HTMLElement | null>(null);
  const gesture = useRef<{ x: number; y: number; time: number; axis: 'pending' | 'horizontal' | 'vertical'; dx: number } | null>(null);
  const settling = useRef(false);
  const animation = useRef<Animation | null>(null);
  const direction = useRef(0);
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reset = useCallback(() => {
    animation.current?.cancel();
    animation.current = null;
    if (element.current) {
      element.current.style.transform = '';
      element.current.style.willChange = '';
    }
    gesture.current = null;
    settling.current = false;
  }, []);
  useEffect(() => () => reset(), [reset]);
  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (blocked || !tab || settling.current || event.touches.length !== 1 || window.innerWidth > 820) return;
    const target = event.target as HTMLElement;
    if (target.closest(BLOCKED) || target.closest('[data-horizontal-scroll]')) return;
    // Leave horizontally scrolling components in control of their own gestures.
    for (let node: HTMLElement | null = target; node && node !== element.current; node = node.parentElement) {
      if (node.scrollWidth > node.clientWidth + 4 && ['auto', 'scroll'].includes(getComputedStyle(node).overflowX)) return;
    }
    gesture.current = { x: event.touches[0].clientX, y: event.touches[0].clientY, time: performance.now(), axis: 'pending', dx: 0 };
  };
  const onTouchMove = (event: TouchEvent<HTMLElement>) => {
    const g = gesture.current;
    if (!g || !tab || event.touches.length !== 1) return;
    const dx = event.touches[0].clientX - g.x;
    const dy = event.touches[0].clientY - g.y;
    if (g.axis === 'pending' && Math.hypot(dx, dy) > 9) g.axis = Math.abs(dx) > Math.abs(dy) * 1.25 ? 'horizontal' : 'vertical';
    if (g.axis !== 'horizontal') return;
    g.dx = dx;
    const allowed = swipeDestination(tab, dx);
    const offset = allowed ? dx : dx * 0.16;
    if (element.current && !reduceMotion()) {
      element.current.style.willChange = 'transform';
      element.current.style.transform = `translate3d(${offset}px,0,0)`;
    }
  };
  const onTouchEnd = () => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.axis !== 'horizontal' || !tab) return;
    const target = swipeDestination(tab, g.dx);
    const elapsed = Math.max(1, performance.now() - g.time);
    const velocity = Math.abs(g.dx) / elapsed;
    const commit = !!target && (Math.abs(g.dx) > Math.min(110, window.innerWidth * .26) || (Math.abs(g.dx) > 35 && velocity > .5));
    const node = element.current;
    if (!node) return;
    const from = getComputedStyle(node).transform === 'none' ? 'translate3d(0,0,0)' : getComputedStyle(node).transform;
    if (reduceMotion()) {
      reset();
      if (commit && target) navigate(target);
      return;
    }
    settling.current = true;
    direction.current = Math.sign(g.dx);
    const to = commit ? `translate3d(${direction.current * window.innerWidth}px,0,0)` : 'translate3d(0,0,0)';
    animation.current = node.animate([{ transform: from }, { transform: to }], {
      duration: commit ? 230 : 260, easing: 'cubic-bezier(.22,.75,.2,1)'
    });
    animation.current.onfinish = () => {
      reset();
      if (commit && target) navigate(target);
    };
    animation.current.oncancel = () => { settling.current = false; };
  };
  return { element, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: reset };
}
