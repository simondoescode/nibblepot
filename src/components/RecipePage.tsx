
import { ArrowLeft, Check, Clock3, Heart, Share2, ShoppingBasket, Minus, Plus, ChefHat, CalendarPlus } from 'lucide-react';
import { ingredientName } from '../data';
import { useState } from 'react';
import { MAX_SERVINGS, MIN_SERVINGS, formatRecipeQuantity } from '../lib/quantities';
import { recipePath } from '../lib/routes';
import type { Recipe } from '../types';
import { Button } from '../ui/controls';

const ingredientIcons: Record<string, string> = {
  potatoes: '🥔', 'baked-beans': '🫘', cheese: '🧀', butter: '🧈', rice: '🍚', chicken: '🍗',
  sausages: '🌭', 'chopped-tomatoes': '🍅', onion: '🧅', garlic: '🧄', pasta: '🍝',
  eggs: '🥚', 'frozen-peas': '🫛', carrots: '🥕', bread: '🍞', ham: '🥓',
  milk: '🥛', lettuce: '🥬', 'sweetcorn': '🌽', 'fish-fingers': '🐟',
  'kidney-beans': '🫘', 'butter-beans': '🫘', wraps: '🫓', tuna: '🐟', meatballs: '🥩',
};

export function RecipePage({ recipe, larder, saved, servings, onServingsChange, onBack, onAddMissing, onFavorite, onPlan, onCook, notify }: {
  recipe: Recipe; larder: string[]; saved: boolean;
  servings: number; onServingsChange: (value: number) => void;
  onBack: () => void; onAddMissing: (includedOptional: string[]) => void; onFavorite: () => void; onPlan: (opener: HTMLButtonElement) => void; onCook: () => void; notify: (message: string) => void;
}) {
  const [pulse,setPulse] = useState(false);
  const [includedOptional, setIncludedOptional] = useState<string[]>([]);
  const shareRecipe = async () => {
    const url = new URL(recipePath(recipe.id), window.location.origin).href;
    if (navigator.share) {
      try {
        await navigator.share({ title: recipe.title, text: recipe.description, url });
        return;
      } catch (error) {
        // Cancelling the native share sheet should not copy a link unexpectedly.
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      notify('Recipe link copied!');
    } catch {
      notify('Sharing is unavailable here');
    }
  };
  return <article className="recipe-page" aria-label={recipe.title}>
    <div className="recipe-page-toolbar">
      <button className="recipe-back" type="button" onClick={onBack}><ArrowLeft size={18} /> Back to recipes</button>
      <Button size="small" icon={<Share2 size={16} />} onClick={shareRecipe}>Share recipe</Button>
    </div>
    <div className="recipe-page-hero">
      <div className="recipe-page-image">
        <img src={`${import.meta.env.BASE_URL}${recipe.image ?? `recipes/${recipe.id}.svg`}`}
          className={recipe.image ? 'recipe-photo' : ''} alt={`Finished ${recipe.title}`}
          width="800" height="504" decoding="async"
          onError={event => {
            const fallback = `${import.meta.env.BASE_URL}recipes/${recipe.id}.svg`;
            if (!event.currentTarget.src.endsWith(fallback)) event.currentTarget.src = fallback;
          }} />
      </div>
      <div className="recipe-page-intro">
        <span className="recipe-page-eyebrow">FROM THE SIMMER KITCHEN</span>
        <h1>{recipe.title}</h1>
        <p>{recipe.description}</p>
        <div className="recipe-page-facts">
          <span><Clock3 size={18} aria-hidden="true" /> {recipe.mins} minutes</span>
          <span>🍽️ Serves {servings}</span>
          <span>🫙 {recipe.ing.filter(i => larder.includes(i.id)).length} of {recipe.ing.length} in larder</span>
        </div>
        <div className="recipe-page-actions">
          <Button tone="primary" icon={<ChefHat size={18} />} onClick={onCook}>Start cooking</Button>
          <Button className="recipe-plan-action" aria-haspopup="dialog" icon={<CalendarPlus size={18} />}
            onClick={event => onPlan(event.currentTarget)}>Plan this dinner</Button>
          <Button icon={<ShoppingBasket size={18} />} onClick={() => onAddMissing(includedOptional)}>Add missing bits</Button>
          <Button icon={<Heart size={18} fill={saved ? 'currentColor' : 'none'} />} onClick={() => {setPulse(!saved);onFavorite();}} className={pulse ? 'just-saved' : ''} onAnimationEnd={() => setPulse(false)}
            aria-pressed={saved}>{saved ? 'Saved to favourites' : 'Save recipe'}</Button>
        </div>
      </div>
    </div>
    <div className="recipe-page-sections">
      <section className="recipe-detail-panel recipe-page-ingredients">
        <h2>What you'll need <span>{servings} servings</span></h2>
        <div className="servings-control" aria-label="Adjust recipe servings">
          <span>Servings</span>
          <button type="button" onClick={() => onServingsChange(Math.max(MIN_SERVINGS, servings - 1))}
            disabled={servings <= MIN_SERVINGS} aria-label="Fewer servings"><Minus size={17} /></button>
          <output aria-live="polite" aria-label="Servings count">{servings}</output>
          <button type="button" onClick={() => onServingsChange(Math.min(MAX_SERVINGS, servings + 1))}
            disabled={servings >= MAX_SERVINGS} aria-label="More servings"><Plus size={17} /></button>
        </div>
        <div className="recipe-ingredients">{recipe.ing.map(item => {
          const owned = larder.includes(item.id);
          return <div className="ingredient-line" key={item.id}>
            <span className="ingredient-icon" aria-hidden="true">{ingredientIcons[item.id] || '🥄'}</span>
            <span className="ingredient-description">
              <strong>{formatRecipeQuantity(item, servings)}</strong> {ingredientName(item.id)}
              {item.optional && <label className="recipe-optional"><input type="checkbox"
                checked={includedOptional.includes(item.id)}
                onChange={event => setIncludedOptional(current => event.target.checked
                  ? [...current, item.id] : current.filter(id => id !== item.id))} />
                Include optional ingredient</label>}
            </span>
            <span className={`stock-tag ${owned ? 'have' : 'need'}`}>
              {owned ? <><Check size={13} aria-hidden="true" /> In larder</> : item.optional ? 'Optional' : '+ Need'}</span>
          </div>;
        })}</div>
      </section>
      <section className="recipe-detail-panel recipe-page-method">
        <h2>Method</h2>
        <ol className="steps">{recipe.steps.map((step, index) =>
          <li key={index}><span className="step-number" aria-hidden="true">{index + 1}</span><span>{step}</span></li>
        )}</ol>
      </section>
    </div>
    <section className="recipe-safety-panel" aria-labelledby="recipe-safety-heading">
      <h2 id="recipe-safety-heading">Good to know</h2>
      <p><strong>Cooking safely:</strong> {recipe.safety}</p>
      <p><strong>Leftovers:</strong> {recipe.storage}</p>
      <small>Recipe reviewed {recipe.reviewedOn} · General guidance: <a href="https://www.food.gov.uk/safety-hygiene/cooking-your-food" target="_blank" rel="noopener noreferrer">Food Standards Agency</a>.</small>
    </section>
    <div className="recipe-page-bottom">
      <Button onClick={onBack} icon={<ArrowLeft size={17} />}>More recipes</Button>
      <span>Made for real-life tea times ✳</span>
    </div>
  </article>;
}
