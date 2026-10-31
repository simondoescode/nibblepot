import { describe, expect, it } from 'vitest';
import { recipes } from '../src/data';
import { cookingPath, parseRoute, recipePath } from '../src/lib/routes';
import {
  DEFAULT_TIMER_SECONDS, MAX_TIMER_SECONDS, formatCountdown, initialCookingProgress,
  parseCookingProgress, suggestedTimerMinutes, timerSeconds,
} from '../src/lib/cooking';

describe('cooking routes', () => {
  it('gives every existing recipe a canonical full page and a cook URL', () => {
    for (const recipe of recipes) {
      const path = cookingPath(recipe.id);
      expect(path).toBe(recipePath(recipe.id) + 'cook/');
      expect(parseRoute(path)).toEqual({kind:'cook',id:recipe.id});
      expect(parseRoute(path.slice(0,-1))).toEqual({kind:'cook',id:recipe.id});
    }
    expect(parseRoute('/nibblepot/recipes/jacket/cook/extra/')).toEqual({kind:'not-found'});
  });
});

describe('cooking progress and timers', () => {
  it('starts on the first step with a paused five-minute timer', () => {
    expect(initialCookingProgress()).toEqual({
      step:0,checked:[],seconds:DEFAULT_TIMER_SECONDS,deadline:null,finished:false
    });
    expect(formatCountdown(5*60)).toBe('05:00');
    expect(formatCountdown(9)).toBe('00:09');
    expect(formatCountdown(75*60 + 2)).toBe('75:02');
  });
  it('accepts explicit durations, respects ranges, and never derives a duration from the recipe total', () => {
    expect(suggestedTimerMinutes('Simmer for 15 minutes until thick.')).toEqual([15]);
    expect(suggestedTimerMinutes('Bake for 45–60 minutes at 200°C.')).toEqual([45,60]);
    expect(suggestedTimerMinutes('Roast for 35-45 mins.')).toEqual([35,45]);
    expect(suggestedTimerMinutes('Cook until golden and piping hot.')).toEqual([]);
    expect(suggestedTimerMinutes('Heat the oven to 200°C.')).toEqual([]);
    expect(suggestedTimerMinutes('Cook for 999 minutes.')).toEqual([]);
  });
  it('does not drift when a tab is suspended and resumes from absolute deadlines', () => {
    expect(timerSeconds({seconds:300,deadline:13_000}, 11_000)).toBe(2);
    expect(timerSeconds({seconds:300,deadline:13_000}, 13_100)).toBe(0);
    expect(timerSeconds({seconds:90,deadline:null}, 100_000)).toBe(90);
  });
  it('restores only valid checklist IDs, clamps step number and expires completed timers', () => {
    const restored=parseCookingProgress({
      step:999,checked:['potatoes','potatoes','unknown',2],seconds:87,deadline:13000,finished:false,
    },3,['potatoes','baked-beans'],10000);
    expect(restored).toEqual({step:2,checked:['potatoes'],seconds:87,deadline:13000,finished:false});
    const expired=parseCookingProgress({...restored,deadline:9000},3,['potatoes'],10000);
    expect(expired.seconds).toBe(0);
    expect(expired.deadline).toBeNull();
    const malformed=parseCookingProgress({step:-42,seconds:MAX_TIMER_SECONDS+10,checked:'nope'},2,[],1000);
    expect(malformed).toEqual(initialCookingProgress());
  });
});
