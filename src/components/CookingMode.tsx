import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeft, ArrowRight, Check, CheckCheck, ChefHat, Clock3, Minus, Pause, Play, Plus, RotateCcw, X } from 'lucide-react';
import { ingredientName } from '../data';
import { formatRecipeQuantity } from '../lib/quantities';
import {
  COOK_SESSION_PREFIX, MAX_TIMER_SECONDS, formatCountdown, initialCookingProgress,
  parseCookingProgress, suggestedTimerMinutes, timerSeconds, type CookingProgress,
} from '../lib/cooking';
import type { Recipe } from '../types';

function restoreProgress(recipe: Recipe): CookingProgress {
  try {
    const raw = sessionStorage.getItem(COOK_SESSION_PREFIX + recipe.id);
    return parseCookingProgress(raw ? JSON.parse(raw) as unknown : null, recipe.steps.length, recipe.ing.map(i => i.id));
  } catch { return initialCookingProgress(); }
}

/** Render the tools once: sidebar on desktop, accessible bottom sheet on smaller screens. */
function useCompactLayout(): boolean {
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 750px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 750px)');
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return compact;
}

export function CookingMode({ recipe, servings, onExit }: {
  recipe: Recipe; servings: number; onExit: () => void;
}) {
  const [progress, setProgress] = useState<CookingProgress>(() => restoreProgress(recipe));
  const [now, setNow] = useState(() => Date.now());
  const compact = useCompactLayout();
  const [activeTool, setActiveTool] = useState<'timer' | 'ingredients' | null>(null);
  useEffect(() => { if (!compact) setActiveTool(null); }, [compact]);
  const secondsLeft = timerSeconds(progress, now);
  const timerRunning = progress.deadline !== null && secondsLeft > 0;
  const timerFinished = secondsLeft === 0 && progress.deadline === null;
  const suggestions = suggestedTimerMinutes(recipe.steps[progress.step] ?? '');

  useEffect(() => {
    try { sessionStorage.setItem(COOK_SESSION_PREFIX + recipe.id, JSON.stringify(progress)); }
    catch { /* Private browsing / restricted storage: page stays usable in memory. */ }
  }, [recipe.id, progress]);

  useEffect(() => {
    if (progress.deadline === null) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 1000);
    const visibility = () => tick();
    document.addEventListener('visibilitychange', visibility);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', visibility); };
  }, [progress.deadline]);

  useEffect(() => {
    if (progress.deadline !== null && now >= progress.deadline) {
      setProgress(value => value.deadline !== null && now >= value.deadline
        ? { ...value, seconds: 0, deadline: null } : value);
    }
  }, [now, progress.deadline]);

  const goTo = (step: number) => {
    setProgress(current => ({ ...current, step: Math.max(0, Math.min(recipe.steps.length - 1, step)) }));
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const checkedCount = progress.checked.length;
  const toggleIngredient = (id: string, checked: boolean) => setProgress(current => ({
    ...current, checked: checked ? [...new Set([...current.checked, id])] : current.checked.filter(item => item !== id),
  }));
  const setTimer = (seconds: number) => {
    setProgress(current => ({ ...current, seconds: Math.min(MAX_TIMER_SECONDS, Math.max(0, seconds)), deadline: null }));
    setNow(Date.now());
  };
  const startTimer = () => {
    const time = Date.now();
    setNow(time);
    setProgress(current => current.seconds > 0
      ? { ...current, deadline: time + current.seconds * 1000 } : current);
  };
  const pauseTimer = () => {
    const time = Date.now();
    setNow(time);
    setProgress(current => ({ ...current, seconds: timerSeconds(current, time), deadline: null }));
  };
  const restart = () => {
    setProgress(initialCookingProgress());
    setNow(Date.now());
  };

  const renderTimer = () => (
          <section className="cook-timer" aria-label="Optional cooking timer">
            <div className="cook-panel-title"><Clock3 size={19} aria-hidden="true"/><h2>Kitchen timer</h2></div>
            <p className="cook-panel-description">Optional, for keeping an eye on the clock.</p>
            {suggestions.length>0 && <div className="cook-timer-presets">
              <span>From this step:</span>
              {suggestions.map(minutes => <button type="button" key={minutes} disabled={timerRunning}
                onClick={() => setTimer(minutes * 60)}>{minutes} min</button>)}
            </div>}
            <div className="cook-timer-row">
              <button type="button" aria-label="Subtract one minute" disabled={timerRunning || secondsLeft < 60}
                onClick={() => setTimer(secondsLeft - 60)}><Minus size={18} /></button>
              <output className="cook-timer-time" aria-label="Time remaining" aria-live="off">{formatCountdown(secondsLeft)}</output>
              <button type="button" aria-label="Add one minute" disabled={timerRunning || secondsLeft >= MAX_TIMER_SECONDS}
                onClick={() => setTimer(secondsLeft + 60)}><Plus size={18}/></button>
            </div>
            <div className="cook-timer-actions">
              {timerRunning
                ? <button type="button" className="cook-primary" onClick={pauseTimer}><Pause size={17}/> Pause</button>
                : <button type="button" className="cook-primary" onClick={startTimer} disabled={secondsLeft===0}>
                  <Play size={17}/> Start timer</button>}
              <button type="button" className="cook-secondary" onClick={() => setTimer(5 * 60)}>
                <RotateCcw size={16}/> Reset
              </button>
            </div>
            {timerFinished && <p className="cook-timer-done" role="status">⏰ Time's up! Check your food.</p>}
            <p className="cook-timer-note">Timer runs while this page is open and restores after a reload. It can't replace checking food is properly cooked.</p>
          </section>
  );
  const renderIngredients = () => (
          <details className="cook-ingredients" open>
            <summary><span><CheckCheck size={20} aria-hidden="true"/> Ingredients</span><strong>{checkedCount}/{recipe.ing.length}</strong></summary>
            <div className="cook-checklist">
              {recipe.ing.map(item => <label key={item.id} className={progress.checked.includes(item.id) ? 'is-checked' : ''}>
                <input type="checkbox" checked={progress.checked.includes(item.id)}
                  onChange={event => toggleIngredient(item.id, event.target.checked)}/>
                <span><strong>{formatRecipeQuantity(item, servings)}</strong> {ingredientName(item.id)}
                  {item.optional && <small>Optional</small>}</span>
              </label>)}
            </div>
          </details>
  );

  return <main className="cook-screen" id="main-content">
    <div className="cook-shell">
      <header className="cook-toolbar">
        <button type="button" className="cook-back" onClick={onExit}>
          <ArrowLeft size={19} aria-hidden="true" /> Recipe
        </button>
        <span className="cook-brand"><ChefHat size={18} aria-hidden="true"/> COOKING MODE</span>
        <span className="cook-serves">🍽️ {servings}</span>
      </header>
      <div className="cook-heading">
        <p>GOOD GRUB. ZERO FAFF.</p>
        <h1>{recipe.title}</h1>
      </div>
      <div className="cook-layout">
        <section className="cook-step-card" aria-label="Cooking instructions">
          {!progress.finished ? <>
            <div className="cook-progress-row">
              <span className="cook-step-count">STEP {progress.step + 1} OF {recipe.steps.length}</span>
              <span className="cook-step-percent">{Math.round((progress.step + 1) / recipe.steps.length * 100)}% through</span>
            </div>
            <div className="cook-progress-track" role="progressbar" aria-label="Recipe step progress"
              aria-valuemin={0} aria-valuemax={recipe.steps.length} aria-valuenow={progress.step + 1}>
              <div style={{ width: `${(progress.step + 1) / recipe.steps.length * 100}%` }} />
            </div>
            <div className="cook-step-content" aria-live="polite" aria-atomic="true">
              <span className="cook-step-number">{String(progress.step + 1).padStart(2, '0')}</span>
              <p>{recipe.steps[progress.step]}</p>
            </div>
            {compact && <div className="cook-mobile-tools" aria-label="Cooking tools">
              <button type="button" onClick={() => setActiveTool('ingredients')}
                aria-label="Open ingredient checklist" aria-haspopup="dialog">
                <CheckCheck size={19} aria-hidden="true" />
                <span>Ingredients</span><strong>{checkedCount}/{recipe.ing.length}</strong>
              </button>
              <button type="button" onClick={() => setActiveTool('timer')}
                aria-label="Open kitchen timer" aria-haspopup="dialog"
                className={timerRunning ? 'timer-active' : ''}>
                <Clock3 size={19} aria-hidden="true" />
                <span>Timer</span><strong>{formatCountdown(secondsLeft)}</strong>
                {timerFinished && <span className="cook-tool-alert">!</span>}
              </button>
            </div>}
            <div className="cook-step-actions">
              <button type="button" className="cook-secondary" onClick={() => goTo(progress.step - 1)}
                disabled={progress.step === 0}><ArrowLeft size={19} aria-hidden="true"/> Previous</button>
              {progress.step === recipe.steps.length - 1
                ? <button className="cook-primary" type="button"
                    onClick={() => setProgress(current => ({ ...current, finished: true }))}>
                    Finish cooking <Check size={20} aria-hidden="true"/></button>
                : <button className="cook-primary" type="button" onClick={() => goTo(progress.step + 1)}>
                    Next step <ArrowRight size={20} aria-hidden="true"/></button>}
            </div>
          </> : <div className="cook-complete">
            <span aria-hidden="true">🎉</span>
            <h2>Dinner's ready!</h2>
            <p>Time to dish up. You made it.</p>
            <button type="button" className="cook-primary" onClick={restart}><RotateCcw size={18}/> Cook again</button>
            <button type="button" className="cook-secondary" onClick={onExit}>Back to recipe</button>
          </div>}
        </section>
        {compact ? <Dialog.Root open={activeTool !== null} onOpenChange={open => { if (!open) setActiveTool(null); }}>
          <Dialog.Portal>
            <Dialog.Overlay className="cook-sheet-overlay" />
            <Dialog.Content className="cook-sheet" aria-describedby="cook-sheet-description">
              <div className="cook-sheet-handle" aria-hidden="true" />
              <div className="cook-sheet-heading">
                <Dialog.Title>{activeTool === 'timer' ? 'Kitchen timer' : 'Ingredients'}</Dialog.Title>
                <Dialog.Close className="cook-sheet-close" aria-label="Close cooking tools">
                  <X size={22} aria-hidden="true" />
                </Dialog.Close>
              </div>
              <Dialog.Description className="sr-only" id="cook-sheet-description">
                {activeTool === 'timer' ? 'Set or pause an optional countdown timer.' : 'Tick off the ingredients you have prepared.'}
              </Dialog.Description>
              <div className="cook-sheet-body">
                {activeTool === 'timer' ? renderTimer() : renderIngredients()}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root> : <div className="cook-side">
          {renderTimer()}
          {renderIngredients()}
        </div>}
      </div>
    </div>
  </main>;
}
