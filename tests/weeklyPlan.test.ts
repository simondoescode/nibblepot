import { describe, expect, it } from 'vitest';
import { mondayFor, shiftWeek, validMondayKey, defaultWeek, shuffleWeek, weekContributions, applyWeekToShopping, shoppingPlanSignature } from '../src/lib/weeklyPlan';
import { parseSavedData } from '../src/lib/storage';
import { shoppingQuantity } from '../src/lib/quantities';
import type { SavedData, WeekSlot } from '../src/types';

const emptyData: SavedData = { larder:[],favorites:[],shopping:[] };
describe('weekly meal planner',()=>{
  it('uses local Monday keys and handles DST, years and week navigation',()=>{
    expect(mondayFor(new Date(2026,9,31,19))).toBe('2026-10-26');
    expect(shiftWeek('2026-10-26',1)).toBe('2026-11-02');
    expect(shiftWeek('2026-12-28',1)).toBe('2027-01-04');
    expect(validMondayKey('2026-10-27')).toBe(false);
    expect(validMondayKey('2026-02-30')).toBe(false);
    expect(validMondayKey('2026-10-26')).toBe(true);
  });
  it('starts with five different recipes and two deliberate nights off',()=>{
    const plan=defaultWeek();
    expect(plan).toHaveLength(7);
    expect(plan.filter(s=>s.kind==='recipe')).toHaveLength(5);
    expect(plan[5]).toEqual({kind:'leftovers'});
    expect(plan[6]).toEqual({kind:'freezer'});
    const shuffled=shuffleWeek(plan,()=>0.2);
    const ids=shuffled.flatMap(s=>s.kind==='recipe'?[s.id]:[]);
    expect(new Set(ids).size).toBe(5);
    expect(shuffled.slice(5)).toEqual(plan.slice(5));
  });
  it('generates missing ingredients with correct counts for repeated recipes',()=>{
    const repeated: WeekSlot[]=[
      {kind:'recipe',id:'tomato-pasta'}, {kind:'recipe',id:'tomato-pasta'},
      {kind:'leftovers'}, {kind:'freezer'}, {kind:'empty'}, {kind:'empty'}, {kind:'empty'},
    ];
    const preview=weekContributions(repeated,[]);
    expect(preview.find(i=>i.id==='pasta')?.weekCounts).toEqual({'tomato-pasta':2});
    expect(shoppingQuantity(preview.find(i=>i.id==='pasta')!)).toBe('700 g');
    expect(preview.find(i=>i.id==='chopped-tomatoes')?.weekCounts).toEqual({'tomato-pasta':2});
    expect(weekContributions(repeated,['pasta']).some(i=>i.id==='pasta')).toBe(false);
  });
  it('preserves manually added shopping sources and ticks while replacing an old week',()=>{
    const planA: WeekSlot[]=Array.from({length:7},(_,i)=>i===0?{kind:'recipe',id:'tomato-pasta'}:{kind:'empty'});
    const planB: WeekSlot[]=Array.from({length:7},(_,i)=>i===0?{kind:'recipe',id:'chicken-rice'}:{kind:'empty'});
    const manual: SavedData={
      ...emptyData,
      shopping:[{id:'pasta',done:true,from:['tuna-bake']},{id:'eggs',done:false,from:[]}],
    };
    const first=applyWeekToShopping(manual,planA);
    expect(shoppingQuantity(first.shopping.find(x=>x.id==='pasta')!)).toBe('700 g');
    expect(first.shopping.find(x=>x.id==='pasta')?.done).toBe(true);
    const next=applyWeekToShopping(first,planB);
    expect(shoppingQuantity(next.shopping.find(x=>x.id==='pasta')!)).toBe('350 g');
    expect(next.shopping.find(x=>x.id==='eggs')).toBeDefined();
    expect(next.shopping.some(x=>x.id==='chopped-tomatoes')).toBe(false);
    expect(next.shopping.some(x=>x.id==='chicken')).toBe(true);
    expect(applyWeekToShopping(next,planB).shopping.length).toBe(next.shopping.length);
  });
  it('tracks a shopping snapshot without mutating it on later edits',()=>{
    const week='2026-10-26';
    const slots=defaultWeek();
    const current=applyWeekToShopping(emptyData,slots,week);
    expect(current.shoppingPlan?.week).toBe(week);
    expect(current.shoppingPlan?.signature).toBe(shoppingPlanSignature(week,slots,[],{}));
    expect(shoppingPlanSignature(week,slots,['rice','pasta'],{}))
      .toBe(shoppingPlanSignature(week,slots,['pasta','rice'],{}));
    const updated=slots.map(slot=>({...slot}));
    updated[0]={kind:'recipe',id:'egg-rice'};
    expect(shoppingPlanSignature(week,updated,[],{})).not.toBe(current.shoppingPlan?.signature);
    expect(shoppingPlanSignature(week,slots,[],{'jacket':2})).not.toBe(current.shoppingPlan?.signature);
    expect(shoppingPlanSignature(week,slots,[],{'toasties':8})).toBe(current.shoppingPlan?.signature);
    expect(shoppingPlanSignature('2026-11-02',slots,[],{})).not.toBe(current.shoppingPlan?.signature);
    const restored=parseSavedData(current);
    expect(restored.shoppingPlan).toEqual(current.shoppingPlan);
  });
  it('does not double-count a recipe selected manually and scheduled once',()=>{
    const single: WeekSlot[]=[{kind:'recipe',id:'tomato-pasta'},...Array.from({length:6},()=>({kind:'empty' as const}))];
    const manual={...emptyData, shopping:[{id:'pasta',done:false,from:['tomato-pasta']}]};
    const next=applyWeekToShopping(manual,single);
    expect(shoppingQuantity(next.shopping.find(x=>x.id==='pasta')!)).toBe('350 g');
  });
  it('restores valid weekly data from backups and drops invalid entries',()=>{
    const saved=parseSavedData({
      larder:[],favorites:[],shopping:[
        {id:'pasta',done:false,from:[],weekCounts:{'tomato-pasta':2,unknown:4},planGenerated:true}
      ],
      weekPlans:{
        '2026-10-26':defaultWeek(),
        '2026-10-27':defaultWeek(),
        '2026-11-02':[{kind:'recipe',id:'nonexistent'},...Array.from({length:6},()=>({kind:'empty'}))]
      }
    });
    expect(saved.weekPlans?.['2026-10-26']).toHaveLength(7);
    expect(saved.weekPlans?.['2026-10-27']).toBeUndefined();
    expect(saved.weekPlans?.['2026-11-02']).toBeUndefined();
    expect(saved.shopping[0].weekCounts).toEqual({'tomato-pasta':2});
  });
});
