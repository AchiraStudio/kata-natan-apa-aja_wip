import React from 'react';
import type { ComposerTab } from './types';
import { SectionHead } from './ui';

const PUBLIC_TEMPLATES = [
  { label: 'Sudah diverifikasi', text: 'Laporan sudah diverifikasi tim teknis dan masuk agenda penanganan pemeliharaan berkala.' },
  { label: 'Survei lapangan', text: 'Petugas pengawas ditugaskan untuk survei ke lokasi. Hasilnya akan dicatat pada laporan ini.' },
  { label: 'Diteruskan ke dinas', text: 'Laporan sudah diteruskan ke dinas yang berwenang untuk dijadwalkan perbaikannya.' },
  { label: 'Perbaikan selesai', text: 'Pekerjaan perbaikan di lokasi sudah selesai dan telah diperiksa tim pengawas.' },
];

const INTERNAL_TEMPLATES = [
  { label: 'Survei besok', text: 'Disposisi ke UPT wilayah untuk survei teknis lapangan besok pagi.' },
  { label: 'Lintas instansi', text: 'Perlu koordinasi kewenangan dengan Pemprov Jawa Barat.' },
  { label: 'Usul Musrenbang', text: 'Diajukan masuk prioritas Musrenbang tahun anggaran berikutnya.' },
  { label: 'Duplikat', text: 'Duplikat dari titik kerusakan yang sama, gabungkan berkas.' },
];

interface OfficialResponseComposerProps {
  reportId: string;
  publicResponse: string;
  internalNote: string;
  onChangePublicResponse: (value: string) => void;
  onChangeInternalNote: (value: string) => void;
  activeTab?: ComposerTab;
  composerTab?: ComposerTab;
  onTabChange?: (tab: ComposerTab) => void;
  onChangeComposerTab?: (tab: ComposerTab) => void;
  isUpdating?: boolean;
  onSaveResponse?: () => void;
}

export const OfficialResponseComposer: React.FC<OfficialResponseComposerProps> = ({
  publicResponse,
  internalNote,
  onChangePublicResponse,
  onChangeInternalNote,
  activeTab: explicitActiveTab,
  composerTab,
  onTabChange: explicitOnTabChange,
  onChangeComposerTab,
  isUpdating = false,
  onSaveResponse,
}) => {
  const activeTab = explicitActiveTab ?? composerTab ?? 'public';
  const onTabChange = explicitOnTabChange ?? onChangeComposerTab ?? (() => {});
  const isPublic = activeTab === 'public';
  const value = isPublic ? publicResponse : internalNote;
  const templates = isPublic ? PUBLIC_TEMPLATES : INTERNAL_TEMPLATES;
  const setValue = isPublic ? onChangePublicResponse : onChangeInternalNote;

  return (
    <section aria-label="Catatan dan tanggapan" className="space-y-3">
      <SectionHead
        as="h3"
        title="Catatan dan tanggapan"
        note={isPublic ? 'Tampil terbuka untuk pelapor dan publik.' : 'Hanya terlihat oleh sesama admin.'}
        actions={
          <div role="tablist" aria-label="Jenis catatan" className="titik-pill-track">
            <button type="button" role="tab" aria-selected={isPublic} onClick={() => onTabChange('public')} className={`titik-pill-tab ${isPublic ? 'active' : ''}`}>
              Tanggapan Publik
              {publicResponse.trim() && <span className="sr-only"> (ada draf)</span>}
            </button>
            <button type="button" role="tab" aria-selected={!isPublic} onClick={() => onTabChange('internal')} className={`titik-pill-tab ${!isPublic ? 'active' : ''}`}>
              Catatan Internal
              {internalNote.trim() && <span className="sr-only"> (ada draf)</span>}
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Templat">
        {templates.map((tpl) => (
          <button
            key={tpl.label}
            type="button"
            disabled={isUpdating}
            onClick={() => setValue(tpl.text)}
            className="h-7 px-2.5 rounded-md bg-surface-2 text-xs font-medium text-ink-2 hover:text-ink transition-colors cursor-pointer disabled:opacity-50"
          >
            {tpl.label}
          </button>
        ))}
      </div>

      <textarea
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isUpdating}
        aria-label={isPublic ? 'Tanggapan publik' : 'Catatan internal'}
        placeholder={
          isPublic
            ? 'Tulis tanggapan yang akan dibaca pelapor: apa yang sudah dicek dan langkah berikutnya.'
            : 'Tulis catatan koordinasi, disposisi, atau temuan lapangan untuk sesama admin.'
        }
        className="titik-pill-input px-3.5 py-3 min-h-28 resize-y disabled:opacity-50"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-ink-3 tabular-nums">{value.length > 0 ? `${value.length} karakter` : 'Draf kosong'}</span>
        {onSaveResponse && (
          <button
            type="button"
            onClick={onSaveResponse}
            disabled={isUpdating || !value.trim()}
            className="h-9 px-4 rounded-lg bg-brand text-on-brand text-sm font-semibold hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isUpdating ? 'Menyimpan' : isPublic ? 'Simpan tanggapan' : 'Simpan catatan'}
          </button>
        )}
      </div>
    </section>
  );
};
