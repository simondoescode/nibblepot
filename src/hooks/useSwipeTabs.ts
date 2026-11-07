import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import type { Tab } from '../types';
import { prefersReducedMotion } from './useReducedMotion';

export const SWIPE_TABS: readonly Tab[] = ['home', 'planner', 'larder', 'shopping'];
const BLOCKED = 'input,textarea,select,button,[role="slider"],[role="dialog"],[contenteditable="true"],[data-no-tab-swipe],[data-horizontal-scroll]';

export function swipeDestination(tab: Tab, delta: number): Tab | null {
  const index = SWIPE_TABS.indexOf(tab);
  if (index < 0 || !delta) return null;
  return SWIPE_TABS[index + (delta < 0 ? 1 : -1)] ?? null;
}

export function useSwipeTabs(tab: Tab | null, navigate: (tab: Tab) => Promise<void>, blocked = false) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number; time: number; axis: 'pending' | 'horizontal' | 'vertical'; dx: number; offset: number } | null>(null);
  const animation = useRef<{ slide: Animation; committing: boolean } | null>(null);
  const [preview, setPreview] = useState<Tab | null>(null);

  const clearTrack = useCallback(() => {
    const settling = animation.current;
    animation.current = null;
    settling?.slide.cancel();
    if (track.current) track.current.style.transform = '';
    gesture.current = null;
  }, []);
  const reset = useCallback(() => {
    clearTrack();
    setPreview(null);
  }, [clearTrack]);

  useLayoutEffect(() => {
    reset();
    const surface = viewport.current;
    if (!surface || !tab || blocked) return;

    const move = (event: globalThis.TouchEvent) => {
      const g = gesture.current;
      const node = track.current;
      if (!g || !node) return;
      if (event.touches.length !== 1) { reset(); return; }

      const dx = event.touches[0].clientX - g.x;
      const dy = event.touches[0].clientY - g.y;
      if (g.axis === 'pending' && Math.hypot(dx, dy) > 9) {
        g.axis = Math.abs(dx) > Math.abs(dy) * 1.25 ? 'horizontal' : 'vertical';
      }
      if (g.axis !== 'horizontal') return;

      if (event.cancelable) event.preventDefault();
      g.dx = dx;
      if (prefersReducedMotion()) return;
      const target = swipeDestination(tab, dx);
      const width = surface.clientWidth;
      g.offset = target ? Math.max(-width, Math.min(dx, width)) : dx * 0.16;
      node.style.transform = translate(g.offset);
      setPreview(target);
    };
    surface.addEventListener('touchmove', move, { passive: false });
    return () => {
      surface.removeEventListener('touchmove', move);
      clearTrack();
    };
  }, [tab, blocked, clearTrack, reset]);

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) {
      if (gesture.current) reset();
      return;
    }
    if (blocked || !tab || !SWIPE_TABS.includes(tab) || animation.current?.committing || window.innerWidth > 820) return;
    const target = event.target;
    if (!(target instanceof Element) || target.closest(BLOCKED) || document.querySelector('[role="dialog"]')) return;
    // Leave horizontally scrolling components in control of their own gestures.
    for (let node: Element | null = target; node && node !== viewport.current; node = node.parentElement) {
      if (node.scrollWidth > node.clientWidth + 4 && ['auto', 'scroll'].includes(getComputedStyle(node).overflowX)) return;
    }
    if (animation.current) reset();
    gesture.current = { x: event.touches[0].clientX, y: event.touches[0].clientY, time: performance.now(), axis: 'pending', dx: 0, offset: 0 };
  };

  const onTouchEnd = () => {
    const g = gesture.current;
    gesture.current = null;
    const node = track.current;
    const width = viewport.current?.clientWidth;
    if (!g || g.axis !== 'horizontal' || !tab || !node || !width) return;

    const target = swipeDestination(tab, g.dx);
    const elapsed = Math.max(1, performance.now() - g.time);
    const distance = Math.abs(g.dx);
    const commit = target && (distance > Math.min(110, width * .26) || (distance > 35 && distance / elapsed > .5));
    if (prefersReducedMotion()) {
      reset();
      if (commit) void navigate(target);
      return;
    }
    if (!g.offset) { reset(); return; }

    const slide = node.animate(
      [{ transform: translate(g.offset) }, { transform: translate(commit ? Math.sign(g.dx) * width : 0) }],
      { duration: commit ? 230 : 260, easing: 'cubic-bezier(.22,.75,.2,1)', fill: 'forwards' },
    );
    animation.current = { slide, committing: !!commit };
    const finish = () => {
      if (animation.current?.slide === slide) reset();
    };
    void slide.finished
      .then(() => animation.current?.slide === slide && commit ? navigate(target) : undefined)
      .then(finish, finish);
  };

  return { viewport, track, preview, onTouchStart, onTouchEnd, onTouchCancel: reset };
}

function translate(x: number) {
  return `translate3d(${x}px,0,0)`;
}
