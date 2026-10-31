import React from 'react';
import { ComposerTab } from './types';
import { Eye, Lock, Sparkles } from 'lucide-react';

const PUBLIC_TEMPLATES = [
  {
    label: 'Dinas PUPR',
    text: 'Laporan telah diverifikasi oleh tim teknis Dinas PUPR Kota Bogor. Titik kerusakan telah masuk agenda penanganan pemeliharaan berkala infrastruktur APBD.',
  },
  {
    label: 'Dishub Kota Bogor',
    text: 'Laporan telah dicatat oleh Dishub Kota Bogor. Petugas pengawas telah ditugaskan untuk survei rambu dan fasilitas lalu lintas di lokasi.',
  },
  {
    label: 'Dinas Lingkungan Hidup',
    text: 'Laporan penumpukan sampah/kebersihan telah didisposisikan ke armada UPT DLH Kota Bogor untuk segera ditindaklanjuti.',
  },
  {
    label: 'Minta Info RT/RW',
    text: 'Mohon warga pelapor dapat memberikan detail patokan lokasi (nomor bangunan / RT / RW) untuk mempermudah survei lapangan.',
  },
  {
    label: 'Tuntas Fisik 100%',
    text: 'Pekerjaan perbaikan fisik di titik lokasi telah selesai 100% dan telah diverifikasi oleh tim pengawas Pemerintah Kota Bogor.',
  },
];

const INTERNAL_TEMPLATES = [
  'Disposisi ke UPT Wilayah untuk survei teknis lapangan besok pagi.',
  'Memerlukan koordinasi kewenangan lintas instansi dengan Pemprov Jawa Barat.',
  'Diajukan masuk prioritas Musrenbang tahun anggaran berikutnya.',
  'Laporan duplikat dari titik kerusakan yang sama, jadwalkan penggabungan berkas.',
];

interface OfficialResponseComposerProps {
  reportId: string;
  publicResponse: string;
  internalNote: string;
  onChangePublicResponse: (value: string) => void;
  onChangeInternalNote: (value: string) => void;
  activeTab: ComposerTab;
  onTabChange: (tab: ComposerTab) => void;
  isUpdating?: boolean;
  onSaveResponse?: () => void;
}

export const OfficialResponseComposer: React.FC<OfficialResponseComposerProps> = ({
  publicResponse,
  internalNote,
  onChangePublicResponse,
  onChangeInternalNote,
  activeTab,
  onTabChange,
  isUpdating = false,
  onSaveResponse,
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
        <div className="space-y-2">
          {/* Quick Response Templates */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] uppercase font-bold text-[#4F5A52] dark:text-[#9EACA3] inline-flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-[#1B4332] dark:text-[#34D399]" />
              Templat Cepat:
            </span>
            {PUBLIC_TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => onChangePublicResponse(tpl.text)}
                disabled={isUpdating}
                className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#F7F5EF] dark:bg-[#1A221E] hover:bg-[#E3E0D6] dark:hover:bg-[#26352E] text-[#1B4332] dark:text-[#34D399] border border-[#E3E0D6] dark:border-[#26352E] transition-colors cursor-pointer"
              >
                {tpl.label}
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            value={publicResponse}
            onChange={(e) => onChangePublicResponse(e.target.value)}
            disabled={isUpdating}
            placeholder="Jelaskan bukti atau informasi yang kurang dan cara memperbaikinya. Warga akan melihat catatan ini jika laporan ditolak atau perlu informasi."
            className="admin-note-input w-full px-4 py-3 bg-[#F7F5EF] dark:bg-[#131916] border border-[#E3E0D6] dark:border-[#26352E] rounded-2xl text-xs text-[#101913] dark:text-[#F3F6F4] placeholder-[#4F5A52] dark:placeholder-[#6C7D73] focus:outline-none focus:border-[#1B4332] dark:focus:border-[#10B981] shadow-xs resize-y disabled:opacity-50"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#4F5A52] dark:text-[#9EACA3] px-1 pt-1">
            <span className="flex items-center gap-1 text-[#1B4332] dark:text-[#34D399]">
              <Eye className="w-3 h-3 shrink-0" />
              Tanggapan resmi ini ditampilkan secara terbuka kepada pelapor dan publik.
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px]">
                {publicResponse.length > 0 ? `${publicResponse.length} karakter (Draf tersimpan)` : 'Draf kosong'}
              </span>
              {onSaveResponse && (
                <button
                  type="button"
                  onClick={onSaveResponse}
                  disabled={isUpdating || !publicResponse.trim()}
                  className="px-2.5 py-1 rounded-lg bg-[#1B4332] dark:bg-[#10B981] hover:bg-[#14352A] text-white dark:text-[#0A1610] text-[10px] font-bold disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan ke Server'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Quick Internal Templates */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 inline-flex items-center gap-1 mr-1">
              <Lock className="w-3 h-3" />
              Templat Internal:
            </span>
            {INTERNAL_TEMPLATES.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChangeInternalNote(item)}
                disabled={isUpdating}
                className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 transition-colors cursor-pointer truncate max-w-[200px]"
                title={item}
              >
                {item}
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            value={internalNote}
            onChange={(e) => onChangeInternalNote(e.target.value)}
            disabled={isUpdating}
            placeholder="Tuliskan catatan evaluasi internal verifikator, disposisi dinas teknis, atau temuan koordinasi lapangan (Privat & terjaga RLS)."
            className="admin-note-input w-full px-4 py-3 bg-[#F7F5EF] dark:bg-[#131916] border border-[#E3E0D6] dark:border-[#26352E] rounded-2xl text-xs text-[#101913] dark:text-[#F3F6F4] placeholder-[#4F5A52] dark:placeholder-[#6C7D73] focus:outline-none focus:border-[#1B4332] dark:focus:border-[#10B981] shadow-xs resize-y disabled:opacity-50"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#4F5A52] dark:text-[#9EACA3] px-1 pt-1">
            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <Lock className="w-3 h-3 shrink-0" />
              Catatan privat verifikator: hanya dapat diakses oleh peran admin/auditor.
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px]">
                {internalNote.length > 0 ? `${internalNote.length} karakter (Draf tersimpan)` : 'Draf kosong'}
              </span>
              {onSaveResponse && (
                <button
                  type="button"
                  onClick={onSaveResponse}
                  disabled={isUpdating || !internalNote.trim()}
                  className="px-2.5 py-1 rounded-lg bg-amber-700 dark:bg-amber-600 hover:bg-amber-800 text-white text-[10px] font-bold disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan Catatan'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
