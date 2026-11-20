import { Clock3, Heart } from 'lucide-react';
import { type MouseEvent } from 'react';
import { MotionMark } from '../ui/MotionMark';
import { recipePath } from '../lib/routes';
import type { Recipe } from '../types';
import { missingRequiredIngredients } from '../lib/recipes';
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
  const image = <img
    className={`recipe-illustration${recipe.image ? " recipe-photo" : ""}`}
    src={`${import.meta.env.BASE_URL}${recipe.image ?? 'recipes/jacket.svg'}`}
    alt="" width="800" height="504"
    loading={large ? 'eager' : 'lazy'} decoding="async"
    onError={event => {
      const fallback = `${import.meta.env.BASE_URL}recipes/jacket.svg`;
      if (!event.currentTarget.src.endsWith(fallback)) event.currentTarget.src = fallback;
    }}
  />;
  return <div className={large ? 'modal-art illustrated-art' : 'recipe-pic illustrated-art'}>
    {image}
    {!large && <button type="button" className={`heart ${saved ? 'saved' : ''}`}
      aria-label={`${saved ? 'Remove from' : 'Add to'} favourites`} aria-pressed={saved} onClick={() => onFavorite?.()}>
      <MotionMark active={saved}><Heart size={19} fill={saved ? 'currentColor' : 'none'} strokeWidth={2.6} aria-hidden="true" /></MotionMark>
    </button>}
  </div>;
}

export function RecipeGrid({ recipes, favorites, larder, onFavorite, onOpen, onReset, stock = {}, servings = {} }: Props) {
  if (!recipes.length) return <div className="empty">
    <div className="empty-icon">🍽️</div><h3>No recipes found</h3>
    <p>Try another search or filter.</p>
    {onReset && <Button tone="primary" size="small" onClick={onReset}>Show everything</Button>}
  </div>;
  return <div className="recipe-grid menu-grid">{recipes.map(recipe => {
    const missing = missingRequiredIngredients(recipe, larder, stock, servings[recipe.id] ?? 4);
    return <article className="recipe-card" key={recipe.id}>
      <RecipeArt recipe={recipe} saved={favorites.includes(recipe.id)}
        onFavorite={() => onFavorite(recipe.id)} />
      <div className="recipe-info">
        <h3><a className="recipe-card-link" href={recipePath(recipe.id)}
          onClick={event => visitRecipe(event, recipe.id, onOpen)}>
          {recipe.title}</a></h3><p>{recipe.description}</p>
        <div className="menu-meta">
          <span className="foot-meta"><Clock3 size={14} aria-hidden="true" />{recipe.mins} min</span>
          {larder.length > 0 && <span>{missing.length === 0 ? 'Ready to cook' : `${missing.length} ingredient${missing.length === 1 ? '' : 's'} missing`}</span>}
        </div>
      </div>
    </article>;
  })}</div>;
}
