import { useEffect, useRef, useState } from 'react';
import { pullDistance, shouldRefresh } from '../lib/pullGesture';

/** Listen to real touch gestures at the top of the page, not synthetic scroll updates. */
export function usePullToRefresh(refresh: () => void, enabled: boolean) {
  const [distance, setDistance] = useState(0);
  const callback = useRef(refresh);
  callback.current = refresh;

  useEffect(() => {
    if (!enabled) return;
    let start: { x: number; y: number } | null = null;
    let distanceNow = 0;

    const reset = () => { start = null; distanceNow = 0; setDistance(0); };
    const startTouch = (event: TouchEvent) => {
      if (event.touches.length !== 1 || window.scrollY > 0) return;
      if (!window.matchMedia('(pointer: coarse)').matches) return;
      const element = event.target;
      if (element instanceof Element && element.closest('input,textarea,select,[contenteditable="true"],[role="dialog"],.chips')) return;
      const touch = event.touches[0];
      start = { x: touch.clientX, y: touch.clientY };
      distanceNow = 0;
    };
    const moveTouch = (event: TouchEvent) => {
      if (!start || event.touches.length !== 1) return;
      if (window.scrollY > 0) { reset(); return; }
      const touch = event.touches[0];
      distanceNow = pullDistance(start.x, start.y, touch.clientX, touch.clientY);
      setDistance(distanceNow);
      if (distanceNow > 8 && event.cancelable) event.preventDefault();
    };
    const endTouch = () => {
      const triggered = shouldRefresh(distanceNow);
      reset();
      if (triggered) callback.current();
    };
    document.addEventListener('touchstart', startTouch, { passive: true });
    document.addEventListener('touchmove', moveTouch, { passive: false });
    document.addEventListener('touchend', endTouch, { passive: true });
    document.addEventListener('touchcancel', reset, { passive: true });
    return () => {
      document.removeEventListener('touchstart', startTouch);
      document.removeEventListener('touchmove', moveTouch);
      document.removeEventListener('touchend', endTouch);
      document.removeEventListener('touchcancel', reset);
    };
  }, [enabled]);

  return distance;
}
