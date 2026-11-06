export interface InstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let pending: InstallPromptEvent | null = null;
// Capture before React mounts, including on a direct recipe URL.
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  pending = event as InstallPromptEvent;
  window.dispatchEvent(new Event('nibblepot-install-ready'));
});
window.addEventListener('appinstalled', () => { pending = null; });
export const getInstallPrompt = () => pending;
export const clearInstallPrompt = () => { pending = null; };
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;
export const isAppleMobile = () => /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const key = 'nibblepot-install-later';
export function installDismissed(): boolean {
  try { return Date.now() - Number(localStorage.getItem(key) || 0) < 7 * 86400000; }
  catch { return false; }
}
export function dismissInstall(): void {
  try { localStorage.setItem(key, String(Date.now())); } catch { /* Private browsing still works. */ }
}
