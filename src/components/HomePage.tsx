import { useMemo } from 'react';
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
  onRandom: () => void; onLarder: () => void;
};

export function HomePage({ selectedFoodTypes, setSelectedFoodTypes, filter, setFilter, search, setSearch, favorites, larder, onFavorite, onOpen }: Props) {
  const filtered = useMemo(() => filterRecipes(recipes, search, filter, larder, selectedFoodTypes), [search, filter, larder, selectedFoodTypes]);
  const clearFilters = () => { setSearch(''); setFilter('all'); setSelectedFoodTypes([]); };
  return <>
    <TonightInspiration recipes={filtered} favorites={favorites} onFavorite={onFavorite} onOpen={onOpen} />
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
