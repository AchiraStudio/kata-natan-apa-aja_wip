import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { TitikLogo } from '../common/TitikLogo';
import { ThemeToggle } from '../common/ThemeToggle';

interface AuthShellProps {
  mode: 'login' | 'register';
  title: string;
  description: string;
  children: React.ReactNode;
}

/**
 * Shared frame for sign in and sign up: one card, forest-green brand panel on the left,
 * the form on the right. Under lg the brand panel shrinks to a short banner above the form.
 * The diagonal slashes are the old TITIK motif (a report is a point that travels).
 */
export const AuthShell: React.FC<AuthShellProps> = ({ mode, title, description, children }) => (
  <div className="relative min-h-[100dvh] w-full flex items-center justify-center sm:p-6 lg:p-10 text-ink">
    <div className="absolute top-4 right-4 z-20">
      <ThemeToggle />
    </div>

    <div className="w-full max-w-5xl lg:min-h-[680px] grid lg:grid-cols-[5fr_6fr] bg-surface sm:border sm:border-line-soft sm:rounded-3xl overflow-hidden sm:shadow-[0_28px_60px_-32px_rgba(10,30,18,0.55)]">
      {/* Brand panel */}
      <aside className="relative overflow-hidden bg-[var(--hero)] text-white px-6 py-8 sm:px-10 lg:p-12 flex flex-col justify-between gap-10 min-h-[200px]">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none select-none">
          <span className="absolute -top-10 -right-16 w-80 h-32 rounded-3xl bg-white/6 -rotate-[35deg]" />
          <span className="absolute top-[28%] -right-8 w-64 h-14 rounded-2xl bg-white/9 -rotate-[35deg]" />
          <span className="absolute top-[52%] -left-20 w-96 h-24 rounded-3xl bg-white/5 -rotate-[35deg]" />
          <span className="absolute bottom-16 -left-10 w-72 h-12 rounded-2xl bg-lime/12 -rotate-[35deg]" />
          <span className="absolute top-12 left-1/3 w-40 h-px bg-white/25 -rotate-[35deg]" />
          <span className="absolute bottom-28 right-10 w-48 h-px bg-white/25 -rotate-[35deg]" />
        </div>

        <Link to="/" className="relative flex items-center gap-2.5 w-fit" aria-label="TITIK. Beranda">
          <TitikLogo className="w-9 h-9" pinColor="#5fc785" innerColor="#14301f" dotColor="#eaf3e2" />
          <span className="font-display text-2xl font-extrabold tracking-tight">
            TITIK<span className="text-brand">.</span>
          </span>
        </Link>

        <div className="relative space-y-4">
          <p className="font-display text-2xl sm:text-3xl lg:text-[34px] font-bold leading-[1.12] tracking-tight">
            Lihat masalahnya.
            <br />
            Telusuri anggarannya.
            <br />
            <span className="text-lime">Pantau hasilnya.</span>
          </p>
          <p className="hidden lg:block text-sm text-white/75 max-w-sm leading-relaxed">
            Kanal warga Kota Bogor untuk melaporkan masalah fasilitas publik dan mengawal penanganannya secara terbuka.
          </p>
        </div>

        <p className="relative hidden lg:flex items-center gap-2 text-xs text-white/65">
          <span aria-hidden="true" className="w-2 h-2 rounded-full bg-lime titik-live" />
          Setiap masalah adalah titik: muncul, ditindak, lalu tuntas.
        </p>
      </aside>

      {/* Form panel */}
      <main className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12 flex flex-col justify-center">
        <div className="w-full max-w-md mx-auto">
          <div role="tablist" aria-label="Masuk atau daftar" className="titik-pill-track mb-7 w-fit">
            <Link to="/login" role="tab" aria-selected={mode === 'login'} className={`titik-pill-tab ${mode === 'login' ? 'active' : ''}`}>
              Masuk
            </Link>
            <Link to="/daftar" role="tab" aria-selected={mode === 'register'} className={`titik-pill-tab ${mode === 'register' ? 'active' : ''}`}>
              Daftar
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-ink">{title}</h1>
          <p className="mt-2 mb-7 text-sm text-ink-2">{description}</p>
          {children}
          <p className="mt-8 text-xs text-ink-3">
            <Link to="/" className="underline underline-offset-2 hover:text-ink">
              Lanjut tanpa masuk
            </Link>{' '}
            untuk melihat laporan dan peta tanpa akun.
          </p>
        </div>
      </main>
    </div>
  </div>
);

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  /** Adds a show/hide control for password fields. */
  reveal?: { visible: boolean; onToggle: () => void };
}

export const AuthField: React.FC<AuthFieldProps> = ({ label, hint, reveal, id, className = '', ...input }) => {
  const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-medium text-ink mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input id={fieldId} {...input} className={`titik-pill-input px-3.5 min-h-11 ${reveal ? 'pr-11' : ''} ${className}`} />
        {reveal && (
          <button
            type="button"
            onClick={reveal.onToggle}
            aria-label={reveal.visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-md flex items-center justify-center text-ink-3 hover:text-ink cursor-pointer"
          >
            {reveal.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-ink-3">{hint}</p>}
    </div>
  );
};

export const AuthAlert: React.FC<{ kind: 'error' | 'success'; children: React.ReactNode }> = ({ kind, children }) => (
  <div
    role={kind === 'error' ? 'alert' : 'status'}
    className={`mb-5 rounded-lg px-3.5 py-3 text-sm border ${
      kind === 'error' ? 'border-st-ditolak/40 text-st-ditolak bg-st-ditolak/10' : 'border-st-tuntas/40 text-ink bg-st-tuntas/10'
    }`}
  >
    {children}
  </div>
);
