import { describe, it, expect } from 'vitest';
import { missingRequiredIngredients } from '../src/lib/recipes';
import type { Recipe } from '../src/types';
const meal: Recipe = {id:'test',slug:'test',prepMins:5,cookMins:5,tags:[],title:'Test',description:'',emoji:'',color:'',mins:10,onePot:true,safety:'',storage:'',reviewedOn:'2026-01-01',steps:[],ing:[{id:'rice',amount:300,unit:'g'},{id:'onion',amount:1,unit:'each'},{id:'cheese',amount:50,unit:'g',optional:true}]};
describe('quantity-aware larder',()=>{
  it('accepts checked stock without quantities for legacy users',()=>expect(missingRequiredIngredients(meal,['rice','onion'])).toEqual([]));
  it('flags short quantities and excludes optional items',()=>expect(missingRequiredIngredients(meal,['rice','onion'],{rice:'200g',onion:'1'}).map(x=>x.id)).toEqual(['rice']));
  it('scales recipe requirements for servings',()=>expect(missingRequiredIngredients(meal,['rice','onion'],{rice:'300g',onion:'1'},8).map(x=>x.id)).toEqual(['rice','onion']));
  it('does not guess incompatible unit conversions',()=>expect(missingRequiredIngredients(meal,['rice','onion'],{rice:'1 tin',onion:'1'})).toEqual([]));
});
