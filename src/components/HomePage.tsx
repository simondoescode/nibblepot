import { useMemo } from 'react';
import { recipes } from '../data';
import { filterRecipes } from '../lib/recipes';
import type { Filter } from '../types';
import { PotMascot } from './PotArt';
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
  filter: Filter; setFilter: (filter: Filter) => void; search: string; setSearch: (search: string) => void;
  favorites: string[]; larder: string[]; onFavorite: (id: string) => void; onOpen: (id: string) => void;
  onRandom: () => void; onLarder: () => void;
};

export function HomePage({ filter, setFilter, search, setSearch, favorites, larder, onFavorite, onOpen, onRandom, onLarder }: Props) {
  const filtered = useMemo(() => filterRecipes(recipes, search, filter, larder), [search, filter, larder]);
  return <>
    <section className="hero">
      <div className="hero-content"><span className="eyebrow">✳️ Good grub. Zero faff.</span>
        <h1>What's for<br /><em>tea?</em></h1>
        <p>Easy, budget-friendly family dinners. No waffle, no weird ingredients. Just food.</p>
        <div className="actions"><Button tone="primary" onClick={onRandom}>🎲 Surprise me!</Button>
          <Button onClick={onLarder}>🫙 My larder</Button></div>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="art-disk" /><div className="art-squiggle" />
        <div className="hero-pot"><PotMascot /></div><span className="float-food ff-1">🥕</span>
        <span className="float-food ff-2">🍅</span><span className="float-food ff-3">🥦</span><span className="mini-burst">✳</span><div className="hero-copy-speech">GOOD GRUB.<br/>ZERO FAFF.</div>
      </div>
    </section>
    <div className="section-heading"><div><h2>What takes your fancy? <span aria-hidden="true">✳</span></h2>
      <p>{recipes.length} easy recipes, all made for real life.</p></div>
      <label className="search"><span aria-hidden="true">🔎</span>
        <input type="search" id="search" placeholder="Search meals or ingredients" value={search}
          onChange={event => setSearch(event.target.value)} aria-label="Search recipes" /></label>
    </div>
    <div className="chips" aria-label="Recipe filters">{filters.map(({ id, label }) =>
      <FilterChip key={id} selected={filter === id} onClick={() => setFilter(id)}>{label}</FilterChip>)}</div>
    <div id="home-results"><RecipeGrid recipes={filtered} favorites={favorites} larder={larder} onFavorite={onFavorite} onOpen={onOpen}
      onReset={() => { setSearch(''); setFilter('all'); }} /></div>
  </>;
}
