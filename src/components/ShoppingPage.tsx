import { ingredientName, ingredients } from '../data';
import { tescoSearchUrl } from '../lib/recipes';
import { shoppingPackHint, shoppingQuantity } from '../lib/quantities';
import type { ShoppingEntry } from '../types';
import { CheckCheck, ClipboardCopy, ExternalLink, X } from 'lucide-react';
import { Button, IconButton } from '../ui/controls';

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
  const remaining = shopping.filter(item => !item.done);
  const purchased = shopping.filter(item => item.done);
  const sections = ['Cupboard', 'Fridge', 'Freezer'] as const;
  return <>
    <div className="page-intro blue"><div><h2>Shopping, sorted.</h2><p>Just the bits you're missing. No giant lists.</p></div><div className="intro-icon" aria-hidden="true">🧺</div></div>
    {shopping.length > 0 ? <>
      <div className="shop-actions"><Button size="small" icon={<ClipboardCopy size={16} />} onClick={onCopy}>Copy list</Button>
        <Button size="small" icon={<CheckCheck size={16} />} onClick={onClear}>Remove ticked items</Button></div>
      <p role="status" aria-live="polite">{remaining.length} to buy · {purchased.length} ticked off</p>
      <div className="shop-list">{sections.map(section => {
        const entries = [...remaining, ...purchased].filter(item => ingredients[item.id]?.[1] === section);
        if (!entries.length) return null;
        return <section key={section} aria-label={`${section} shopping items`}><h3>{section}</h3>{entries.map(item => <div className={`shop-row ${item.done ? 'done' : ''}`} key={item.id}>
        <input type="checkbox" checked={item.done} aria-label={`Mark ${ingredientName(item.id)} as purchased`}
          onChange={event => onToggle(item.id, event.target.checked)} />
        <div className="shop-item"><strong>{ingredientName(item.id)}</strong>
          <span className="shop-quantity">{shoppingQuantity(item, servings, stock)}</span>
          {shoppingPackHint(item, servings) && <small className="shop-pack-hint">{shoppingPackHint(item, servings)}</small>}
          <small>{item.from.length ? `For ${item.from.length} recipe${item.from.length === 1 ? '' : 's'}` : 'Added to your list'}</small></div>
        <a className="tesco-link" target="_blank" rel="noopener noreferrer" href={tescoSearchUrl(item.id)}
          aria-label={`Find ${ingredientName(item.id)} at Tesco`}>Tesco <ExternalLink size={14} aria-hidden="true" /></a>
        <IconButton className="shop-remove" onClick={() => onRemove(item.id)}
          label={`Remove ${ingredientName(item.id)}`}><X size={18} aria-hidden="true" /></IconButton>
      </div>)}</section>;
      })}</div>
    </> : <div className="empty"><div className="empty-icon">🧺</div><h3>Looking delightfully empty.</h3>
      <p>Open a recipe and tap “Add missing bits”.</p>
      <Button tone="primary" size="small" onClick={onBrowse}>Browse recipes</Button>
    </div>}
    <div className="info-bar" style={{ marginTop: 24 }}><strong>🛍️ Tesco links open product searches</strong>
      <small>Grouped by cupboard, fridge and freezer, with unchecked items first. Quantities combine recipes with matching units; different units remain separate. Only entered larder quantities are subtracted when units match; unchecked stock quantities remain estimates. Check your cupboards before shopping. Tesco basket integration isn't supported.</small></div>
  </>;
}
