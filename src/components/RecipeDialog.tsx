import { useEffect, useRef } from 'react';
import { ingredientName } from '../data';
import type { Recipe, RecipeModal } from '../types';
import { RecipeArt } from './RecipeGrid';

export function RecipeDialog({ modal, recipe, larder, saved, onClose, onView, onReroll, onAddMissing, onFavorite }: {
  modal: RecipeModal; recipe: Recipe; larder: string[]; saved: boolean;
  onClose: () => void; onView: () => void; onReroll: () => void; onAddMissing: () => void; onFavorite: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const random = modal.kind === 'random';
  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = oldOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);
  return <div className="overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-label={`${random ? 'Random dinner suggestion' : 'Recipe'}: ${recipe.title}`}>
      <button ref={closeRef} className="modal-close" type="button" onClick={onClose} aria-label="Close dialog">×</button>
      {random && <div className="random-intro">🎲 The dinner gods have spoken!</div>}
      <RecipeArt recipe={recipe} saved={saved} large />
      <div className="modal-body"><span className="modal-topline">{random ? 'Tonight’s pick!' : `⏱ ${recipe.mins} min · Serves 4`}</span>
        <h2>{recipe.title}</h2><p>{recipe.description} · {recipe.mins} minutes · serves 4</p>
        {random ? <div className="random-actions">
          <button type="button" className="btn btn-primary" onClick={onView}>🍴 See recipe</button>
          <button type="button" className="btn btn-cream" onClick={onReroll}>🎲 Roll again</button>
        </div> : <>
          <h3>What you'll need</h3>
          {recipe.ing.map(item => <div className="ingredient-line" key={item.id}>
            <span><strong>{item.qty}</strong> {ingredientName(item.id)}</span>
            <span className={`stock-tag ${larder.includes(item.id) ? 'have' : 'need'}`}>
              {larder.includes(item.id) ? '✓ In larder' : '+ Need'}</span>
          </div>)}
          <h3>Let's make it</h3>
          <ol className="steps">{recipe.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>
          <div className="modal-actions">
            <button type="button" className="btn btn-primary" onClick={onAddMissing}>🛒 Add missing bits</button>
            <button type="button" className="btn btn-cream" onClick={onFavorite}>{saved ? '♥ Saved' : '♡ Save recipe'}</button>
          </div>
        </>}
      </div>
    </section>
  </div>;
}
