import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, AlertTriangle, FileText } from 'lucide-react';
import { useTitik } from '../../context/useTitik';
import { PostComposer } from './PostComposer';
import { ReportForm } from './ReportForm';

export const CreateModal: React.FC = () => {
  const { composerOpen, composerTab, closeComposer, openComposer } = useTitik();
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && composerOpen) {
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false);
        } else {
          setShowDiscardConfirm(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [composerOpen, showDiscardConfirm]);

  if (!composerOpen) return null;

  const handleCloseAttempt = () => {
    setShowDiscardConfirm(true);
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    closeComposer();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="composer-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCloseAttempt();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-[#F7F6F1] dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl shadow-2xl overflow-hidden my-auto"
      >
        {/* Discard Confirmation Overlay */}
        {showDiscardConfirm && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black/75 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl p-5 max-w-xs text-center space-y-3 shadow-xl">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[#20221D] dark:text-[#F3F6F4]">
                Tutup tanpa menyimpan?
              </h4>
              <p className="text-xs text-[#686B65] dark:text-[#9EACA3]">
                Draf yang belum diterbitkan akan tetap tersimpan di sesi browser ini.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl border border-[#E4E2DA] dark:border-[#26352E] text-[#20221D] dark:text-[#F3F6F4] hover:bg-[#F7F6F1] dark:hover:bg-[#26352E] cursor-pointer"
                >
                  Lanjut Menulis
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDiscard}
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E4E2DA] dark:border-[#26352E] bg-white/70 dark:bg-[#1A221E]/70 backdrop-blur-sm">
          {/* Tab Switcher */}
          <div className="flex items-center p-1 bg-[#E4E2DA]/60 dark:bg-[#131916] rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => openComposer('post')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                composerTab === 'post'
                  ? 'bg-white dark:bg-[#26352E] text-[#263F35] dark:text-[#34D399] shadow-xs'
                  : 'text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Postingan</span>
            </button>
            <button
              type="button"
              onClick={() => openComposer('report')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                composerTab === 'report'
                  ? 'bg-white dark:bg-[#26352E] text-[#263F35] dark:text-[#34D399] shadow-xs'
                  : 'text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Laporan Warga</span>
            </button>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={handleCloseAttempt}
            className="p-1.5 rounded-full text-[#686B65] hover:text-[#20221D] dark:text-[#9EACA3] dark:hover:text-white hover:bg-[#E4E2DA]/60 dark:hover:bg-[#26352E] transition-colors cursor-pointer"
            aria-label="Tutup modal pembuatan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 max-h-[80vh] overflow-y-auto">
          {composerTab === 'post' ? (
            <PostComposer
              onSuccess={() => closeComposer()}
              onCancel={handleCloseAttempt}
            />
          ) : (
            <ReportForm
              onSuccess={() => {}}
              onCancel={closeComposer}
            />
          )}
        </div>
      </div>
    </div>
  );
};
