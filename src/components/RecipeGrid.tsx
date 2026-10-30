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

export function RecipeArt({ recipe, saved, onFavorite, large = false }: {
  recipe: Recipe; saved: boolean; onFavorite?: () => void; large?: boolean;
}) {
  return <div className={large ? 'modal-art' : 'recipe-pic'} style={{ background: recipe.color }}>
    {!large && <span className="tiny-label">{recipe.mins} min</span>}
    <div className="food-plate"><span className="food-emoji" role="img" aria-label={recipe.title}>{recipe.emoji}</span></div>
    {!large && <button type="button" className={`heart ${saved ? 'saved' : ''}`}
      aria-label={`${saved ? 'Remove from' : 'Add to'} favourites`} aria-pressed={saved} onClick={onFavorite}>
      {saved ? '♥' : '♡'}
    </button>}
  </div>;
}

export function RecipeGrid({ recipes, favorites, larder, onFavorite, onOpen, onReset }: Props) {
  if (!recipes.length) return <div className="empty">
    <div className="empty-icon">🍽️</div><h3>No recipes found</h3>
    <p>Try another search or filter.</p>
    {onReset && <Button tone="primary" size="small" onClick={onReset}>Show everything</Button>}
  </div>;
  return <div className="recipe-grid">{recipes.map(recipe => <article className="recipe-card" key={recipe.id}>
    <RecipeArt recipe={recipe} saved={favorites.includes(recipe.id)} onFavorite={() => onFavorite(recipe.id)} />
    <div className="recipe-info"><h3>{recipe.title}</h3><p>{recipe.description}</p>
      <div className="card-foot"><span className="foot-meta">🫙 {inLarder(recipe, larder)}/{recipe.ing.length} in larder</span>
        <button type="button" className="open-recipe" onClick={() => onOpen(recipe.id)} aria-label={`View ${recipe.title}`}>View →</button>
      </div>
    </div>
  </article>)}</div>;
}
