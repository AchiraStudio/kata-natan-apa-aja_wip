import React from 'react';

/** Shared form pieces for the create dialog. 16px text on phones so iOS does not zoom on focus. */

export const INPUT_CLASS = 'titik-pill-input px-3.5 min-h-11 text-base sm:text-sm';

export const Field: React.FC<{
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  optional?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, htmlFor, hint, optional, action, children }) => (
  <div>
    <div className="flex items-baseline justify-between gap-3 mb-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {optional && <span className="ml-1.5 text-xs font-normal text-ink-3">opsional</span>}
      </label>
      {action}
    </div>
    {children}
    {hint && <p className="mt-1.5 text-xs text-ink-3">{hint}</p>}
  </div>
);

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; hint?: string }>;
  /** `cards` shows each option's hint under its label; `track` is a compact single row. */
  variant?: 'track' | 'cards';
  columns?: 2 | 3 | 4;
}

/** Radio group drawn as buttons. Arrow keys move the selection, as native radios do. */
export function Segmented<T extends string>({ label, value, onChange, options, variant = 'track', columns = 2 }: SegmentedProps<T>) {
  const move = (e: React.KeyboardEvent, index: number) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = options[(index + step + options.length) % options.length];
    onChange(next.value);
    (e.currentTarget.parentElement?.querySelectorAll('[role="radio"]')[options.indexOf(next)] as HTMLElement | undefined)?.focus();
  };

  const cols = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' }[columns];

  return (
    <div role="radiogroup" aria-label={label} className={variant === 'track' ? 'titik-pill-track w-full' : `grid gap-2 ${cols}`}>
      {options.map((o, i) => {
        const checked = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => move(e, i)}
            className={
              variant === 'track'
                ? `flex-1 titik-pill-tab ${checked ? 'active' : ''}`
                : `text-left rounded-xl border px-3.5 py-3 transition-colors cursor-pointer ${
                    checked ? 'border-brand bg-brand-soft' : 'border-line-soft bg-surface hover:bg-surface-2'
                  }`
            }
          >
            <span className={variant === 'track' ? '' : 'block text-sm font-semibold text-ink'}>{o.label}</span>
            {variant === 'cards' && o.hint && <span className="block mt-0.5 text-xs text-ink-2 leading-snug">{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Sticky action row at the bottom of a form. Respects the phone home-indicator inset. */
export const FormFooter: React.FC<{ children: React.ReactNode; start?: React.ReactNode }> = ({ children, start }) => (
  <div className="shrink-0 flex items-center gap-3 px-4 sm:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-line-soft bg-surface">
    {start && <div className="min-w-0 mr-auto text-xs text-ink-3">{start}</div>}
    <div className={`flex items-center gap-2 ${start ? '' : 'ml-auto'}`}>{children}</div>
  </div>
);

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...props }) => (
  <button
    {...props}
    className={`h-11 px-5 inline-flex items-center justify-center gap-2 rounded-lg bg-brand text-on-brand text-sm font-semibold hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer ${className}`}
  />
);

export const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...props }) => (
  <button
    {...props}
    className={`h-11 px-4 inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer ${className}`}
  />
);

export const ErrorNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p role="alert" className="rounded-lg border border-st-ditolak/40 bg-st-ditolak/10 px-3.5 py-2.5 text-sm text-ink">
    {children}
  </p>
);
