import { type RefObject } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Clock3, Heart, ShoppingBasket, X } from 'lucide-react';
import { ingredientName } from '../data';
import type { Recipe, RecipeModal } from '../types';
import { RecipeArt } from './RecipeGrid';
import { Button } from '../ui/controls';

const icons: Record<string, string> = {
  potatoes: '🥔', 'baked-beans': '🫘', cheese: '🧀', butter: '🧈', rice: '🍚', chicken: '🍗',
  sausages: '🌭', 'chopped-tomatoes': '🍅', onion: '🧅', garlic: '🧄', pasta: '🍝',
  eggs: '🥚', 'frozen-peas': '🫛', carrots: '🥕', bread: '🍞', ham: '🥓',
  milk: '🥛', lettuce: '🥬', 'sweetcorn': '🌽', 'fish-fingers': '🐟',
  'kidney-beans': '🫘', 'butter-beans': '🫘', wraps: '🫓', tuna: '🐟', meatballs: '🥩',
};

export function RecipeDialog({ modal, recipe, larder, saved, onClose, onView, onReroll, onAddMissing, onFavorite, returnFocusRef }: {
  modal: RecipeModal; recipe: Recipe; larder: string[]; saved: boolean;
  onClose: () => void; onView: () => void; onReroll: () => void; onAddMissing: () => void; onFavorite: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const random = modal.kind === 'random';
  return <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="overlay" />
      <Dialog.Content className="modal recipe-detail"
        onCloseAutoFocus={event => {
          event.preventDefault();
          if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
        }}>
        <Dialog.Close className="modal-close" aria-label="Close dialog"><X size={20} aria-hidden="true" /></Dialog.Close>
        <RecipeArt recipe={recipe} saved={saved} large />
        <div className="modal-body">
          <div className="recipe-detail-meta"><Clock3 size={15} aria-hidden="true" /> {recipe.mins} MIN <span aria-hidden="true">·</span> SERVES 4</div>
          {random && <span className="recipe-random-tag">🎲 TONIGHT'S PICK!</span>}
          <Dialog.Title><span className="sr-only">{random ? 'Random dinner suggestion: ' : 'Recipe: '}</span>{recipe.title}</Dialog.Title>
          <Dialog.Description>{recipe.description} Simple ingredients, proper comfort food.</Dialog.Description>
          {random ? <div className="random-actions">
            <Button tone="primary" onClick={onView}>🍴 See recipe</Button>
            <Button onClick={onReroll}>🎲 Roll again</Button>
          </div> : <>
            <div className="recipe-detail-actions">
              <Button tone="primary" onClick={onAddMissing} icon={<ShoppingBasket size={18} />}>🛒 Add missing bits</Button>
              <Button onClick={onFavorite} icon={<Heart size={18} fill={saved ? 'currentColor' : 'none'} />}>{saved ? '♥ Saved' : '♡ Save recipe'}</Button>
            </div>
            <section className="recipe-detail-panel">
              <h3>What you'll need <span>4 servings</span></h3>
              <div className="recipe-ingredients">{recipe.ing.map(item => {
                const owned = larder.includes(item.id);
                return <div className="ingredient-line" key={item.id}>
                  <span className="ingredient-icon" aria-hidden="true">{icons[item.id] || '🥄'}</span>
                  <span className="ingredient-description"><strong>{item.qty}</strong> {ingredientName(item.id)}</span>
                  <span className={`stock-tag ${owned ? 'have' : 'need'}`}>{owned ? '✓ In larder' : '+ Need'}</span>
                </div>;
              })}</div>
            </section>
            <section className="recipe-detail-panel">
              <h3>Let's make it <span>Easy peasy</span></h3>
              <ol className="steps">{recipe.steps.map((step, i) => <li key={i}><span className="step-number" aria-hidden="true">{i + 1}</span><span>{step}</span></li>)}</ol>
            </section>
          </>}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
