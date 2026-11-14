import type { InputHTMLAttributes } from 'react';
import { useChangeMotion } from '../hooks/useChangeMotion';

/** Keep the native checkbox, label and hit area; animate only a new check. */
export function MotionCheckbox(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const ref = useChangeMotion<HTMLInputElement>(props.checked, 'pop', !!props.checked);
  return <input {...props} ref={ref} type="checkbox" />;
}
