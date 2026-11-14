import { Search } from 'lucide-react';
import { useMemo } from 'react';
import type { WeekSlot } from '../types';
import { TonightInspiration } from './TonightInspiration';
import { recipes } from '../data';
import { filterRecipes, missingRequiredIngredients } from '../lib/recipes';
import { foodTypes, type FoodType } from '../lib/foodTypes';
import { FoodTypePicker } from './FoodTypePicker';
import type { Filter } from '../types';
import { RecipeGrid } from './RecipeGrid';
import { FilterChip } from '../ui/controls';

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All recipes' },
  { id: 'quick', label: '⚡ 30 mins or less' },
  { id: 'simple', label: '✋ 5 ingredients' },
  { id: 'onepot', label: '🍲 One pot' },
  { id: 'minimal', label: 'Minimal prep' },
  { id: 'budget', label: 'Budget-friendly' },
  { id: 'batch', label: 'Batch cooking' },
  { id: 'larder', label: '🫙 Use my larder' },
];

type Props = {
  selectedFoodTypes: FoodType[]; setSelectedFoodTypes: (types: FoodType[]) => void;
  filter: Filter; setFilter: (filter: Filter) => void; search: string; setSearch: (search: string) => void;
  favorites: string[]; larder: string[]; stock: Record<string,string>; dates: Record<string,string>; servings: Record<string,number>; onAddMissing: (id: string) => void; onFavorite: (id: string) => void; onOpen: (id: string) => void;
  weekSlots: WeekSlot[]; onPlanner: () => void; onLarder: () => void; onShopping: () => void;
};

export function HomePage({ selectedFoodTypes, setSelectedFoodTypes, filter, setFilter, search, setSearch, favorites, larder, stock, dates, servings, onAddMissing, onFavorite, onOpen, weekSlots, onPlanner, onLarder, onShopping }: Props) {
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
  return <>
    <TonightInspiration recipes={ready.length ? ready : nearly.length ? nearly : filtered} onOpen={onOpen} />
    <section className="simmer-home-plan" aria-label="This week's meal plan"><div className="simmer-home-plan-heading"><div><span className="simmer-plan-kicker">MAKE THE WEEK EASIER</span><h2>This week's dinners</h2></div><button type="button" onClick={onPlanner}>Open planner →</button></div><div className="simmer-home-days">{weekSlots.map((slot,index) => {const meal=slot.kind === 'recipe' ? recipes.find(recipe=>recipe.id===slot.id) : undefined;return <button type="button" key={index} onClick={onPlanner}><span>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][index]}</span><strong>{meal?.title ?? (slot.kind === 'leftovers' ? 'Leftovers' : slot.kind === 'freezer' ? 'Freezer night' : 'Choose dinner')}</strong></button>;})}</div><div className="simmer-home-shortcuts"><button type="button" onClick={onLarder}>Use my larder</button><button type="button" onClick={onShopping}>Shopping list</button></div></section>
    <div className="section-heading"><div><h2>What takes your fancy?</h2>
      <p>{recipes.length} easy recipes, all made for real life.</p></div>
      <label className="search"><Search size={20} aria-hidden="true" />
        <input type="search" id="search" placeholder="Search meals or ingredients" value={search}
          onChange={event => setSearch(event.target.value)} aria-label="Search recipes" /></label>
    </div>
    <div className="chips" aria-label="Recipe filters">{filters.map(({ id, label }) =>
      <FilterChip key={id} selected={filter === id} onClick={() => setFilter(id)}>{label}</FilterChip>)}</div>
    <div className="recipe-food-toolbar">
      <FoodTypePicker selected={selectedFoodTypes} onChange={setSelectedFoodTypes}/>
      {(selectedFoodTypes.length > 0 || filter !== 'all' || search.trim()) && <button type="button" className="recipe-clear-filters" onClick={clearFilters}>Clear filters</button>}
      <p className="recipe-result-count" role="status">{filter === 'larder' ? `${ready.length} ready · ${nearly.length} need 1–2 items · ${other.length} more ideas` : `${resultCount} recipes`}</p>
    </div>
    {selectedFoodTypes.length > 0 && <div className="selected-food-types" aria-label="Selected food types">
      {foodTypes.filter(type=>selectedFoodTypes.includes(type.id)).map(type=><button key={type.id} type="button" aria-label={`Remove ${type.label} filter`}
        onClick={()=>setSelectedFoodTypes(selectedFoodTypes.filter(id=>id!==type.id))}>{type.label}<span aria-hidden="true">×</span></button>)}
    </div>}
    <div id="home-results" className="results-feedback" key={filter + selectedFoodTypes.join(',')}>
      {filter === 'larder' ? <>
        <section aria-label="Ready to cook"><h2>Ready to cook</h2><p>Everything required is in your larder.</p>
          {ready.length ? <RecipeGrid recipes={ready} favorites={favorites} larder={larder} stock={stock} servings={servings} onFavorite={onFavorite} onOpen={onOpen} /> : <p>No meals ready yet. Add ingredients to your larder.</p>}</section>
        <section aria-label="Nearly there"><h2>Nearly there</h2><p>Just one or two required ingredients to pick up.</p>
          {nearly.length ? <RecipeGrid recipes={nearly} favorites={favorites} larder={larder} stock={stock} servings={servings} onAddMissing={onAddMissing} onFavorite={onFavorite} onOpen={onOpen} /> : <p>No close matches right now.</p>}</section>
        <section aria-label="Other inspiration"><h2>Other inspiration</h2><p>More dinner ideas for when you next stock up.</p>
          {other.length ? <RecipeGrid recipes={other} favorites={favorites} larder={larder} stock={stock} servings={servings} onAddMissing={onAddMissing} onFavorite={onFavorite} onOpen={onOpen} /> : <p>No other matches.</p>}</section>
      </> : <RecipeGrid recipes={filtered} favorites={favorites} larder={larder} onFavorite={onFavorite} onOpen={onOpen} onReset={clearFilters} />}
    </div>
  </>;
}
