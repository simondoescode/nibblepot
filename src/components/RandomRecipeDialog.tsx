
import { type RefObject } from 'react';
import * as Dialog from '../ui/dialog';
import { X, Clock3 } from 'lucide-react';
import type { Recipe } from '../types';
import { RecipeArt } from './RecipeGrid';
import { Button } from '../ui/controls';

export function RandomRecipeDialog({ recipe, saved, open, onReopen, onClose, onView, onReroll, returnFocusRef }: {
  recipe: Recipe; saved: boolean; open: boolean; onReopen: () => void; onClose: () => void; onView: () => void; onReroll: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  return <Dialog.Root historyKey="random-dinner" open={open} onOpenChange={open => { if (!open) onClose(); else onReopen(); }}>
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
          <span className="recipe-random-tag">🎲 Tonight’s pick!</span>
          <Dialog.Title><span className="sr-only">Random dinner suggestion: </span>{recipe.title}</Dialog.Title>
          <Dialog.Description>{recipe.description}</Dialog.Description>
          <div className="random-actions">
            <Button tone="primary" onClick={onView}>🍴 See recipe</Button>
            <Button onClick={onReroll}>🎲 Roll again</Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
