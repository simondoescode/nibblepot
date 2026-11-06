import * as Primitive from '@radix-ui/react-dialog';
import { createContext, forwardRef, useContext, useEffect, useRef, useState, type ComponentPropsWithoutRef, type PointerEvent } from 'react';
import { registerSheet } from '../lib/sheetHistory';
import { useReducedMotion } from '../hooks/useReducedMotion';
export { Trigger, Portal, Close, Title, Description } from '@radix-ui/react-dialog';
const Dismiss = createContext<() => void>(() => {});

export function Root({ open = false, onOpenChange, children, historyKey, ...props }: ComponentPropsWithoutRef<typeof Primitive.Root> & {historyKey: string}) {
  const [token] = useState(() => historyKey);
  const callback = useRef(onOpenChange);
  callback.current = onOpenChange;
  useEffect(() => {
    const reopen = () => { if (history.state?.nibblepotSheet === token) callback.current?.(true); };
    reopen();
    window.addEventListener('popstate', reopen);
    return () => window.removeEventListener('popstate', reopen);
  }, [token]);
  useEffect(() => {
    if (!open) return;
    // Defer registration so React StrictMode's probe does not create a history entry.
    let cancelled = false;
    let unregister: (() => void) | undefined;
    queueMicrotask(() => { if (!cancelled) unregister = registerSheet(() => callback.current?.(false), token); });
    return () => { cancelled = true; unregister?.(); };
  }, [open, token]);
  return <Dismiss.Provider value={() => callback.current?.(false)}>
    <Primitive.Root {...props} open={open} onOpenChange={onOpenChange}>{children}</Primitive.Root>
  </Dismiss.Provider>;
}
export const Overlay = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof Primitive.Overlay>>(function Overlay({className = '', ...props}, ref) {
  return <Primitive.Overlay {...props} ref={ref} className={`${className} motion-backdrop`} />;
});
export const Content = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof Primitive.Content>>(function Content({className = '', children, style, ...props}, ref) {
  const dismiss = useContext(Dismiss);
  const reduced = useReducedMotion();
  const start = useRef<{x:number;y:number;time:number} | null>(null);
  const dragged = useRef(false);
  const [drag, setDrag] = useState(0);
  const [interacted,setInteracted] = useState(false);
  const visibleArea = () => ({height: window.visualViewport?.height ?? window.innerHeight, bottom: Math.max(0, window.innerHeight - (window.visualViewport?.height ?? window.innerHeight) - (window.visualViewport?.offsetTop ?? 0))});
  const [viewportArea, setViewportArea] = useState(visibleArea);
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => setViewportArea(visibleArea());
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    return () => {viewport?.removeEventListener('resize', update);viewport?.removeEventListener('scroll', update);};
  }, []);
  const pointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    setInteracted(true);
    dragged.current=false;
    start.current = {x:event.clientX,y:event.clientY,time:performance.now()};
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!start.current) return;
    const dy = Math.max(0,event.clientY-start.current.y);
    if (Math.abs(event.clientX-start.current.x) > dy + 12) { dragged.current=true;start.current=null;setDrag(0);return; }
    if (dy > 3) dragged.current=true;
    setDrag(dy);
  };
  const pointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const origin = start.current;
    start.current = null;
    setDrag(0);
    if (!origin) return;
    const distance = event.clientY-origin.y;
    const velocity = distance / Math.max(1,performance.now()-origin.time);
    if (distance >= 80 || (distance > 20 && velocity >= .5)) dismiss();
  };
  return <Primitive.Content {...props} ref={ref} className={`${className} motion-sheet${interacted ? ' sheet-interacted' : ''}${drag ? ' sheet-dragging' : ''}`}
    style={{...style, '--visual-height': `${viewportArea.height}px`, '--visual-bottom': `${viewportArea.bottom}px`, '--sheet-drag': `${reduced ? 0 : drag}px`} as React.CSSProperties}>
    <button type="button" className="motion-sheet-grip" tabIndex={-1} aria-label="Close sheet" onClick={event => { if (event.detail === 0 || !dragged.current) dismiss(); }}
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
      onPointerCancel={() => {start.current=null;setDrag(0);}}><span aria-hidden="true" /></button>
    {children}
  </Primitive.Content>;
});
