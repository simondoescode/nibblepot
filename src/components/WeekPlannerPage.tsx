import { useMemo } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Dice5, ShoppingBasket, Trash2 } from 'lucide-react';
import { recipes } from '../data';
import { shoppingQuantity } from '../lib/quantities';
import { shiftWeek, weekContributions } from '../lib/weeklyPlan';
import type { WeekSlot } from '../types';
import { Button } from '../ui/controls';

const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
function dateFor(week: string, index: number): Date {
  const [y,m,d] = week.split('-').map(Number);
  return new Date(y,m-1,d+index,12);
}
function valueOf(slot: WeekSlot): string {
  return slot.kind === 'recipe' ? 'recipe:' + slot.id : slot.kind;
}
function parseValue(value: string): WeekSlot {
  if (value.startsWith('recipe:')) return {kind:'recipe',id:value.slice(7)};
  return {kind:value as 'leftovers' | 'freezer' | 'empty'};
}

export function WeekPlannerPage({ week, slots, larder, servings, onWeekChange, onChange, onShuffle, onClear, onAdd, onRecipe }: {
  week: string; slots: WeekSlot[]; larder: string[]; servings: Record<string,number>;
  onWeekChange: (week: string) => void;
  onChange: (index: number, value: WeekSlot) => void;
  onShuffle: () => void; onClear: () => void; onAdd: () => void;
  onRecipe: (id: string) => void;
}) {
  const planned = slots.filter(slot => slot.kind === 'recipe');
  const preview = useMemo(() => weekContributions(slots,larder),[slots,larder]);
  const start = dateFor(week,0);
  const end = dateFor(week,6);
  const range = new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'}).format(start) +
    ' – ' + new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(end);
  return <div className="planner-page">
    <div className="page-intro planner-intro"><div><h2>This week's tea. 📅</h2>
      <p>Seven days, less head-scratching. Pick dinners, plan leftovers, shop once.</p>
    </div><div className="intro-icon" aria-hidden="true">🍲</div></div>
    <div className="planner-week-head">
      <div className="planner-week-picker">
        <button type="button" aria-label="Previous week" onClick={() => onWeekChange(shiftWeek(week,-1))}><ArrowLeft size={18}/></button>
        <div><CalendarDays size={17} aria-hidden="true"/><strong>{range}</strong></div>
        <button type="button" aria-label="Next week" onClick={() => onWeekChange(shiftWeek(week,1))}><ArrowRight size={18}/></button>
      </div>
      <div className="planner-tools">
        <Button size="small" icon={<Dice5 size={16}/>} onClick={onShuffle}>Shuffle dinners</Button>
        <Button size="small" icon={<Trash2 size={15}/>} onClick={onClear}>Clear week</Button>
      </div>
    </div>
    <div className="planner-layout">
      <div className="planner-days">
        {slots.map((slot,index) => {
          const recipe = slot.kind === 'recipe' ? recipes.find(r=>r.id===slot.id) : undefined;
          return <section className="planner-day" key={index}>
            <div className="planner-day-label"><strong>{days[index]}</strong>
              <span>{new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'}).format(dateFor(week,index))}</span>
            </div>
            <div className="planner-day-main">
              <label htmlFor={`planner-slot-${index}`} className="sr-only">{days[index]} dinner</label>
              <select id={`planner-slot-${index}`} aria-label={days[index] + ' dinner'} value={valueOf(slot)}
                onChange={event => onChange(index,parseValue(event.target.value))}>
                <option value="empty">Choose a dinner…</option>
                <option value="leftovers">♻️ Leftovers night</option>
                <option value="freezer">❄️ Freezer / easy night</option>
                {recipes.map(item => <option key={item.id} value={'recipe:'+item.id}>{item.title}</option>)}
              </select>
              <span className="planner-day-hint">{recipe ? `${recipe.mins} min · serves ${servings[recipe.id] ?? 4}` :
                slot.kind === 'leftovers' ? 'Make yesterday’s dinner go further' :
                slot.kind === 'freezer' ? 'Give yourself a night off' : 'No meal selected'}</span>
            </div>
            {recipe ? <button type="button" className="planner-view" onClick={()=>onRecipe(recipe.id)}>View recipe <ArrowRight size={15}/></button> :
              <span className="planner-occasion" aria-hidden="true">{slot.kind==='leftovers'?'♻️':slot.kind==='freezer'?'❄️':'＋'}</span>}
          </section>;
        })}
      </div>
      <aside className="planner-summary">
        <div className="planner-summary-top"><span>THE WEEK AT A GLANCE</span>
          <div className="planner-big">{planned.length}<small>planned dinners</small></div>
          <p>{slots.filter(s=>s.kind==='leftovers'||s.kind==='freezer').length} leftovers / freezer nights. No ingredients added for those nights.</p>
        </div>
        <h3>What you'll need</h3>
        {preview.length ? <>
          <p className="planner-note">{preview.length} missing ingredients across your planned dinners.</p>
          <ul className="planner-preview">{preview.slice(0,9).map(item=><li key={item.id}><span>{item.id.replace(/-/g,' ')}</span><strong>{shoppingQuantity(item,servings)}</strong></li>)}</ul>
          {preview.length>9&&<p className="planner-note">+ {preview.length-9} more in your shopping list</p>}
        </> : <p className="planner-note">Nothing to buy yet — choose meals or check your larder.</p>}
        <Button tone="primary" icon={<ShoppingBasket size={18}/>} onClick={onAdd}
          disabled={planned.length===0} >Add week to shopping</Button>
        <p className="planner-note">Replaces your previous planner items, but keeps manually added shopping items. Check quantities already in your larder.</p>
      </aside>
    </div>
    <p className="planner-footnote">Try <button type="button" onClick={()=>onChange(5,{kind:'leftovers'})}>leftovers on Saturday</button> or <button type="button" onClick={()=>onChange(6,{kind:'freezer'})}>an easy Sunday</button>. Your plan is saved on this device.</p>
  </div>;
}
