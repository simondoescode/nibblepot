import { ingredients } from '../data';
import { Button } from '../ui/controls';

const groups = [{ name: 'Cupboard', icon: '🥫' }, { name: 'Fridge', icon: '🧀' }, { name: 'Freezer', icon: '❄️' }] as const;

export function LarderPage({ larder, onToggle, onFindMeals }: {
  larder: string[]; onToggle: (id: string, checked: boolean) => void; onFindMeals: () => void;
}) {
  return <>
    <div className="page-intro"><div><h2>What's in your larder? 🫙</h2><p>Tick what you've got. We'll do the thinking.</p></div><div className="intro-icon">🥫</div></div>
    <div className="larder-layout"><div>{groups.map(group =>
      <section className="panel" key={group.name}><h3>{group.icon} {group.name}</h3>
        <div className="item-grid">{Object.entries(ingredients)
          .filter(([, [, section]]) => section === group.name)
          .map(([id, [name]]) => <label className="larder-item" key={id}>
            <input type="checkbox" checked={larder.includes(id)} onChange={event => onToggle(id, event.target.checked)} />
            <span>{name}</span>
          </label>)}</div>
      </section>)}</div>
      <aside className="larder-aside"><span>✨ YOU'RE STOCKED!</span>
        <div className="big">{larder.length}</div><strong>ingredients ready to go</strong>
        <p>See which dinners need the fewest extra bits. Your larder stays on this device.</p>
        <Button tone="primary" onClick={onFindMeals}>🍳 What can I make?</Button>
        <p style={{ fontSize: 12, marginBottom: 0 }}>We've added a few example ingredients to get you started. Change them to match your cupboards.</p>
      </aside>
    </div>
  </>;
}
