import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, Dice5, Pencil, RotateCcw, Search, ShoppingBasket, Trash2, X } from 'lucide-react';
import { ingredientName, recipes } from '../data';
import { shoppingQuantity } from '../lib/quantities';
import { mondayFor, shiftWeek, shoppingPlanSignature, weekContributions } from '../lib/weeklyPlan';
import type { WeekSlot } from '../types';
import { Button } from '../ui/controls';

const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
function dateFor(week: string, index: number): Date {
  const [y,m,d] = week.split('-').map(Number);
  return new Date(y,m-1,d+index,12);
}

type MealFilter = 'all' | 'quick' | 'onepot' | 'larder';
const filters: { key: MealFilter; label: string }[] = [
  {key:'all',label:'All meals'}, {key:'quick',label:'30 min or less'},
  {key:'onepot',label:'One-pot'}, {key:'larder',label:'Use my larder'},
];
function sameSlot(a: WeekSlot,b: WeekSlot): boolean {
  return a.kind === b.kind && (a.kind !== 'recipe' || (b.kind === 'recipe' && a.id === b.id));
}
function slotTitle(slot: WeekSlot): string {
  if (slot.kind === 'recipe') return recipes.find(item=>item.id===slot.id)?.title ?? 'Choose a meal';
  return slot.kind==='leftovers'?'Leftovers night':slot.kind==='freezer'?'Freezer / easy night':'Choose a dinner';
}

