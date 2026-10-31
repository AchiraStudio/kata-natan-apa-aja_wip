import React from 'react';
import { ComposerTab } from './types';
import { Eye, Lock } from 'lucide-react';

interface OfficialResponseComposerProps {
  reportId: string;
  publicResponse: string;
  internalNote: string;
  onChangePublicResponse: (value: string) => void;
  onChangeInternalNote: (value: string) => void;
  activeTab: ComposerTab;
  onTabChange: (tab: ComposerTab) => void;
  isUpdating?: boolean;
}

export const OfficialResponseComposer: React.FC<OfficialResponseComposerProps> = ({
  publicResponse,
  internalNote,
  onChangePublicResponse,
  onChangeInternalNote,
  activeTab,
  onTabChange,
  isUpdating = false,
}) => {
  const hasPublicDraft = Boolean(publicResponse?.trim());
  const hasInternalDraft = Boolean(internalNote?.trim());

  return (
    <div className="space-y-3">
      {/* Header with Dual-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4]">
          Catatan & Tanggapan Verifikator
        </label>

        {/* Tab pills */}
        <div className="inline-flex items-center p-1 rounded-xl bg-[#F7F5EF] dark:bg-[#131916] border border-[#E3E0D6] dark:border-[#26352E]">
          <button
            type="button"
            onClick={() => onTabChange('public')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'public'
                ? 'bg-white dark:bg-[#26352E] text-[#101913] dark:text-[#F3F6F4] shadow-xs'
                : 'text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Tanggapan Publik</span>
            {hasPublicDraft && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Ada draf publik" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange('internal')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'internal'
                ? 'bg-white dark:bg-[#26352E] text-[#101913] dark:text-[#F3F6F4] shadow-xs'
                : 'text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Catatan Internal</span>
            {hasInternalDraft && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Ada draf internal" />
            )}
          </button>
        </div>
      </div>

      {/* Composer Content Area */}
      {activeTab === 'public' ? (
        <div className="space-y-1.5">
          <textarea
            rows={3}
            value={publicResponse}
            onChange={(e) => onChangePublicResponse(e.target.value)}
            disabled={isUpdating}
            placeholder="Jelaskan bukti atau informasi yang kurang dan cara memperbaikinya. Warga akan melihat catatan ini jika laporan ditolak atau perlu informasi."
            className="admin-note-input w-full px-4 py-3 bg-[#F7F5EF] dark:bg-[#131916] border border-[#E3E0D6] dark:border-[#26352E] rounded-2xl text-xs text-[#101913] dark:text-[#F3F6F4] placeholder-[#4F5A52] dark:placeholder-[#6C7D73] focus:outline-none focus:border-[#1B4332] dark:focus:border-[#10B981] shadow-xs resize-y disabled:opacity-50"
          />
          <div className="flex items-center justify-between text-[11px] text-[#4F5A52] dark:text-[#9EACA3] px-1">
            <span className="flex items-center gap-1 text-[#1B4332] dark:text-[#34D399]">
              <Eye className="w-3 h-3 shrink-0" />
              Tanggapan resmi ini ditampilkan secara terbuka kepada pelapor dan publik.
            </span>
            <span className="font-mono text-[10px]">
              {publicResponse.length > 0 ? `${publicResponse.length} karakter (Draf tersimpan)` : 'Draf kosong'}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <textarea
            rows={3}
            value={internalNote}
            onChange={(e) => onChangeInternalNote(e.target.value)}
            disabled={isUpdating}
            placeholder="Tuliskan catatan evaluasi internal verifikator, disposisi dinas teknis, atau temuan koordinasi lapangan (Privat & terjaga RLS)."
            className="admin-note-input w-full px-4 py-3 bg-[#F7F5EF] dark:bg-[#131916] border border-[#E3E0D6] dark:border-[#26352E] rounded-2xl text-xs text-[#101913] dark:text-[#F3F6F4] placeholder-[#4F5A52] dark:placeholder-[#6C7D73] focus:outline-none focus:border-[#1B4332] dark:focus:border-[#10B981] shadow-xs resize-y disabled:opacity-50"
          />
          <div className="flex items-center justify-between text-[11px] text-[#4F5A52] dark:text-[#9EACA3] px-1">
            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <Lock className="w-3 h-3 shrink-0" />
              Catatan privat verifikator: hanya dapat diakses oleh peran admin/auditor.
            </span>
            <span className="font-mono text-[10px]">
              {internalNote.length > 0 ? `${internalNote.length} karakter (Draf tersimpan)` : 'Draf kosong'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
