import { type ButtonHTMLAttributes, forwardRef } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, className, ...rest }, ref) => (
    <button
      ref={ref}
      className={[styles.button, styles[variant], styles[size], fullWidth && styles.fullWidth, className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  )
);
Button.displayName = 'Button';