export function WeekPlannerPage({ week, slots, larder, servings, shoppingPlan, hasGeneratedShopping, onWeekChange, onChange, onReplace, onShuffle, onClear, onAdd, onRecipe }: {
  week: string; slots: WeekSlot[]; larder: string[]; servings: Record<string,number>;
  shoppingPlan?: {week:string;signature:string}; hasGeneratedShopping:boolean;
  onWeekChange: (week: string) => void;
  onChange: (index: number, value: WeekSlot) => void; onReplace: (slots: WeekSlot[]) => void;
  onShuffle: () => void; onClear: () => void; onAdd: () => void;
  onRecipe: (id: string) => void;
}) {

  const [editingDay,setEditingDay] = useState<number|null>(null);
  const [query,setQuery] = useState('');
  const [filter,setFilter] = useState<MealFilter>('all');
  const [clearPending,setClearPending] = useState(false);
  const [undo,setUndo] = useState<{week:string;before:WeekSlot[];description:string}|null>(null);
  const opener = useRef<HTMLButtonElement|null>(null);
  useEffect(() => {
    setEditingDay(null);
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
      onChange(editingDay,choice);
    }
    setEditingDay(null);
  };
  const openPicker = (event: MouseEvent<HTMLButtonElement>, index:number) => {
    opener.current=event.currentTarget;
    setEditingDay(index);
    setQuery('');
    setFilter('all');
    setClearPending(false);
  };
  const shuffle = () => {remember('Dinners shuffled');onShuffle();setClearPending(false);};
  const clear = () => {remember('Week cleared');onClear();setClearPending(false);};
  const revert = () => {if(undo?.week === week){onReplace(undo.before);setUndo(null);}};
  const planned = slots.filter(slot => slot.kind === 'recipe');
  const hasShoppingHistory = hasGeneratedShopping || !!shoppingPlan;
  const synced = shoppingPlan?.week === week && shoppingPlan.signature ===
    shoppingPlanSignature(week,slots,larder,servings);
  const shoppingNeedsUpdate = hasShoppingHistory && !synced;
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

  const preview = useMemo(() => weekContributions(slots,larder),[slots,larder]);
  const start = dateFor(week,0);
  const end = dateFor(week,6);
  const range = new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'}).format(start) +
    ' – ' + new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(end);
  return <div className="planner-page">
    <div className="page-intro planner-intro"><div><h2>This week's tea.</h2>
      <p>Seven days, less head-scratching. Pick dinners, plan leftovers, shop once.</p>
    </div><div className="intro-icon" aria-hidden="true">🍲</div></div>
    <div className="planner-week-head">
      <div className="planner-week-picker">
        <button type="button" aria-label="Previous week" onClick={() => onWeekChange(shiftWeek(week,-1))}><ArrowLeft size={18}/></button>
        <div><CalendarDays size={17} aria-hidden="true"/><strong>{range}</strong></div>
        <button type="button" aria-label="Next week" onClick={() => onWeekChange(shiftWeek(week,1))}><ArrowRight size={18}/></button>
      </div>
      <div className="planner-tools">
        {week !== mondayFor(new Date()) && <Button size="small" onClick={()=>onWeekChange(mondayFor(new Date()))}>This week</Button>}
        <Button size="small" icon={<Dice5 size={16}/>} onClick={shuffle}>Shuffle dinners</Button>
        {clearPending ? <span className="planner-clear-confirm" role="group" aria-label="Confirm clearing the week">
          <button type="button" onClick={()=>setClearPending(false)}>Cancel</button>
          <button type="button" onClick={clear}>Confirm clear week</button>
        </span> : <Button size="small" icon={<Trash2 size={15}/>} onClick={()=>setClearPending(true)}>Clear week</Button>}
      </div>
    </div>
    {undo?.week===week && <div className="planner-undo" role="status">
      <span><Check size={17} aria-hidden="true"/> {undo.description}. Saved on this device.</span>
      <button type="button" onClick={revert}><RotateCcw size={15} aria-hidden="true"/> Undo</button>
    </div>}
    <div className="planner-layout">
      <div className="planner-days">
        {slots.map((slot,index) => {
          const recipe = slot.kind === 'recipe' ? recipes.find(r=>r.id===slot.id) : undefined;
          return <section className="planner-day" key={index}>
            <div className="planner-day-label"><strong>{days[index]}</strong>
              <span>{new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'}).format(dateFor(week,index))}</span>
            </div>
            <div className="planner-day-main">
              <button type="button" className="planner-day-picker"
                aria-label={'Change '+days[index]+' dinner'} aria-haspopup="dialog"
                onClick={event=>openPicker(event,index)}>
                {recipe && <img alt="" width="70" height="56" loading="lazy"
                  src={import.meta.env.BASE_URL+(recipe.image ?? 'recipes/'+recipe.id+'.svg')}/>}
                <span className="planner-picked"><strong>{slotTitle(slot)}</strong>
                  <small>{recipe ? recipe.mins+' min · serves '+(servings[recipe.id]??4) :
                    slot.kind==='leftovers'?'Make yesterday’s dinner go further':
                    slot.kind==='freezer'?'A night off cooking':'Tap to pick a meal'}</small>
                </span>
                <Pencil size={17} aria-hidden="true" className="planner-change-icon"/>
              </button>
            </div>
            {recipe && <button type="button" className="planner-view" onClick={()=>onRecipe(recipe.id)}>
              View recipe <ArrowRight size={15}/></button>}
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
          <ul className="planner-preview">{preview.slice(0,9).map(item=><li key={item.id}><span>{ingredientName(item.id)}</span><strong>{shoppingQuantity(item,servings)}</strong></li>)}</ul>
          {preview.length>9&&<p className="planner-note">+ {preview.length-9} more in your shopping list</p>}
        </> : <p className="planner-note">Nothing to buy yet — choose meals or check your larder.</p>}
        <div className={'planner-sync '+(shoppingNeedsUpdate?'needs-update':synced?'is-synced':'')}>
          {synced ? <><Check size={16}/> Shopping list matches this week</> :
            shoppingNeedsUpdate ? <><ShoppingBasket size={16}/> {
              shoppingPlan?.week===week?'Meals changed — update your shopping list':
              'Shopping list is for a different plan — update it'}</> :
            'Ready when you are. Generate a list from this week.'}
        </div>
        <Button tone="primary" icon={<ShoppingBasket size={18}/>} onClick={onAdd}
          disabled={planned.length===0}>{hasShoppingHistory?'Update shopping list':'Add week to shopping'}</Button>
        <p className="planner-note">Changing dinners saves your plan. Shopping updates only when you tap above. Manually added items stay.</p>
      </aside>
    </div>
    <Dialog.Root open={editingDay !== null} onOpenChange={open=>{if(!open)setEditingDay(null);}}>
      <Dialog.Portal>
        <Dialog.Overlay className="planner-picker-overlay"/>
        <Dialog.Content className="planner-picker-dialog" aria-describedby="planner-picker-description"
          onCloseAutoFocus={event=>{event.preventDefault();opener.current?.focus();}}>
          <div className="planner-picker-handle" aria-hidden="true"/>
          <div className="planner-picker-heading">
            <div>
              <Dialog.Title>Change {editingDay===null?'':days[editingDay]} dinner</Dialog.Title>
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
