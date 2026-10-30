import { RefreshCw } from 'lucide-react';
import { PULL_THRESHOLD } from '../lib/pullGesture';
export function PullIndicator({ distance, refreshing }: { distance: number; refreshing: boolean }) {
  if (distance < 5 && !refreshing) return null;
  const armed = distance >= PULL_THRESHOLD;
  return <div className={`pull-indicator ${armed ? 'armed' : ''}`} role="status" aria-live="polite"
    style={{ transform: `translate(-50%, ${refreshing ? 20 : Math.min(34, distance * .35)}px)` }}>
    <RefreshCw size={18} className={refreshing ? 'pull-spinning' : ''} aria-hidden="true"/>
    <span>{refreshing ? 'Refreshing Nibblepot…' : armed ? 'Release to refresh' : 'Pull to refresh'}</span>
  </div>;
}
