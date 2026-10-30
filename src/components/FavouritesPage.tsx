import { recipes } from '../data';
import { RecipeGrid } from './RecipeGrid';
import { Button } from '../ui/controls';

export function FavouritesPage({ favorites, larder, onFavorite, onOpen, onBrowse }: {
  favorites: string[]; larder: string[]; onFavorite: (id: string) => void; onOpen: (id: string) => void; onBrowse: () => void;
}) {
  const saved = recipes.filter(recipe => favorites.includes(recipe.id));
  return <>
    <div className="page-intro pink"><div><h2>Saved for later. ❤️</h2><p>Your tried-and-true tea-time favourites.</p></div><div className="intro-icon">💘</div></div>
    {saved.length > 0 ? <RecipeGrid recipes={saved} favorites={favorites} larder={larder} onFavorite={onFavorite} onOpen={onOpen} /> :
      <div className="empty"><div className="empty-icon">♡</div><h3>Nothing saved yet</h3>
        <p>Tap the heart on any recipe to keep it here.</p>
        <Button tone="primary" size="small" onClick={onBrowse}>Find a favourite</Button>
      </div>}
  </>;
}
