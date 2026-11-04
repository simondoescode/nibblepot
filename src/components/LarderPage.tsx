import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { ingredients, recipes } from '../data';
import { useItUpRecipes } from '../lib/recipes';
import { Button } from '../ui/controls';

const groups = [{ name: 'Cupboard', icon: '🥫' }, { name: 'Fridge', icon: '🧀' }, { name: 'Freezer', icon: '❄️' }] as const;

export function LarderPage({ larder, quantities = {}, dates = {}, onDate, onOpenRecipe, onQuantity, onToggle, onFindMeals }: {
  larder: string[]; quantities?: Record<string,string>; dates?: Record<string,string>;
  onDate: (id:string,value:string)=>void; onOpenRecipe: (id:string)=>void; onQuantity: (id:string, value:string)=>void;
  onToggle: (id: string, checked: boolean) => void; onFindMeals: () => void;
}) {
  const [query,setQuery] = useState('');
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const suggestions = useItUpRecipes(recipes,larder,dates,today).slice(0,3);
  const overdue = Object.entries(dates).filter(([id,date])=>larder.includes(id) && date < today).length;
  const normalized = query.trim().toLocaleLowerCase('en-GB');
  const matches = Object.entries(ingredients).filter(([, [name]]) => name.toLocaleLowerCase('en-GB').includes(normalized));
  return <>
    <div className="page-intro"><div><h2>What's in your larder?</h2><p>Search and tick what you've got. Add an amount if you know it (e.g. 200 g or 2 tins).</p></div><div className="intro-icon" aria-hidden="true">🥫</div></div>
    <div className="larder-layout"><div>
      <div className="larder-searchbar">
        <Search size={20} aria-hidden="true"/>
        <input type="search" aria-label="Search larder ingredients" value={query}
          placeholder="Find an ingredient…" onChange={event=>setQuery(event.target.value)}/>
        {query && <button type="button" aria-label="Clear larder search" onClick={()=>setQuery('')}><X size={18}/></button>}
      </div>
      <p className="larder-result-count" role="status">{matches.length} ingredient{matches.length===1?'':'s'} found</p>
      {matches.length===0 ? <div className="panel larder-no-results"><strong>No ingredients match “{query}”</strong>
        <Button size="small" onClick={()=>setQuery('')}>Clear search</Button></div> : groups.map(group => {
          const entries = matches.filter(([, [, section]]) => section === group.name);
          if (!entries.length) return null;
          return <section className="panel" key={group.name}><h3>{group.icon} {group.name}</h3>
            <div className="item-grid">{entries.map(([id, [name]]) => <label className="larder-item" key={id}>
              <input type="checkbox" checked={larder.includes(id)} onChange={event => onToggle(id, event.target.checked)} />
              <span>{name}</span>
              {larder.includes(id) && <input type="date" aria-label={`${name} use-by date`} value={dates[id] ?? ''} onChange={event=>onDate(id,event.target.value)} />}
              {larder.includes(id) && <input type="text" className="larder-quantity" aria-label={`${name} quantity in stock`} placeholder="e.g. 200 g" value={quantities[id] ?? ''} onChange={event=>onQuantity(id,event.target.value)} />}
            </label>)}</div>
          </section>;
        })}
    </div>
      <aside className="larder-aside"><span>✨ YOU'RE STOCKED!</span>
        <div className="big">{larder.length}</div><strong>ingredients ready to go</strong>
        <p>See which dinners need the fewest extra bits. Your larder stays on this device.</p>
        <Button tone="primary" onClick={onFindMeals}>🍳 What can I make?</Button>
        {overdue > 0 && <p role="status">{overdue} item{overdue===1?'':'s'} past the date you entered. Check food safety guidance; do not assume it is safe to eat.</p>}
        {suggestions.length > 0 && <section aria-label="Use it up recipe suggestions"><h3>Use it up soon</h3><p>Recipes using ingredients dated within three days. Always check food safety and freshness.</p>{suggestions.map(recipe=><p key={recipe.id}><button type="button" onClick={()=>onOpenRecipe(recipe.id)}>{recipe.title} · {recipe.mins} min</button></p>)}</section>}
        <p style={{ fontSize: 12, marginBottom: 0 }}>We've added a few example ingredients to get you started. Change them to match your cupboards.</p>
      </aside>
    </div>
  </>;
}
