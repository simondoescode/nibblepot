import { useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';

const treatments = {
  pop: { token: '--motion-release', frames: [{ scale: '1' }, { scale: '1.22', offset: .45 }, { scale: '.96', offset: .75 }, { scale: '1' }] },
  select: { token: '--motion-release', frames: [{ scale: '.97' }, { scale: '1.03', offset: .6 }, { scale: '1' }] },
  reveal: { token: '--motion-reveal', frames: [{ opacity: .35, translate: '0 12px', scale: '.97' }, { opacity: 1, translate: '0 -2px', scale: '1.01', offset: .7 }, { opacity: 1, translate: '0 0', scale: '1' }] },
  stamp: { token: '--motion-release', frames: [{ scale: '.88', rotate: '-4deg' }, { scale: '1.06', rotate: '1deg', offset: .65 }, { scale: '1', rotate: '0deg' }] },
  shuffle: { token: '--motion-reveal', frames: [{ rotate: '-18deg', scale: '.9' }, { rotate: '12deg', scale: '1.12', offset: .55 }, { rotate: '0deg', scale: '1' }] },
  celebrate: { token: '--motion-celebrate', frames: [{ scale: '.8', rotate: '-8deg' }, { scale: '1.12', rotate: '3deg', offset: .55 }, { scale: '1', rotate: '0deg' }] },
} satisfies Record<string, { token: string; frames: Keyframe[] }>;

/** Animate a committed change, never its initial/restored state. DOM and focus stay intact.
 * Repeated changes, preference updates and unmount cancel all owned animations.
 * No app state or correctness depends on a timer or animation-finished callback.
 */
export function useChangeMotion<T extends HTMLElement>(value: unknown, treatment: keyof typeof treatments,
  enabled = true, selector?: string, scope?: unknown) {
  const ref = useRef<T>(null);
  const previous = useRef(value);
  const previousScope = useRef(scope);
  const reduced = useReducedMotion();
  useLayoutEffect(() => {
    const changed = Object.is(previousScope.current, scope) && !Object.is(previous.current, value);
    previousScope.current = scope;
    previous.current = value;
    const root = ref.current;
    const target = selector ? root?.querySelector<HTMLElement>(selector) : root;
    if (!changed || !enabled || reduced || !target?.animate) return;
    const style = getComputedStyle(target);
    const { token, frames } = treatments[treatment];
    const duration = Number.parseFloat(style.getPropertyValue(token)) || 240;
    const animation = target.animate(frames, { duration, easing: 'ease-out' });
    animation.id = `simmer-${treatment}`;
    const sparks = Array.from(target.querySelectorAll<HTMLElement>('[data-motion-spark]')).map((spark, index) => {
      const x = [15, -15, 14, -14][index % 4], y = [-15, -12, 13, 15][index % 4];
      const effect = spark.animate([
        { opacity: 0, translate: '0 0', scale: '.4' },
        { opacity: 1, translate: `${x * .6}px ${y * .6}px`, scale: '1', offset: .4 },
        { opacity: 0, translate: `${x}px ${y}px`, scale: '.3' },
      ], { duration, easing: 'ease-out' });
      effect.id = 'simmer-spark';
      return effect;
    });
    return () => { animation.cancel(); sparks.forEach(spark => spark.cancel()); };
  }, [value, treatment, enabled, selector, scope, reduced]);
  return ref;
}
