import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { useTitik } from '../../context/useTitik';
import { PostComposer } from './PostComposer';
import { ReportForm } from './ReportForm';
import { GhostButton } from './ui';

/**
 * Create dialog. A full-screen sheet on phones, a centered panel from `sm` up.
 * Each form owns its scroll area and sticky footer; this shell owns the tabs, the close
 * button, focus handling and the "discard?" prompt, which only appears when there is something to lose.
 */
export const CreateModal: React.FC = () => {
  const { composerOpen, composerTab, closeComposer, openComposer } = useTitik();
  // A ref, not state: Escape pressed right after typing must already see the latest value
  const dirtyRef = useRef(false);
  const setDirty = useCallback((value: boolean) => {
    dirtyRef.current = value;
  }, []);
  const [confirming, setConfirming] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const requestClose = useCallback(() => {
    if (dirtyRef.current) setConfirming(true);
    else closeComposer();
  }, [closeComposer]);

  const discard = () => {
    setConfirming(false);
    setDirty(false);
    closeComposer();
  };

  // Keyboard: Escape closes (or dismisses the prompt), Tab stays inside the dialog
  useEffect(() => {
    if (!composerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (confirming) setConfirming(false);
        else requestClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [composerOpen, confirming, requestClose]);

  // Lock page scroll while open and give focus back to whatever opened the dialog
  useEffect(() => {
    if (!composerOpen) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
      returnFocusRef.current?.focus?.();
      setConfirming(false);
      setDirty(false);
    };
  }, [composerOpen]);

  if (!composerOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-6 bg-[var(--scrim)] animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="composer-modal-title"
        className="relative flex flex-col w-full h-[100dvh] sm:h-[min(90dvh,800px)] sm:max-w-2xl bg-surface sm:rounded-2xl sm:border sm:border-line-soft sm:shadow-[0_32px_80px_-24px_rgba(0,0,0,0.6)] overflow-hidden"
      >
        <header className="shrink-0 flex items-center gap-3 h-14 pl-4 pr-2 sm:pl-6 sm:pr-3 border-b border-line-soft pt-[env(safe-area-inset-top)] box-content">
          <h2 id="composer-modal-title" className="sr-only">
            {composerTab === 'post' ? 'Buat postingan' : 'Buat laporan warga'}
          </h2>
          <div role="tablist" aria-label="Yang ingin dibuat" className="titik-pill-track">
            {(
              [
                ['post', 'Postingan'],
                ['report', 'Laporan'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={composerTab === key}
                onClick={() => openComposer(key)}
                className={`titik-pill-tab ${composerTab === key ? 'active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Tutup"
            className="ml-auto w-11 h-11 rounded-lg flex items-center justify-center text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 min-h-0 flex flex-col">
          {composerTab === 'post' ? (
            <PostComposer onSuccess={closeComposer} onCancel={requestClose} onDirtyChange={setDirty} />
          ) : (
            <ReportForm onSuccess={() => {}} onCancel={closeComposer} onDirtyChange={setDirty} />
          )}
        </div>

        {confirming && (
          <div className="absolute inset-0 z-20 flex items-end sm:items-center justify-center bg-black/45">
            <div role="alertdialog" aria-labelledby="discard-title" aria-describedby="discard-body" className="w-full sm:max-w-sm bg-surface rounded-t-2xl sm:rounded-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:m-6 space-y-4 border border-line-soft">
              <div>
                <h3 id="discard-title" className="font-display text-lg font-semibold text-ink">
                  Tutup dan buang isian?
                </h3>
                <p id="discard-body" className="mt-1 text-sm text-ink-2">
                  {composerTab === 'post'
                    ? 'Teks postingan tetap tersimpan sebagai draf di sesi ini. Foto dan video yang sudah dipilih akan hilang.'
                    : 'Isian laporan, foto, dan video yang sudah dipilih akan hilang.'}
                </p>
              </div>
              <div className="flex gap-2">
                <GhostButton onClick={() => setConfirming(false)} autoFocus className="flex-1 bg-surface-2 text-ink">
                  Lanjut menulis
                </GhostButton>
                <button type="button" onClick={discard} className="flex-1 h-11 rounded-lg bg-st-ditolak text-white text-sm font-semibold hover:brightness-110 transition cursor-pointer">
                  Buang
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
