import React, { useCallback, useEffect, useState } from 'react';
import { Bookmark, MapPin, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SaveReportButton } from '../components/reporting/SaveReportButton';
import { dataService } from '../services/dataService';
import type { Report } from '../types/domain';
import { formatIndonesianTimeAgo } from '../utils/timeAgo';

export const SavedReportsView: React.FC = () => {
  const { profile } = useAuth();
  const [savedReports, setSavedReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadSavedReports = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      setSavedReports(await dataService.getSavedReports(profile.id));
    } catch (error) {
      console.error('Failed to load saved reports:', error);
      setErrorMessage('Laporan tersimpan gagal dimuat. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    void loadSavedReports();
  }, [loadSavedReports]);

  const handleSavedReportChange = (reportId: string, isSaved: boolean) => {
    if (!isSaved) {
      setSavedReports((current) => current.filter((report) => report.id !== reportId));
    }
  };

  return (
    <main className="flex-1 min-w-0 w-full mx-auto max-w-5xl px-4 sm:px-6 lg:px-10 pt-5 lg:pt-10 pb-32 lg:pb-14 text-ink">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-brand" />
          <h1 className="text-xl font-extrabold">Laporan Tersimpan</h1>
        </div>
        <p className="mt-1 text-xs text-ink-2">
          Kumpulan laporan warga yang Anda simpan untuk ditinjau kembali.
        </p>
      </header>

      {errorMessage && (
        <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          <div className="flex items-center justify-between gap-3">
            <span>{errorMessage}</span>
            <button type="button" onClick={() => void loadSavedReports()} className="font-bold underline">
              Coba lagi
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-xs text-ink-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Memuat laporan tersimpan...
        </div>
      ) : savedReports.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center dark:bg-surface-2">
          <Bookmark className="mx-auto mb-3 h-8 w-8 text-ink-2 opacity-40" />
          <h2 className="text-sm font-bold">Belum ada laporan tersimpan</h2>
          <p className="mx-auto mt-2 max-w-sm text-xs text-ink-2">
            Simpan laporan yang ingin Anda pantau dan tinjau kembali di sini.
          </p>
          <Link to="/" className="mt-4 inline-flex rounded-xl bg-brand px-4 py-2 text-xs font-bold text-on-brand">
            Jelajahi laporan
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {savedReports.map((report) => (
            <article key={report.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 dark:bg-surface-2 sm:flex-row sm:items-center sm:justify-between">
              <Link to={`/report/${encodeURIComponent(report.publicReference)}`} className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  <span className="rounded-md bg-brand-soft px-2 py-0.5 font-mono font-bold text-brand">{report.publicReference}</span>
                  <span className="font-bold text-ink-2">{report.category}</span>
                  <span className="text-ink-2">{formatIndonesianTimeAgo(report.createdAt)}</span>
                </div>
                <h3 className="truncate text-sm font-bold">{report.title}</h3>
                <p className="flex items-center gap-1 truncate text-xs text-ink-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {report.location.address}
                </p>
              </Link>
              <SaveReportButton
                reportId={report.id}
                isSavedByMe
                onSavedChange={(isSaved) => handleSavedReportChange(report.id, isSaved)}
              />
            </article>
          ))}
        </div>
      )}
    </main>
  );
};
