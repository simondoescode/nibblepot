import { Download, WifiOff, X, RefreshCw } from 'lucide-react';
import type { PwaState } from '../hooks/usePwa';

export function InstallCard({ pwa, settings = false }: { pwa: PwaState; settings?: boolean }) {
  if (!settings && (pwa.installed || pwa.dismissed || (!pwa.canInstall && !pwa.apple))) return null;
  return <section className="pwa-card" aria-label="Install Nibblepot">
    <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} width="52" height="52" alt="" />
    <div className="pwa-card-copy"><h3>{pwa.installed ? 'Nibblepot is on your home screen' : 'Tea times, one tap away.'}</h3>
      <p>{pwa.installed ? 'You’re using the app. Your recipes and lists stay on this device.' : 'Add Nibblepot to your home screen. Keep recipes, your planner and shopping list handy offline.'}</p>
      {!pwa.installed && <button className="btn btn-primary" type="button" disabled={pwa.installing} onClick={() => void pwa.install()}>
        <Download size={17} aria-hidden="true" /> {pwa.installing ? 'Opening…' : pwa.canInstall ? 'Install Nibblepot' : 'How to install'}
      </button>}
      {pwa.help && !pwa.installed && <div className="pwa-install-help">
        {pwa.apple ? <ol><li>Open your browser’s Share menu.</li><li>Choose <strong>Add to Home Screen</strong> (you may need to scroll).</li><li>Tap <strong>Add</strong>. If the option is missing, open this page in Safari.</li></ol> :
          <p>Open your browser’s menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>. On desktop, look for the install icon in the address bar. If it is missing, try Chrome or Edge.</p>}
        <p>Your saved lists stay in this browser. Export a backup in Settings before moving to a different browser.</p>
        <button className="btn" type="button" onClick={() => pwa.setHelp(false)}>Hide instructions</button>
      </div>}
      {pwa.error && <p role="status">{pwa.error}</p>}
    </div>
    {!settings && <button type="button" className="pwa-dismiss" onClick={pwa.dismiss} aria-label="Maybe later"><X size={20} /></button>}
  </section>;
}

export function PwaStatus({ pwa, cooking = false }: { pwa: PwaState; cooking?: boolean }) {
  return <>
    {!pwa.online && <div className="pwa-status" role="status"><WifiOff size={17} aria-hidden="true" /> You’re offline. Recipes and saved lists work here; shop links need internet.</div>}
    {pwa.needRefresh && !cooking && <aside className="pwa-update" aria-label="App update available">
      <div><strong>A fresh Nibblepot is ready</strong><p>Update when you’re ready. Your saved lists will stay.</p></div>
      <button className="btn btn-primary" type="button" onClick={pwa.update}><RefreshCw size={16} aria-hidden="true" /> Update app</button>
      <button className="btn" type="button" onClick={pwa.later}>Later</button>
      {pwa.error && <p role="status">{pwa.error}</p>}
    </aside>}
  </>;
}
