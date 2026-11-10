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
          className={`titik-pill-btn ${isSavedByMe ? 'titik-pill-btn-subtle' : 'titik-pill-btn-secondary'} ${className}`}
        >
          <Bookmark className={`h-4 w-4 ${isSavedByMe ? 'fill-current' : ''}`} aria-hidden="true" />
          <span>{isSaving ? 'Menyimpan...' : isSavedByMe ? 'Tersimpan' : 'Simpan'}</span>
        </button>
      ) : (
        <a
          href="/login"
          onClick={(event) => event.stopPropagation()}
          aria-label="Masuk untuk menyimpan laporan"
          className={`titik-pill-btn titik-pill-btn-secondary ${className}`}
        >
          <Bookmark className="h-4 w-4" aria-hidden="true" />
          <span>Simpan</span>
        </a>
      )}
      {errorMessage && (
        <span role="alert" className="mt-1 text-xs font-medium text-st-ditolak">
          {errorMessage}
        </span>
      )}
    </span>
  );
};
