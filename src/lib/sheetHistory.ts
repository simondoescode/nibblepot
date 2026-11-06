/** A modal gets one same-URL entry. Back dismisses it before leaving the screen. */
let active: { close: () => void; token: string } | undefined;
let pending: Promise<void> | undefined;
let finish: (() => void) | undefined;

export function registerSheet(close: () => void, token: string) {
  active = { close, token };
  if (history.state?.nibblepotSheet !== token) history.pushState({ ...history.state, nibblepotSheet: token }, '', location.href);
  const pop = () => {
    if (history.state?.nibblepotSheet === token) return;
    if (active?.token === token) { active = undefined; close(); }
    finish?.();
    finish = undefined;
    pending = undefined;
  };
  window.addEventListener('popstate', pop);
  return () => {
    window.removeEventListener('popstate', pop);
    if (active?.token === token) void dismissSheet();
  };
}

export function dismissSheet(): Promise<void> {
  if (pending) return pending;
  if (!active) return Promise.resolve();
  const sheet = active;
  active = undefined;
  sheet.close();
  if (history.state?.nibblepotSheet !== sheet.token) return Promise.resolve();
  pending = new Promise<void>(resolve => {
    const done = () => {
      window.removeEventListener('popstate', done);
      finish = undefined;
      pending = undefined;
      resolve();
    };
    finish = done;
    window.addEventListener('popstate', done, { once: true });
    history.back();
  });
  return pending;
}
