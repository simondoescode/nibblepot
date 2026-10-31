import { ArrowDown, RefreshCw } from 'lucide-react';
import { MAX_PULL, PULL_THRESHOLD } from '../lib/pullGesture';

export function PullIndicator({ distance, refreshing }: { distance: number; refreshing: boolean }) {
  if (distance < 5 && !refreshing) return null;
  const armed = distance >= PULL_THRESHOLD;
  const progress = Math.min(1, distance / MAX_PULL);
  return <div className={`pull-native-indicator ${armed ? 'armed' : ''}`}
    role="status" aria-live="polite" aria-atomic="true"
    style={{ transform: `translate(-50%, ${refreshing ? 18 : Math.min(33, distance * .31)}px)` }}>
    <span className="pull-native-icon" aria-hidden="true">
      {refreshing ? <RefreshCw size={19} className="pull-spinning" /> :
        <ArrowDown size={19} style={{transform:`rotate(${Math.round(progress * 180)}deg)`}} />}
    </span>
    <span>{refreshing ? 'Refreshing…' : armed ? 'Release to refresh' : 'Pull to refresh'}</span>
  </div>;
}
