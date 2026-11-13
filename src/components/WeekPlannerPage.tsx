import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import * as Dialog from '../ui/dialog';
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, Clock3, Dice5, Pencil, Plus, RotateCcw, Search, ShoppingBasket, Snowflake, Trash2, X } from 'lucide-react';
import { ingredientName, recipes } from '../data';
import { shoppingQuantity } from '../lib/quantities';
import { dateForWeekDay, mondayFor, shiftWeek, shoppingPlanSignature, weekContributions, WEEK_DAYS as days, weekSlotTitle } from '../lib/weeklyPlan';
import type { WeekSlot } from '../types';
import { Button } from '../ui/controls';
import { WeekShareDialog } from './WeekShareDialog';

const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const weekDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

type MealFilter = 'all' | 'quick' | 'onepot' | 'larder';
const filters: { key: MealFilter; label: string }[] = [
  {key:'all',label:'All meals'}, {key:'quick',label:'30 min or less'},
  {key:'onepot',label:'One-pot'}, {key:'larder',label:'Use my larder'},
];
function sameSlot(a: WeekSlot,b: WeekSlot): boolean {
  return a.kind === b.kind && (a.kind !== 'recipe' || (b.kind === 'recipe' && a.id === b.id));
}
export function WeekPlannerPage({ week, slots, larder, servings, stock, shoppingPlan, hasGeneratedShopping, onWeekChange, onChange, onReplace, onShuffle, onClear, onAdd, onRecipe }: {
  week: string; slots: WeekSlot[]; larder: string[]; servings: Record<string,number>; stock?: Record<string,string>;
  shoppingPlan?: {week:string;signature:string}; hasGeneratedShopping:boolean;
  onWeekChange: (week: string) => void;
  onChange: (index: number, value: WeekSlot) => void; onReplace: (slots: WeekSlot[]) => void;
  onShuffle: () => void; onClear: () => void; onAdd: () => void;
  onRecipe: (id: string) => void;
}) {

  const [direction,setDirection] = useState<'forward'|'back'|'direct'>('direct');
  const [changedDay,setChangedDay] = useState<number|null>(null);
  const lastEditing = useRef(0);
  const [editingDay,setEditingDay] = useState<number|null>(null);
  const [query,setQuery] = useState('');
  const [filter,setFilter] = useState<MealFilter>('all');
  const [clearPending,setClearPending] = useState(false);
  const [dragOver,setDragOver] = useState<number|null>(null);
  const [undo,setUndo] = useState<{week:string;before:WeekSlot[];description:string}|null>(null);
  const opener = useRef<HTMLButtonElement|null>(null);
  useEffect(() => {
    setEditingDay(null);
    setChangedDay(null);
    setClearPending(false);
    setUndo(null);
    setQuery('');
    setFilter('all');
  },[week]);
  const remember = (description:string) => setUndo({
    week,before:slots.map(slot=>({...slot})),description
  });
  const chooseMeal = (choice:WeekSlot) => {
    if(editingDay === null) return;
    if(!sameSlot(slots[editingDay],choice)){
      remember(days[editingDay] + ' dinner changed');
      setChangedDay(editingDay);
      onChange(editingDay,choice);
    }
    setEditingDay(null);
  };
  const openPicker = (event: MouseEvent<HTMLButtonElement>, index:number) => {
    opener.current=event.currentTarget;
    lastEditing.current=index;
    setEditingDay(index);
    setQuery('');
    setFilter('all');
    setClearPending(false);
  };
  const shuffle = () => {remember('Dinners shuffled');onShuffle();setClearPending(false);};
  const clear = () => {remember('Week cleared');onClear();setClearPending(false);};
  const revert = () => {if(undo?.week === week){onReplace(undo.before);setUndo(null);}};
  const dropMeal = (index:number, raw:string) => {
    setDragOver(null);
    const [kind,value] = raw.split(':');
    if(kind === 'recipe' && recipes.some(recipe=>recipe.id===value)) {
      if(sameSlot(slots[index],{kind:'recipe',id:value})) return;
      remember(days[index] + ' dinner changed');setChangedDay(index);onChange(index,{kind:'recipe',id:value});
    } else if(kind === 'day') {
      const from = Number(value);
      if(!Number.isInteger(from) || from<0 || from>=slots.length || from===index) return;
      remember('Dinners moved');
      const next=slots.map(slot=>({...slot}));[next[from],next[index]]=[next[index],next[from]];
      setChangedDay(index);onReplace(next);
    }
  };
  const planned = slots.filter(slot => slot.kind === 'recipe');
  const hasShoppingHistory = hasGeneratedShopping || !!shoppingPlan;
  const synced = shoppingPlan?.week === week && shoppingPlan.signature ===
    shoppingPlanSignature(week,slots,larder,servings,stock);
  const shoppingNeedsUpdate = hasShoppingHistory && !synced;
  const shoppingForAnotherWeek = !!shoppingPlan && shoppingPlan.week !== week;
  const canUpdateShopping = planned.length > 0 || (shoppingNeedsUpdate && !shoppingForAnotherWeek);
  const usedOn = new Map<string,string[]>();
  slots.forEach((slot,index)=>{
    if(slot.kind!=='recipe' || index===editingDay) return;
    usedOn.set(slot.id,[...(usedOn.get(slot.id)??[]),days[index]]);
  });
  const visibleRecipes = useMemo(() => {
    const needle=query.trim().toLocaleLowerCase('en-GB');
    const found=recipes.filter(recipe=>{
      if(needle && ![recipe.title,recipe.description,
        ...recipe.ing.map(item=>ingredientName(item.id))]
        .some(value=>value.toLocaleLowerCase('en-GB').includes(needle)))return false;
      if(filter==='quick' && recipe.mins>30)return false;
      if(filter==='onepot' && !recipe.onePot)return false;
      return true;
    });
    if(filter==='larder')found.sort((a,b)=>{
      const missing=(id:string)=>recipes.find(recipe=>recipe.id===id)!.ing
        .filter(item=>!item.optional && !larder.includes(item.id)).length;
      return missing(a.id)-missing(b.id)||a.mins-b.mins;
    });
    return found;
  },[query,filter,larder]);

  const preview = useMemo(() => weekContributions(slots,larder,stock,servings),[slots,larder,stock,servings]);
  const today = new Date();
  const thisWeek = mondayFor(today);
  const isThisWeek = week === thisWeek;
  const range = weekDate.formatRange(dateForWeekDay(week, 0), dateForWeekDay(week, 6));
  return <div className="planner-page">
    <header className="page-intro planner-intro">
      <span className="intro-icon" aria-hidden="true"><CalendarDays size={23}/></span>
      <div><h2>This week's dinners</h2><p>Plan dinners and shop for the week.</p></div>
    </header>
    <div className="planner-week-head">
      <div className="planner-week-picker" role="group" aria-label="Choose a week">
        <button type="button" aria-label="Previous week" onClick={() => {setDirection('back');onWeekChange(shiftWeek(week,-1));}}><ArrowLeft size={19} aria-hidden="true"/></button>
        <div className="planner-week-range" aria-live="polite">
          <small>{isThisWeek ? 'Current week' : 'Week of ' + shortDate.format(dateForWeekDay(week, 0))}</small>
          <strong>{range}</strong>
        </div>
        <button type="button" aria-label="Next week" onClick={() => {setDirection('forward');onWeekChange(shiftWeek(week,1));}}><ArrowRight size={19} aria-hidden="true"/></button>
      </div>
      <div className="planner-tools">
        <WeekShareDialog week={week} slots={slots} servings={servings}/>
        {!isThisWeek && <Button size="small" onClick={()=>onWeekChange(thisWeek)}>This week</Button>}
        <Button size="small" icon={<Dice5 size={16}/>} onClick={shuffle}>Shuffle dinners</Button>
        {clearPending ? <span className="planner-clear-confirm" role="group" aria-label="Confirm clearing the week">
          <button type="button" onClick={()=>setClearPending(false)}>Cancel</button>
          <button type="button" onClick={clear}>Confirm clear week</button>
        </span> : <Button size="small" icon={<Trash2 size={15}/>} onClick={()=>setClearPending(true)}>Clear week</Button>}
      </div>
    </div>
    <section className="planner-shopping-action" aria-label="Shopping for this week">
      <div>
        <strong>{preview.length} ingredient{preview.length === 1 ? '' : 's'} to buy</strong>
        <p className={'planner-sync '+(shoppingNeedsUpdate?'needs-update':synced?'is-synced':'')} role="status">
          {synced ? 'Shopping list matches this week' : shoppingForAnotherWeek ? 'Shopping list is for a different week.' :
            shoppingNeedsUpdate ? 'Update your shopping list to match this plan.' :
            canUpdateShopping ? 'Generate a list from this week.' : 'Choose a dinner to start a shopping list.'}
        </p>
      </div>
      <Button tone="primary" icon={<ShoppingBasket size={18}/>} onClick={onAdd}
        disabled={!canUpdateShopping}>{hasShoppingHistory?'Update shopping list':'Add week to shopping'}</Button>
    </section>
    {undo?.week===week && <div className="planner-undo" role="status">
      <span><Check size={17} aria-hidden="true"/> {undo.description}. Saved on this device.</span>
      <button type="button" onClick={revert}><RotateCcw size={15} aria-hidden="true"/> Undo</button>
    </div>}
    <section className="planner-drag-tray" aria-label="Quick add dinners">
      <strong>Quick add dinners</strong><span>Drag a meal onto a day on tablets and desktop, or tap to choose as usual.</span>
      <div className="planner-drag-recipes">{recipes.slice(0,6).map(recipe=><div key={recipe.id} className="planner-drag-recipe" draggable
        onDragStart={event=>{event.dataTransfer.setData('text/plain','recipe:'+recipe.id);event.dataTransfer.effectAllowed='copy';}}>
        {recipe.title}</div>)}</div>
    </section>
    <div className="planner-layout">
      <div className="planner-days" key={week} data-direction={direction}>
        {slots.map((slot,index) => {
          const recipe = slot.kind === 'recipe' ? recipes.find(r=>r.id===slot.id) : undefined;
          const isToday = isThisWeek && index === (today.getDay() + 6) % 7;
          return <section className={`planner-day${changedDay === index ? ' just-changed' : ''}`} onAnimationEnd={() => setChangedDay(null)} key={index}
            draggable onDragStart={event=>{event.dataTransfer.setData('text/plain','day:'+index);event.dataTransfer.effectAllowed='move';}}
            onDragOver={event=>{event.preventDefault();setDragOver(index);}}
            onDragLeave={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setDragOver(null);}}
            onDrop={event=>{event.preventDefault();dropMeal(index,event.dataTransfer.getData('text/plain'));}}
            data-drop-target={dragOver===index ? 'true' : undefined}
            data-today={isToday || undefined}>
            <div className="planner-day-label" aria-current={isToday ? 'date' : undefined}>
              <strong className="planner-day-name">{days[index]}</strong>
              <strong className="planner-day-short">{days[index].slice(0, 3)}</strong>
              <span>{shortDate.format(dateForWeekDay(week, index))}</span>
              {isToday && <small>Today</small>}
            </div>
            <button type="button" className="planner-day-picker"
              aria-label={'Change '+days[index]+' dinner'} aria-haspopup="dialog"
              onClick={event=>openPicker(event,index)}>
              {recipe ? <img className="planner-meal-thumb" alt="" width="70" height="56" loading="lazy"
                src={import.meta.env.BASE_URL+(recipe.image ?? 'recipes/'+recipe.id+'.svg')}/> :
                <span className="planner-meal-thumb" data-kind={slot.kind} aria-hidden="true">
                  {slot.kind === 'leftovers' ? <RotateCcw size={18}/> :
                    slot.kind === 'freezer' ? <Snowflake size={18}/> : <Plus size={20}/>}
                </span>}
              <span className="planner-picked"><strong>{weekSlotTitle(slot)}</strong>
                <small>{recipe ? recipe.mins+' min · serves '+(servings[recipe.id]??4) :
                  slot.kind==='leftovers'?'Use what’s left':
                  slot.kind==='freezer'?'A night off cooking':'Tap to pick a meal'}</small>
              </span>
              <Pencil size={15} aria-hidden="true" className="planner-change-icon"/>
            </button>
            {recipe && <button type="button" className="planner-view" aria-label={'View recipe for '+days[index]}
              title="View recipe" onClick={()=>onRecipe(recipe.id)}>
              <ArrowUpRight size={20} aria-hidden="true"/>
            </button>}
          </section>;
        })}
      </div>
      <aside className="planner-summary">
        <div className="planner-summary-top"><span>DINNER PLAN</span>
          <div className="planner-big">{planned.length}<small>planned dinners</small></div>
          <p>{slots.filter(s=>s.kind==='leftovers'||s.kind==='freezer').length} leftovers or freezer nights</p>
        </div>
        <h3>What you'll need</h3>
        {preview.length ? <>
          <p className="planner-note">{preview.length} missing ingredients across your planned dinners.</p>
          <ul className="planner-preview">{preview.slice(0,9).map(item=><li key={item.id}><span>{ingredientName(item.id)}</span><strong>{shoppingQuantity(item,servings,stock)}</strong></li>)}</ul>
          {preview.length>9&&<p className="planner-note">+ {preview.length-9} more when you update your shopping list</p>}
        </> : <p className="planner-note">Nothing to buy for this plan.</p>}
        <p className="planner-note">Shopping updates when you tap the button above. Manually added items stay.</p>
      </aside>
    </div>
    <Dialog.Root historyKey="planner-meal-picker" open={editingDay !== null} onOpenChange={open=>setEditingDay(open ? lastEditing.current : null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="planner-picker-overlay"/>
        <Dialog.Content className="planner-picker-dialog" aria-describedby="planner-picker-description"
          onCloseAutoFocus={event=>{event.preventDefault();opener.current?.focus();}}>
          <div className="planner-picker-handle" aria-hidden="true"/>
          <div className="planner-picker-heading">
            <div>
              <Dialog.Title>Change {days[editingDay ?? lastEditing.current]} dinner</Dialog.Title>
              <Dialog.Description id="planner-picker-description">Choose a recipe or easy night. Your change saves automatically.</Dialog.Description>
            </div>
            <Dialog.Close className="planner-picker-close" aria-label="Close meal picker"><X size={22}/></Dialog.Close>
          </div>
          <div className="planner-picker-shortcuts" aria-label="Other dinner options">
            <button type="button" onClick={()=>chooseMeal({kind:'leftovers'})}>Leftovers</button>
            <button type="button" onClick={()=>chooseMeal({kind:'freezer'})}>Freezer / easy</button>
            <button type="button" onClick={()=>chooseMeal({kind:'empty'})}>Clear night</button>
          </div>
          <label className="planner-picker-search"><Search size={20} aria-hidden="true"/>
            <input type="search" aria-label="Search meals" autoComplete="off" placeholder="Search meals or ingredients…"
              value={query} onChange={event=>setQuery(event.target.value)}/>
            {query && <button type="button" aria-label="Clear meal search" onClick={()=>setQuery('')}><X size={18}/></button>}
          </label>
          <div className="planner-picker-filters" aria-label="Filter meals">
            {filters.map(item=><button type="button" key={item.key} aria-pressed={filter===item.key}
              onClick={()=>setFilter(item.key)}>{item.label}</button>)}
          </div>
          <p className="planner-picker-count" role="status">{visibleRecipes.length} meals to choose from</p>
          <div className="planner-picker-results">
            {visibleRecipes.map(recipe=>{
              const used=usedOn.get(recipe.id);
              const selected=editingDay!==null && slots[editingDay].kind==='recipe' && slots[editingDay].id===recipe.id;
              const required=recipe.ing.filter(item=>!item.optional).length;
              const owned=recipe.ing.filter(item=>!item.optional&&larder.includes(item.id)).length;
              return <button key={recipe.id} type="button" className="planner-meal-option"
                aria-label={'Choose '+recipe.title} aria-pressed={selected}
                onClick={()=>chooseMeal({kind:'recipe',id:recipe.id})}>
                <img width="100" height="80" alt="" loading="lazy"
                  src={import.meta.env.BASE_URL+(recipe.image ?? 'recipes/'+recipe.id+'.svg')}/>
                <span className="planner-meal-copy"><strong>{recipe.title}</strong>
                  <small><Clock3 size={13} aria-hidden="true"/> {recipe.mins} min · {owned}/{required} ingredients in larder</small>
                  {used?.length ? <em>Also on {used.join(', ')}</em>:null}
                </span>
                {selected ? <Check className="planner-meal-selected" size={22}/> :
                  <ArrowRight className="planner-meal-arrow" size={19}/>}
              </button>;
            })}
            {!visibleRecipes.length && <div className="planner-picker-empty">No matching dinners.
              <button type="button" onClick={()=>{setQuery('');setFilter('all');}}>Show all meals</button></div>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </div>;
}
