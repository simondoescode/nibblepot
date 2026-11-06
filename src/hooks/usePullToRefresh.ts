import { useEffect, useRef, useState } from 'react';
import { pullDistance, shouldRefresh } from '../lib/pullGesture';
import { prefersReducedMotion } from './useReducedMotion';
export interface PullState { distance: number; dragging: boolean; settling: boolean }

/** Gestures update at most once per frame. Reload waits for the actual release transition. */
export function usePullToRefresh(refresh: (settled: Promise<void>) => void, enabled: boolean, refreshing = false): PullState {
  const [state, setState] = useState<PullState>({distance:0,dragging:false,settling:false});
  const callback = useRef(refresh);
  callback.current = refresh;
  const blocked = useRef(refreshing);
  blocked.current = refreshing;
  useEffect(() => {
    if (!enabled) { setState({distance:0,dragging:false,settling:false}); return; }
    let start: {x:number;y:number} | null = null;
    let distance = 0;
    let captured = false;
    let frame = 0;
    let release: (() => void) | undefined;
    const paint = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setState({distance,dragging:captured,settling:false}));
    };
    const reset = () => {
      start=null;distance=0;captured=false;
      cancelAnimationFrame(frame);
      setState({distance:0,dragging:false,settling:false});
    };
    const startTouch = (event: TouchEvent) => {
      if (event.touches.length !== 1 || window.scrollY > 0 || !matchMedia('(pointer: coarse)').matches || release || blocked.current) return;
      const target = event.target;
      if (document.querySelector('[role="dialog"]') || (target instanceof Element && target.closest('input,textarea,select,[contenteditable="true"],.chips,[data-no-pull]'))) return;
      start={x:event.touches[0].clientX,y:event.touches[0].clientY};
      distance=0;
    };
    const moveTouch = (event: TouchEvent) => {
      if (!start) return;
      if (event.touches.length !== 1 || window.scrollY > 0) { reset();return; }
      distance=pullDistance(start.x,start.y,event.touches[0].clientX,event.touches[0].clientY);
      if (distance < 3) { if(captured)reset();return; }
      captured=true;paint();
      if (distance>8 && event.cancelable) event.preventDefault();
    };
    const endTouch = () => {
      if (!start) return;
      const triggered=captured && shouldRefresh(distance);
      const moved=captured;
      reset();
      if (!moved) return;
      const body=document.querySelector('.pull-body');
      const settled=new Promise<void>(resolve => {
        let timeout: ReturnType<typeof setTimeout>;
        const done = () => {
          clearTimeout(timeout);
          body?.removeEventListener('transitionend',ended);
          body?.removeEventListener('transitioncancel',ended);
          release=undefined;
          setState({distance:0,dragging:false,settling:false});
          resolve();
        };
        const ended = (event: Event) => {
          if(event.target===body && (event as TransitionEvent).propertyName==='transform') done();
        };
        release=done;
        body?.addEventListener('transitionend',ended);
        body?.addEventListener('transitioncancel',ended);
        setState({distance:0,dragging:false,settling:true});
        // A missing/cancelled transition must never leave refresh waiting forever.
        const timing=body ? getComputedStyle(body).getPropertyValue('--motion-pull').trim() : '0ms';
        const duration=parseFloat(timing) * (timing.endsWith('ms') ? 1 : 1000);
        timeout=setTimeout(done, prefersReducedMotion() ? 0 : duration+80);
      });
      if(triggered)callback.current(settled);
    };
    document.addEventListener('touchstart',startTouch,{passive:true});
    document.addEventListener('touchmove',moveTouch,{passive:false});
    document.addEventListener('touchend',endTouch,{passive:true});
    document.addEventListener('touchcancel',reset,{passive:true});
    return () => {
      cancelAnimationFrame(frame);
      // Resolve the reload barrier on disable/unmount, without resetting the refresh indicator.
      release?.();
      document.removeEventListener('touchstart',startTouch);
      document.removeEventListener('touchmove',moveTouch);
      document.removeEventListener('touchend',endTouch);
      document.removeEventListener('touchcancel',reset);
    };
  },[enabled]);
  return state;
}
