import { type InputHTMLAttributes, forwardRef, useId } from 'react';
import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Texto de apoio abaixo do campo -- some quando `error` está presente. */
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, id, className, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className={[styles.field, className].filter(Boolean).join(' ')}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={styles.input}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId ?? hintId}
          {...rest}
        />
        {error ? (
          <span id={errorId} className={styles.error} role="alert">
            {error}
          </span>
        ) : hint ? (
          <span id={hintId} className={styles.hint}>
            {hint}
          </span>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';
