import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock3, Heart, Shuffle } from 'lucide-react';
import type { Recipe } from '../types';
import { chooseRandomRecipe } from '../lib/recipes';

type Props = { recipes: readonly Recipe[]; favorites: readonly string[]; onFavorite: (id: string) => void; onOpen: (id: string) => void };
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
export function TonightInspiration({ recipes, favorites, onFavorite, onOpen }: Props) {
  const [id, setId] = useState(() => initialId(recipes));
  const start = useRef<{ x: number; y: number } | null>(null);
  const eligible = recipes.filter(recipe => Boolean(recipe.image));
  const catalogue = eligible.length ? eligible : [...recipes];
  const current = catalogue.find(recipe => recipe.id === id) ?? catalogue[0];
  const show = (next: string) => {
    setId(next);
    try { sessionStorage.setItem(sessionKey, next); } catch { /* No persistence available. */ }
  };
  const cycle = (direction: number) => {
    if (!current || catalogue.length < 2) return;
    const index = catalogue.findIndex(recipe => recipe.id === current.id);
    show(catalogue[(index + direction + catalogue.length) % catalogue.length].id);
  };
  const surprise = () => { if (current) show(chooseRandomRecipe(catalogue, current.id).id); };
  if (!current) return null;
  return <section className="simmer-spotlight" aria-label="Tonight's inspiration"
    onTouchStart={event => { const touch = event.touches[0]; start.current = {x:touch.clientX,y:touch.clientY}; }}
    onTouchEnd={event => {
      if (!start.current) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.current.x, dy = touch.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) cycle(dx < 0 ? 1 : -1);
    }}>
    <div className="simmer-spotlight-image" key={current.id}>
      <img src={`${import.meta.env.BASE_URL}${current.image ?? `recipes/${current.id}.svg`}`}
        alt={current.title} width="800" height="504" decoding="async" fetchPriority="high"
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
      </div>
    </div>
    <div className="simmer-spotlight-controls">
      <button type="button" aria-label="Previous inspiration" disabled={catalogue.length < 2} onClick={() => cycle(-1)}><ArrowLeft size={19}/></button>
      <span aria-live="polite" aria-atomic="true">{catalogue.findIndex(recipe => recipe.id === current.id) + 1} / {catalogue.length}</span>
      <button type="button" aria-label="Next inspiration" disabled={catalogue.length < 2} onClick={() => cycle(1)}><ArrowRight size={19}/></button>
      <button type="button" className="simmer-shuffle" disabled={catalogue.length < 2} onClick={surprise}><Shuffle size={17}/> Surprise me</button>
    </div>
  </section>;
}
