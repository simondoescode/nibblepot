import { useEffect, useState } from 'react';
import { ExternalLink, ShoppingBasket } from 'lucide-react';
import { parseSharedShopping, SHOPPING_SECTIONS, type SharedShopping } from '../lib/shoppingShare';
import { tescoSearchUrl } from '../lib/recipes';
import { Button } from '../ui/controls';

function SharedChecklist({ list, onShopping }: { list: SharedShopping; onShopping: () => void }) {
  const key = 'simmer-shared-shopping-' + list.id;
  const [checked, setChecked] = useState<boolean[]>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) ?? 'null');
      if (Array.isArray(saved) && saved.length === list.items.length && saved.every(value => typeof value === 'boolean')) return saved;
    } catch { /* A blocked storage area must not prevent shopping. */ }
    return list.items.map(item => item.done);
  });
  useEffect(() => { try { sessionStorage.setItem(key, JSON.stringify(checked)); } catch { /* Keep ticking without storage. */ } }, [key, checked]);
  const done = checked.filter(Boolean).length;
  return <section className="shopping-screen shared-shopping-page">
    <header className="page-intro shopping-heading"><span className="intro-icon" aria-hidden="true"><ShoppingBasket size={22}/></span><h1>A shared shopping list</h1></header>
    <p className="shared-week-note">Tick things off as you shop. Your ticks stay on this device for this visit and won’t update the sender’s list. Your own shopping list stays as it is.</p>
    <div className="shopping-summary">
      <p role="status"><strong>{list.items.length - done} to buy</strong><span>{done} of {list.items.length} ticked off</span></p>
      <progress aria-label="Shared shopping progress" value={done} max={list.items.length}/>
    </div>
    <div className="shop-list">
      {SHOPPING_SECTIONS.map(section => {
        const entries = list.items.map((item, index) => ({ item, index })).filter(({ item }) => item.section === section);
        return entries.length ? <section key={section} aria-label={section + ' shared shopping items'}>
          <h2>{section}</h2><ul className="shopping-group">
            {entries.map(({ item, index }) => <li className={'shop-row' + (checked[index] ? ' done' : '')} key={index}>
              <label className="shopping-toggle">
                <input type="checkbox" checked={checked[index]} aria-label={'Mark ' + item.name + ' as purchased'}
                  onChange={event => setChecked(current => current.map((value, i) => i === index ? event.target.checked : value))}/>
                <span className="shop-item"><strong>{item.name}</strong>
                  {item.quantity && <span className="shop-quantity">{item.quantity}</span>}
                  {item.hint && <small className="shop-pack-hint">{item.hint}</small>}
                </span>
              </label>
              <a className="tesco-link" href={tescoSearchUrl('', item.name)} target="_blank" rel="noopener noreferrer" aria-label={'Find ' + item.name + ' at Tesco'}>Tesco <ExternalLink size={12} aria-hidden="true"/></a>
            </li>)}
          </ul>
        </section> : null;
      })}
    </div>
    <Button onClick={onShopping}>Open my shopping list</Button>
  </section>;
}

export function SharedShoppingPage({ onShopping }: { onShopping: () => void }) {
  const [list, setList] = useState(() => parseSharedShopping(location.hash));
  useEffect(() => {
    const sync = () => setList(parseSharedShopping(location.hash));
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  if (!list) return <section className="recipe-page-not-found"><h1>This shopping link isn’t complete</h1>
    <p>Ask the sender to share the list again.</p><Button onClick={onShopping}>Open my shopping list</Button></section>;
  return <SharedChecklist key={list.id} list={list} onShopping={onShopping}/>;
}
