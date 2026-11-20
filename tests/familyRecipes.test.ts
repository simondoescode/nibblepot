import { describe, expect, it } from 'vitest';
import { recipes, ingredients } from '../src/data';
import { recipePath, cookingPath } from '../src/lib/routes';
import { filterRecipes, missingRequired } from '../src/lib/recipes';
import { formatRecipeQuantity } from '../src/lib/quantities';

const additions = [
  {
    "id": "1rqk",
    "slug": "creamy-chicken-broccoli-rice"
  },
  {
    "id": "e1xf",
    "slug": "sticky-honey-garlic-chicken"
  },
  {
    "id": "ymkm",
    "slug": "mild-chicken-sweet-potato-curry"
  },
  {
    "id": "ckl8",
    "slug": "chicken-veggie-meatballs"
  },
  {
    "id": "vyox",
    "slug": "mini-shepherds-pies"
  },
  {
    "id": "p09p",
    "slug": "mild-lamb-koftas"
  },
  {
    "id": "9cis",
    "slug": "lamb-sweet-potato-stew"
  },
  {
    "id": "x7yk",
    "slug": "hidden-veg-beef-bolognese"
  },
  {
    "id": "td9h",
    "slug": "cheesy-beef-rice-bowls"
  },
  {
    "id": "j4s2",
    "slug": "beef-potato-hotpot"
  },
  {
    "id": "csaw",
    "slug": "beef-meatballs-tomato-sauce"
  },
  {
    "id": "lzdv",
    "slug": "salmon-potato-fishcakes"
  },
  {
    "id": "kmuu",
    "slug": "creamy-fish-pie"
  },
  {
    "id": "inxv",
    "slug": "homemade-fish-fingers-wedges"
  },
  {
    "id": "7op4",
    "slug": "creamy-salmon-pea-pasta"
  }
] as const;

describe('family recipes added in #61',()=>{
  it('adds all 15 new four-serving recipes without changing the existing catalogue',()=>{
    expect(recipes).toHaveLength(61);
    const ids=new Set(recipes.map(recipe=>recipe.id));
    expect(ids.size).toBe(recipes.length);
    for(const item of additions){
      const recipe=recipes.find(recipe=>recipe.id===item.id);
      expect(recipe?.slug).toBe(item.slug);
      expect(recipePath(item.id)).toBe('/nibblepot/recipes/'+item.slug+'/');
      expect(cookingPath(item.id)).toBe('/nibblepot/recipes/'+item.slug+'/cook/');
      expect(recipe!.prepMins+recipe!.cookMins).toBe(recipe!.mins);
      for(const ingredient of recipe!.ing){
        expect(ingredients[ingredient.id]).toBeDefined();
        expect(formatRecipeQuantity(ingredient,2)).not.toMatch(/NaN|undefined/);
        expect(formatRecipeQuantity(ingredient,8)).not.toMatch(/NaN|undefined/);
      }
    }
  });
  it('recognises new fish, chicken and mince ingredients in food filters',()=>{
    const fish=filterRecipes(recipes,'','all',[],['fish']);
    expect(fish).toHaveLength(9);
    for(const item of additions.slice(11))expect(fish.some(recipe=>recipe.id===item.id)).toBe(true);
    const chicken=filterRecipes(recipes,'','all',[],['chicken']);
    expect(chicken.some(recipe=>recipe.id==='ckl8')).toBe(true);
    for(const item of additions){
      expect(filterRecipes(recipes,'','all',[],['meat-free']).some(recipe=>recipe.id===item.id)).toBe(false);
      expect(filterRecipes(recipes,'','all',[],['vegan']).some(recipe=>recipe.id===item.id)).toBe(false);
    }
  });
  it('uses optional-safe larder ranking and rice storage advice',()=>{
    for(const item of additions){
      const recipe=recipes.find(recipe=>recipe.id===item.id)!;
      expect(missingRequired(recipe,recipe.ing.map(ingredient=>ingredient.id))).toBe(0);
      if(recipe.ing.some(ingredient=>ingredient.id==='rice')){
        expect(recipe.storage).toContain('within one hour');
        expect(recipe.storage).toContain('24 hours');
        expect(recipe.storage).toContain('Reheat only once');
      }
    }
  });
});
