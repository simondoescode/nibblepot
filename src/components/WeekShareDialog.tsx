import { useRef, useState } from 'react';
import { Copy, Share2, X } from 'lucide-react';
import * as Dialog from '../ui/dialog';
import { Button } from '../ui/controls';
import { createWeekShareLink } from '../lib/weekShare';
import type { WeekSlot } from '../types';

export function WeekShareDialog({ week, slots, servings }: { week: string; slots: WeekSlot[]; servings: Record<string, number> }) {
  const [link, setLink] = useState('');
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const create = () => {
    setLink(createWeekShareLink(window.location.origin, week, slots, servings));
    setStatus(''); setOpen(true);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setStatus('Link copied. Ready to send.'); }
    catch { setStatus('Select and copy the link below.'); input.current?.focus(); input.current?.select(); }
  };
  const share = async () => {
    try { await navigator.share({ title: 'Our week of dinners | Simmer', text: 'Here’s our dinner plan for the week.', url: link }); }
    catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) setStatus('Sharing is unavailable. Copy the link instead.'); }
  };
  return <Dialog.Root historyKey="share-week" open={open} onOpenChange={setOpen}>
    <Button ref={trigger} size="small" icon={<Share2 size={16}/>} onClick={create}>Share week</Button>
    <Dialog.Portal>
      <Dialog.Overlay className="planner-picker-overlay"/>
      <Dialog.Content className="planner-picker-dialog week-share-dialog" aria-describedby="week-share-description"
        onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}>
        <div className="planner-picker-heading">
          <Dialog.Title>Share this week</Dialog.Title>
          <Dialog.Close className="planner-picker-close" aria-label="Close sharing"><X size={22}/></Dialog.Close>
        </div>
        <Dialog.Description id="week-share-description">Send this week’s dinners and serving sizes. Anyone with the link can view this snapshot.</Dialog.Description>
        <p>Later changes to your planner won’t change this link. Share again to send an updated plan.</p>
        <label className="week-share-label">Week share link
          <input ref={input} value={link} readOnly onFocus={event => event.currentTarget.select()}/>
        </label>
        <div className="week-share-actions">
          {typeof navigator.share === 'function' && <Button tone="primary" icon={<Share2 size={18}/>} onClick={share}>Share link</Button>}
          <Button icon={<Copy size={18}/>} onClick={copy}>Copy link</Button>
        </div>
        <p role="status" aria-live="polite">{status}</p>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
