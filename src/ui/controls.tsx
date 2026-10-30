import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'primary' | 'cream' | 'dark';
  size?: 'normal' | 'small';
  icon?: ReactNode;
};

/** Shared Nibblepot button styling; native button behaviour stays intact. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  tone = 'cream', size = 'normal', icon, className = '', type = 'button', children, ...rest
}, ref) {
  return <button ref={ref} type={type}
    className={`btn btn-${tone}${size === 'small' ? ' btn-small' : ''}${className ? ` ${className}` : ''}`}
    {...rest}>
    {icon && <span className="btn-icon" aria-hidden="true">{icon}</span>}
    {children}
  </button>;
});

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & { label: string };

/** Icon-only actions must have a visible focus ring and an accessible name. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({
  label, type = 'button', className = '', children, ...rest
}, ref) {
  return <button ref={ref} aria-label={label} type={type} className={className} {...rest}>{children}</button>;
});

export function FilterChip({ selected, onClick, children }: {
  selected: boolean; onClick: () => void; children: ReactNode;
}) {
  return <button type="button" className={`chip ${selected ? 'selected' : ''}`}
    aria-pressed={selected} onClick={onClick}>{children}</button>;
}
