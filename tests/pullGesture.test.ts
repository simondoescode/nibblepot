import { describe, expect, it } from 'vitest';
import { pullDistance, shouldRefresh, PULL_THRESHOLD } from '../src/lib/pullGesture';
describe('pull-to-refresh gesture', () => {
  it('requires an intentional long downward pull', () => {
    expect(shouldRefresh(pullDistance(10, 10, 10, 70))).toBe(false);
    expect(shouldRefresh(pullDistance(10, 10, 10, 190))).toBe(true);
    expect(PULL_THRESHOLD).toBeGreaterThan(50);
  });
  it('ignores upward and horizontal swipes', () => {
    expect(pullDistance(5, 150, 5, 40)).toBe(0);
    expect(pullDistance(5, 40, 180, 115)).toBe(0);
  });
});
