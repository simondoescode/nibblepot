import type { Recipe } from '../types';

export function DietBadges({ diet }: { diet: Recipe['diet'] }) {
  if (diet !== 'vegetarian' && diet !== 'vegan') return null;
  return <span className="diet-badges">
    {diet === 'vegan' && <abbr title="Vegan"><span aria-hidden="true">vg</span><span className="sr-only">Vegan</span></abbr>}
    <abbr title="Vegetarian"><span aria-hidden="true">v</span><span className="sr-only">Vegetarian</span></abbr>
  </span>;
}
