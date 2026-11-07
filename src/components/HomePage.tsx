import { useMemo } from 'react';
import type { WeekSlot } from '../types';
import { TonightInspiration } from './TonightInspiration';
import { recipes } from '../data';
import { filterRecipes } from '../lib/recipes';
import { foodTypes, type FoodType } from '../lib/foodTypes';
import { FoodTypePicker } from './FoodTypePicker';
import type { Filter } from '../types';
import { RecipeGrid } from './RecipeGrid';
import { Button, FilterChip } from '../ui/controls';

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All recipes' },
  { id: 'quick', label: '⚡ 30 mins or less' },
  { id: 'simple', label: '✋ 5 ingredients' },
  { id: 'onepot', label: '🍲 One pot' },
  { id: 'larder', label: '🫙 Use my larder' },
];

type Props = {
  selectedFoodTypes: FoodType[]; setSelectedFoodTypes: (types: FoodType[]) => void;
  filter: Filter; setFilter: (filter: Filter) => void; search: string; setSearch: (search: string) => void;
  favorites: string[]; larder: string[]; onFavorite: (id: string) => void; onOpen: (id: string) => void;
  weekSlots: WeekSlot[]; onPlan: (id: string, day: number) => void; onPlanner: () => void; onLarder: () => void; onShopping: () => void;
};

export function HomePage({ selectedFoodTypes, setSelectedFoodTypes, filter, setFilter, search, setSearch, favorites, larder, onFavorite, onOpen, weekSlots, onPlan, onPlanner, onLarder, onShopping }: Props) {
  const filtered = useMemo(() => filterRecipes(recipes, search, filter, larder, selectedFoodTypes), [search, filter, larder, selectedFoodTypes]);
  const clearFilters = () => { setSearch(''); setFilter('all'); setSelectedFoodTypes([]); };
  return <>
    <TonightInspiration recipes={filtered} favorites={favorites} onFavorite={onFavorite} onOpen={onOpen} onPlan={onPlan} />
    <section className="simmer-home-plan" aria-label="This week's meal plan"><div className="simmer-home-plan-heading"><div><span className="simmer-plan-kicker">MAKE THE WEEK EASIER</span><h2>This week's dinners</h2></div><button type="button" onClick={onPlanner}>Open planner →</button></div><div className="simmer-home-days">{weekSlots.map((slot,index) => {const meal=slot.kind === 'recipe' ? recipes.find(recipe=>recipe.id===slot.id) : undefined;return <button type="button" key={index} onClick={onPlanner}><span>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][index]}</span><strong>{meal?.title ?? (slot.kind === 'leftovers' ? 'Leftovers' : slot.kind === 'freezer' ? 'Freezer night' : 'Choose dinner')}</strong></button>;})}</div><div className="simmer-home-shortcuts"><button type="button" onClick={onLarder}>Use my larder</button><button type="button" onClick={onShopping}>Shopping list</button></div></section>
    <div className="section-heading"><div><h2>What takes your fancy?</h2>
      <p>{recipes.length} easy recipes, all made for real life.</p></div>
      <label className="search"><span aria-hidden="true">🔎</span>
        <input type="search" id="search" placeholder="Search meals or ingredients" value={search}
          onChange={event => setSearch(event.target.value)} aria-label="Search recipes" /></label>
    </div>
    <div className="chips" aria-label="Recipe filters">{filters.map(({ id, label }) =>
      <FilterChip key={id} selected={filter === id} onClick={() => setFilter(id)}>{label}</FilterChip>)}</div>
    <div className="recipe-food-toolbar">
      <FoodTypePicker selected={selectedFoodTypes} onChange={setSelectedFoodTypes}/>
      {(selectedFoodTypes.length > 0 || filter !== 'all' || search.trim()) && <button type="button" className="recipe-clear-filters" onClick={clearFilters}>Clear filters</button>}
      <p className="recipe-result-count" role="status">{filtered.length} of {recipes.length} recipes</p>
    </div>
    {selectedFoodTypes.length > 0 && <div className="selected-food-types" aria-label="Selected food types">
      {foodTypes.filter(type=>selectedFoodTypes.includes(type.id)).map(type=><button key={type.id} type="button" aria-label={`Remove ${type.label} filter`}
        onClick={()=>setSelectedFoodTypes(selectedFoodTypes.filter(id=>id!==type.id))}>{type.label}<span aria-hidden="true">×</span></button>)}
    </div>}
    <div id="home-results" className="results-feedback" key={filter + selectedFoodTypes.join(',')}><RecipeGrid recipes={filtered} favorites={favorites} larder={larder} onFavorite={onFavorite} onOpen={onOpen}
      onReset={clearFilters} /></div>
  </>;
}
