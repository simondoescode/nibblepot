import { useState } from 'react';
import { ClipboardCopy, ExternalLink, ListX, ShoppingBasket, X } from 'lucide-react';
import { ingredientName, ingredients } from '../data';
import { tescoSearchUrl } from '../lib/recipes';
import { shoppingPackHint, shoppingQuantity } from '../lib/quantities';
import type { ShoppingEntry } from '../types';
import { Button, IconButton } from '../ui/controls';

const sections = ['Cupboard', 'Fridge', 'Freezer'] as const;

export function ShoppingPage({ shopping, servings, stock, onToggle, onRemove, onClear, onCopy, onBrowse }: {
  shopping: ShoppingEntry[];
  servings: Record<string, number>;
  stock?: Record<string,string>;
  onToggle: (id: string, done: boolean) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCopy: () => void;
  onBrowse: () => void;
}) {
  const [showRemaining, setShowRemaining] = useState(false);
  const remaining = shopping.filter(item => !item.done);
  const checkedCount = shopping.length - remaining.length;
  const visibleItems = showRemaining ? remaining : shopping;

  return <div className="shopping-screen">
    <header className="page-intro shopping-heading">
      <span className="intro-icon" aria-hidden="true"><ShoppingBasket size={22} /></span>
      <h2>Shopping, sorted.</h2>
    </header>
    {shopping.length > 0 ? <>
      <div className="shopping-summary">
        <p role="status"><strong>{remaining.length} to buy</strong><span>{checkedCount} of {shopping.length} ticked off</span></p>
        <progress aria-label="Shopping progress" value={checkedCount} max={shopping.length} />
        <div className="shopping-toolbar">
          <div className="shopping-filter" role="group" aria-label="Show shopping items">
            <button type="button" aria-pressed={!showRemaining} onClick={() => setShowRemaining(false)}>All</button>
            <button type="button" aria-pressed={showRemaining} onClick={() => setShowRemaining(true)}>To buy</button>
          </div>
          <div className="shopping-tools">
            <IconButton label="Copy list" title="Copy list" onClick={onCopy}>
              <ClipboardCopy size={19} aria-hidden="true" />
            </IconButton>
            <IconButton label="Remove ticked items" title="Remove ticked items" disabled={!checkedCount} onClick={onClear}>
              <ListX size={19} aria-hidden="true" />
            </IconButton>
          </div>
        </div>
      </div>
      {visibleItems.length ? <div className="shop-list">
        {sections.map(section => {
          const entries = visibleItems.filter(item => ingredients[item.id]?.[1] === section);
          if (!entries.length) return null;

          return <section key={section} aria-label={`${section} shopping items`}>
            <h3>{section}</h3>
            <ul className="shopping-group">
              {entries.map(item => {
                const name = ingredientName(item.id);
                const packHint = shoppingPackHint(item, servings);
                return <li className={`shop-row ${item.done ? 'done' : ''}`} key={item.id}>
                  <label className="shopping-toggle">
                    <input type="checkbox" checked={item.done} aria-label={`Mark ${name} as purchased`}
                      onChange={event => onToggle(item.id, event.target.checked)} />
                    <span className="shop-item">
                      <strong>{name}</strong>
                      <span className="shop-quantity">{shoppingQuantity(item, servings, stock)}</span>
                      {packHint && <small className="shop-pack-hint">{packHint}</small>}
                    </span>
                  </label>
                  <a className="tesco-link" target="_blank" rel="noopener noreferrer" href={tescoSearchUrl(item.id)}
                    aria-label={`Find ${name} at Tesco`}>Tesco <ExternalLink size={12} aria-hidden="true" /></a>
                  <IconButton className="shop-remove" onClick={() => onRemove(item.id)} label={`Remove ${name}`}>
                    <X size={17} aria-hidden="true" />
                  </IconButton>
                </li>;
              })}
            </ul>
          </section>;
        })}
      </div> : <div className="empty"><h3>Everything’s ticked off</h3>
        <Button size="small" onClick={() => setShowRemaining(false)}>Show all items</Button>
      </div>}
      <details className="shopping-help">
        <summary>About quantities and Tesco links</summary>
        <p>Quantities combine recipes with matching units. Only larder amounts you’ve entered are subtracted, and only when the units match. Tesco links open product searches.</p>
      </details>
    </> : <div className="empty"><h3>Your list is empty</h3>
      <p>Open a recipe and tap “Add missing bits”.</p>
      <Button tone="primary" size="small" onClick={onBrowse}>Browse recipes</Button>
    </div>}
  </div>;
}
