import { useRef, useState } from 'react';
import { Button } from '../ui/controls';
import type { Recipe } from '../types';
import { chooseRandomRecipe } from '../lib/recipes';

type Props = { recipes: readonly Recipe[]; onOpen: (id: string) => void };
const backdrops = ['cream-linen', 'golden-stone', 'honey-wood'] as const;
const sessionKey = 'simmer-spotlight-v1';
// The swipe preview and the mounted Recipes tab need the same initial pick.
const initialRandom = Math.random();
function initialId(recipes: readonly Recipe[]): string {
  if (!recipes.length) return '';
  try {
    const saved = sessionStorage.getItem(sessionKey);
    if (saved && recipes.some(recipe => recipe.id === saved)) return saved;
  } catch { /* Private browsing may block session storage. */ }
  return chooseRandomRecipe(recipes, undefined, () => initialRandom).id;
}

/** Supports recipe cycling when a gesture is not claimed by tab navigation. */
export function TonightInspiration({ recipes, onOpen }: Props) {
  const [id, setId] = useState(() => initialId(recipes));
  const start = useRef<{ x: number; y: number } | null>(null);
  const mouseStart = useRef<{ x: number; y: number } | null>(null);
  const catalogue = recipes;
  const current = catalogue.find(recipe => recipe.id === id) ?? catalogue[0];
  const index = current ? catalogue.indexOf(current) : 0;
  const show = (next: string) => {
    setId(next);
    try { sessionStorage.setItem(sessionKey, next); } catch { /* No persistence available. */ }
  };
  const cycle = (direction: number) => {
    if (!current || catalogue.length < 2) return;
    show(catalogue[(index + direction + catalogue.length) % catalogue.length].id);
  };
  const surprise = () => { if (current) show(chooseRandomRecipe(catalogue, current.id).id); };
  if (!current) return <section className="simmer-spotlight simmer-spotlight-empty" aria-label="Tonight's inspiration"><div className="simmer-spotlight-content"><span className="simmer-spotlight-kicker">Tonight's inspiration</span><h2>Something good is cooking</h2><p>Try clearing your filters to see more dinner ideas.</p></div></section>;
  const backdrop = backdrops[index % backdrops.length];
  return <section className="simmer-spotlight" aria-label="Tonight's inspiration" data-no-pull
    onPointerDown={event => { if (event.pointerType === 'mouse' && event.button === 0 && !(event.target as HTMLElement).closest('button,select,a')) mouseStart.current = {x:event.clientX,y:event.clientY}; }}
    onPointerUp={event => { if (!mouseStart.current || event.pointerType !== 'mouse') return; const dx=event.clientX-mouseStart.current.x,dy=event.clientY-mouseStart.current.y; mouseStart.current=null; if (Math.abs(dx)>55 && Math.abs(dx)>Math.abs(dy)*1.4) cycle(dx<0?1:-1); }}
    onPointerCancel={() => { mouseStart.current=null; }}
    onTouchStart={event => { const touch = event.touches[0]; start.current = {x:touch.clientX,y:touch.clientY}; }}
    onTouchMove={event => { if (event.defaultPrevented) start.current = null; }}
    onTouchCancel={() => { start.current = null; }}
    onTouchEnd={event => {
      if (!start.current) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.current.x, dy = touch.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) cycle(dx < 0 ? 1 : -1);
    }}>
    <div className="simmer-spotlight-image" key={current.id}
      style={{ backgroundImage: `url("${import.meta.env.BASE_URL}backgrounds/${backdrop}.webp")` }}>
      <img src={`${import.meta.env.BASE_URL}${current.image ?? `recipes/${current.id}.svg`}`}
        alt="" width="800" height="504" decoding="async" fetchPriority="high"
        onError={event => { const fallback = `${import.meta.env.BASE_URL}recipes/${current.id}.svg`; if (!event.currentTarget.src.endsWith(fallback)) event.currentTarget.src = fallback; }} />
    </div>
    <div className="simmer-spotlight-content">
      <span className="simmer-spotlight-kicker">Tonight's inspiration</span>
      <h1 aria-live="polite" aria-atomic="true">{current.title}</h1>
      <p>{current.mins} mins · Serves 4</p>
      <div className="simmer-spotlight-actions">
        <Button tone="primary" onClick={() => onOpen(current.id)}>View recipe</Button>
        {catalogue.length > 1 && <button type="button" className="simmer-shuffle" onClick={surprise}>Surprise me</button>}
      </div>
    </div>
  </section>;
}
