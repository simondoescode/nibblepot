import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

type DragPreview = { from: number; target: number | null; x: number; y: number; width: number };
type Gesture = DragPreview & { pointerId: number; startX: number; startY: number; active: boolean };

// Pointer capture keeps a grip drag alive outside its row. The animation loop
// also scrolls while a finger is held still near an edge, updating the hit test.
export function useDinnerDrag(week: string, onDrop: (from: number, to: number) => void, onLift: () => void) {
  const [preview, setPreview] = useState<DragPreview | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const frame = useRef(0);
  const lastFrame = useRef(0);
  const ignoreClick = useRef(false);
  const drop = useRef(onDrop);
  const lift = useRef(onLift);
  drop.current = onDrop;
  lift.current = onLift;

  const cancel = () => {
    if (gesture.current?.active) ignoreClick.current = true;
    gesture.current = null;
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    lastFrame.current = 0;
    setPreview(null);
  };
  const targetAt = (x: number, y: number, from: number) => {
    const row = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-day-index]');
    if (!row) return null;
    const index = Number(row.dataset.dayIndex);
    return Number.isInteger(index) && index >= 0 && index < 7 && index !== from ? index : null;
  };
  const publish = (move: Gesture) => {
    move.target = targetAt(move.x, move.y, move.from);
    setPreview(previous => previous && previous.from === move.from && previous.target === move.target &&
      previous.x === move.x && previous.y === move.y ? previous :
      { from: move.from, target: move.target, x: move.x, y: move.y, width: move.width });
  };
  const animate = (time: number) => {
    const elapsed = lastFrame.current ? Math.min(32,time-lastFrame.current) : 16.67;
    lastFrame.current = time;
    const move = gesture.current;
    if (!move?.active) return;
    // Leave room for the fixed mobile navigation and sticky app header.
    const top = 112, bottom = window.innerHeight - 112;
    const column = document.querySelector('.planner-days')?.getBoundingClientRect();
    if (column && move.x >= column.left && move.x <= column.right) {
      const speed = move.y < top ? -Math.min(10, (top - move.y) / 6)
        : move.y > bottom ? Math.min(10, (move.y - bottom) / 6) : 0;
      if (speed) window.scrollBy({ top: speed * elapsed / 16.67, behavior: 'instant' });
    }
    publish(move);
    frame.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    cancel();
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') cancel(); };
    const hidden = () => { if (document.hidden) cancel(); };
    document.addEventListener('keydown', escape);
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('blur', cancel);
    return () => {
      gesture.current = null;
      cancelAnimationFrame(frame.current);
      document.removeEventListener('keydown', escape);
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('blur', cancel);
    };
  }, [week]);

  const pointerDown = (event: ReactPointerEvent<HTMLButtonElement>, from: number) => {
    if (!event.isPrimary || event.button !== 0 || gesture.current) return;
    event.stopPropagation();
    ignoreClick.current = false;
    const row = event.currentTarget.closest<HTMLElement>('[data-day-index]');
    gesture.current = { from, target: null, x: event.clientX, y: event.clientY,
      startX: event.clientX, startY: event.clientY, active: false, pointerId: event.pointerId,
      width: Math.min(row?.getBoundingClientRect().width ?? 300, 360, window.innerWidth - 24) };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const move = gesture.current;
    if (!move || move.pointerId !== event.pointerId) return;
    move.x = event.clientX; move.y = event.clientY;
    if (!move.active) {
      if (Math.hypot(move.x - move.startX, move.y - move.startY) < 8) return;
      move.active = true;
      lift.current();
      frame.current = requestAnimationFrame(animate);
    }
    publish(move);
  };
  const pointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const move = gesture.current;
    if (!move || move.pointerId !== event.pointerId) return;
    const target = move.active ? targetAt(event.clientX, event.clientY, move.from) : null;
    cancel();
    if (target !== null) drop.current(move.from, target);
  };
  return { preview, isTracking: () => gesture.current !== null, cancel,
    pointerDown, pointerMove, pointerUp,
    ignoreClick: () => { const ignored = ignoreClick.current; ignoreClick.current = false; return ignored; } };
}
