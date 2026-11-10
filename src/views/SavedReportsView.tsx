import React, { useCallback, useEffect, useState } from 'react';
import { Bookmark, FileText, MapPin, MessageSquare, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTitik } from '../context/TitikContext';
import { SaveReportButton } from '../components/reporting/SaveReportButton';
import { dataService } from '../services/dataService';
import type { Post, Report } from '../types/domain';
import { formatIndonesianTimeAgo } from '../utils/timeAgo';

export const SavedReportsView: React.FC = () => {
  const { profile } = useAuth();
  const { togglePostSave } = useTitik();
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [savedReports, setSavedReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [updatingPostId, setUpdatingPostId] = useState<string | null>(null);

  const loadSavedItems = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [posts, reports] = await Promise.all([
        dataService.getSavedPosts(profile.id),
        dataService.getSavedReports(profile.id),
      ]);
      setSavedPosts(posts);
      setSavedReports(reports);
    } catch (error) {
      console.error('Failed to load saved reports:', error);
      setErrorMessage('Laporan tersimpan gagal dimuat. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    loadSavedItems();
  }, [loadSavedItems]);

  const handleRemovePost = async (postId: string) => {
    if (!togglePostSave) {
      setErrorMessage('Fitur menyimpan postingan tidak tersedia.');
      return;
    }
    setUpdatingPostId(postId);
    setErrorMessage('');
    try {
      await togglePostSave(postId);
      setSavedPosts((current) => current.filter((post) => post.id !== postId));
    } catch (error) {
      console.error('Failed to remove saved post:', error);
      setErrorMessage('Postingan gagal dihapus dari daftar tersimpan.');
    } finally {
      setUpdatingPostId(null);
    }
  };

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
          Kumpulan postingan dan laporan yang Anda simpan untuk ditinjau kembali.
        </p>
      </header>

      {errorMessage && (
        <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          <div className="flex items-center justify-between gap-3">
            <span>{errorMessage}</span>
            <button type="button" onClick={loadSavedItems} className="font-bold underline">
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
      ) : savedPosts.length === 0 && savedReports.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center dark:bg-surface-2">
          <Bookmark className="mx-auto mb-3 h-8 w-8 text-ink-2 opacity-40" />
          <h2 className="text-sm font-bold">Belum ada laporan tersimpan</h2>
          <p className="mx-auto mt-2 max-w-sm text-xs text-ink-2">
            Tekan ikon simpan pada postingan atau laporan yang ingin Anda pantau. Semua pilihan Anda akan muncul di sini.
          </p>
          <Link to="/" className="mt-4 inline-flex rounded-xl bg-brand px-4 py-2 text-xs font-bold text-on-brand">
            Jelajahi Feed
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {savedPosts.length > 0 && (
            <section aria-labelledby="saved-posts-heading" className="space-y-3">
              <h2 id="saved-posts-heading" className="text-sm font-bold">
                Postingan disimpan <span className="text-ink-2">({savedPosts.length})</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {savedPosts.map((post) => (
                  <article key={post.id} className="overflow-hidden rounded-2xl border border-line bg-surface dark:bg-surface-2">
                    <Link to={`/post/${post.id}`} className="group block">
                      {post.media[0] && (
                        <div className="aspect-video overflow-hidden bg-stone-900">
                          <img src={post.media[0].url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        </div>
                      )}
                      <div className="space-y-2 p-4">
                        <div className="flex items-center gap-2 text-[11px] text-ink-2">
                          <span className="font-bold text-ink">@{post.author.username}</span>
                          <span>·</span>
                          <span>{formatIndonesianTimeAgo(post.createdAt)}</span>
                        </div>
                        <p className="line-clamp-3 text-xs">{post.body}</p>
                        {post.relatedReport && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand">
                            <FileText className="h-3 w-3" />
                            {post.relatedReport.title}
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center justify-between border-t border-line px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[10px] text-ink-2">
                        <MessageSquare className="h-3 w-3" />
                        {post.commentsCount} tanggapan
                      </span>
                      <button
                        type="button"
                        disabled={updatingPostId === post.id}
                        onClick={() => handleRemovePost(post.id)}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
                      >
                        <Bookmark className="h-3.5 w-3.5 fill-current" />
                        {updatingPostId === post.id ? 'Menghapus...' : 'Tersimpan'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {savedReports.length > 0 && (
            <section aria-labelledby="saved-reports-heading" className="space-y-3">
              <h2 id="saved-reports-heading" className="text-sm font-bold">
                Laporan warga disimpan <span className="text-ink-2">({savedReports.length})</span>
              </h2>
              <div className="space-y-3">
                {savedReports.map((report) => (
                  <article key={report.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 dark:bg-surface-2 sm:flex-row sm:items-center sm:justify-between">
                    <Link to={`/report/${report.publicReference}`} className="min-w-0 flex-1 space-y-1.5">
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
            </section>
          )}
        </div>
      )}
    </main>
  );
};
