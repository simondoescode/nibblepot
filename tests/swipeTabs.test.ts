import { describe, expect, it } from 'vitest';
import { SWIPE_TABS, swipeDestination } from '../src/hooks/useSwipeTabs';

describe('mobile swipe destinations', () => {
  it('follows the visible mobile bottom navigation order', () => {
    expect(SWIPE_TABS).toEqual(['home', 'planner', 'larder', 'shopping']);
    expect(swipeDestination('home', -100)).toBe('planner');
    expect(swipeDestination('planner', 100)).toBe('home');
    expect(swipeDestination('planner', -100)).toBe('larder');
    expect(swipeDestination('larder', -100)).toBe('shopping');
  });
  it('does not swipe beyond boundaries or through hidden More pages', () => {
    expect(swipeDestination('home', 100)).toBeNull();
    expect(swipeDestination('shopping', -100)).toBeNull();
    expect(swipeDestination('favorites', -100)).toBeNull();
    expect(swipeDestination('settings', 100)).toBeNull();
    expect(swipeDestination('planner', 0)).toBeNull();
  });
});
