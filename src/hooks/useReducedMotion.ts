import { useSyncExternalStore } from 'react';
const query = '(prefers-reduced-motion: reduce)';
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};
export const prefersReducedMotion = () => window.matchMedia(query).matches;
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
