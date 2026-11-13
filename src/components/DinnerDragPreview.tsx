import { createPortal } from 'react-dom';
import { GripVertical, Plus, RotateCcw, Snowflake } from 'lucide-react';
import { recipes } from '../data';
import { WEEK_DAYS, weekSlotTitle } from '../lib/weeklyPlan';
import type { WeekSlot } from '../types';

export function DragMeal({ slot }: { slot: WeekSlot }) {
  const recipe = slot.kind === 'recipe' ? recipes.find(item => item.id === slot.id) : undefined;
  return <>
    {recipe ? <img src={import.meta.env.BASE_URL + (recipe.image ?? 'recipes/' + recipe.id + '.svg')} width="64" height="48" alt="" draggable={false}/>
      : <span className="planner-drag-symbol" aria-hidden="true">{slot.kind === 'freezer' ? <Snowflake size={22}/> : slot.kind === 'empty' ? <Plus size={22}/> : <RotateCcw size={22}/>}</span>}
    <strong>{weekSlotTitle(slot)}</strong>
  </>;
}

export function DinnerDragPreview({ drag, slots }: {
  drag: { from: number; target: number | null; x: number; y: number; width: number };
  slots: WeekSlot[];
}) {
  // Place the card above the finger and clamp it inside the viewport.
  const left = Math.max(12, Math.min(window.innerWidth - drag.width - 12, drag.x - drag.width / 2));
  const top = Math.max(12, Math.min(window.innerHeight - 108, drag.y - 124));
  return createPortal(<div className="planner-drag-layer" aria-hidden="true">
    <div className="planner-drag-float" style={{ width: drag.width, transform: `translate3d(${left}px, ${top}px, 0)` }}>
      <div className="planner-drag-float-meal"><GripVertical size={18}/><DragMeal slot={slots[drag.from]}/></div>
      <span className="planner-drag-float-caption">{drag.target === null ? 'Drag onto a day · release outside to cancel'
        : slots[drag.target].kind === 'empty' ? 'Release to move to ' + WEEK_DAYS[drag.target]
          : 'Release to swap with ' + WEEK_DAYS[drag.target]}</span>
    </div>
  </div>, document.body);
}
