import React, { useState, useEffect } from 'react';
import { Building2, Clock, ChevronRight, MessageSquare, RotateCcw, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { Report, UserProfile } from '../../types/domain';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createConversation } from '../../services/messagesService';

interface Props {
  profile: UserProfile;
}

const STATUS_LABEL: Record<string, string> = {
  accepted_for_routing: 'Siap Diteruskan',
  forwarded_to_institution: 'Diteruskan ke Dinas',
  institution_responded: 'Dinas Merespons',
  in_progress: 'Dalam Pengerjaan',
};

const AGENCY_COLORS: Record<string, string> = {
  'Dinas PUPR': 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300',
  'Dishub': 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300',
  'DLH': 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300',
  'Dinkes': 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300',
  'Disdik': 'bg-teal-100 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300',
};

function agencyColor(agency: string): string {
  for (const key of Object.keys(AGENCY_COLORS)) {
    if (agency.includes(key)) return AGENCY_COLORS[key];
  }
  return 'bg-stone-100 dark:bg-stone-900/50 text-stone-700 dark:text-stone-300';
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

export const AdminDisposisi: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();
  const { profile: authProfile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('Semua');

  const fetchReports = async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('reports')
        .select('*')
        .in('status', ['accepted_for_routing', 'forwarded_to_institution', 'institution_responded'])
        .order('updated_at', { ascending: false });
      if (err) throw err;
      setReports((data ?? []).map((r) => ({
        id: r.id,
        publicReference: r.public_reference ?? '',
        title: r.title ?? '',
        description: r.description ?? '',
        category: r.category ?? '',
        severity: r.severity ?? 'medium',
        status: r.status ?? 'submitted',
        publicationStatus: r.publication_status ?? 'pending',
        location: {
          latitude: r.latitude ?? 0,
          longitude: r.longitude ?? 0,
          address: r.address ?? '',
          district: r.district ?? '',
          city: r.city ?? 'Kota Bogor',
          province: r.province ?? 'Jawa Barat',
        },
        responsibleAgency: r.responsible_agency ?? '',
        mediaUrls: r.media_urls ?? [],
        reporterType: r.reporter_type ?? 'registered_citizen',
        reporterDisplayName: r.reporter_display_name ?? '',
        reporterUserId: r.reporter_user_id,
        supportCount: r.support_count ?? 0,
        events: [],
        createdAt: r.created_at ?? '',
        updatedAt: r.updated_at ?? '',
        isSampleData: false,
        estimatedCost: r.estimasi_anggaran ?? 0,
      })));
    } catch (e) {
      setError('Gagal memuat data disposisi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const agencies = ['Semua', ...Array.from(new Set(reports.map((r) => r.responsibleAgency).filter(Boolean)))];
  const filtered = agencyFilter === 'Semua' ? reports : reports.filter((r) => r.responsibleAgency === agencyFilter);

  // Group by agency
  const grouped: Record<string, Report[]> = {};
  for (const r of filtered) {
    const key = r.responsibleAgency || 'Belum Ditentukan';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  }

  const handleMessage = async (report: Report) => {
    if (!report.reporterUserId || !authProfile) return;
    try {
      const conv = await createConversation(report.id, authProfile.id, report.reporterUserId);
      navigate(`/pesan?conversation_id=${conv.id}`);
    } catch {
      navigate(`/pesan?report_id=${report.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-bold text-[#101913] dark:text-[#F3F6F4]">
              Disposisi &amp; Rute Dinas
            </h2>
            <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3] mt-0.5">
              {reports.length} laporan aktif tersebar ke {Object.keys(grouped).length} instansi
            </p>
          </div>
          <button
            type="button"
            onClick={fetchReports}
            className="p-2 rounded-xl border border-[#E3E0D6] dark:border-[#26352E] text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#1B4332] dark:hover:text-[#34D399] transition-colors"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Agency filter pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {agencies.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAgencyFilter(a)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                agencyFilter === a
                  ? 'bg-[#1B4332] text-white border-[#1B4332] dark:bg-[#34D399] dark:text-[#0A100D] dark:border-[#34D399]'
                  : 'border-[#E3E0D6] dark:border-[#26352E] text-[#4F5A52] dark:text-[#9EACA3] hover:border-[#1B4332] dark:hover:border-[#34D399]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-xs text-[#9EACA3] animate-pulse">Memuat data disposisi dari Supabase...</div>
      )}

      {!loading && Object.keys(grouped).length === 0 && (
        <div className="py-12 text-center text-xs text-[#9EACA3]">Tidak ada laporan dalam disposisi aktif.</div>
      )}

      {/* Grouped by agency */}
      {Object.entries(grouped).map(([agency, agencyReports]) => (
        <div key={agency} className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl shadow-xs overflow-hidden">
          {/* Agency header */}
          <div className="px-6 py-4 border-b border-[#E3E0D6] dark:border-[#26352E] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#1B4332]/10 dark:bg-[#34D399]/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-[#1B4332] dark:text-[#34D399]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#101913] dark:text-[#F3F6F4]">{agency}</p>
                <p className="text-[11px] text-[#9EACA3]">{agencyReports.length} laporan aktif</p>
              </div>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${agencyColor(agency)}`}>
              {agency.split(' ').slice(1, 3).join(' ') || agency}
            </span>
          </div>

          {/* Report rows */}
          <div className="divide-y divide-[#E3E0D6] dark:divide-[#26352E]">
            {agencyReports.map((r) => {
              const days = daysSince(r.updatedAt || r.createdAt);
              const slaBreach = days > 14;
              return (
                <div key={r.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#F7F5EF]/60 dark:hover:bg-[#131916]/60 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-[11px] font-bold text-[#4F5A52] dark:text-[#9EACA3]">
                        {r.publicReference}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        STATUS_LABEL[r.status]
                          ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                          : 'bg-stone-100 dark:bg-stone-900/50 text-stone-600 dark:text-stone-300'
                      }`}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                      {slaBreach && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300">
                          ⚠ SLA {days}h
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4] truncate">{r.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-[#9EACA3]">{r.location?.address}</span>
                      {r.estimatedCost ? (
                        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                          Rp {(r.estimatedCost / 1_000_000).toFixed(1)}jt
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-[11px] text-[#9EACA3]">
                      <Clock className="w-3 h-3" />
                      <span>{days}h</span>
                    </div>
                    {r.reporterUserId && (
                      <button
                        type="button"
                        onClick={() => handleMessage(r)}
                        className="p-1.5 rounded-xl border border-[#E3E0D6] dark:border-[#26352E] text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#1B4332] dark:hover:text-[#34D399] hover:border-[#1B4332] dark:hover:border-[#34D399] transition-colors"
                        title="Kirim pesan ke pelapor"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronRight className="w-4 h-4 text-[#9EACA3]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

