import { ingredientName } from '../data';
import { tescoSearchUrl } from '../lib/recipes';
import type { ShoppingEntry } from '../types';

export function ShoppingPage({ shopping, onToggle, onRemove, onClear, onCopy, onBrowse }: {
  shopping: ShoppingEntry[];
  onToggle: (id: string, done: boolean) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCopy: () => void;
  onBrowse: () => void;
}) {
  return <>
    <div className="page-intro blue"><div><h2>Shopping, sorted. 🛒</h2><p>Just the bits you're missing. No giant lists.</p></div><div className="intro-icon">🧺</div></div>
    {shopping.length > 0 ? <>
      <div className="shop-actions"><button type="button" className="btn btn-cream btn-small" onClick={onCopy}>📋 Copy list</button>
        <button type="button" className="btn btn-cream btn-small" onClick={onClear}>✓ Remove ticked items</button></div>
      <div className="shop-list">{shopping.map(item => <div className={`shop-row ${item.done ? 'done' : ''}`} key={item.id}>
        <input type="checkbox" checked={item.done} aria-label={`Mark ${ingredientName(item.id)} as purchased`}
          onChange={event => onToggle(item.id, event.target.checked)} />
        <div className="shop-item"><strong>{ingredientName(item.id)}</strong>
          <small>{item.from.length ? `For ${item.from.length} recipe${item.from.length === 1 ? '' : 's'} · see recipe for quantities` : 'Added to your list'}</small></div>
        <a className="tesco-link" target="_blank" rel="noopener noreferrer" href={tescoSearchUrl(item.id)}
          aria-label={`Find ${ingredientName(item.id)} at Tesco`}>Tesco ↗</a>
        <button type="button" className="shop-remove" onClick={() => onRemove(item.id)}
          aria-label={`Remove ${ingredientName(item.id)}`}>×</button>
      </div>)}</div>
    </> : <div className="empty"><div className="empty-icon">🧺</div><h3>Looking delightfully empty.</h3>
      <p>Open a recipe and tap “Add missing ingredients”.</p>
      <button type="button" className="btn btn-primary btn-small" onClick={onBrowse}>Browse recipes</button>
    </div>}
    <div className="info-bar" style={{ marginTop: 24 }}><strong>🛍️ Tesco links open product searches</strong>
      <small>Adding items straight to a Tesco basket isn't supported in this demo.</small></div>
  </>;
}
