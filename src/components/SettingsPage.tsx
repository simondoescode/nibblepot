import { useRef, useState, type ChangeEvent } from 'react';
import { Download, RefreshCw, Trash2, Upload, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/controls';
import { parseSavedData } from '../lib/storage';
import type { SavedData } from '../types';
import { version } from '../../package.json';

export function SettingsPage({ data, onRefresh, refreshing, onRestore, onReset, notify }: {
  data: SavedData;
  onRefresh: () => void;
  refreshing: boolean;
  onRestore: (value: SavedData) => void;
  onReset: () => void;
  notify: (message: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify({ format: 'nibblepot-backup', version: 1, data }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nibblepot-backup.json';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Backup downloaded');
  };

  const restoreBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 100_000) { notify('That backup is too large'); return; }
    setReading(true);
    try {
      const content: unknown = JSON.parse(await file.text());
      if (!content || typeof content !== 'object' || Array.isArray(content)) throw new Error('Not a backup');
      const envelope = content as Record<string, unknown>;
      if (envelope.format !== 'nibblepot-backup' || envelope.version !== 1) throw new Error('Unknown backup');
      const payload = envelope.data;
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Missing data');
      const raw = payload as Record<string, unknown>;
      if (!Array.isArray(raw.larder) || !Array.isArray(raw.favorites) || !Array.isArray(raw.shopping)) throw new Error('Invalid data');
      if (!window.confirm('Replace the favourites, larder and shopping list on this device with this backup?')) return;
      onRestore(parseSavedData(payload));
      notify('Backup restored!');
    } catch {
      notify('Could not read that Nibblepot backup');
    } finally { setReading(false); }
  };

  const confirmReset = () => {
    if (window.confirm('Delete all saved favourites, larder ingredients and shopping items on this device? This cannot be undone.')) {
      onReset();
      notify('Saved data cleared');
    }
  };

  return <div className="settings-page">
    <section className="page-intro settings-intro">
      <div><h2>Little tweaks.</h2><p>Make Nibblepot yours. No account, no fuss.</p></div>
      <span className="intro-icon" aria-hidden="true">🍲</span>
    </section>
    <div className="settings-stack">
      <section className="settings-panel">
        <div className="settings-heading"><div><h3>App & updates</h3><p>Pull down at the top of any page to refresh the whole app.</p></div><span className="settings-version">v{version}</span></div>
        <div className="settings-action">
          <div><strong>Refresh Nibblepot</strong><small>Check for an update, then reload the PWA.</small></div>
          <Button tone="primary" icon={<RefreshCw size={17} />} onClick={onRefresh} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh app'}
          </Button>
        </div>
      </section>
      <section className="settings-panel">
        <div className="settings-heading"><div><h3>Your recipe stash</h3><p>Everything stays on this device unless you export it.</p></div></div>
        <div className="settings-stats">
          <div><strong>{data.favorites.length}</strong><span>Favourites</span></div>
          <div><strong>{data.larder.length}</strong><span>In your larder</span></div>
          <div><strong>{data.shopping.length}</strong><span>Shopping items</span></div>
        </div>
        <div className="settings-action"><div><strong>Download backup</strong><small>Keep a copy of your saved favourites and lists.</small></div>
          <Button icon={<Download size={17} />} onClick={downloadBackup}>Export</Button></div>
        <div className="settings-action"><div><strong>Restore backup</strong><small>Import a Nibblepot backup from this or another device.</small></div>
          <Button icon={<Upload size={17} />} disabled={reading} onClick={() => fileInput.current?.click()}>Import</Button>
          <input ref={fileInput} type="file" accept=".json,application/json" className="sr-only" tabIndex={-1} aria-label="Choose Nibblepot backup" onChange={restoreBackup} />
        </div>
      </section>
      <section className="settings-panel">
        <div className="settings-action"><div><h3>Your data, your choice</h3><p><ShieldCheck size={16} aria-hidden="true" /> Nothing is stored in an online account.</p></div>
          <Button className="btn-danger" icon={<Trash2 size={17} />} onClick={confirmReset}>Clear saved data</Button>
        </div>
      </section>
    </div>
  </div>;
}
