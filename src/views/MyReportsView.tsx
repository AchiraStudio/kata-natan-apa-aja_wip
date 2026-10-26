import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, MapPin, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTitik } from '../context/TitikContext';
import { dataService } from '../services/dataService';
import { Report, ReportStatus } from '../types/domain';
import { getReportMediaType } from '../utils/reportEvidence';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';

const STATUS_LABELS: Record<ReportStatus, string> = {
  submitted: 'Terkirim',
  under_review: 'Sedang ditinjau',
  needs_info: 'Perlu informasi',
  accepted_for_routing: 'Disetujui',
  forwarded_to_institution: 'Diteruskan ke instansi',
  institution_responded: 'Instansi merespons',
  resolved: 'Selesai',
  rejected: 'Ditolak',
};

export const MyReportsView: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { openReportModal } = useTitik();
  const [loadedReports, setLoadedReports] = useState<{
    userId: string;
    reports?: Report[];
    error?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    dataService.getMyReports(profile.id).then((result) => {
      if (isMounted) setLoadedReports({ userId: profile.id, reports: result });
    }).catch((error: unknown) => {
      console.error('Failed to load the current user reports:', error);
      if (isMounted) {
        setLoadedReports({
          userId: profile.id,
          error: 'Laporan Anda gagal dimuat. Silakan coba segarkan halaman.',
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [profile.id]);

  const isLoading = loadedReports?.userId !== profile.id;
  const reports = loadedReports?.userId === profile.id ? loadedReports.reports ?? [] : [];
  const loadError = loadedReports?.userId === profile.id ? loadedReports.error ?? '' : '';

  return (
    <div className="h-screen w-full max-w-[1680px] mx-auto bg-[#F7F6F1] dark:bg-[#0C100E] flex flex-col lg:flex-row overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto no-scrollbar p-4 lg:p-8 w-full max-w-5xl pb-24 lg:pb-12 min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#263F35] dark:text-[#34D399]">
              <FileText className="w-4 h-4" />
              Ruang pribadi • {profile.displayName}
            </div>
            <h1 className="text-2xl font-extrabold text-[#20221D] dark:text-[#F3F6F4] mt-1">
              Laporan Saya
            </h1>
            <p className="text-xs text-[#686B65] dark:text-[#9EACA3] mt-1">
              Hanya laporan yang dikirim dari akun ini yang ditampilkan.
            </p>
          </div>
          <button
            type="button"
            onClick={openReportModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            Buat Laporan
          </button>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#686B65] dark:text-[#9EACA3]">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Memuat laporan Anda...
          </div>
        ) : loadError ? (
          <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {loadError}
          </p>
        ) : reports.length === 0 ? (
          <div className="rounded-3xl border border-[#E4E2DA] dark:border-[#26352E] bg-white dark:bg-[#1A221E] p-10 text-center">
            <FileText className="w-9 h-9 mx-auto text-[#263F35] dark:text-[#34D399]" />
            <h2 className="mt-3 font-bold text-[#20221D] dark:text-[#F3F6F4]">Belum ada laporan dari akun ini</h2>
            <p className="mt-1 text-xs text-[#686B65] dark:text-[#9EACA3]">
              Laporan yang Anda kirim akan tersimpan di sini.
            </p>
            <button
              type="button"
              onClick={openReportModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#263F35] px-4 py-2.5 text-xs font-bold text-white"
            >
              <Plus className="w-4 h-4" />
              Buat laporan pertama
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <article
                key={report.id}
                className="rounded-3xl border border-[#E4E2DA] dark:border-[#26352E] bg-white dark:bg-[#1A221E] p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-[#686B65] dark:text-[#9EACA3]">
                      {report.publicReference}
                    </span>
                    <h2 className="mt-1 text-base font-bold text-[#20221D] dark:text-[#F3F6F4]">
                      {report.title}
                    </h2>
                    <p className="mt-1 flex items-start gap-1.5 text-xs text-[#686B65] dark:text-[#9EACA3]">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                      {report.location.address}
                    </p>
                  </div>
                  <span className="rounded-full border border-[#D9DEC9] bg-[#F7F8F2] px-3 py-1 text-[11px] font-semibold text-[#263F35]">
                    {STATUS_LABELS[report.status] ?? report.status}
                  </span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-[#41443D] dark:text-[#D5DDD7]">
                  {report.description}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {report.mediaUrls.map((url, index) => (
                    <div key={`${report.id}-media-${index}`} className="overflow-hidden rounded-xl border border-[#E4E2DA] dark:border-[#26352E] bg-black">
                      {getReportMediaType(url) === 'video' ? (
                        <video
                          src={url}
                          controls
                          playsInline
                          aria-label={`Video bukti ${report.title}`}
                          className="h-40 w-full object-contain"
                        />
                      ) : (
                        <img
                          src={url}
                          alt={`Foto bukti ${report.title}`}
                          className="h-40 w-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E4E2DA] dark:border-[#26352E] pt-3">
                  <span className="text-[11px] text-[#686B65] dark:text-[#9EACA3]">
                    {report.category} • {new Date(report.createdAt).toLocaleDateString('id-ID')}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(`/report/${encodeURIComponent(report.publicReference)}`)}
                    className="text-xs font-bold text-[#263F35] dark:text-[#34D399] hover:underline"
                  >
                    Lihat detail
                  </button>
                </div>

                {report.events.length > 0 && (
                  <section
                    aria-label={`Riwayat penanganan ${report.publicReference}`}
                    className="mt-4 border-t border-[#E4E2DA] dark:border-[#26352E] pt-3"
                  >
                    <h3 className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4]">
                      Riwayat penanganan admin
                    </h3>
                    <ol className="mt-2 space-y-2">
                      {[...report.events].reverse().map((event) => (
                        <li
                          key={event.id}
                          className="rounded-xl bg-[#F7F6F1] dark:bg-[#131916] p-3 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="font-semibold text-[#20221D] dark:text-[#F3F6F4]">
                              {event.newStatus ? STATUS_LABELS[event.newStatus] : event.eventType}
                            </span>
                            <time className="text-[10px] text-[#686B65] dark:text-[#9EACA3]">
                              {event.timestamp}
                            </time>
                          </div>
                          <p className="mt-1 text-[#41443D] dark:text-[#D5DDD7]">{event.description}</p>
                          <p className="mt-1 text-[10px] text-[#686B65] dark:text-[#9EACA3]">
                            Oleh: {event.actorName}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};
