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
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-6 pb-24 text-[#101913] dark:text-[#F3F6F4] sm:px-6 lg:py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-[#1B4332] dark:text-[#34D399]" />
          <h1 className="text-xl font-black">Laporan Tersimpan</h1>
        </div>
        <p className="mt-1 text-xs text-[#4F5A52] dark:text-[#9EACA3]">
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
        <div className="flex items-center justify-center gap-2 py-20 text-xs text-[#4F5A52] dark:text-[#9EACA3]">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Memuat laporan tersimpan...
        </div>
      ) : savedPosts.length === 0 && savedReports.length === 0 ? (
        <div className="rounded-2xl border border-[#E3E0D6] bg-white p-8 text-center dark:border-[#26352E] dark:bg-[#131916]">
          <Bookmark className="mx-auto mb-3 h-8 w-8 text-[#4F5A52] opacity-40 dark:text-[#9EACA3]" />
          <h2 className="text-sm font-bold">Belum ada laporan tersimpan</h2>
          <p className="mx-auto mt-2 max-w-sm text-xs text-[#4F5A52] dark:text-[#9EACA3]">
            Tekan ikon simpan pada postingan atau laporan yang ingin Anda pantau. Semua pilihan Anda akan muncul di sini.
          </p>
          <Link to="/" className="mt-4 inline-flex rounded-xl bg-[#1B4332] px-4 py-2 text-xs font-bold text-white dark:bg-[#10B981] dark:text-[#0A1610]">
            Jelajahi Feed
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {savedPosts.length > 0 && (
            <section aria-labelledby="saved-posts-heading" className="space-y-3">
              <h2 id="saved-posts-heading" className="text-sm font-bold">
                Postingan disimpan <span className="text-[#4F5A52] dark:text-[#9EACA3]">({savedPosts.length})</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {savedPosts.map((post) => (
                  <article key={post.id} className="overflow-hidden rounded-2xl border border-[#E3E0D6] bg-white dark:border-[#26352E] dark:bg-[#131916]">
                    <Link to={`/post/${post.id}`} className="group block">
                      {post.media[0] && (
                        <div className="aspect-video overflow-hidden bg-stone-900">
                          <img src={post.media[0].url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        </div>
                      )}
                      <div className="space-y-2 p-4">
                        <div className="flex items-center gap-2 text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">
                          <span className="font-bold text-[#101913] dark:text-[#F3F6F4]">@{post.author.username}</span>
                          <span>·</span>
                          <span>{formatIndonesianTimeAgo(post.createdAt)}</span>
                        </div>
                        <p className="line-clamp-3 text-xs">{post.body}</p>
                        {post.relatedReport && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1B4332] dark:text-[#34D399]">
                            <FileText className="h-3 w-3" />
                            {post.relatedReport.title}
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center justify-between border-t border-[#E3E0D6] px-4 py-3 dark:border-[#26352E]">
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#4F5A52] dark:text-[#9EACA3]">
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
                Laporan warga disimpan <span className="text-[#4F5A52] dark:text-[#9EACA3]">({savedReports.length})</span>
              </h2>
              <div className="space-y-3">
                {savedReports.map((report) => (
                  <article key={report.id} className="flex flex-col gap-3 rounded-2xl border border-[#E3E0D6] bg-white p-4 dark:border-[#26352E] dark:bg-[#131916] sm:flex-row sm:items-center sm:justify-between">
                    <Link to={`/report/${report.publicReference}`} className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-[10px]">
                        <span className="rounded-md bg-[#E7EBDD] px-2 py-0.5 font-mono font-bold text-[#1B4332] dark:bg-[#1A2E24] dark:text-[#34D399]">{report.publicReference}</span>
                        <span className="font-bold uppercase tracking-wider text-[#4F5A52] dark:text-[#9EACA3]">{report.category}</span>
                        <span className="text-[#4F5A52] dark:text-[#9EACA3]">{formatIndonesianTimeAgo(report.createdAt)}</span>
                      </div>
                      <h3 className="truncate text-sm font-bold">{report.title}</h3>
                      <p className="flex items-center gap-1 truncate text-xs text-[#4F5A52] dark:text-[#9EACA3]">
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
