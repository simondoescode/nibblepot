import { useState, type Dispatch, type SetStateAction } from 'react';
/** Ephemeral browsing context, separate from the versioned recipe/user-data schema. */
export function useSessionState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try { const raw = sessionStorage.getItem('nibblepot-ui-' + key); return raw ? JSON.parse(raw) as T : initial; }
    catch { return initial; }
  });
  const update: Dispatch<SetStateAction<T>> = action => setValue(previous => {
    const next = typeof action === 'function' ? (action as (value: T) => T)(previous) : action;
    try { sessionStorage.setItem('nibblepot-ui-' + key, JSON.stringify(next)); } catch { /* Storage may be unavailable. */ }
    return next;
  });
  return [value, update];
}
