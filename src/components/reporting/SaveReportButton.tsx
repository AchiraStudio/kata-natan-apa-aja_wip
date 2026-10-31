import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { useTitik } from '../../context/TitikContext';

interface SaveReportButtonProps {
  reportId: string;
  isSavedByMe?: boolean;
  onSavedChange?: (isSaved: boolean) => void;
  className?: string;
}

export const SaveReportButton: React.FC<SaveReportButtonProps> = ({
  reportId,
  isSavedByMe = false,
  onSavedChange,
  className = '',
}) => {
  const { currentUserId, toggleReportSave } = useTitik();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!currentUserId) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    try {
      if (!toggleReportSave) {
        throw new Error('Fitur simpan laporan tidak tersedia.');
      }
      const result = await toggleReportSave(reportId);
      onSavedChange?.(result.isSaved);
    } catch (error) {
      console.error('Failed to save report:', error);
      setErrorMessage('Gagal menyimpan laporan. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-start">
      {currentUserId ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={isSaving}
          aria-pressed={isSavedByMe}
          aria-label={isSavedByMe ? 'Hapus laporan dari daftar tersimpan' : 'Simpan laporan'}
          className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${
          isSavedByMe
            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
            : 'border-[#E3E0D6] bg-white text-[#101913] hover:bg-[#F7F5EF] dark:border-[#26352E] dark:bg-[#1A221E] dark:text-[#F3F6F4] dark:hover:bg-[#131916]'
          } ${className}`}
        >
          <Bookmark className={`h-3.5 w-3.5 ${isSavedByMe ? 'fill-current' : ''}`} />
          <span>{isSaving ? 'Menyimpan...' : isSavedByMe ? 'Tersimpan' : 'Simpan'}</span>
        </button>
      ) : (
        <a
          href="/login"
          onClick={(event) => event.stopPropagation()}
          aria-label="Masuk untuk menyimpan laporan"
          className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E3E0D6] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#101913] transition-colors hover:bg-[#F7F5EF] dark:border-[#26352E] dark:bg-[#1A221E] dark:text-[#F3F6F4] dark:hover:bg-[#131916] ${className}`}
        >
          <Bookmark className="h-3.5 w-3.5" />
          <span>Simpan</span>
        </a>
      )}
      {errorMessage && (
        <span role="alert" className="mt-1 text-[10px] font-medium text-rose-600 dark:text-rose-400">
          {errorMessage}
        </span>
      )}
    </span>
  );
};
