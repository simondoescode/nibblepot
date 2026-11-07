import { useState } from 'react';
import * as Dialog from '../ui/dialog';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { foodTypes, type FoodType } from '../lib/foodTypes';
import { Button } from '../ui/controls';

export function FoodTypePicker({selected,onChange}:{selected:FoodType[];onChange:(value:FoodType[])=>void}) {
  const [open,setOpen]=useState(false);
  const [draft,setDraft]=useState<FoodType[]>([]);
  const options=foodTypes.filter(type=>type.id!=='all');
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
        <Dialog.Description>Pick as many as you like. Recipes matching any selected type are shown.</Dialog.Description>
        <div className="food-picker-options">{options.map(type=><label key={type.id}>
          <input type="checkbox" checked={draft.includes(type.id)} onChange={event=>setDraft(current=>event.target.checked?[...current,type.id]:current.filter(id=>id!==type.id))}/>
          <span>{type.label}</span></label>)}</div>
        <div className="food-picker-actions"><Button onClick={()=>setDraft([])}>Clear selection</Button>
          <Button tone="primary" onClick={()=>{onChange(draft);setOpen(false);}}>Apply filters</Button></div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
