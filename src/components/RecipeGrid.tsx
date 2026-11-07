import { ArrowRight, Clock3, Heart, Soup } from 'lucide-react';
import { useState, type MouseEvent } from 'react';
import { recipePath } from '../lib/routes';
import type { Recipe } from '../types';
import { inLarder, missingRequiredIngredients } from '../lib/recipes';
import { ingredientName } from '../data';
import { Button } from '../ui/controls';

type Props = {
  recipes: Recipe[];
  favorites: string[];
  larder: string[];
  onFavorite: (id: string) => void;
  onOpen: (id: string) => void;
  onReset?: () => void;
  stock?: Record<string,string>;
  servings?: Record<string,number>;
  onAddMissing?: (id:string) => void;
};

/** Keep real link hrefs for sharing/open-in-new-tab, with SPA navigation on a normal click. */
function visitRecipe(event: MouseEvent<HTMLAnchorElement>, id: string, onOpen: (id: string) => void) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  onOpen(id);
}

/** Local WebP and SVG food art. No external runtime images or layout shifts. */
export function RecipeArt({ recipe, saved, onFavorite, large = false }: {
  recipe: Recipe; saved: boolean; onFavorite?: () => void; large?: boolean;
}) {
  const [pulse, setPulse] = useState(false);
  const image = <img
    className={`recipe-illustration${recipe.image ? " recipe-photo" : ""}`}
    src={`${import.meta.env.BASE_URL}${recipe.image ?? `recipes/${recipe.id}.svg`}`}
    alt="" width="800" height="504"
    loading={large ? 'eager' : 'lazy'} decoding="async"
  />;
  return <div className={large ? 'modal-art illustrated-art' : 'recipe-pic illustrated-art'}>
    {image}
    {!large && <span className="tiny-label"><Clock3 size={13} aria-hidden="true" /> {recipe.mins} min</span>}
    {!large && <button type="button" className={`heart ${saved ? 'saved' : ''}${pulse ? ' just-saved' : ''}`}
      aria-label={`${saved ? 'Remove from' : 'Add to'} favourites`} aria-pressed={saved} onAnimationEnd={() => setPulse(false)} onClick={() => {setPulse(!saved);onFavorite?.();}}>
      <Heart size={19} fill={saved ? 'currentColor' : 'none'} strokeWidth={2.6} aria-hidden="true" />
    </button>}
  </div>;
}

export function RecipeGrid({ recipes, favorites, larder, onFavorite, onOpen, onReset, stock = {}, servings = {}, onAddMissing }: Props) {
  if (!recipes.length) return <div className="empty">
    <div className="empty-icon">🍽️</div><h3>No recipes found</h3>
    <p>Try another search or filter.</p>
    {onReset && <Button tone="primary" size="small" onClick={onReset}>Show everything</Button>}
  </div>;
  return <div className="recipe-grid">{recipes.map(recipe => {
    const inStock = inLarder(recipe, larder);
    const missing = missingRequiredIngredients(recipe, larder, stock, servings[recipe.id] ?? 4);
    return <article className="recipe-card" key={recipe.id}>
      <RecipeArt recipe={recipe} saved={favorites.includes(recipe.id)}
        onFavorite={() => onFavorite(recipe.id)} />
      <div className="recipe-info">
        <div className="recipe-card-eyebrow"><Soup size={13} aria-hidden="true" /> {recipe.onePot ? 'One pot' : recipe.ing.length <= 5 ? `${recipe.ing.length} ingredients` : 'Family favourite'}</div>
        <h3><a className="recipe-card-link" href={recipePath(recipe.id)}
          onClick={event => visitRecipe(event, recipe.id, onOpen)}>
          {recipe.title}</a></h3><p>{recipe.description}</p>
        {onAddMissing && missing.length > 0 && <div className="recipe-missing"><span>Need: {missing.map(item => ingredientName(item.id)).join(', ')}</span><button type="button" onClick={() => onAddMissing(recipe.id)}>Add missing to shopping</button></div>}
        <div className="card-foot">
          <span className="foot-meta" data-in-stock={inStock > 0}>
            <span className="foot-stock-dot" aria-hidden="true" />{inStock}/{recipe.ing.length} in larder
          </span>
          <span className="recipe-card-cue" aria-hidden="true">
            <span>View recipe</span><ArrowRight size={16} />
          </span>
        </div>
      </div>
    </article>;
  })}</div>;
}
