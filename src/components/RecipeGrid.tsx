import { ArrowUpRight, Clock3, Heart, Soup } from 'lucide-react';
import type { Recipe } from '../types';
import { inLarder } from '../lib/recipes';
import { Button } from '../ui/controls';

type Props = {
  recipes: Recipe[];
  favorites: string[];
  larder: string[];
  onFavorite: (id: string) => void;
  onOpen: (id: string) => void;
  onReset?: () => void;
};

/** Lightweight, local SVG art. No external images, per-user requests or layout shifts. */
export function RecipeArt({ recipe, saved, onFavorite, onOpen, large = false }: {
  recipe: Recipe; saved: boolean; onFavorite?: () => void; onOpen?: () => void; large?: boolean;
}) {
  const image = <img
    className={`recipe-illustration${recipe.image ? " recipe-photo" : ""}`}
    src={`${import.meta.env.BASE_URL}${recipe.image ?? `recipes/${recipe.id}.svg`}`}
    alt="" width="800" height="504"
    loading={large ? 'eager' : 'lazy'} decoding="async"
  />;
  return <div className={large ? 'modal-art illustrated-art' : 'recipe-pic illustrated-art'}>
    {large ? image : <button type="button" className="recipe-art-open" onClick={onOpen}
      aria-label={`View ${recipe.title}`}>{image}</button>}
    {!large && <span className="tiny-label"><Clock3 size={13} aria-hidden="true" /> {recipe.mins} min</span>}
    {!large && <button type="button" className={`heart ${saved ? 'saved' : ''}`}
      aria-label={`${saved ? 'Remove from' : 'Add to'} favourites`} aria-pressed={saved} onClick={onFavorite}>
      <Heart size={19} fill={saved ? 'currentColor' : 'none'} strokeWidth={2.6} aria-hidden="true" />
    </button>}
  </div>;
}

export function RecipeGrid({ recipes, favorites, larder, onFavorite, onOpen, onReset }: Props) {
  if (!recipes.length) return <div className="empty">
    <div className="empty-icon">🍽️</div><h3>No recipes found</h3>
    <p>Try another search or filter.</p>
    {onReset && <Button tone="primary" size="small" onClick={onReset}>Show everything</Button>}
  </div>;
  return <div className="recipe-grid">{recipes.map(recipe => {
    const inStock = inLarder(recipe, larder);
    return <article className="recipe-card" key={recipe.id}>
      <RecipeArt recipe={recipe} saved={favorites.includes(recipe.id)}
        onFavorite={() => onFavorite(recipe.id)} onOpen={() => onOpen(recipe.id)} />
      <div className="recipe-info">
        <div className="recipe-card-eyebrow"><Soup size={13} aria-hidden="true" /> {recipe.onePot ? 'ONE-POT FAVOURITE' : recipe.ing.length <= 5 ? 'MINIMAL INGREDIENTS' : 'FAMILY FAVOURITE'}</div>
        <h3>{recipe.title}</h3><p>{recipe.description}</p>
        <div className="card-foot">
          <span className="foot-meta"><span className="foot-stock-dot" aria-hidden="true" />{inStock} of {recipe.ing.length} in larder</span>
          <button type="button" className="open-recipe" onClick={() => onOpen(recipe.id)} aria-label={`Open recipe: ${recipe.title}`}>
            <span>Let's cook</span><ArrowUpRight size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>;
  })}</div>;
}
