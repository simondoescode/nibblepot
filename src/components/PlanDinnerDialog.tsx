import { useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarPlus, X } from 'lucide-react';
import { dateForWeekDay, defaultWeek, mondayFor, shiftWeek, WEEK_DAYS, weekSlotTitle } from '../lib/weeklyPlan';
import type { Recipe, WeekSlot } from '../types';
import { Button } from '../ui/controls';
import * as Dialog from '../ui/dialog';

const dayLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
const weekLabel = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function PlanDinnerDialog({ recipe, open, weekPlans, onOpenChange, onPlan, returnFocus }: {
  recipe?: Recipe;
  open: boolean;
  weekPlans?: Record<string, WeekSlot[]>;
  onOpenChange: (open: boolean) => void;
  onPlan: (week: string, day: number) => void;
  returnFocus: () => void;
}) {
  return <Dialog.Root historyKey="plan-dinner" open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="planner-picker-overlay" />
      <Dialog.Content className="planner-picker-dialog plan-dinner-dialog"
        onCloseAutoFocus={event => { event.preventDefault(); returnFocus(); }}>
        <div className="planner-picker-heading">
          <div><Dialog.Title>Plan this dinner</Dialog.Title>
            <Dialog.Description>{recipe?.title}</Dialog.Description></div>
          <Dialog.Close className="planner-picker-close" aria-label="Close dinner planner"><X size={22} /></Dialog.Close>
        </div>
        {recipe && <DinnerDatePicker recipe={recipe} weekPlans={weekPlans} onPlan={onPlan} />}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

function DinnerDatePicker({ recipe, weekPlans, onPlan }: {
  recipe: Recipe;
  weekPlans?: Record<string, WeekSlot[]>;
  onPlan: (week: string, day: number) => void;
}) {
  const today = new Date();
  const currentWeek = mondayFor(today);
  const [week, setWeek] = useState(currentWeek);
  const [day, setDay] = useState(() => (today.getDay() + 6) % 7);
  const slots = weekPlans?.[week] ?? defaultWeek();
  const existing = slots[day];
  const alreadyPlanned = existing.kind === 'recipe' && existing.id === recipe.id;
  const replacing = existing.kind !== 'empty' && !alreadyPlanned;

  return <>
    <div className="planner-week-picker" role="group" aria-label="Choose a week">
      <button type="button" aria-label="Previous week" onClick={() => setWeek(shiftWeek(week, -1))}><ArrowLeft size={19} aria-hidden="true" /></button>
      <div className="planner-week-range" aria-live="polite">
        <small>{week === currentWeek ? 'Current week' : 'Week of ' + weekLabel.format(dateForWeekDay(week, 0))}</small>
        <strong>{weekLabel.formatRange(dateForWeekDay(week, 0), dateForWeekDay(week, 6))}</strong>
      </div>
      <button type="button" aria-label="Next week" onClick={() => setWeek(shiftWeek(week, 1))}><ArrowRight size={19} aria-hidden="true" /></button>
    </div>
    <label className="plan-dinner-day">Dinner date
      <select value={day} onChange={event => setDay(Number(event.target.value))}>
        {WEEK_DAYS.map((name, index) => <option key={name} value={index}>
          {dayLabel.format(dateForWeekDay(week, index))}
        </option>)}
      </select>
    </label>
    <p className="planner-note" role="status">{alreadyPlanned ? 'This dinner is already planned for that date.' :
      replacing ? 'Replaces ' + weekSlotTitle(existing) + '.' : 'This date has no dinner planned.'}</p>
    <Button tone="primary" icon={<CalendarPlus size={18} />} disabled={alreadyPlanned} onClick={() => onPlan(week, day)}>
      {replacing ? 'Replace dinner' : 'Add dinner'}
    </Button>
  </>;
}
