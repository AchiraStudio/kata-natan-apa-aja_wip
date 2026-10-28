import React from 'react';
import { FileText, MapPin } from 'lucide-react';
import { formatIndonesianTimeAgo } from '../../utils/timeAgo';
import type { ProfileController } from './useProfileController';

interface ReportsTabProps {
  ctrl: ProfileController;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ ctrl }) => {
  const { openComposer, openReportDetail, reports, activeTab, isOwnProfile } = ctrl;
  return (
    <>
            {activeTab === 'reports' && (
              <div>
                {reports.length === 0 ? (
                  <div className="bg-white dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl p-8 text-center space-y-3">
                    <FileText className="w-8 h-8 text-[#686B65] dark:text-[#9EACA3] mx-auto opacity-40" />
                    <h4 className="text-sm font-bold text-[#20221D] dark:text-[#F3F6F4]">
                      Belum Ada Laporan Publik
                    </h4>
                    <p className="text-xs text-[#686B65] dark:text-[#9EACA3] max-w-xs mx-auto">
                      {isOwnProfile
                        ? 'Kirimkan laporan kerusakan infrastruktur atau fasilitas publik untuk diproses dinas terkait.'
                        : 'Pengguna ini belum mengirimkan laporan publik terverifikasi.'}
                    </p>
                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={() => openComposer('report')}
                        className="px-4 py-2 bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-xl text-xs font-bold hover:bg-[#1d3129] cursor-pointer"
                      >
                        + Laporkan Masalah Fasilitas
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        onClick={() => openReportDetail(report)}
                        className="bg-white dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl p-4 hover:border-[#263F35]/40 dark:hover:border-[#10B981]/40 transition-all shadow-xs cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-[#263F35] dark:text-[#34D399] bg-[#E7EBDD] dark:bg-[#1A2E24] px-2 py-0.5 rounded-md">
                              {report.publicReference}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#1A221E] text-[#686B65] dark:text-[#9EACA3]">
                              {report.category}
                            </span>
                            <span className="text-[10px] font-semibold text-[#686B65] dark:text-[#9EACA3]">
                              {formatIndonesianTimeAgo(report.createdAt)}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-[#20221D] dark:text-[#F3F6F4] group-hover:text-[#263F35] dark:group-hover:text-[#34D399] transition-colors truncate">
                            {report.title}
                          </h4>
                          <p className="text-xs text-[#686B65] dark:text-[#9EACA3] flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-[#263F35] dark:text-[#34D399] shrink-0" />
                            <span>{report.location?.address || 'Kota Bogor'}</span>
                          </p>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-2">
                          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                            {report.status}
                          </span>
                          <span className="text-[10px] text-[#686B65] dark:text-[#9EACA3]">
                            {report.supportCount || 0} Dukungan Warga
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
    </>
  );
};
