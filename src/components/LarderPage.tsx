import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { ingredients } from '../data';
import { Button } from '../ui/controls';

const groups = [{ name: 'Cupboard', icon: '🥫' }, { name: 'Fridge', icon: '🧀' }, { name: 'Freezer', icon: '❄️' }] as const;

export function LarderPage({ larder, onToggle, onFindMeals }: {
  larder: string[]; onToggle: (id: string, checked: boolean) => void; onFindMeals: () => void;
}) {
  const [query,setQuery] = useState('');
  const normalized = query.trim().toLocaleLowerCase('en-GB');
  const matches = Object.entries(ingredients).filter(([, [name]]) => name.toLocaleLowerCase('en-GB').includes(normalized));
  return <>
    <div className="page-intro"><div><h2>What's in your larder? 🫙</h2><p>Search and tick what you've got. We'll do the thinking.</p></div><div className="intro-icon">🥫</div></div>
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
            </label>)}</div>
          </section>;
        })}
    </div>
      <aside className="larder-aside"><span>✨ YOU'RE STOCKED!</span>
        <div className="big">{larder.length}</div><strong>ingredients ready to go</strong>
        <p>See which dinners need the fewest extra bits. Your larder stays on this device.</p>
        <Button tone="primary" onClick={onFindMeals}>🍳 What can I make?</Button>
        <p style={{ fontSize: 12, marginBottom: 0 }}>We've added a few example ingredients to get you started. Change them to match your cupboards.</p>
      </aside>
    </div>
  </>;
}
