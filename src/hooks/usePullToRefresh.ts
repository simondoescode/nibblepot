import { useEffect, useRef, useState } from 'react';
import { pullDistance, shouldRefresh } from '../lib/pullGesture';

export interface PullState { distance: number; dragging: boolean }

/** Real vertical touch gestures at scroll top; resistance and spring settle are visual only. */
export function usePullToRefresh(refresh: () => void, enabled: boolean): PullState {
  const [distance, setDistance] = useState(0);
  const [dragging, setDragging] = useState(false);
  const callback = useRef(refresh);
  callback.current = refresh;

  useEffect(() => {
    if (!enabled) {
      setDistance(0);
      setDragging(false);
      return;
    }
    let start: { x: number; y: number } | null = null;
    let distanceNow = 0;
    let hasCaptured = false;
    let refreshTimeout: ReturnType<typeof setTimeout> | undefined;

    const reset = () => {
      start = null;
      hasCaptured = false;
      distanceNow = 0;
      setDragging(false);
      setDistance(0);
    };
    const startTouch = (event: TouchEvent) => {
      if (event.touches.length !== 1 || window.scrollY > 0) return;
      if (!window.matchMedia('(pointer: coarse)').matches) return;
      const element = event.target;
      if (element instanceof Element && element.closest(
        'input,textarea,select,[contenteditable="true"],[role="dialog"],.chips,[data-no-pull]'
      )) return;
      const touch = event.touches[0];
      start = { x: touch.clientX, y: touch.clientY };
      distanceNow = 0;
    };
    const moveTouch = (event: TouchEvent) => {
      if (!start || event.touches.length !== 1) return;
      if (window.scrollY > 0) { reset(); return; }
      const touch = event.touches[0];
      distanceNow = pullDistance(start.x, start.y, touch.clientX, touch.clientY);
      if (distanceNow < 3) {
        if (hasCaptured) reset();
        return;
      }
      if (!hasCaptured) { hasCaptured = true; setDragging(true); }
      setDistance(distanceNow);
      // Take over only deliberate downward gestures. Native horizontal swipes remain available.
      if (distanceNow > 8 && event.cancelable) event.preventDefault();
    };
    const endTouch = () => {
      const triggered = hasCaptured && shouldRefresh(distanceNow);
      reset(); // CSS spring eases the translated page back into place.
      if (triggered) {
        // Allow the release bounce to start before the existing PWA reload.
        refreshTimeout = setTimeout(() => callback.current(), 300);
      }
    };
    document.addEventListener('touchstart', startTouch, { passive: true });
    document.addEventListener('touchmove', moveTouch, { passive: false });
    document.addEventListener('touchend', endTouch, { passive: true });
    document.addEventListener('touchcancel', reset, { passive: true });
    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      document.removeEventListener('touchstart', startTouch);
      document.removeEventListener('touchmove', moveTouch);
      document.removeEventListener('touchend', endTouch);
      document.removeEventListener('touchcancel', reset);
    };
  }, [enabled]);

  return { distance, dragging };
}
