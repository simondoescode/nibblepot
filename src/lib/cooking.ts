/**
 * Cooking-mode progress lives only in sessionStorage, scoped to a recipe.
 * All validation is independent of React and doesn't alter the main saved data.
 */
export const COOK_SESSION_PREFIX = 'nibblepot-cook-v1:';
export const DEFAULT_TIMER_SECONDS = 5 * 60;
export const MAX_TIMER_SECONDS = 180 * 60;

export interface CookingProgress {
  step: number;
  checked: string[];
  seconds: number;
  deadline: number | null;
  finished: boolean;
}

export function initialCookingProgress(): CookingProgress {
  return { step: 0, checked: [], seconds: DEFAULT_TIMER_SECONDS, deadline: null, finished: false };
}

export function parseCookingProgress(raw: unknown, totalSteps: number, allowedIngredients: string[], now = Date.now()): CookingProgress {
  const defaults = initialCookingProgress();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaults;
  const value = raw as Record<string, unknown>;
  const step = typeof value.step === 'number' && Number.isInteger(value.step)
    ? Math.min(Math.max(value.step, 0), Math.max(0, totalSteps - 1)) : 0;
  const checked = Array.isArray(value.checked)
    ? [...new Set(value.checked.filter((id): id is string => typeof id === 'string' && allowedIngredients.includes(id)))]
    : [];
  const seconds = typeof value.seconds === 'number' && Number.isInteger(value.seconds) &&
    value.seconds >= 0 && value.seconds <= MAX_TIMER_SECONDS ? value.seconds : defaults.seconds;
  const deadline = typeof value.deadline === 'number' && Number.isFinite(value.deadline) &&
    value.deadline > now && value.deadline <= now + MAX_TIMER_SECONDS * 1000
    ? value.deadline : null;
  const expired = typeof value.deadline === 'number' && value.deadline <= now;
  return { step, checked, seconds: expired ? 0 : seconds, deadline,
    finished: value.finished === true };
}

export function timerSeconds(progress: Pick<CookingProgress, 'seconds' | 'deadline'>, now = Date.now()): number {
  return progress.deadline === null ? progress.seconds :
    Math.max(0, Math.ceil((progress.deadline - now) / 1000));
}

export function formatCountdown(seconds: number): string {
  const value = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

/** Only durations stated explicitly in the current cooking instruction; never infer an overall cooking time. */
export function suggestedTimerMinutes(step: string): number[] {
  const range = step.match(/\b(\d{1,3})\s*[–—-]\s*(\d{1,3})\s*(?:minutes?|mins?)\b/i);
  if (range) {
    const first = Number(range[1]), last = Number(range[2]);
    return first > 0 && first < last && last <= 180 ? [first, last] : [];
  }
  const single = step.match(/\b(\d{1,3})\s*(?:minutes?|mins?)\b/i);
  if (!single) return [];
  const minutes = Number(single[1]);
  return minutes >= 1 && minutes <= 180 ? [minutes] : [];
}
