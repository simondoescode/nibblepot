import { describe, expect, it } from 'vitest';
import { recipes } from '../src/data';
import { filterRecipes, missingRequired } from '../src/lib/recipes';
import { foodTypes, matchesFoodType } from '../src/lib/foodTypes';

const recipe = (id: string) => recipes.find(item=>item.id===id)!;

describe('food type filters',()=>{
  it('uses ingredients and allows overlapping categories',()=>{
    expect(matchesFoodType(recipe('chicken-tomato-pasta'),'chicken')).toBe(true);
    expect(matchesFoodType(recipe('chicken-stuffing-pie'),'chicken')).toBe(true);
    expect(matchesFoodType(recipe('chicken-stuffing-pie'),'meat-free')).toBe(false);
    expect(matchesFoodType(recipe('chicken-tomato-pasta'),'pasta')).toBe(true);
    expect(matchesFoodType(recipe('chicken-tomato-pasta'),'rice')).toBe(false);
    expect(matchesFoodType(recipe('ham-pea-pasta'),'pork')).toBe(true);
    expect(matchesFoodType(recipe('beef-chilli'),'beef')).toBe(true);
    expect(matchesFoodType(recipe('meatball'),'beef')).toBe(false);
    expect(matchesFoodType({...recipe('jacket'),title:'Chicken rice'},'chicken')).toBe(false);
  });
  it('keeps fish, meatballs and optional meat out of meat-free results',()=>{
    const ids=filterRecipes(recipes,'','all',[],['meat-free']).map(item=>item.id);
    expect(ids).toContain('lentil-bolognese');
    expect(ids).toContain('chickpea-curry');
    for(const id of ['meatball','tuna-bake','fish-wedges','ham-pea-pasta','chicken-pie']) expect(ids).not.toContain(id);
    expect(matchesFoodType({...recipe('jacket'),ing:[...recipe('jacket').ing,{id:'ham',qty:'1 slice',optional:true}]},'meat-free')).toBe(false);
  });
  it('offers populated food types without changing default catalogue results',()=>{
    expect(filterRecipes(recipes,'','all',[])).toEqual(filterRecipes(recipes,'','all',[],['all']));
    for(const type of foodTypes) expect(filterRecipes(recipes,'','all',[],[type.id]).length).toBeGreaterThan(0);
    expect(filterRecipes(recipes,'','all',[],['fish']).map(item=>item.id)).toEqual(['tuna-bake','fish-butties','tuna-jackets','fish-wedges','creamy-tuna-sweetcorn-pasta']);
  });
  it('combines food type with search, quick filters and larder ranking',()=>{
    expect(filterRecipes(recipes,'tomato','quick',[],['chicken']).map(item=>item.id)).toEqual(['chicken-tomato-pasta']);
    expect(filterRecipes(recipes,'tuna','all',[],['meat-free'])).toEqual([]);
    const stock=['pasta','chopped-tomatoes','cheese','baked-beans'];
    const ranked=filterRecipes(recipes,'','larder',stock,['pasta']);
    expect(ranked[0].id).toBe('bean-pasta');
    expect(ranked.every(item=>matchesFoodType(item,'pasta'))).toBe(true);
    expect(ranked.map(item=>missingRequired(item,stock))).toEqual(ranked.map(item=>missingRequired(item,stock)).sort((a,b)=>a-b));
  });
  it('matches any selected type once, then applies quick and search restrictions',()=>{
    const combined=filterRecipes(recipes,'','all',[],['chicken','rice']);
    const expected=new Set([...filterRecipes(recipes,'','all',[],['chicken']),...filterRecipes(recipes,'','all',[],['rice'])].map(r=>r.id));
    expect(new Set(combined.map(r=>r.id))).toEqual(expected);
    expect(combined.length).toBe(expected.size);
    expect(filterRecipes(recipes,'tomato','quick',[],['chicken','fish']).map(r=>r.id)).toEqual(['chicken-tomato-pasta']);
    expect(filterRecipes(recipes,'','all',[],[])).toEqual(recipes);
  });

});
