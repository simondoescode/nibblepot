import { useState } from 'react';
import * as Dialog from '../ui/dialog';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { dietaryFoodTypes, foodTypes, type FoodType } from '../lib/foodTypes';
import { Button } from '../ui/controls';

export function FoodTypePicker({selected,onChange}:{selected:FoodType[];onChange:(value:FoodType[])=>void}) {
  const [open,setOpen]=useState(false);
  const [draft,setDraft]=useState<FoodType[]>([]);
  const dietary=foodTypes.filter(type=>dietaryFoodTypes.includes(type.id));
  const options=foodTypes.filter(type=>type.id!=='all' && !dietaryFoodTypes.includes(type.id));
  return <Dialog.Root historyKey="food-types" open={open} onOpenChange={value=>{if(value)setDraft([...selected]);setOpen(value);}}>
    <Dialog.Trigger className="food-type-trigger">
      <SlidersHorizontal size={18} aria-hidden="true"/><span>Food types</span>
      <span className="food-type-summary">{selected.length ? `${selected.length} selected` : 'All food'}</span><ChevronDown size={16} aria-hidden="true" />
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="food-picker-overlay"/>
      <Dialog.Content className="food-picker">
        <div className="food-picker-heading"><Dialog.Title>Choose food types</Dialog.Title>
          <Dialog.Close className="food-picker-close" aria-label="Close food types"><X size={21}/></Dialog.Close></div>
        <Dialog.Description>Dietary choices restrict results. Other food types match any selected option.</Dialog.Description>
        <div className="food-picker-options"><h3 className="food-picker-group-title">Dietary preferences</h3>{dietary.map(type=><label key={type.id}>
          <input type="checkbox" checked={draft.includes(type.id)} onChange={event=>setDraft(current=>event.target.checked?[...current,type.id]:current.filter(id=>id!==type.id))}/>
          <span>{type.label}</span></label>)}
        <p className="food-picker-hint">Vegan-friendly recipes exclude listed animal ingredients. Check product labels, especially stock cubes, pasta and sauces.</p>
        <h3 className="food-picker-group-title">Ingredients &amp; dishes</h3>{options.map(type=><label key={type.id}>
          <input type="checkbox" checked={draft.includes(type.id)} onChange={event=>setDraft(current=>event.target.checked?[...current,type.id]:current.filter(id=>id!==type.id))}/>
          <span>{type.label}</span></label>)}</div>
        <div className="food-picker-actions"><Button onClick={()=>setDraft([])}>Clear selection</Button>
          <Button tone="primary" onClick={()=>{onChange(draft);setOpen(false);}}>Apply filters</Button></div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
