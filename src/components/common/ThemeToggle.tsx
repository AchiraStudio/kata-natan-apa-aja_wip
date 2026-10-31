import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
      aria-pressed={isDark}
      title={isDark ? 'Mode terang' : 'Mode gelap'}
      className={`inline-flex w-10 h-10 items-center justify-center rounded-full border border-[#E3E0D6] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-[#1B4332] dark:text-[#34D399] hover:bg-[#F7F5EF] dark:hover:bg-[#24302A] dark:hover:border-[#10B981]/40 transition-colors cursor-pointer ${className}`}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};