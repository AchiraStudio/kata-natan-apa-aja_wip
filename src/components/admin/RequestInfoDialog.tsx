import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import type { Report } from '../../types/domain';
import type { RequestInfoResult } from './useAdminWorkspace';
import { Notice } from './ui';

const QUICK_ASKS = [
  { label: 'Patokan lokasi', text: 'Mohon kirimkan patokan lokasi terdekat (nomor rumah, RT/RW, atau nama toko) agar petugas mudah menemukan titiknya.' },
  { label: 'Foto terbaru', text: 'Mohon unggah foto kondisi terkini dari dua sudut berbeda, siang hari, dengan titik kerusakan terlihat jelas.' },
  { label: 'Ukuran kerusakan', text: 'Mohon perkirakan ukuran kerusakan (panjang, lebar, kedalaman) atau letakkan benda pembanding di foto.' },
  { label: 'Sejak kapan', text: 'Mohon informasikan sejak kapan kerusakan ini terjadi dan apakah ada kejadian yang memicunya.' },
];

interface RequestInfoDialogProps {
  report: Report;
  isSending: boolean;
  onSubmit: (note: string) => Promise<RequestInfoResult>;
  onClose: () => void;
}

/**
 * "Minta info": one note that does two things. The report moves to "butuh info"
 * and the same note is delivered to the reporter as a direct message.
 */
export const RequestInfoDialog: React.FC<RequestInfoDialogProps> = ({ report, isSending, onSubmit, onClose }) => {
  const [note, setNote] = useState('');
  const [result, setResult] = useState<RequestInfoResult | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const canMessage = Boolean(report.reporterUserId);

  useEffect(() => {
    areaRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSending) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, isSending]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending || !note.trim()) return;
    setResult(await onSubmit(note));
  };

  const done = result?.ok;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[var(--scrim)] p-0 sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && !isSending && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="request-info-title" className="w-full sm:max-w-lg glass-strong rounded-t-3xl sm:rounded-2xl max-h-[92dvh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="min-w-0">
            <h2 id="request-info-title" className="font-display text-lg font-semibold text-ink">
              Minta info dari pelapor
            </h2>
            <p className="mt-0.5 text-xs text-ink-2 truncate">
              <span className="titik-id">{report.publicReference}</span> / {report.title}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={isSending} aria-label="Tutup" className="w-9 h-9 -mr-2 rounded-lg flex items-center justify-center text-ink-2 hover:text-ink hover:bg-surface-2 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="px-5 pb-5 pt-4 space-y-4">
            {result.messageFailed ? (
              <Notice kind="error">Status berubah menjadi "butuh info", tetapi pesan ke pelapor belum terkirim. Buka Pesan untuk mengirim ulang.</Notice>
            ) : result.anonymous ? (
              <Notice kind="info">Status berubah menjadi "butuh info". Pelapor anonim tidak bisa dikirimi pesan, jadi catatan tampil di halaman pelacakan laporan.</Notice>
            ) : (
              <Notice kind="success">Permintaan terkirim. Pelapor akan melihatnya di Pesan dan laporan berstatus "butuh info" sampai ia membalas.</Notice>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              {result.conversationId && (
                <Link to={`/pesan?conversation_id=${encodeURIComponent(result.conversationId)}`} className="h-10 px-4 inline-flex items-center rounded-lg bg-brand text-on-brand text-sm font-semibold hover:bg-brand-hover transition-colors">
                  Buka percakapan
                </Link>
              )}
              <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg bg-surface-2 text-ink text-sm font-semibold hover:bg-line transition-colors cursor-pointer">
                Selesai
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="px-5 pb-5 pt-4 space-y-4">
            {!canMessage && <Notice kind="info">Pelapor anonim: status akan berubah, tetapi tidak ada pesan yang bisa dikirim.</Notice>}

            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Pertanyaan cepat">
              {QUICK_ASKS.map((q) => (
                <button key={q.label} type="button" onClick={() => setNote(q.text)} className="h-7 px-2.5 rounded-md bg-surface-2 text-xs font-medium text-ink-2 hover:text-ink transition-colors cursor-pointer">
                  {q.label}
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="request-info-note" className="block text-sm font-medium text-ink mb-1.5">
                Yang perlu dilengkapi
              </label>
              <textarea
                id="request-info-note"
                ref={areaRef}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                maxLength={1000}
                disabled={isSending}
                required
                placeholder="Tulis dengan jelas apa yang kurang dan bagaimana pelapor bisa melengkapinya."
                className="titik-pill-input px-3.5 py-3 resize-y"
              />
              <p className="mt-1 text-xs text-ink-3 tabular-nums">{note.length}/1000</p>
            </div>

            {result && !result.ok && result.error && <Notice kind="error">{result.error}</Notice>}

            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={onClose} disabled={isSending} className="h-10 px-4 rounded-lg bg-surface-2 text-ink text-sm font-semibold hover:bg-line transition-colors cursor-pointer">
                Batal
              </button>
              <button type="submit" disabled={isSending || !note.trim()} className="h-10 px-5 rounded-lg bg-brand text-on-brand text-sm font-semibold hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
                {isSending ? 'Mengirim' : canMessage ? 'Kirim permintaan' : 'Ubah status'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
