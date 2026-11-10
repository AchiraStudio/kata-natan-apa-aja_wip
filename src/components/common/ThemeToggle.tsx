import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  /** `side` for use on the forest sidebar, `default` for page surfaces. */
  variant?: 'default' | 'side';
}

const VARIANT_CLASS = {
  default: 'border-line-soft bg-surface-2 text-ink-2 hover:text-ink',
  side: 'border-side-line bg-white/8 text-side-ink-2 hover:text-side-ink hover:bg-white/14',
} as const;

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', variant = 'default' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
      aria-pressed={isDark}
      title={isDark ? 'Mode terang' : 'Mode gelap'}
      className={`inline-flex w-10 h-10 items-center justify-center rounded-lg border transition-colors cursor-pointer ${VARIANT_CLASS[variant]} ${className}`}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};
