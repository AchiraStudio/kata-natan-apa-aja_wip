import React from 'react';

interface PageShellProps {
  children: React.ReactNode;
  /** Reading width. `wide` for data-dense pages, `narrow` for forms and text. */
  width?: 'narrow' | 'default' | 'wide';
  className?: string;
}

const WIDTHS = {
  narrow: 'max-w-3xl',
  default: 'max-w-5xl',
  wide: 'max-w-6xl',
} as const;

/**
 * The one container every scrolling page uses, so gutters, max widths and the
 * space reserved for the mobile bottom bar are identical across the app.
 */
export const PageShell: React.FC<PageShellProps> = ({ children, width = 'default', className = '' }) => (
  <main className="flex-1 min-w-0 w-full">
    <div className={`titik-stagger mx-auto w-full ${WIDTHS[width]} px-4 sm:px-6 lg:px-10 pt-5 lg:pt-10 pb-32 lg:pb-14 ${className}`}>
      {children}
    </div>
  </main>
);

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Small context line above the title, e.g. a back link. */
  kicker?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions, kicker }) => (
  <header className="mb-6 lg:mb-8">
    {kicker && <div className="mb-3 text-sm">{kicker}</div>}
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-2xl lg:text-[28px] leading-tight font-bold text-ink">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-ink-2 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  </header>
);
