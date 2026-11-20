import "../styles/home-day.css";
import { Search, X } from 'lucide-react';
import * as Dialog from "../ui/dialog";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { WeekSlot } from '../types';
import { Button } from '../ui/controls';
import { recipes } from '../data';
import { filterRecipes, missingRequiredIngredients } from '../lib/recipes';
import { foodTypes, type FoodType } from '../lib/foodTypes';
import { FoodTypePicker } from './FoodTypePicker';
import type { Filter } from '../types';
import { RecipeGrid } from './RecipeGrid';
import { FilterChip } from '../ui/controls';

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All recipes' },
  { id: 'quick', label: '30 mins or less' },
  { id: 'onepot', label: 'One pot' },
  { id: 'minimal', label: 'Minimal prep' },
  { id: 'simple', label: '5 ingredients' },
  { id: 'budget', label: 'Budget-friendly' },
  { id: 'batch', label: 'Batch cooking' },
  { id: 'larder', label: 'Use my larder' },
];

type Props = {
  selectedFoodTypes: FoodType[]; setSelectedFoodTypes: (types: FoodType[]) => void;
  filter: Filter; setFilter: (filter: Filter) => void; search: string; setSearch: (search: string) => void;
  favorites: string[]; larder: string[]; stock: Record<string,string>; dates: Record<string,string>; servings: Record<string,number>; onFavorite: (id: string) => void; onOpen: (id: string) => void;
  weekSlots: WeekSlot[]; onPlan: (day: number, id: string) => void; onPlanner: () => void; onLarder: () => void; onShopping: () => void;
};

