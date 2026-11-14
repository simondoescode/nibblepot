import type { ReactNode } from 'react';
import { useChangeMotion } from '../hooks/useChangeMotion';

/** Sparks are local, decorative and invisible without a user-triggered change. */
export function MotionMark({ active, children }: { active: boolean; children: ReactNode }) {
  const ref = useChangeMotion<HTMLSpanElement>(active, 'pop', active);
  return <span className="motion-mark" ref={ref} aria-hidden="true">{children}<MotionSparks /></span>;
}
export function MotionSparks() {
  return <>{[0,1,2,3].map(index => <i key={index} data-motion-spark aria-hidden="true" />)}</>;
}
