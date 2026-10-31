
import { ArrowLeft, Check, Clock3, Heart, Link2, ShoppingBasket } from 'lucide-react';
import { ingredientName } from '../data';
import type { Recipe } from '../types';
import { Button } from '../ui/controls';

const ingredientIcons: Record<string, string> = {
  potatoes: '🥔', 'baked-beans': '🫘', cheese: '🧀', butter: '🧈', rice: '🍚', chicken: '🍗',
  sausages: '🌭', 'chopped-tomatoes': '🍅', onion: '🧅', garlic: '🧄', pasta: '🍝',
  eggs: '🥚', 'frozen-peas': '🫛', carrots: '🥕', bread: '🍞', ham: '🥓',
  milk: '🥛', lettuce: '🥬', 'sweetcorn': '🌽', 'fish-fingers': '🐟',
  'kidney-beans': '🫘', 'butter-beans': '🫘', wraps: '🫓', tuna: '🐟', meatballs: '🥩',
};

export function RecipePage({ recipe, larder, saved, onBack, onAddMissing, onFavorite, notify }: {
  recipe: Recipe; larder: string[]; saved: boolean;
  onBack: () => void; onAddMissing: () => void; onFavorite: () => void; notify: (message: string) => void;
}) {
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify('Recipe link copied!');
    } catch {
      notify('Copy not available here');
    }
  };
  return <article className="recipe-page" aria-label={recipe.title}>
    <div className="recipe-page-toolbar">
      <button className="recipe-back" type="button" onClick={onBack}><ArrowLeft size={18} /> Back to recipes</button>
      <Button size="small" icon={<Link2 size={16} />} onClick={copyLink}>Copy link</Button>
    </div>
    <div className="recipe-page-hero">
      <div className="recipe-page-image">
        <img src={`${import.meta.env.BASE_URL}${recipe.image ?? `recipes/${recipe.id}.svg`}`}
          className={recipe.image ? 'recipe-photo' : ''} alt={`Finished ${recipe.title}`}
          width="800" height="504" decoding="async" />
      </div>
      <div className="recipe-page-intro">
        <span className="recipe-page-eyebrow">✳ GOOD GRUB. ZERO FAFF.</span>
        <h1>{recipe.title}</h1>
        <p>{recipe.description}</p>
        <div className="recipe-page-facts">
          <span><Clock3 size={18} aria-hidden="true" /> {recipe.mins} minutes</span>
          <span>🍽️ Serves 4</span>
          <span>🫙 {recipe.ing.filter(i => larder.includes(i.id)).length} of {recipe.ing.length} in larder</span>
        </div>
        <div className="recipe-page-actions">
          <Button tone="primary" icon={<ShoppingBasket size={18} />} onClick={onAddMissing}>Add missing bits</Button>
          <Button icon={<Heart size={18} fill={saved ? 'currentColor' : 'none'} />} onClick={onFavorite}
            aria-pressed={saved}>{saved ? 'Saved to favourites' : 'Save recipe'}</Button>
        </div>
      </div>
    </div>
    <div className="recipe-page-sections">
      <section className="recipe-detail-panel recipe-page-ingredients">
        <h2>What you'll need <span>4 servings</span></h2>
        <div className="recipe-ingredients">{recipe.ing.map(item => {
          const owned = larder.includes(item.id);
          return <div className="ingredient-line" key={item.id}>
            <span className="ingredient-icon" aria-hidden="true">{ingredientIcons[item.id] || '🥄'}</span>
            <span className="ingredient-description"><strong>{item.qty}</strong> {ingredientName(item.id)}</span>
            <span className={`stock-tag ${owned ? 'have' : 'need'}`}>
              {owned ? <><Check size={13} aria-hidden="true" /> In larder</> : '+ Need'}</span>
          </div>;
        })}</div>
      </section>
      <section className="recipe-detail-panel recipe-page-method">
        <h2>Let's make it <span>Easy peasy</span></h2>
        <ol className="steps">{recipe.steps.map((step, index) =>
          <li key={index}><span className="step-number" aria-hidden="true">{index + 1}</span><span>{step}</span></li>
        )}</ol>
      </section>
    </div>
    <div className="recipe-page-bottom">
      <Button onClick={onBack} icon={<ArrowLeft size={17} />}>More recipes</Button>
      <span>Made for real-life tea times ✳</span>
    </div>
  </article>;
}