export function HomePage({ selectedFoodTypes, setSelectedFoodTypes, filter, setFilter, search, setSearch, favorites, larder, stock, dates, servings, onFavorite, onOpen, weekSlots, onPlan, onPlanner }: Props) {
  const filtered = useMemo(() => filterRecipes(recipes, search, filter, larder, selectedFoodTypes, stock, servings), [search, filter, larder, selectedFoodTypes, stock, servings]);
  const ready = filter === 'larder' ? filtered.filter(recipe => missingRequiredIngredients(recipe, larder, stock, servings[recipe.id] ?? 4).length === 0) : filtered;
  const nearly = filter === 'larder' ? filtered.filter(recipe => {
    const count = missingRequiredIngredients(recipe, larder, stock, servings[recipe.id] ?? 4).length;
    return count > 0 && count <= 2;
  }) : [];
  const other = filter === 'larder' ? filtered.filter(recipe => missingRequiredIngredients(recipe, larder, stock, servings[recipe.id] ?? 4).length > 2) : [];
  const useSoon = (recipe: typeof recipes[number]) => recipe.ing.filter(i => !i.optional && larder.includes(i.id) && dates[i.id] && dates[i.id] >= new Date().toISOString().slice(0,10) && (Date.parse(dates[i.id] + 'T12:00:00Z') - Date.now()) / 86400000 <= 3).length;
  const byUseSoon = (a: typeof recipes[number], b: typeof recipes[number]) => useSoon(b) - useSoon(a) || a.prepMins - b.prepMins || a.mins - b.mins;
  if (filter === 'larder') { ready.sort(byUseSoon); nearly.sort(byUseSoon); other.sort(byUseSoon); }
  const resultCount = filtered.length === recipes.length ? `${recipes.length}` : `${filtered.length} of ${recipes.length}`;
  const clearFilters = () => { setSearch(''); setFilter('all'); setSelectedFoodTypes([]); };
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [today, setToday] = useState(() => (new Date().getDay() + 6) % 7);
  const [day, setDay] = useState(today);
  const strip = useRef<HTMLDivElement>(null);
  const tonight = weekSlots[today];
  const tonightMeal = tonight?.kind === 'recipe' ? recipes.find(recipe => recipe.id === tonight.id) : undefined;
  useEffect(() => {
    const update = () => setToday((new Date().getDay() + 6) % 7);
    const timer = window.setInterval(update, 30_000);
    window.addEventListener('focus', update);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update); };
  }, []);
  useEffect(() => {
    const card = strip.current?.children[today] as HTMLElement | undefined;
    if (strip.current && card) strip.current.scrollLeft = card.offsetLeft - (strip.current.children[0] as HTMLElement).offsetLeft;
  }, [today]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const opener = useRef<HTMLButtonElement | null>(null);
  const openPicker = (index: number, button: HTMLButtonElement) => {
    opener.current = button;
    setDay(index);
    setQuery('');
    setPickerOpen(true);
  };
  const matches = useMemo(() => pickerOpen ? filterRecipes(recipes, query, 'all', [])
    .sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id))) : [], [pickerOpen, query, favorites]);
  const anchor = opener.current?.getBoundingClientRect();
  return <>
    <section className="home-discovery" aria-label="Find a recipe">
      <label className="search"><Search size={20} aria-hidden="true"/>
        <input type="search" aria-label="Search recipes" placeholder="Search meals or ingredients" value={search} onChange={event => setSearch(event.target.value)}/>
      </label>
      <div className="chips" aria-label="Recipe filters">{filters.map(({ id, label }) =>
        <FilterChip key={id} selected={filter === id} onClick={() => setFilter(id)}>{label}</FilterChip>)}</div>
      <FoodTypePicker selected={selectedFoodTypes} onChange={setSelectedFoodTypes}/>
    </section>
    <section className={`simmer-spotlight tonight-plan${tonightMeal ? '' : ' simmer-spotlight-empty'}`} aria-label="Tonight's dinner">
      {tonightMeal && <div className="simmer-spotlight-image"><img src={import.meta.env.BASE_URL + (tonightMeal.image ?? 'recipes/jacket.svg')} alt="" width="800" height="504"/></div>}
      <div className="simmer-spotlight-content">
        <span className="simmer-spotlight-kicker">Tonight · {days[today]}</span>
        <h1>{tonightMeal?.title ?? (tonight?.kind === 'leftovers' ? 'Leftovers night' : tonight?.kind === 'freezer' ? 'Freezer night' : 'Plan tonight')}</h1>
        <p>{tonightMeal ? `${tonightMeal.mins} mins · Serves ${servings[tonightMeal.id] ?? 4}` : tonight?.kind === 'leftovers' || tonight?.kind === 'freezer' ? 'An easy evening, already planned.' : 'Choose a dinner for this evening.'}</p>
        <div className="simmer-spotlight-actions">
          {tonightMeal && <Button tone="primary" onClick={() => onOpen(tonightMeal.id)}>View recipe</Button>}
          <button type="button" className="tonight-change" onClick={event => openPicker(today, event.currentTarget)}>{tonightMeal || tonight?.kind === 'leftovers' || tonight?.kind === 'freezer' ? 'Change dinner' : 'Plan tonight'}</button>
        </div>
      </div>
    </section>
    <section className="simmer-home-plan" aria-label="This week's meal plan"><div className="simmer-home-plan-heading"><h2>This week's dinners</h2><button type="button" onClick={onPlanner}>Open planner</button></div><div className="simmer-home-days" ref={strip}>
      {weekSlots.map((slot, index) => {
        const meal = slot.kind === 'recipe' ? recipes.find(recipe => recipe.id === slot.id) : undefined;
        const title = meal?.title ?? (slot.kind === 'leftovers' ? 'Leftovers' : slot.kind === 'freezer' ? 'Freezer night' : 'Choose dinner');
        return <div className={`home-day${index === today ? ' is-today' : ''}`} key={days[index]}>
          <button type="button" aria-current={index === today ? 'date' : undefined} aria-label={`Change dinner for ${days[index]}: ${title}`} onClick={event => openPicker(index, event.currentTarget)}>
            <span>{index === today ? 'Today' : days[index].slice(0, 3)}</span><strong>{title}</strong>
            <span className="home-day-action">{slot.kind === 'empty' ? 'Plan dinner' : 'Change dinner'}</span>
          </button>
        </div>;
      })}
    </div></section>
    <Dialog.Root historyKey="home-day-picker" open={pickerOpen} onOpenChange={setPickerOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="planner-picker-overlay"/>
        <Dialog.Content className="planner-picker-dialog home-day-picker" aria-describedby={undefined}
          style={{ '--day-left': `${anchor?.left ?? 16}px`, '--day-top': `${(anchor?.bottom ?? 8) + 8}px` } as CSSProperties}
          onCloseAutoFocus={event => { event.preventDefault(); opener.current?.focus(); }}>
          <div className="planner-picker-heading"><Dialog.Title>Dinner for {days[day]}</Dialog.Title>
            <Dialog.Close className="planner-picker-close" aria-label="Close dinner picker"><X size={20}/></Dialog.Close></div>
          <label className="planner-picker-search"><Search size={18} aria-hidden="true"/>
            <input type="search" value={query} aria-label="Search dinners" placeholder="Search meals or ingredients" onChange={event => setQuery(event.target.value)}/>
          </label>
          <div className="planner-picker-results">
            {matches.map(recipe => <button className="planner-meal-option" key={recipe.id} type="button"
              onClick={() => { onPlan(day, recipe.id); setPickerOpen(false); }}>
              <img width="64" height="48" alt="" loading="lazy" src={import.meta.env.BASE_URL + (recipe.image ?? 'recipes/jacket.svg')}/>
              <span className="planner-meal-copy"><strong>{recipe.title}</strong>
                <small>{recipe.mins} min{favorites.includes(recipe.id) && ' · Favourite'}</small></span>
            </button>)}
            {!matches.length && <p role="status">No dinners match your search.</p>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    <section className="menu-toolbar" aria-label="Browse recipes">
    <div className="section-heading"><div><h2>What takes your fancy?</h2>
</div>
    </div>
    <div className="recipe-food-toolbar">
      {(selectedFoodTypes.length > 0 || filter !== 'all' || search.trim()) && <button type="button" className="recipe-clear-filters" onClick={clearFilters}>Clear filters</button>}
      <p className="recipe-result-count" role="status">{filter === 'larder' ? `${ready.length} ready · ${nearly.length} need 1–2 items · ${other.length} more ideas` : `${resultCount} recipes`}</p>
    </div>
    {selectedFoodTypes.length > 0 && <div className="selected-food-types" aria-label="Selected food types">
      {foodTypes.filter(type=>selectedFoodTypes.includes(type.id)).map(type=><button key={type.id} type="button" aria-label={`Remove ${type.label} filter`}
        onClick={()=>setSelectedFoodTypes(selectedFoodTypes.filter(id=>id!==type.id))}>{type.label}<span aria-hidden="true">×</span></button>)}
    </div>}
    </section>
    <div id="home-results" className="results-feedback" key={filter + selectedFoodTypes.join(',')}>
      {filter === 'larder' ? <>
        <section aria-label="Ready to cook"><h2>Ready to cook</h2><p>Everything required is in your larder.</p>
          {ready.length ? <RecipeGrid recipes={ready} favorites={favorites} larder={larder} stock={stock} servings={servings} onFavorite={onFavorite} onOpen={onOpen} /> : <p>No meals ready yet. Add ingredients to your larder.</p>}</section>
        <section aria-label="Nearly there"><h2>Nearly there</h2><p>Just one or two required ingredients to pick up.</p>
          {nearly.length ? <RecipeGrid recipes={nearly} favorites={favorites} larder={larder} stock={stock} servings={servings} onFavorite={onFavorite} onOpen={onOpen} /> : <p>No close matches right now.</p>}</section>
        <section aria-label="Other inspiration"><h2>Other inspiration</h2><p>More dinner ideas for when you next stock up.</p>
          {other.length ? <RecipeGrid recipes={other} favorites={favorites} larder={larder} stock={stock} servings={servings} onFavorite={onFavorite} onOpen={onOpen} /> : <p>No other matches.</p>}</section>
      </> : <RecipeGrid recipes={filtered} stock={stock} servings={servings} favorites={favorites} larder={larder} onFavorite={onFavorite} onOpen={onOpen} onReset={clearFilters} />}
    </div>
  </>;
}
