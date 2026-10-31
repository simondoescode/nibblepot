import { describe, it, expect } from 'vitest';
import { parseRoute, recipePath, tabPath } from '../src/lib/routes';
import { recipes } from '../src/data';

describe('shareable recipe routes', () => {
  it('maps all recipe IDs to stable URLs', () => {
    for (const recipe of recipes) {
      const href = recipePath(recipe.id);
      expect(href).toBe('/nibblepot/recipes/' + recipe.id + '/');
      expect(parseRoute(href)).toEqual({ kind: 'recipe', id: recipe.id });
    }
  });
  it('recognises navigation tabs, extra or missing trailing slashes, and bad paths', () => {
    expect(tabPath('home')).toBe('/nibblepot/');
    expect(tabPath('favorites')).toBe('/nibblepot/favourites/');
    expect(parseRoute('/nibblepot/favourites/')).toEqual({ kind: 'tab', tab: 'favorites' });
    expect(parseRoute('/nibblepot/recipes/jacket')).toEqual({ kind: 'recipe', id: 'jacket' });
    expect(parseRoute('/nibblepot/recipes/')).toEqual({ kind: 'not-found' });
    expect(parseRoute('/not-nibblepot/recipes/jacket/')).toEqual({ kind: 'not-found' });
  });
});
