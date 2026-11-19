import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  const target = new EventTarget();
  vi.stubGlobal('window', Object.assign(target, { matchMedia: () => ({ matches: false }) }));
  vi.stubGlobal('navigator', { userAgent: 'Chrome', platform: 'Linux', maxTouchPoints: 0 });
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('installation lifecycle', () => {
  it('retains an early browser offer without opening it and clears it after installation', async () => {
    const install = await import('../src/lib/install');
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: vi.fn(), userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(install.getInstallPrompt()).toBe(event);
    expect(event.prompt).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('appinstalled'));
    expect(install.getInstallPrompt()).toBeNull();
  });
  it('respects Maybe later for seven days without changing recipe storage', async () => {
    const install = await import('../src/lib/install');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-06T12:00:00Z'));
    localStorage.setItem('simmer-recipes-v2', 'saved recipes');
    install.dismissInstall();
    expect(install.installDismissed()).toBe(true);
    vi.advanceTimersByTime(7 * 86400000);
    expect(install.installDismissed()).toBe(false);
    expect(localStorage.getItem('simmer-recipes-v2')).toBe('saved recipes');
  });
  it('keeps installation usable when storage is blocked', async () => {
    const install = await import('../src/lib/install');
    vi.stubGlobal('localStorage', { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } });
    expect(install.installDismissed()).toBe(false);
    expect(() => install.dismissInstall()).not.toThrow();
  });
  it('recognises iPads presenting a desktop user agent', async () => {
    const install = await import('../src/lib/install');
    vi.stubGlobal('navigator', { platform: 'MacIntel', userAgent: 'Safari', maxTouchPoints: 5 });
    expect(install.isAppleMobile()).toBe(true);
  });
  it('recognises the Safari standalone flag', async () => {
    const install = await import('../src/lib/install');
    vi.stubGlobal('navigator', { standalone: true });
    expect(install.isStandalone()).toBe(true);
  });
});
