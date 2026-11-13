import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, CalendarDays, CookingPot, Snowflake, Utensils } from 'lucide-react';
import { recipes } from '../data';
import { parseSharedWeek, type SharedWeek } from '../lib/weekShare';
import { dateForWeekDay, WEEK_DAYS, weekSlotTitle } from '../lib/weeklyPlan';
import { Button } from '../ui/controls';

const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export function SharedWeekPage({ onRecipe, onPlanner, onImport }: {
  onRecipe: (id: string) => void; onPlanner: () => void;
  onImport: (plan: SharedWeek, updateShopping: boolean) => void;
}) {
  const [plan, setPlan] = useState(() => parseSharedWeek(location.hash));
  const [updateShopping, setUpdateShopping] = useState(false);
  const [actionHeight, setActionHeight] = useState(148);
  const actionBar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sync = () => { setPlan(parseSharedWeek(location.hash)); setUpdateShopping(false); };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => {
    if (!plan || !actionBar.current) return;
    const element = actionBar.current;
    const observer = new ResizeObserver(() => setActionHeight(element.getBoundingClientRect().height));
    observer.observe(element);
    return () => observer.disconnect();
  }, [plan]);
  if (!plan) return <section className="recipe-page-not-found">
    <h1>This week link isn’t complete</h1>
    <p>Ask the sender to copy and send the full link again.</p>
    <Button onClick={onPlanner}>Open my planner</Button>
  </section>;
  const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
  const weekLabel = shortDate.formatRange(dateForWeekDay(plan.week, 0), dateForWeekDay(plan.week, 6));
  return <section className="shared-week-page" style={{ '--shared-week-action-height': `${actionHeight}px` } as CSSProperties}>
    <header className="page-intro planner-intro">
      <span className="intro-icon" aria-hidden="true"><CalendarDays size={23}/></span>
      <div><h1>A shared week of dinners</h1><p>{date.formatRange(dateForWeekDay(plan.week, 0), dateForWeekDay(plan.week, 6))}</p></div>
    </header>
    <p className="shared-week-note">Preview their dinners, then make this week yours. Updating uses your serving sizes and larder.</p>
    <div className="planner-days">
      {plan.slots.map((slot, index) => {
        const recipe = slot.kind === 'recipe' ? recipes.find(r => r.id === slot.id) : undefined;
        return <article className="planner-day shared-week-day" key={index}>
          <div className="planner-day-label"><strong>{WEEK_DAYS[index]}</strong><span>{shortDate.format(dateForWeekDay(plan.week, index))}</span></div>
          <div className="shared-week-meal">
            {recipe && <img className="planner-meal-thumb" src={import.meta.env.BASE_URL + (recipe.image ?? `recipes/${recipe.id}.svg`)} alt="" width="70" height="56"/>}
            {!recipe && <span className="planner-meal-thumb" data-kind={slot.kind} aria-hidden="true">
              {slot.kind === 'leftovers' ? <CookingPot size={22}/> : slot.kind === 'freezer' ? <Snowflake size={22}/> : <Utensils size={22}/>}
            </span>}
            <div className="planner-picked"><strong>{slot.kind === 'empty' ? 'No dinner planned' : weekSlotTitle(slot)}</strong>
              {recipe && <small>{recipe.mins} min · serves {plan.servings[recipe.id]}</small>}
            </div>
          </div>
          {recipe && <button className="planner-view" type="button" aria-label={'View recipe for ' + WEEK_DAYS[index]} onClick={() => onRecipe(recipe.id)}><ArrowUpRight size={20} aria-hidden="true"/></button>}
        </article>;
      })}
    </div>
    {createPortal(<div className="shared-week-actions" ref={actionBar} aria-label="Save shared week">
      <div className="shared-week-actions-inner">
        <p>Replaces <strong>{weekLabel}</strong> in your planner</p>
        <label className="shared-week-shopping-option">
          <input type="checkbox" checked={updateShopping} onChange={event => setUpdateShopping(event.target.checked)}/>
          <span>Also update my shopping list</span>
        </label>
        <Button tone="primary" onClick={() => onImport(plan, updateShopping)} icon={<CalendarDays size={20}/>}>Update my planner</Button>
      </div>
    </div>, document.body)}
  </section>;
}
