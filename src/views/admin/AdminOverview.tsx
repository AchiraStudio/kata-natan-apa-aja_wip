import React from 'react';
import { Link } from 'react-router-dom';
import {
  ListFilter,
  Send,
  DollarSign,
  Users,
  ChevronRight,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  useAdminWorkspace,
  AdminHeroBanner,
  AdminMetricsCards,
} from '../../components/admin';
import { UserProfile } from '../../types/domain';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createConversation } from '../../services/messagesService';

interface Props {
  profile: UserProfile;
}

export const AdminOverview: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();
  const { profile: authProfile } = useAuth();
  const {
    reports,
    isLoadingReports,
    refresh,
    setSelectedReportId,
    filteredReports,
    statusFilter,
    setStatusFilter,
    metrics,
  } = useAdminWorkspace();

  const recentReports = filteredReports.slice(0, 5);

  const handleMessageReporter = async (reportId: string, reporterUserId?: string) => {
    if (!reporterUserId || !authProfile) return;
    try {
      const conv = await createConversation(reportId, authProfile.id, reporterUserId);
      navigate(`/pesan?conversation_id=${conv.id}`);
    } catch {
      navigate(`/pesan?report_id=${reportId}`);
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeroBanner onRefresh={refresh} isLoading={isLoadingReports} />

      {/* Live connection badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>Koneksi Supabase Aktif · Realtime</span>
        </div>
        <span className="text-[11px] font-mono text-[#4F5A52] dark:text-[#9EACA3]">
          Total: {reports.length} laporan
        </span>
      </div>

      {/* KPI Cards */}
      <AdminMetricsCards
        metrics={metrics}
        activeStatus={statusFilter}
        onSelectStatus={(st) => setStatusFilter(statusFilter === st ? 'all' : st)}
      />

      {/* Quick-nav grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            to: '/admin/validasi',
            icon: <ListFilter className="w-5 h-5" />,
            iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            badge: `${metrics.underReview + metrics.needsInfo} Menunggu`,
            badgeColor: 'text-amber-600 dark:text-amber-400',
            title: 'Antrean Validasi',
            desc: 'Tinjau bukti, verifikasi, dan tentukan status laporan.',
            cta: 'Buka Antrean',
          },
          {
            to: '/admin/disposisi',
            icon: <Send className="w-5 h-5" />,
            iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
            badge: `${metrics.forwarded} Diteruskan`,
            badgeColor: 'text-blue-600 dark:text-blue-400',
            title: 'Disposisi & Rute Dinas',
            desc: 'Rute instansi teknis dan pengawasan SLA tindakan.',
            cta: 'Buka Disposisi',
          },
          {
            to: '/admin/anggaran',
            icon: <DollarSign className="w-5 h-5" />,
            iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            badge: 'APBD Live',
            badgeColor: 'text-emerald-600 dark:text-emerald-400',
            title: 'Rekap APBD & Audit',
            desc: 'Transparansi alokasi dana dan audit realisasi fisik.',
            cta: 'Buka Audit',
          },
          {
            to: '/admin/pengguna',
            icon: <Users className="w-5 h-5" />,
            iconBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
            badge: 'Warga Kota',
            badgeColor: 'text-teal-600 dark:text-teal-400',
            title: 'Manajemen Pengguna',
            desc: 'Verifikasi identitas warga dan riwayat kontribusi.',
            cta: 'Buka Pengguna',
          },
        ].map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="p-5 rounded-2xl bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] hover:border-[#1B4332] dark:hover:border-[#10B981] transition-all group shadow-xs"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                {card.icon}
              </div>
              <span className={`text-xs font-mono font-bold ${card.badgeColor}`}>{card.badge}</span>
            </div>
            <h3 className="font-bold text-sm text-[#101913] dark:text-[#F3F6F4] group-hover:text-[#1B4332] dark:group-hover:text-[#34D399]">
              {card.title}
            </h3>
            <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3] mt-1 line-clamp-2">{card.desc}</p>
            <div className="mt-3 flex items-center text-xs font-semibold text-[#1B4332] dark:text-[#34D399] gap-1">
              <span>{card.cta}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent reports with message action */}
      <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#101913] dark:text-[#F3F6F4]">
              Laporan Memerlukan Perhatian
            </h3>
            <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3]">
              Antrean teratas dengan prioritas verifikasi atau keparahan tinggi.
            </p>
          </div>
          <Link
            to="/admin/validasi"
            className="text-xs font-bold text-[#1B4332] dark:text-[#34D399] hover:underline flex items-center gap-1"
          >
            <span>Buka Antrean Lengkap</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-[#E3E0D6] dark:divide-[#26352E]">
          {isLoadingReports && (
            <div className="py-8 text-center text-xs text-[#9EACA3] animate-pulse">Memuat laporan...</div>
          )}
          {!isLoadingReports && recentReports.length === 0 && (
            <div className="py-8 text-center text-xs text-[#9EACA3]">Tidak ada laporan aktif saat ini.</div>
          )}
          {recentReports.map((r) => (
            <div key={r.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[11px] font-bold text-[#4F5A52] dark:text-[#9EACA3]">
                    {r.publicReference}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      r.severity === 'critical'
                        ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                        : r.severity === 'high'
                        ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {r.severity}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#F0F7F4] dark:bg-[#26352E] text-[#1B4332] dark:text-[#34D399]">
                    {r.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4] truncate mt-0.5">
                  {r.title}
                </p>
                {r.reporterDisplayName && (
                  <p className="text-[11px] text-[#9EACA3] mt-0.5">oleh {r.reporterDisplayName}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.reporterUserId && (
                  <button
                    type="button"
                    onClick={() => handleMessageReporter(r.id, r.reporterUserId)}
                    className="p-1.5 rounded-xl border border-[#E3E0D6] dark:border-[#26352E] text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#1B4332] dark:hover:text-[#34D399] hover:border-[#1B4332] dark:hover:border-[#34D399] transition-colors"
                    title="Kirim pesan ke pelapor"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                )}
                <Link
                  to="/admin/validasi"
                  onClick={() => setSelectedReportId(r.id)}
                  className="px-3 py-1.5 rounded-xl border border-[#E3E0D6] dark:border-[#26352E] text-xs font-bold text-[#101913] dark:text-[#F3F6F4] hover:bg-[#F7F5EF] dark:hover:bg-[#26352E] transition-colors"
                >
                  Tinjau
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Clock className="w-4 h-4" />, label: 'Menunggu Verifikasi', value: metrics.underReview, color: 'text-amber-600 dark:text-amber-400' },
          { icon: <TrendingUp className="w-4 h-4" />, label: 'Butuh Info', value: metrics.needsInfo, color: 'text-orange-600 dark:text-orange-400' },
          { icon: <Send className="w-4 h-4" />, label: 'Diteruskan ke Dinas', value: metrics.forwarded, color: 'text-blue-600 dark:text-blue-400' },
          { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Tuntas Ditangani', value: metrics.resolved, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-2xl p-4 flex items-center gap-3">
            <div className={`shrink-0 ${stat.color}`}>{stat.icon}</div>
            <div className="min-w-0">
              <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-[#9EACA3] leading-tight">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

