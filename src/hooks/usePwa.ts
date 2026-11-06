import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { clearInstallPrompt, dismissInstall, getInstallPrompt, installDismissed, isAppleMobile, isStandalone } from '../lib/install';

export function usePwa() {
  const [installed, setInstalled] = useState(isStandalone);
  const [canInstall, setCanInstall] = useState(() => !!getInstallPrompt());
  const [dismissed, setDismissed] = useState(installDismissed);
  const [installing, setInstalling] = useState(false);
  const [help, setHelp] = useState(false);
  const [error, setError] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const { offlineReady: [offlineReady], needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW();

  useEffect(() => {
    const ready = () => setCanInstall(!!getInstallPrompt());
    const installed = () => { setInstalled(true); setCanInstall(false); setHelp(false); };
    const connection = () => setOnline(navigator.onLine);
    const display = window.matchMedia('(display-mode: standalone)');
    const mode = () => setInstalled(isStandalone());
    window.addEventListener('nibblepot-install-ready', ready);
    window.addEventListener('appinstalled', installed);
    window.addEventListener('online', connection);
    window.addEventListener('offline', connection);
    display.addEventListener('change', mode);
    return () => {
      window.removeEventListener('nibblepot-install-ready', ready);
      window.removeEventListener('appinstalled', installed);
      window.removeEventListener('online', connection);
      window.removeEventListener('offline', connection);
      display.removeEventListener('change', mode);
    };
  }, []);

  const install = async () => {
    const event = getInstallPrompt();
    setError('');
    if (!event) { setHelp(true); return; }
    clearInstallPrompt();
    setCanInstall(false);
    setInstalling(true);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === 'accepted') { setDismissed(true); setHelp(false); }
      else { dismissInstall(); setDismissed(true); }
    } catch { setError('Installation did not open. Try your browser’s menu.'); setHelp(true); }
    finally { setInstalling(false); }
  };
  return { installed, canInstall, dismissed, installing, help, setHelp, error, online, offlineReady, needRefresh,
    apple: isAppleMobile(), install,
    dismiss: () => { dismissInstall(); setDismissed(true); },
    later: () => setNeedRefresh(false),
    update: () => { void updateServiceWorker(true).catch(() => setError('Could not update. Try Refresh app in Settings.')); },
  };
}
export type PwaState = ReturnType<typeof usePwa>;
