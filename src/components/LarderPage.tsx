import { useState } from 'react';
import { createPortal } from 'react-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { CookingPot, Search, X, ArrowRight } from 'lucide-react';
import { ingredients, recipes } from '../data';
import { useItUpRecipes } from '../lib/recipes';
import { parseQuantity } from '../lib/quantities';
import { Button, FilterChip } from '../ui/controls';

const groups = ['Cupboard', 'Fridge', 'Freezer'] as const;
const units = ['each', 'g', 'kg', 'ml', 'l', 'tins', 'large', 'slices', 'cloves', 'cubes', 'tsp', 'tbsp', 'sheets'];

function StockDetails({ name, quantity, date, onSave }: {
  name: string; quantity: string; date: string; onSave: (quantity: string, date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('each');
  const [custom, setCustom] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [error, setError] = useState('');
  const changeOpen = (next: boolean) => {
    if (next) {
      setError('');
      const parsed = /^(\d+(?:\.\d+)?)\s*(.*)$/.exec(quantity);
      const suffix = parsed?.[2] || 'each';
      const supported = parsed && units.includes(suffix);
      setAmount(supported ? parsed[1] : '');
      setUnit(quantity && !supported ? 'custom' : supported ? suffix : 'each');
      setCustom(quantity);
      setDraftDate(date);
    }
    setOpen(next);
  };
  return <Dialog.Root open={open} onOpenChange={changeOpen}>
    <Dialog.Trigger className="larder-amount" aria-label={`Edit ${name} stock details`}>
      <span>{quantity || 'Add amount'}</span>{date && <small>Date added</small>}
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="larder-sheet-overlay" />
      <Dialog.Content className="larder-sheet">
        <span className="larder-sheet-handle" aria-hidden="true" />
        <div className="larder-sheet-heading"><Dialog.Title>{name}</Dialog.Title>
          <Dialog.Close className="larder-sheet-close" aria-label="Close stock details"><X size={22} /></Dialog.Close></div>
        <Dialog.Description>How much have you got? Amount and date are optional.</Dialog.Description>
        <form onSubmit={event => {
          event.preventDefault();
          const value = unit === 'custom' ? custom.trim() : amount ? `${amount}${unit === 'each' ? '' : ` ${unit}`}` : '';
          const parsed = parseQuantity(value);
          if (value && (value.length > 40 || parsed.value === undefined || parsed.value <= 0 || parsed.value > 100000)) {
            setError('Use a positive amount up to 100,000 with a unit such as g, kg or tins.');
            return;
          }
          onSave(value, draftDate);
          setOpen(false);
        }}>
          <div className="larder-amount-fields">
            <label>{unit === 'custom' ? 'Quantity' : 'Amount'}
              {unit === 'custom' ? <input aria-label={`${name} quantity in stock`} maxLength={40} value={custom} onChange={e=>setCustom(e.target.value)} />
                : <input aria-label={`${name} amount`} type="number" inputMode="decimal" min="0" step="any" placeholder="e.g. 200" value={amount} onChange={e=>setAmount(e.target.value)} />}</label>
            <label>Unit<select value={unit} onChange={e=>setUnit(e.target.value)}>
              {units.map(value=><option key={value} value={value}>{value}</option>)}<option value="custom">Custom</option>
            </select></label>
          </div>
          <label className="larder-date-field">Use-by date (optional)<input type="date" aria-label={`${name} use-by date`} value={draftDate} onChange={e=>setDraftDate(e.target.value)} /></label>
          <p className="larder-sheet-note">Use the date on the packaging. Always check food safety and freshness.</p>
          {error && <p role="alert">{error}</p>}
          <div className="larder-sheet-actions"><Dialog.Close asChild><Button>Cancel</Button></Dialog.Close>
            <Button type="submit" tone="primary">Save details</Button></div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

export function LarderPage({ larder, quantities = {}, dates = {}, onDate, onOpenRecipe, onQuantity, onToggle, onFindMeals }: {
  larder: string[]; quantities?: Record<string,string>; dates?: Record<string,string>;
  onDate: (id:string,value:string)=>void; onOpenRecipe: (id:string)=>void; onQuantity: (id:string, value:string)=>void;
  onToggle: (id: string, checked: boolean) => void; onFindMeals: () => void;
}) {
  const [query,setQuery] = useState('');
  const [filter,setFilter] = useState('All');
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const suggestions = useItUpRecipes(recipes,larder,dates,today).slice(0,3);
  const overdue = Object.entries(dates).filter(([id,date])=>larder.includes(id) && date && date < today).length;
  const normalized = query.trim().toLocaleLowerCase('en-GB');
  const matches = Object.entries(ingredients).filter(([id, [name, section]]) =>
    name.toLocaleLowerCase('en-GB').includes(normalized) &&
    (filter === 'All' || (filter === 'In stock' ? larder.includes(id) : section === filter)));
  return <div className="larder-page">
    <div className="page-intro larder-intro"><div><h2>Your larder</h2><p>{larder.length} ingredient{larder.length===1?'':'s'} in stock · saved on this device</p></div><div className="intro-icon" aria-hidden="true"><CookingPot size={30}/></div></div>
    <div className="larder-layout"><div className="larder-catalogue">
      <div className="larder-tools" data-no-pull>
        <div className="larder-searchbar">
          <Search size={20} aria-hidden="true"/>
          <input type="search" aria-label="Search larder ingredients" value={query}
            placeholder="Find an ingredient…" onChange={event=>setQuery(event.target.value)}/>
          {query && <button type="button" aria-label="Clear larder search" onClick={()=>setQuery('')}><X size={18}/></button>}
        </div>
        <div className="chips larder-filters" role="group" aria-label="Filter larder ingredients">
          {['All','In stock',...groups].map(value=><FilterChip key={value} selected={filter===value} onClick={()=>setFilter(value)}>{value}</FilterChip>)}
        </div>
        <p className="larder-result-count" role="status">{matches.length} ingredient{matches.length===1?'':'s'}{filter==='All'?'':` · ${filter.toLowerCase()}`}{query ? ` matching “${query}”` : ''}</p>
      </div>
      {matches.length===0 ? <div className="panel larder-no-results"><strong>{query ? `No ingredients match “${query}”` : 'Nothing in stock yet'}</strong>
        <p>Tick the ingredients you have. Amounts are optional.</p>
        <Button size="small" onClick={()=>{setQuery('');setFilter('All');}}>Show all ingredients</Button></div> : groups.map(group => {
          const entries = matches.filter(([, [, section]]) => section === group);
          if (!entries.length) return null;
          return <section className="panel larder-group" key={group}><h3>{group}<span>{entries.length}</span></h3>
            <div className="item-grid">{entries.map(([id, [name]]) => <div className="larder-item" key={id}>
              <label className="larder-stock-toggle"><input type="checkbox" checked={larder.includes(id)} onChange={event => onToggle(id, event.target.checked)} />
                <span>{name}</span></label>
              {larder.includes(id) && <StockDetails name={name} quantity={quantities[id] ?? ''} date={dates[id] ?? ''}
                onSave={(quantity,date)=>{onQuantity(id,quantity);onDate(id,date);}} />}
            </div>)}</div>
          </section>;
        })}
    </div>
      <aside className="larder-aside"><strong>Dinner starts here.</strong>
        <div className="big">{larder.length}</div><strong>ingredients ready to go</strong>
        <p>Find dinners that need the fewest extra bits.</p>
        <Button tone="primary" onClick={onFindMeals}>What can I make?</Button>
        {overdue > 0 && <p role="status">{overdue} item{overdue===1?'':'s'} past the date you entered. Check food safety guidance; do not assume it is safe to eat.</p>}
        {suggestions.length > 0 && <section aria-label="Use it up recipe suggestions"><h3>Use it up soon</h3><p>Recipes using ingredients dated within three days. Always check food safety and freshness.</p>{suggestions.map(recipe=><p key={recipe.id}><button type="button" onClick={()=>onOpenRecipe(recipe.id)}>{recipe.title} · {recipe.mins} min</button></p>)}</section>}
        <p className="larder-example-note">We've added a few example ingredients to get you started. Change them to match your cupboards.</p>
      </aside>
    </div>
    {createPortal(<div className="larder-meals-bar"><Button tone="dark" onClick={onFindMeals}>Find meals with my {larder.length} ingredient{larder.length===1?'':'s'}<ArrowRight size={18} aria-hidden="true"/></Button></div>, document.body)}
  </div>;
}
