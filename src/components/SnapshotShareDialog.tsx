import { useRef, useState } from 'react';
import { Copy, Share2, X } from 'lucide-react';
import * as Dialog from '../ui/dialog';
import { Button } from '../ui/controls';

export function SnapshotShareDialog({ subject, buttonLabel, title, description, note, inputLabel, shareText, createLink }: {
  subject: string; buttonLabel: string; title: string; description: string; note: string;
  inputLabel: string; shareText: string; createLink: () => string;
}) {
  const [link, setLink] = useState('');
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const create = () => {
    try { setLink(createLink()); setStatus(''); setError(''); setOpen(true); }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not create a link. Try again.'); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setStatus('Link copied. Ready to send.'); }
    catch { setStatus('Select and copy the link below.'); input.current?.focus(); input.current?.select(); }
  };
  const share = async () => {
    try { await navigator.share({ title: title + ' | Simmer', text: shareText, url: link }); }
    catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) setStatus('Sharing is unavailable. Copy the link instead.'); }
  };
  return <Dialog.Root historyKey={'share-' + subject} open={open} onOpenChange={setOpen}>
    <Button ref={trigger} size="small" icon={<Share2 size={16}/>} onClick={create}>{buttonLabel}</Button>
    {error && <p role="alert">{error}</p>}
    <Dialog.Portal>
      <Dialog.Overlay className="planner-picker-overlay"/>
      <Dialog.Content className="planner-picker-dialog week-share-dialog" aria-describedby={subject + '-share-description'}
        onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}>
        <div className="planner-picker-heading">
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Close className="planner-picker-close" aria-label="Close sharing"><X size={22}/></Dialog.Close>
        </div>
        <Dialog.Description id={subject + '-share-description'}>{description}</Dialog.Description>
        <p>{note}</p>
        <label className="week-share-label">{inputLabel}
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
