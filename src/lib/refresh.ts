/**
 * Refresh the complete PWA (HTML, JS, CSS and recipe data), not just React state.
 * Try installing and activating a newer service worker before reloading. When
 * offline the browser can still reload from the app's existing cached shell.
 */
export async function refreshPwa(): Promise<void> {
  try {
    if ('serviceWorker' in navigator && navigator.onLine) {
      const scope = new URL(import.meta.env.BASE_URL, location.origin).href;
      const registration = await navigator.serviceWorker.getRegistration(scope);
      if (registration) {
        await registration.update();
        let waiting = registration.waiting;
        if (registration.installing && !waiting) {
          const installing = registration.installing;
          // update() can resolve before a new worker has finished installing.
          await Promise.race([
            new Promise<void>(resolve => {
              const step = () => {
                if (installing.state === 'installed' || installing.state === 'activated' || installing.state === 'redundant') {
                  installing.removeEventListener('statechange', step);
                  resolve();
                }
              };
              installing.addEventListener('statechange', step);
              step();
            }),
            new Promise<void>(resolve => window.setTimeout(resolve, 2000)),
          ]);
          waiting = registration.waiting;
        }
        if (waiting) {
          // Workbox (vite-plugin-pwa) listens for SKIP_WAITING.
          const controlled = new Promise<void>(resolve => {
            const timeout = window.setTimeout(() => {
              navigator.serviceWorker.removeEventListener('controllerchange', changed);
              resolve();
            }, 2500);
            const changed = () => {
              clearTimeout(timeout);
              navigator.serviceWorker.removeEventListener('controllerchange', changed);
              resolve();
            };
            navigator.serviceWorker.addEventListener('controllerchange', changed);
          });
          waiting.postMessage({ type: 'SKIP_WAITING' });
          await controlled;
        }
      }
    }
  } catch {
    // Network/SW errors must never prevent a normal app reload.
  }
  window.location.reload();
}
