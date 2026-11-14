import { useEffect, useState } from 'react';
import { ArrowUpRight, CalendarDays, CookingPot, Snowflake } from 'lucide-react';
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
    <div className="shared-week-days">
      {plan.slots.map((slot, index) => {
        const recipe = slot.kind === 'recipe' ? recipes.find(r => r.id === slot.id) : undefined;
        const secondary = slot.kind === 'leftovers' ? 'Enjoy what you’ve already cooked'
          : slot.kind === 'freezer' ? 'Something easy from the freezer'
          : 'No meal planned for this day';
        return <article className={`shared-week-day${recipe ? '' : ' shared-week-day--rest'}`} key={index}>
          <div className="shared-week-day-date">
            <strong>{WEEK_DAYS[index]}</strong><span>{date.format(dateForWeekDay(plan.week, index))}</span>
          </div>
          <div className="shared-week-day-visual" aria-hidden="true">
            {recipe
              ? <img src={import.meta.env.BASE_URL + (recipe.image ?? 'recipes/jacket.svg')} alt="" width="74" height="66"/>
              : slot.kind === 'freezer' ? <Snowflake size={26}/>
              : slot.kind === 'leftovers' ? <CookingPot size={26}/>
              : <CalendarDays size={26}/>}
          </div>
          <div className="shared-week-day-meal">
            <strong>{slot.kind === 'empty' ? 'No dinner planned' : weekSlotTitle(slot)}</strong>
            <small>{recipe ? `${recipe.mins} min · serves ${plan.servings[recipe.id]}` : secondary}</small>
          </div>
          {recipe && <button className="shared-week-day-action" type="button"
            aria-label={'View recipe for ' + WEEK_DAYS[index]} onClick={() => onRecipe(recipe.id)}>
            <ArrowUpRight size={20} aria-hidden="true"/>
          </button>}
        </article>;
      })}
    </div>
    <Button onClick={onPlanner}>Open my planner</Button>
  </section>;
}
