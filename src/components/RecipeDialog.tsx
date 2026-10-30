import { type RefObject } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { ingredientName } from '../data';
import type { Recipe, RecipeModal } from '../types';
import { RecipeArt } from './RecipeGrid';
import { Button } from '../ui/controls';

export function RecipeDialog({ modal, recipe, larder, saved, onClose, onView, onReroll, onAddMissing, onFavorite, returnFocusRef }: {
  modal: RecipeModal; recipe: Recipe; larder: string[]; saved: boolean;
  onClose: () => void; onView: () => void; onReroll: () => void; onAddMissing: () => void; onFavorite: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const random = modal.kind === 'random';
  return <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="overlay" />
      <Dialog.Content className="modal"
        onCloseAutoFocus={event => {
          // The recipe cards and surprise-me button are external to Dialog.Root.
          event.preventDefault();
          if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
        }}>
        <Dialog.Close className="modal-close" aria-label="Close dialog">
          <X size={20} aria-hidden="true" />
        </Dialog.Close>
        {random && <div className="random-intro">🎲 The dinner gods have spoken!</div>}
        <RecipeArt recipe={recipe} saved={saved} large />
        <div className="modal-body">
          <span className="modal-topline">{random ? 'Tonight’s pick!' : `⏱ ${recipe.mins} min · Serves 4`}</span>
          <Dialog.Title><span className="sr-only">{random ? 'Random dinner suggestion: ' : 'Recipe: '}</span>{recipe.title}</Dialog.Title>
          <Dialog.Description>{recipe.description} · {recipe.mins} minutes · serves 4</Dialog.Description>
          {random ? <div className="random-actions">
            <Button tone="primary" onClick={onView}>🍴 See recipe</Button>
            <Button onClick={onReroll}>🎲 Roll again</Button>
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
              <Button tone="primary" onClick={onAddMissing}>🛒 Add missing bits</Button>
              <Button onClick={onFavorite}>{saved ? '♥ Saved' : '♡ Save recipe'}</Button>
            </div>
          </>}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
