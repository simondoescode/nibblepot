import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, CalendarDays, CalendarPlus, CookingPot, Snowflake } from 'lucide-react';
import { recipes } from '../data';
import { parseSharedWeek, sharedWeekTitle, type SharedWeek } from '../lib/weekShare';
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
  const range = date.formatRange(dateForWeekDay(plan.week, 0), dateForWeekDay(plan.week, 6));
  const dinners = plan.slots.flatMap(slot => {
    const recipe = slot.kind === 'recipe' ? recipes.find(item => item.id === slot.id) : undefined;
    return recipe ? [recipe] : [];
  });
  return <section className="shared-week-page" style={{ '--shared-week-action-height': `${actionHeight}px` } as CSSProperties}>
    <header className="shared-week-hero">
      <div className="shared-week-hero-copy">
        <span className="shared-week-eyebrow">A little dinner inspiration</span>
        <h1>{sharedWeekTitle(plan.week)}</h1>
        <p className="shared-week-range"><CalendarDays size={18} aria-hidden="true"/>{range}</p>
        <p>A week of dinners, shared with you. Take a look, then make it yours.</p>
        <span className="shared-week-count">{dinners.length} dinner{dinners.length === 1 ? '' : 's'} to cook · {plan.slots.filter(slot => slot.kind === 'leftovers' || slot.kind === 'freezer').length} easy nights</span>
      </div>
      {dinners.length > 0 && <div className="shared-week-hero-food" aria-hidden="true">
        {dinners.slice(0, 3).map((recipe, index) => <img key={index}
          src={import.meta.env.BASE_URL + (recipe.image ?? 'recipes/jacket.svg')} alt="" width="180" height="114"/>)}
      </div>}
    </header>
    <p className="shared-week-note">Make it yours with your serving sizes and larder.</p>
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
    {createPortal(<div className="shared-week-actions" ref={actionBar} role="region" aria-label="Save shared week">
      <div className="shared-week-actions-inner">
        <p id="shared-week-replace-note">Replaces <strong>{range}</strong> in your planner</p>
        <label className="shared-week-shopping-option">
          <input type="checkbox" checked={updateShopping} onChange={event => setUpdateShopping(event.target.checked)}/>
          <span>Also update my shopping list</span>
        </label>
        <Button tone="primary" aria-describedby="shared-week-replace-note" onClick={() => onImport(plan, updateShopping)} icon={<CalendarPlus size={20}/>}>Update my planner</Button>
      </div>
    </div>, document.body)}
  </section>;
}
