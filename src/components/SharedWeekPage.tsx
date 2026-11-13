import { useEffect, useState } from 'react';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { recipes } from '../data';
import { parseSharedWeek } from '../lib/weekShare';
import { dateForWeekDay, WEEK_DAYS, weekSlotTitle } from '../lib/weeklyPlan';
import { Button } from '../ui/controls';

const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export function SharedWeekPage({ onRecipe, onPlanner }: { onRecipe: (id: string) => void; onPlanner: () => void }) {
  const [plan, setPlan] = useState(() => parseSharedWeek(location.hash));
  useEffect(() => {
    const sync = () => setPlan(parseSharedWeek(location.hash));
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  if (!plan) return <section className="recipe-page-not-found">
    <h1>This week link isn’t complete</h1>
    <p>Ask the sender to copy and send the full link again.</p>
    <Button onClick={onPlanner}>Open my planner</Button>
  </section>;
  return <section className="shared-week-page">
    <header className="page-intro planner-intro">
      <span className="intro-icon" aria-hidden="true"><CalendarDays size={23}/></span>
      <div><h1>A shared week of dinners</h1><p>{date.formatRange(dateForWeekDay(plan.week, 0), dateForWeekDay(plan.week, 6))}</p></div>
    </header>
    <p className="shared-week-note">A snapshot of the sender’s plan. Your own planner stays as it is.</p>
    <div className="planner-days">
      {plan.slots.map((slot, index) => {
        const recipe = slot.kind === 'recipe' ? recipes.find(r => r.id === slot.id) : undefined;
        return <article className="planner-day" key={index}>
          <div className="planner-day-label"><strong>{WEEK_DAYS[index]}</strong><span>{date.format(dateForWeekDay(plan.week, index))}</span></div>
          <div className="shared-week-meal">
            {recipe && <img className="planner-meal-thumb" src={import.meta.env.BASE_URL + (recipe.image ?? `recipes/${recipe.id}.svg`)} alt="" width="70" height="56"/>}
            <div className="planner-picked"><strong>{slot.kind === 'empty' ? 'No dinner planned' : weekSlotTitle(slot)}</strong>
              {recipe && <small>{recipe.mins} min · serves {plan.servings[recipe.id]}</small>}
            </div>
          </div>
          {recipe && <button className="planner-view" type="button" aria-label={'View recipe for ' + WEEK_DAYS[index]} onClick={() => onRecipe(recipe.id)}><ArrowUpRight size={20}/></button>}
        </article>;
      })}
    </div>
    <Button onClick={onPlanner}>Open my planner</Button>
  </section>;
}
