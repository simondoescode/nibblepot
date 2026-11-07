import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock3, Heart, Shuffle, CalendarPlus } from 'lucide-react';
import type { Recipe } from '../types';
import { chooseRandomRecipe } from '../lib/recipes';

type Props = { recipes: readonly Recipe[]; favorites: readonly string[]; onFavorite: (id: string) => void; onOpen: (id: string) => void; onPlan: (id: string, day: number) => void };
const sessionKey = 'simmer-spotlight-v1';
function initialId(recipes: readonly Recipe[]): string {
  if (!recipes.length) return '';
  try {
    const saved = sessionStorage.getItem(sessionKey);
    if (saved && recipes.some(recipe => recipe.id === saved)) return saved;
  } catch { /* Private browsing may block session storage. */ }
  return chooseRandomRecipe(recipes).id;
}

/** A self-contained gesture surface: horizontal swipes here do not navigate app tabs. */
export function TonightInspiration({ recipes, favorites, onFavorite, onOpen, onPlan }: Props) {
  const [id, setId] = useState(() => initialId(recipes));
  const [planDay, setPlanDay] = useState<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const mouseStart = useRef<{ x: number; y: number } | null>(null);
  const catalogue = recipes;
  const current = catalogue.find(recipe => recipe.id === id) ?? catalogue[0];
  // Stable per-recipe rotation across four locally cached editorial WebP backdrops.
  const backdrop = current ? ['golden-stone','cream-linen','honey-wood','navy-tartan'][Math.max(0,catalogue.findIndex(recipe => recipe.id === current.id)) % 4] : 'golden-stone';
  const show = (next: string) => {
    setPlanDay(null);
    setId(next);
    try { sessionStorage.setItem(sessionKey, next); } catch { /* No persistence available. */ }
  };
  const cycle = (direction: number) => {
    if (!current || catalogue.length < 2) return;
    const index = catalogue.findIndex(recipe => recipe.id === current.id);
    show(catalogue[(index + direction + catalogue.length) % catalogue.length].id);
  };
  const surprise = () => { if (current) show(chooseRandomRecipe(catalogue, current.id).id); };
  if (!current) return <section className="simmer-spotlight simmer-spotlight-empty" aria-label="Tonight's inspiration"><div className="simmer-spotlight-content"><span className="simmer-spotlight-kicker">TONIGHT'S INSPIRATION</span><h2>Something good is cooking</h2><p>Try clearing your filters to see more dinner ideas.</p></div></section>;
  return <section className="simmer-spotlight" aria-label="Tonight's inspiration" data-no-pull
    onPointerDown={event => { if (event.pointerType === 'mouse' && event.button === 0 && !(event.target as HTMLElement).closest('button,select,a')) mouseStart.current = {x:event.clientX,y:event.clientY}; }}
    onPointerUp={event => { if (!mouseStart.current || event.pointerType !== 'mouse') return; const dx=event.clientX-mouseStart.current.x,dy=event.clientY-mouseStart.current.y; mouseStart.current=null; if (Math.abs(dx)>55 && Math.abs(dx)>Math.abs(dy)*1.4) cycle(dx<0?1:-1); }}
    onPointerCancel={() => { mouseStart.current=null; }}
    onTouchStart={event => { const touch = event.touches[0]; start.current = {x:touch.clientX,y:touch.clientY}; }}
    onTouchCancel={() => { start.current = null; }}
    onTouchEnd={event => {
      if (!start.current) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.current.x, dy = touch.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) cycle(dx < 0 ? 1 : -1);
    }}>
    <div className="simmer-spotlight-image" key={current.id} data-backdrop={backdrop}>
      <img src={`${import.meta.env.BASE_URL}${current.image ?? `recipes/${current.id}.svg`}`}
        alt="" width="800" height="504" decoding="async" fetchPriority="high"
        onError={event => { const fallback = `${import.meta.env.BASE_URL}recipes/${current.id}.svg`; if (!event.currentTarget.src.endsWith(fallback)) event.currentTarget.src = fallback; }} />
    </div>
    <div className="simmer-spotlight-content">
      <span className="simmer-spotlight-kicker">TONIGHT'S INSPIRATION</span>
      <h1>{current.title}</h1>
      <p><Clock3 size={16} aria-hidden="true"/> {current.mins} mins · {current.onePot ? 'One-pot favourite' : 'Family dinner'}</p>
      <div className="simmer-spotlight-actions">
        <button type="button" className="simmer-view" onClick={() => onOpen(current.id)}>View recipe <ArrowRight size={18} aria-hidden="true"/></button>
        <button type="button" className="simmer-save" aria-label={favorites.includes(current.id) ? 'Remove from favourites' : 'Save to favourites'}
          aria-pressed={favorites.includes(current.id)} onClick={() => onFavorite(current.id)}>
          <Heart size={20} fill={favorites.includes(current.id) ? 'currentColor' : 'none'} aria-hidden="true"/>
        </button>
        <button type="button" className="simmer-save" aria-label="Add to meal plan" aria-expanded={planDay !== null} onClick={() => setPlanDay(value => value === null ? 0 : null)}><CalendarPlus size={20} aria-hidden="true"/></button>
      </div>
      {planDay !== null && <div className="simmer-plan-picker"><label htmlFor="simmer-plan-day">Plan for</label><select id="simmer-plan-day" value={planDay} onChange={event => setPlanDay(Number(event.target.value))}>{['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((day,index)=><option key={day} value={index}>{day}</option>)}</select><button type="button" onClick={() => {onPlan(current.id,planDay);setPlanDay(null);}}>Add dinner</button></div>}
    </div>
    <div className="simmer-spotlight-controls">
      <button type="button" aria-label="Previous inspiration" disabled={catalogue.length < 2} onClick={() => cycle(-1)}><ArrowLeft size={19}/></button>
      <span aria-live="polite" aria-atomic="true">{catalogue.findIndex(recipe => recipe.id === current.id) + 1} / {catalogue.length}: {current.title}</span>
      <button type="button" aria-label="Next inspiration" disabled={catalogue.length < 2} onClick={() => cycle(1)}><ArrowRight size={19}/></button>
      <button type="button" className="simmer-shuffle" disabled={catalogue.length < 2} onClick={surprise}><Shuffle size={17}/> Surprise me</button>
    </div>
  </section>;
}
