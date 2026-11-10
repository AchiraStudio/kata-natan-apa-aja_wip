import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  Search,
  GraduationCap,
  HeartPulse,
  Leaf,
  Building2,
  MapPin,
  ShieldAlert,
  Droplets,
  Lightbulb,
  Landmark,
  ArrowUpRight,
  LayoutGrid,
  List,
  CheckCircle2,
  Filter,
  X,
  RotateCcw,
  Calendar,
  ThumbsUp,
  MessageSquareQuote,
  Plus,
  Sparkles,
  Users,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useTitik } from '../context/TitikContext';
import { useAuth } from '../context/AuthContext';
import { Facility, Report, ReportStatus } from '../types/domain';
import { UserAvatar } from '../components/common/UserAvatar';
import './ExploreView.css';

export interface CivicAspiration {
  id: string;
  title: string;
  description: string;
  category: string;
  district: string;
  authorName: string;
  supportCount: number;
  isSupportedByMe?: boolean;
  status: 'planned_2026' | 'under_review' | 'field_survey' | 'musrenbang_queue';
  statusLabel: string;
  responsibleAgency: string;
  createdAt: string;
}

const DEFAULT_ASPIRATIONS: CivicAspiration[] = [
  {
    id: 'asp-1',
    title: 'Revitalisasi Trotoar Inklusif dan Pemandu Tunanetra di Kawasan SSA & Stasiun Bogor',
    description:
      'Perluasan jalur pejalan kaki ramah disabilitas, perbaikan guiding block yang terputus, dan penataan trotoar di seputar Kebun Raya dan Jalan Kapten Muslihat.',
    category: 'Infrastruktur',
    district: 'Bogor Tengah',
    authorName: 'Forum Warga Peduli Pejalan Kaki',
    supportCount: 342,
    status: 'planned_2026',
    statusLabel: 'Diagendakan TA 2026',
    responsibleAgency: 'Dinas PUPR Kota Bogor',
    createdAt: '2026-11-02T08:00:00Z',
  },
  {
    id: 'asp-2',
    title: 'Normalisasi Saluran Drainase & Kolam Retensi Anti-Banjir Kali Cibalok',
    description:
      'Pengerukan sedimentasi lumpur tebal dan perbaikan talud bantaran kali Cibalok di Batutulis guna mencegah genangan air meluap ke permukiman padat warga saat curah hujan tinggi.',
    category: 'Drainase & Banjir',
    district: 'Bogor Selatan',
    authorName: 'Komunitas Siaga Bencana Cibalok',
    supportCount: 218,
    status: 'under_review',
    statusLabel: 'Verifikasi Dinas PUPR',
    responsibleAgency: 'Dinas PUPR & BPBD Kota Bogor',
    createdAt: '2026-11-04T10:30:00Z',
  },
  {
    id: 'asp-3',
    title: 'Pemasangan Lampu Penerangan Jalan Umum (PJU) Tenaga Surya di Jalur Alternatif Katulampa',
    description:
      'Penerangan jalan minim pada malam hari memicu kerawanan kecelakaan dan tindak kriminal di sepanjang jalan pintas Katulampa menuju Baranangsiang.',
    category: 'Penerangan Umum',
    district: 'Bogor Timur',
    authorName: 'Rukun Warga 04 Katulampa',
    supportCount: 185,
    status: 'field_survey',
    statusLabel: 'Tinjauan Lapangan Dishub',
    responsibleAgency: 'Dinas Perhubungan Kota Bogor',
    createdAt: '2026-11-05T14:15:00Z',
  },
  {
    id: 'asp-4',
    title: 'Pengembangan Puskesmas Pembantu Ramah Lansia & Layanan 24 Jam di Bogor Barat',
    description:
      'Akses fasilitas kesehatan primer malam hari di wilayah Curug Mekar dan Bubulak masih membutuhkan rujukan jauh ke RSUD Kota Bogor.',
    category: 'Kesehatan',
    district: 'Bogor Barat',
    authorName: 'Kader Posyandu Curug Mekar',
    supportCount: 290,
    status: 'musrenbang_queue',
    statusLabel: 'Musrenbang 2026',
    responsibleAgency: 'Dinas Kesehatan Kota Bogor',
    createdAt: '2026-11-06T09:45:00Z',
  },
];

interface SectorDefinition {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CIVIC_SECTORS: SectorDefinition[] = [
  { name: 'Semua', icon: Compass },
  { name: 'Infrastruktur', icon: Building2 },
  { name: 'Drainase & Banjir', icon: Droplets },
  { name: 'Lingkungan', icon: Leaf },
  { name: 'Penerangan Umum', icon: Lightbulb },
  { name: 'Fasilitas Sosial', icon: Landmark },
  { name: 'Pendidikan', icon: GraduationCap },
  { name: 'Kesehatan', icon: HeartPulse },
];

const TIME_RANGE_OPTIONS: { id: 'all' | '7d' | '30d' | '90d'; label: string }[] = [
  { id: 'all', label: 'Semua Waktu' },
  { id: '7d', label: '7 Hari Terakhir' },
  { id: '30d', label: '30 Hari Terakhir' },
  { id: '90d', label: '90 Hari Terakhir' },
];

function isWithinTimeRange(dateStr: string, range: 'all' | '7d' | '30d' | '90d'): boolean {
  if (range === 'all') return true;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const time = new Date(dateStr).getTime();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return time >= cutoff;
}

function matchesFacilitySector(facility: Facility, sector: string): boolean {
  if (sector === 'Semua') return true;
  const cat = facility.category.toLowerCase();
  const text = `${facility.name} ${facility.address} ${facility.responsibleAgency}`.toLowerCase();

  switch (sector) {
    case 'Infrastruktur':
      return cat === 'infrastruktur' || text.includes('pupr') || text.includes('jalan');
    case 'Drainase & Banjir':
      return text.includes('drainase') || text.includes('saluran') || text.includes('air') || text.includes('banjir');
    case 'Lingkungan':
      return cat === 'lingkungan' || text.includes('taman') || text.includes('lingkungan');
    case 'Penerangan Umum':
      return text.includes('pju') || text.includes('penerangan') || text.includes('dishub');
    case 'Fasilitas Sosial':
      return cat === 'fasilitas' || cat === 'pendidikan' || cat === 'kesehatan' || text.includes('taman');
    case 'Pendidikan':
      return cat === 'pendidikan';
    case 'Kesehatan':
      return cat === 'kesehatan';
    default:
      return facility.category === sector;
  }
}

function matchesReportSector(report: Report, sector: string): boolean {
  if (sector === 'Semua') return true;
  const cat = report.category.toLowerCase();
  const text = `${report.title} ${report.description} ${report.facilityName || ''} ${report.responsibleAgency} ${report.budgetContext?.sectorName || ''} ${report.budgetContext?.subSectorName || ''}`.toLowerCase();

  switch (sector) {
    case 'Infrastruktur':
      return cat === 'infrastruktur';
    case 'Drainase & Banjir':
      return (
        text.includes('drainase') ||
        text.includes('banjir') ||
        text.includes('genangan') ||
        text.includes('rob') ||
        text.includes('saluran') ||
        text.includes('pompa')
      );
    case 'Lingkungan':
      return cat === 'lingkungan';
    case 'Penerangan Umum':
      return text.includes('pju') || text.includes('penerangan') || text.includes('lampu') || text.includes('kabel');
    case 'Fasilitas Sosial':
      return cat === 'fasilitas' || cat === 'pendidikan' || cat === 'kesehatan' || text.includes('marka') || text.includes('trotoar');
    case 'Pendidikan':
      return cat === 'pendidikan' || text.includes('sekolah') || text.includes('pendidikan');
    case 'Kesehatan':
      return cat === 'kesehatan' || text.includes('puskesmas') || text.includes('kesehatan');
    default:
      return report.category === sector;
  }
}

function formatStatusLabel(status: Report['status']): string {
  const labels: Record<Report['status'], string> = {
    submitted: 'Tercatat',
    under_review: 'Dalam Tinjauan',
    needs_info: 'Butuh Info',
    accepted_for_routing: 'Siap Diteruskan',
    forwarded_to_institution: 'Diteruskan ke Dinas',
    institution_responded: 'Dinas Merespons',
    resolved: 'Tuntas',
    rejected: 'Ditolak',
  };
  return labels[status] || status.replace(/_/g, ' ');
}

const SECTOR_DEFAULT_PHOTOS: Record<string, string> = {
  Infrastruktur: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=600&q=80',
  Lingkungan: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=600&q=80',
  Pendidikan: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=600&q=80',
  Kesehatan: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
  Lainnya: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
};

const REPORT_STATUS_COLORS: Record<Report['status'], string> = {
  submitted: '#B45309',
  under_review: '#2563EB',
  needs_info: '#D97706',
  accepted_for_routing: '#0E7490',
  forwarded_to_institution: '#2E5E8C',
  institution_responded: '#0F766E',
  resolved: '#2D6A4F',
  rejected: '#B3261E',
};

export const ExploreView: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isAuthenticated } = useAuth();
  const { facilities, posts, openReportModal, unreadMessagesCount } = useTitik();
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<Report['status'] | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [activeExploreTab, setActiveExploreTab] = useState<'directory' | 'aspirations'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Civic Aspirations Module State (FDS Musrenbang & Partisipasi Warga)
  const [aspirations, setAspirations] = useState<CivicAspiration[]>(DEFAULT_ASPIRATIONS);
  const [isNewAspirationModalOpen, setIsNewAspirationModalOpen] = useState(false);
  const [aspirationForm, setAspirationForm] = useState({
    title: '',
    description: '',
    category: 'Infrastruktur',
    district: 'Bogor Tengah',
    responsibleAgency: 'Dinas PUPR Kota Bogor',
  });

  const allReports = useMemo(
    () => posts.map((p) => p.relatedReport).filter((r): r is Report => Boolean(r)),
    [posts]
  );

  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sector of CIVIC_SECTORS) {
      const facCount = facilities.filter((f) => matchesFacilitySector(f, sector.name)).length;
      const repCount = allReports.filter((r) => matchesReportSector(r, sector.name)).length;
      counts[sector.name] = facCount + repCount;
    }
    return counts;
  }, [facilities, allReports]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredFacilities = useMemo(
    () =>
      facilities.filter((f) => {
        const matchesCat = matchesFacilitySector(f, selectedCategory);
        const matchesQuery =
          !normalizedQuery ||
          f.name.toLowerCase().includes(normalizedQuery) ||
          f.address.toLowerCase().includes(normalizedQuery) ||
          f.responsibleAgency.toLowerCase().includes(normalizedQuery) ||
          f.category.toLowerCase().includes(normalizedQuery);
        return matchesCat && matchesQuery;
      }),
    [facilities, selectedCategory, normalizedQuery]
  );

  const baseChartReports = useMemo(
    () =>
      posts.filter((p) => {
        if (!p.relatedReport) return false;
        const r = p.relatedReport;
        const matchesCat = matchesReportSector(r, selectedCategory);
        const matchesTime = isWithinTimeRange(r.createdAt || p.createdAt, selectedTimeRange);
        const matchesQuery =
          !normalizedQuery ||
          r.title.toLowerCase().includes(normalizedQuery) ||
          r.description.toLowerCase().includes(normalizedQuery) ||
          r.publicReference.toLowerCase().includes(normalizedQuery) ||
          r.responsibleAgency.toLowerCase().includes(normalizedQuery) ||
          r.location.address.toLowerCase().includes(normalizedQuery) ||
          (r.facilityName && r.facilityName.toLowerCase().includes(normalizedQuery));
        return matchesCat && matchesTime && matchesQuery;
      }),
    [posts, selectedCategory, selectedTimeRange, normalizedQuery]
  );

  const filteredReportPosts = useMemo(() => {
    if (!selectedStatusFilter) return baseChartReports;
    return baseChartReports.filter((p) => p.relatedReport?.status === selectedStatusFilter);
  }, [baseChartReports, selectedStatusFilter]);

  const reportCharts = useMemo(() => {
    const uniqueReports = new Map<string, Report>();
    for (const post of baseChartReports) {
      if (post.relatedReport) uniqueReports.set(post.relatedReport.id, post.relatedReport);
    }

    const reports = [...uniqueReports.values()];
    const statusCounts = new Map<Report['status'], number>();
    const categoryCounts = new Map<string, number>();
    for (const report of reports) {
      statusCounts.set(report.status, (statusCounts.get(report.status) ?? 0) + 1);
      categoryCounts.set(report.category, (categoryCounts.get(report.category) ?? 0) + 1);
    }

    const statuses = [...statusCounts.entries()].map(([status, value]) => ({
      status,
      name: formatStatusLabel(status),
      value,
      fill: REPORT_STATUS_COLORS[status],
    }));
    const categories = [...categoryCounts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'id'));
    const topCategories = categories.slice(0, 5);
    const remainingCount = categories.slice(5).reduce((sum, category) => sum + category.value, 0);
    if (remainingCount > 0) topCategories.push({ name: 'Kategori lainnya', value: remainingCount });

    let accumulatedPercent = 0;
    const donutBackground = `conic-gradient(${statuses
      .map((entry) => {
        const startPercent = accumulatedPercent;
        accumulatedPercent += (entry.value / reports.length) * 100;
        return `${entry.fill} ${startPercent}% ${accumulatedPercent}%`;
      })
      .join(', ')})`;

    return {
      reports,
      statuses,
      categories: topCategories,
      donutBackground,
      maxCategoryCount: topCategories[0]?.value ?? 0,
    };
  }, [baseChartReports]);

  const handleToggleAspirationSupport = (aspirationId: string) => {
    setAspirations((prev) =>
      prev.map((asp) => {
        if (asp.id !== aspirationId) return asp;
        const isSupported = asp.isSupportedByMe;
        return {
          ...asp,
          isSupportedByMe: !isSupported,
          supportCount: isSupported ? asp.supportCount - 1 : asp.supportCount + 1,
        };
      })
    );
  };

  const handleCreateAspiration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aspirationForm.title.trim() || !aspirationForm.description.trim()) return;

    const newAsp: CivicAspiration = {
      id: `asp-${Date.now()}`,
      title: aspirationForm.title.trim(),
      description: aspirationForm.description.trim(),
      category: aspirationForm.category,
      district: aspirationForm.district,
      authorName: profile?.displayName || 'Warga Bogor',
      supportCount: 1,
      isSupportedByMe: true,
      status: 'under_review',
      statusLabel: 'Verifikasi Dinas Terkait',
      responsibleAgency: aspirationForm.responsibleAgency,
      createdAt: new Date().toISOString(),
    };

    setAspirations((prev) => [newAsp, ...prev]);
    setIsNewAspirationModalOpen(false);
    setAspirationForm({
      title: '',
      description: '',
      category: 'Infrastruktur',
      district: 'Bogor Tengah',
      responsibleAgency: 'Dinas PUPR Kota Bogor',
    });
  };

  const resetAllFilters = () => {
    setSelectedCategory('Semua');
    setSelectedStatusFilter(null);
    setSelectedTimeRange('all');
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedCategory !== 'Semua' ||
    selectedStatusFilter !== null ||
    selectedTimeRange !== 'all' ||
    searchQuery.trim() !== '';

  const filteredAspirations = useMemo(() => {
    return aspirations.filter((asp) => {
      const matchesCat =
        selectedCategory === 'Semua' ||
        asp.category.toLowerCase() === selectedCategory.toLowerCase() ||
        matchesReportSector({ category: asp.category, title: asp.title, description: asp.description, responsibleAgency: asp.responsibleAgency } as any, selectedCategory);
      const matchesQuery =
        !normalizedQuery ||
        asp.title.toLowerCase().includes(normalizedQuery) ||
        asp.description.toLowerCase().includes(normalizedQuery) ||
        asp.district.toLowerCase().includes(normalizedQuery) ||
        asp.responsibleAgency.toLowerCase().includes(normalizedQuery) ||
        asp.authorName.toLowerCase().includes(normalizedQuery);
      return matchesCat && matchesQuery;
    });
  }, [aspirations, selectedCategory, normalizedQuery]);

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden h-14 bg-[#F7F5EF] dark:bg-[#131916] border-b border-[#E3E0D6] dark:border-[#26352E] px-4 flex items-center justify-between shrink-0 z-20">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          className="inline-flex items-center gap-1.5 text-xl font-black tracking-tight text-[#101913] dark:text-[#F3F6F4]"
        >
          <span>TITIK</span>
          <span className="w-2 h-2 rounded-full bg-[#1B4332] dark:bg-[#10B981]"></span>
        </a>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/pesan')}
            className="relative p-1.5 rounded-full text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4] transition-colors cursor-pointer"
            title="Pesan Langsung"
            aria-label="Pesan"
          >
            <MessageSquareQuote className="w-4 h-4" />
            {(unreadMessagesCount ?? 0) > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#131916]" />
            )}
          </button>
          {isAuthenticated && profile.role === 'admin' && (
            <Link
              to="/admin"
              className="p-1.5 rounded-full bg-amber-600/90 text-amber-100 hover:text-white transition-colors cursor-pointer"
              title="Portal admin"
              aria-label="Portal admin"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
            </Link>
          )}
          {isAuthenticated ? (
            <Link to={'/u/' + encodeURIComponent(profile.username)} className="flex items-center" title={'Profil ' + profile.displayName}>
              <UserAvatar
                src={profile.avatarUrl}
                alt={profile.displayName}
                name={profile.displayName}
                role={profile.role}
                className="w-7 h-7 rounded-full object-cover border border-[#E3E0D6] dark:border-[#26352E]"
              />
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-2.5 py-1 rounded-xl bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] text-xs font-bold"
            >
              Masuk
            </Link>
          )}
        </div>
      </header>


      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto no-scrollbar p-4 lg:p-8 w-full max-w-6xl space-y-6 pb-24 lg:pb-12 min-w-0">
        {/* LIVE BOGOR CITY-PULSE STRIP (Replaces generic gradient box) */}
        <section
          aria-label="Telemetri Wilayah Kota Bogor"
          className="bg-white dark:bg-[#161F1B] border border-[#E3E0D6] dark:border-[#24322B] rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1B4332] dark:bg-[#10B981] titik-live" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B4332] dark:text-[#34D399]">
                  Telemetri Kota Hujan · Denyut Publik
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#E7EBDD] dark:bg-[#192B22] text-[#1B4332] dark:text-[#34D399] font-bold">
                  Satu Data Bogor
                </span>
              </div>
              <h1 className="text-xl lg:text-2xl font-black text-[#101913] dark:text-[#F3F6F4] tracking-tight">
                Direktori Fasilitas & Wilayah Kota Bogor
              </h1>
              <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3]">
                Setiap masalah adalah titik. Pantau status infrastruktur, kesiapan fasilitas, dan alokasi APBD secara transparan.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={openReportModal}
                className="px-4 py-2.5 rounded-xl bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] text-xs font-bold hover:bg-[#14352A] dark:hover:bg-[#34D399] active:scale-[0.98] transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <span>+ Laporkan Titik Baru</span>
              </button>
            </div>
          </div>

          {/* City Vitals Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E3E0D6]/70 dark:border-[#24322B]">
            <div className="p-3 rounded-2xl bg-[#F7F5EF] dark:bg-[#111714] border border-[#E3E0D6]/60 dark:border-[#222E28]">
              <div className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Titik Aktif</span>
              </div>
              <div className="text-base sm:text-lg font-black text-[#B45309] dark:text-amber-400 font-mono tabular-nums mt-0.5">
                {allReports.filter((r) => r.status !== 'resolved' && r.status !== 'rejected').length} Titik
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#F7F5EF] dark:bg-[#111714] border border-[#E3E0D6]/60 dark:border-[#222E28]">
              <div className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3] font-semibold">Ditindak / Diproses</div>
              <div className="text-base sm:text-lg font-black text-[#2E5E8C] dark:text-sky-400 font-mono tabular-nums mt-0.5">
                {allReports.filter((r) => r.status === 'forwarded_to_institution' || r.status === 'institution_responded' || r.status === 'under_review').length} Titik
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#F7F5EF] dark:bg-[#111714] border border-[#E3E0D6]/60 dark:border-[#222E28]">
              <div className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#2D6A4F]" />
                <span>Tuntas</span>
              </div>
              <div className="text-base sm:text-lg font-black text-[#2D6A4F] dark:text-emerald-400 font-mono tabular-nums mt-0.5">
                {allReports.filter((r) => r.status === 'resolved').length} Titik
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#F7F5EF] dark:bg-[#111714] border border-[#E3E0D6]/60 dark:border-[#222E28]">
              <div className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3] font-semibold">Cuaca & Status Sungai</div>
              <div className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4] truncate mt-1">
                🌧️ Hujan Sedang (Katulampa Normal)
              </div>
            </div>
          </div>
        </section>

        {/* Main Explore Navigation Tabs: Direktori vs Aspirasi (FDS Web In Action 2026) */}
        <div className="flex items-center gap-2 border-b border-[#E3E0D6] dark:border-[#26352E] pb-3" role="tablist" aria-label="Navigasi Jelajah Publik">
          <button
            type="button"
            role="tab"
            aria-selected={activeExploreTab === 'directory'}
            onClick={() => setActiveExploreTab('directory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeExploreTab === 'directory'
                ? 'bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] shadow-sm'
                : 'bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Direktori Fasilitas &amp; Laporan</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeExploreTab === 'aspirations'}
            onClick={() => setActiveExploreTab('aspirations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 relative ${
              activeExploreTab === 'aspirations'
                ? 'bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] shadow-sm'
                : 'bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Aspirasi &amp; Musrenbang Warga</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
              FDS 2026
            </span>
          </button>
        </div>

        {/* Search, Time-Range, and Sektor Filter Bar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-4 top-3.5 text-[#4F5A52] dark:text-[#9EACA3]" />
              <input
                type="text"
                placeholder={
                  activeExploreTab === 'directory'
                    ? 'Cari nama fasilitas, jalan, kode referensi, atau dinas penanggung jawab...'
                    : 'Cari topik aspirasi, usulan warga, kecamatan, atau dinas terkait...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="explore-search-input w-full pl-11 pr-10 py-3 bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-full text-xs text-[#101913] dark:text-[#F3F6F4] placeholder-[#4F5A52] dark:placeholder-[#6C7D73] focus:outline-none focus:border-[#1B4332] dark:focus:border-[#10B981] shadow-xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3 p-0.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 text-[#4F5A52] dark:text-[#9EACA3] transition-colors"
                  title="Hapus pencarian"
                  aria-label="Hapus kata kunci pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Time-Range Selector Buttons (Directory Mode) */}
            {activeExploreTab === 'directory' && (
              <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-full overflow-x-auto no-scrollbar shrink-0">
                <Calendar className="w-3.5 h-3.5 ml-2 mr-1 text-[#4F5A52] dark:text-[#9EACA3] shrink-0" />
                {TIME_RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedTimeRange(opt.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedTimeRange === opt.id
                        ? 'bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610]'
                        : 'text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sektor Filter Pills */}
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter Sektor Publik">
            {CIVIC_SECTORS.map((sector) => {
              const Icon = sector.icon;
              const isSelected = selectedCategory === sector.name;
              const count = sectorCounts[sector.name] ?? 0;
              return (
                <button
                  key={sector.name}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedCategory(sector.name)}
                  className={`explore-category-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] font-semibold shadow-xs'
                      : 'bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4] hover:border-[#1B4332]/30 dark:hover:border-[#10B981]/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{sector.name}</span>
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[11px] font-mono tabular-nums ${
                      isSelected
                        ? 'bg-white/20 dark:bg-[#0A1610]/20 text-white dark:text-[#0A1610] font-bold'
                        : 'bg-[#F7F5EF] dark:bg-[#131916] text-[#4F5A52] dark:text-[#9EACA3]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Filter Bar & Clear Actions */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 px-3.5 rounded-2xl bg-[#F7F5EF] dark:bg-[#151D19] border border-[#E3E0D6] dark:border-[#26352E] text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#4F5A52] dark:text-[#9EACA3] mr-1">
                  Filter Aktif:
                </span>

                {selectedCategory !== 'Semua' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#202B25] border border-[#E3E0D6] dark:border-[#2E3D35] text-[11px] font-medium text-[#101913] dark:text-[#F3F6F4]">
                    <span>Sektor: {selectedCategory}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('Semua')}
                      className="hover:text-red-500 cursor-pointer"
                      title="Hapus filter sektor"
                      aria-label="Hapus filter sektor"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedStatusFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#202B25] border border-[#E3E0D6] dark:border-[#2E3D35] text-[11px] font-medium text-[#101913] dark:text-[#F3F6F4]">
                    <span>Status: {formatStatusLabel(selectedStatusFilter)}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedStatusFilter(null)}
                      className="hover:text-red-500 cursor-pointer"
                      title="Hapus filter status"
                      aria-label="Hapus filter status"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedTimeRange !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#202B25] border border-[#E3E0D6] dark:border-[#2E3D35] text-[11px] font-medium text-[#101913] dark:text-[#F3F6F4]">
                    <span>Waktu: {TIME_RANGE_OPTIONS.find((t) => t.id === selectedTimeRange)?.label}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTimeRange('all')}
                      className="hover:text-red-500 cursor-pointer"
                      title="Hapus filter rentang waktu"
                      aria-label="Hapus filter rentang waktu"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {searchQuery.trim() !== '' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#202B25] border border-[#E3E0D6] dark:border-[#2E3D35] text-[11px] font-medium text-[#101913] dark:text-[#F3F6F4]">
                    <span>Kata Kunci: &ldquo;{searchQuery.trim()}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="hover:text-red-500 cursor-pointer"
                      title="Hapus kata kunci"
                      aria-label="Hapus kata kunci"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-[#4F5A52] dark:text-[#9EACA3]" aria-live="polite">
                  {activeExploreTab === 'directory'
                    ? `${filteredFacilities.length} fasilitas · ${filteredReportPosts.length} laporan`
                    : `${filteredAspirations.length} usulan aspirasi warga`}
                </span>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Semua</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TAB CONTENT: 1. DIREKTORI & LAPORAN */}
        {activeExploreTab === 'directory' && (
          <>
            {/* Interactive Charts Section (FDS Pilar 1) */}
            <section className="space-y-3" aria-labelledby="explore-charts-heading">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2
                    id="explore-charts-heading"
                    className="text-sm font-bold text-[#101913] dark:text-[#F3F6F4]"
                  >
                    Visualisasi Interaktif Laporan Publik
                  </h2>
                  <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3]">
                    Klik irisan status atau baris kategori untuk memfilter direktori secara langsung.
                  </p>
                </div>
              </div>

              {reportCharts.reports.length === 0 ? (
                <div className="explore-chart-card rounded-3xl border border-[#E3E0D6] dark:border-[#26352E] bg-white dark:bg-[#1A221E] p-5 text-xs text-[#4F5A52] dark:text-[#9EACA3]">
                  Belum ada laporan yang cocok untuk ditampilkan pada grafik.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <article className="explore-chart-card rounded-3xl border border-[#E3E0D6] dark:border-[#26352E] bg-white dark:bg-[#1A221E] p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4]">
                        Laporan Menurut Status (Interaktif)
                      </h3>
                      {selectedStatusFilter && (
                        <button
                          type="button"
                          onClick={() => setSelectedStatusFilter(null)}
                          className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          Tampilkan Semua Status
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">
                      Proporsi progres penanganan. Klik item status untuk menyaring data.
                    </p>
                    <div className="explore-donut-wrap mt-3">
                      <div
                        className="explore-donut explore-donut-interactive"
                        style={{ background: reportCharts.donutBackground }}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedStatusFilter(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedStatusFilter(null);
                          }
                        }}
                        title="Klik untuk mereset filter status laporan"
                        aria-label={`Diagram lingkaran proporsi status dari ${reportCharts.reports.length} laporan. Klik untuk reset filter.`}
                      >
                        <div className="explore-donut-center" aria-hidden="true">
                          <strong>{reportCharts.reports.length}</strong>
                          <span>laporan</span>
                        </div>
                      </div>
                    </div>
                    <ul className="explore-chart-legend mt-4 space-y-1" aria-label="Legenda status laporan interaktif">
                      {reportCharts.statuses.map((entry) => {
                        const isSelected = selectedStatusFilter === entry.status;
                        return (
                          <li key={entry.status}>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedStatusFilter((prev) => (prev === entry.status ? null : entry.status))
                              }
                              className={`explore-chart-legend-btn ${isSelected ? 'is-active' : ''}`}
                              title={`Saring laporan berstatus ${entry.name}`}
                              aria-pressed={isSelected}
                            >
                              <span className="explore-chart-legend-dot" style={{ backgroundColor: entry.fill }} />
                              <span className="flex-1 truncate">{entry.name}</span>
                              <strong className="font-mono tabular-nums">{entry.value}</strong>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </article>

                  <article className="explore-chart-card rounded-3xl border border-[#E3E0D6] dark:border-[#26352E] bg-white dark:bg-[#1A221E] p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4]">
                        Laporan Menurut Sektor (Interaktif)
                      </h3>
                      {selectedCategory !== 'Semua' && (
                        <button
                          type="button"
                          onClick={() => setSelectedCategory('Semua')}
                          className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          Tampilkan Semua Sektor
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">
                      Klik nama sektor untuk menyaring daftar fasilitas dan laporan warga.
                    </p>
                    <div
                      className="explore-category-chart mt-4 space-y-1.5"
                      role="img"
                      aria-label={`Diagram batang kategori dari ${reportCharts.reports.length} laporan`}
                    >
                      {reportCharts.categories.map((entry) => {
                        const isSelected = selectedCategory === entry.name;
                        return (
                          <button
                            key={entry.name}
                            type="button"
                            onClick={() =>
                              setSelectedCategory((prev) => (prev === entry.name ? 'Semua' : entry.name))
                            }
                            className={`explore-category-row-btn ${isSelected ? 'is-active' : ''}`}
                            title={`Saring menurut sektor ${entry.name}`}
                            aria-pressed={isSelected}
                          >
                            <span className="explore-category-label truncate">{entry.name}</span>
                            <div className="explore-category-track" aria-hidden="true">
                              <span
                                className="explore-category-bar"
                                style={{
                                  width: `${(entry.value / reportCharts.maxCategoryCount) * 100}%`,
                                }}
                              />
                            </div>
                            <strong className="font-mono tabular-nums text-right">{entry.value}</strong>
                          </button>
                        );
                      })}
                    </div>
                    <ul className="sr-only" aria-label="Rincian jumlah laporan per kategori">
                      {reportCharts.categories.map((entry) => (
                        <li key={entry.name}>{entry.name}: {entry.value} laporan</li>
                      ))}
                    </ul>
                  </article>
                </div>
              )}
            </section>

        {/* Registered Public Facilities Grid with Photos & Vitals */}
        <section aria-labelledby="explore-facilities-heading">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2
                id="explore-facilities-heading"
                className="text-xs font-bold uppercase tracking-wider text-[#4F5A52] dark:text-[#9EACA3] tabular-nums"
              >
                Fasilitas Terdaftar ({filteredFacilities.length})
              </h2>
              {selectedCategory !== 'Semua' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('Semua')}
                  className="text-xs font-semibold text-[#1B4332] dark:text-[#34D399] hover:underline cursor-pointer"
                >
                  Tampilkan Semua Sektor
                </button>
              )}
            </div>

            {/* Density Toggle (Grid vs List) */}
            <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#E7EBDD] dark:bg-[#1E2E25] text-[#1B4332] dark:text-[#34D399]'
                    : 'text-[#4F5A52] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
                }`}
                title="Tampilan Kartu Foto"
                aria-label="Tampilan Kartu Foto"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#E7EBDD] dark:bg-[#1E2E25] text-[#1B4332] dark:text-[#34D399]'
                    : 'text-[#4F5A52] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
                }`}
                title="Tampilan Daftar Ringkas"
                aria-label="Tampilan Daftar Ringkas"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {filteredFacilities.length === 0 ? (
            <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 text-center">
              <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3]">
                Tidak ada fasilitas yang cocok dengan filter sektor atau kata kunci pencarian saat ini.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFacilities.map((f) => {
                const photoUrl =
                  (f as any).photoUrl ||
                  SECTOR_DEFAULT_PHOTOS[f.category] ||
                  SECTOR_DEFAULT_PHOTOS['Infrastruktur'];

                return (
                  <article
                    key={f.id}
                    className="explore-facility-card group bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl overflow-hidden shadow-xs hover:border-[#1B4332]/40 dark:hover:border-[#10B981]/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Facility Photo Header with Category Tag */}
                      <div className="relative h-32 w-full overflow-hidden bg-stone-100 dark:bg-stone-900">
                        <img
                          src={photoUrl}
                          alt={f.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                        <div className="absolute top-3 left-3">
                          <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20">
                            {f.category}
                          </span>
                        </div>
                        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                          <span className="text-[11px] font-medium text-white/90 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#34D399] shrink-0" />
                            <span className="truncate">{f.address}</span>
                          </span>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-4 space-y-2">
                        <h3 className="text-base font-bold text-[#101913] dark:text-[#F3F6F4] leading-snug">
                          {f.name}
                        </h3>

                        {/* Status Row: Active vs Resolved Reports */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {f.activeReportsCount > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-[11px] font-bold font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>{f.activeReportsCount} Titik Aktif</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold">
                              <span>Kondisi Normal</span>
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4F5A52] dark:text-[#9EACA3] font-mono">
                            <CheckCircle2 className="w-3 h-3 text-[#2D6A4F] dark:text-[#34D399]" />
                            <span>{f.resolvedReportsCount} Tuntas</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Agency Footer */}
                    <div className="p-4 pt-2 border-t border-[#E3E0D6]/70 dark:border-[#26352E] flex items-center justify-between gap-3 text-xs bg-[#F7F5EF]/60 dark:bg-[#141C18]">
                      <span className="text-[#4F5A52] dark:text-[#9EACA3] text-[11px] truncate flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#34D399] shrink-0" />
                        <span className="truncate">{f.responsibleAgency}</span>
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* Compact List View for Agency Density */
            <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl divide-y divide-[#E3E0D6]/70 dark:divide-[#26352E] overflow-hidden shadow-xs">
              {filteredFacilities.map((f) => (
                <div
                  key={f.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F7F5EF]/60 dark:hover:bg-[#161F1B] transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#1B4332] dark:text-[#34D399]">
                        {f.category}
                      </span>
                      <span className="text-[#4F5A52]/40">•</span>
                      <h3 className="text-sm font-bold text-[#101913] dark:text-[#F3F6F4] truncate">
                        {f.name}
                      </h3>
                    </div>
                    <div className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3] flex items-center gap-2 truncate">
                      <span className="truncate">{f.address}</span>
                      <span className="text-[#4F5A52]/40">•</span>
                      <span className="truncate">{f.responsibleAgency}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    {f.activeReportsCount > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-[11px] font-bold font-mono">
                        {f.activeReportsCount} Aktif
                      </span>
                    ) : (
                      <span className="text-[#4F5A52] dark:text-[#9EACA3] text-[11px]">Nir-masalah</span>
                    )}
                    <span className="font-mono text-[#2D6A4F] dark:text-[#34D399] font-bold">
                      {f.resolvedReportsCount} Tuntas
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Community Reports Filtered by Sector & Search */}
        <section className="pt-2" aria-labelledby="explore-reports-heading">
          <div className="flex items-center justify-between mb-3">
            <h2
              id="explore-reports-heading"
              className="text-xs font-bold uppercase tracking-wider text-[#4F5A52] dark:text-[#9EACA3] tabular-nums"
            >
              Laporan Komunitas Terbaru ({filteredReportPosts.length})
            </h2>
          </div>

          {filteredReportPosts.length === 0 ? (
            <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 text-center">
              <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3]">
                Belum ada laporan warga pada sektor atau kata kunci pencarian ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReportPosts.map((p) => {
                if (!p.relatedReport) return null;
                const r = p.relatedReport;
                return (
                  <Link
                    key={p.id}
                    to={`/report/${r.id}`}
                    className="explore-incident-card group bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl overflow-hidden shadow-xs hover:border-[#1B4332] dark:hover:border-[#10B981] transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative overflow-hidden bg-[#E7EBDD]/40 dark:bg-[#131916]">
                        <img
                          src={r.mediaUrls[0]}
                          alt={r.title}
                          className="w-full h-36 object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-mono tabular-nums font-bold text-[#4F5A52] dark:text-[#9EACA3]">
                            {r.publicReference}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100/80 dark:bg-amber-950/60 text-[#92400E] dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80">
                            {formatStatusLabel(r.status)}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-[#101913] dark:text-[#F3F6F4] line-clamp-1 group-hover:text-[#1B4332] dark:group-hover:text-[#34D399] transition-colors">
                          {r.title}
                        </h3>
                        <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3] line-clamp-2 leading-relaxed">
                          {r.description}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2 border-t border-[#E3E0D6]/60 dark:border-[#26352E] flex items-center justify-between text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">
                      <span className="truncate max-w-[75%]">{r.location.city}</span>
                      <span className="inline-flex items-center gap-0.5 font-semibold text-[#1B4332] dark:text-[#34D399] shrink-0">
                        <span>Detail</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </>
    )}

    {/* TAB CONTENT: 2. ASPIRASI & MUSRENBANG WARGA (FDS Pilar 3) */}
    {activeExploreTab === 'aspirations' && (
      <section className="space-y-6" aria-labelledby="aspirations-heading">
        {/* Musrenbang Digital Hero Banner */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#161F1B] border border-[#E3E0D6] dark:border-[#24322B] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Forum Musrenbang Digital · Kota Bogor 2026</span>
            </div>
            <h2 id="aspirations-heading" className="text-lg sm:text-xl font-black text-[#101913] dark:text-[#F3F6F4] tracking-tight">
              Ruang Aspirasi &amp; Musrenbang Warga
            </h2>
            <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3] max-w-2xl leading-relaxed">
              Bentuk partisipasi langsung warga Kota Bogor untuk mengusulkan proyek fasilitas publik dan perbaikan lingkungan. Usulan dengan dukungan tertinggi diajukan ke dinas teknis terkait untuk penganggaran TA 2026.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsNewAspirationModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#1B4332] dark:bg-[#10B981] hover:bg-[#14352A] dark:hover:bg-[#34D399] text-white dark:text-[#0A1610] text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Sampaikan Aspirasi Warga</span>
          </button>
        </div>

        {/* Aspirations Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4F5A52] dark:text-[#9EACA3] tabular-nums">
              Daftar Usulan Komunitas ({filteredAspirations.length})
            </span>
            <span className="text-xs text-[#4F5A52] dark:text-[#9EACA3]">
              Diurutkan berdasarkan dukungan &amp; prioritas musyawarah
            </span>
          </div>

          {filteredAspirations.length === 0 ? (
            <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-8 text-center space-y-2">
              <Users className="w-8 h-8 text-[#E3E0D6] dark:text-[#26352E] mx-auto" />
              <p className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4]">
                Belum ada usulan aspirasi yang cocok dengan filter atau kata kunci ini.
              </p>
              <p className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">
                Jadilah pelopor pertama dengan mengusulkan perbaikan di lingkungan Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAspirations.map((asp) => (
                <article
                  key={asp.id}
                  className="explore-aspiration-card bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] p-5 flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#E7EBDD] dark:bg-[#1C2C24] text-[#1B4332] dark:text-[#34D399]">
                        {asp.category} · {asp.district}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                        {asp.statusLabel}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#101913] dark:text-[#F3F6F4] leading-snug">
                      {asp.title}
                    </h3>

                    <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3] leading-relaxed">
                      {asp.description}
                    </p>

                    <div className="pt-2 text-[11px] text-[#4F5A52] dark:text-[#9EACA3] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#34D399] shrink-0" />
                      <span className="truncate">Rencana Pengampu: <strong>{asp.responsibleAgency}</strong></span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E3E0D6]/60 dark:border-[#26352E] flex items-center justify-between gap-3 text-xs">
                    <div className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">
                      Oleh <strong>{asp.authorName}</strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleAspirationSupport(asp.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        asp.isSupportedByMe
                          ? 'bg-[#1B4332] text-white dark:bg-[#10B981] dark:text-[#0A1610] shadow-2xs'
                          : 'bg-[#F7F5EF] dark:bg-[#202B25] border border-[#E3E0D6] dark:border-[#2C3B32] text-[#101913] dark:text-[#F3F6F4] hover:border-[#1B4332]'
                      }`}
                      aria-label={`Dukung usulan aspirasi ini. Saat ini memiliki ${asp.supportCount} dukungan warga`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${asp.isSupportedByMe ? 'fill-current' : ''}`} />
                      <span>{asp.isSupportedByMe ? 'Didukung' : 'Dukung'}</span>
                      <span className="font-mono tabular-nums ml-0.5">({asp.supportCount})</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    )}

    {/* Modal: Sampaikan Usulan Aspirasi Warga (FDS Musrenbang) */}
    {isNewAspirationModalOpen && (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-aspiration-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      >
        <div className="bg-white dark:bg-[#161F1B] border border-[#E3E0D6] dark:border-[#24322B] rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3E0D6] dark:border-[#26352E]">
            <div className="space-y-0.5">
              <h3 id="modal-aspiration-title" className="text-base font-black text-[#101913] dark:text-[#F3F6F4]">
                Sampaikan Usulan Aspirasi Warga
              </h3>
              <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3]">
                Musrenbang Digital Kota Bogor · Tahun Anggaran 2026
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewAspirationModalOpen(false)}
              className="p-1 rounded-full text-[#4F5A52] hover:text-[#101913] dark:text-[#9EACA3] dark:hover:text-[#F3F6F4] transition-colors"
              aria-label="Tutup form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateAspiration} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-[#101913] dark:text-[#F3F6F4] mb-1">
                Judul Usulan / Proyek Fasilitas
              </label>
              <input
                type="text"
                required
                value={aspirationForm.title}
                onChange={(e) => setAspirationForm({ ...aspirationForm, title: e.target.value })}
                placeholder="Contoh: Pemasangan Lampu PJU dan Cermin Tikungan di Cibalok"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F5EF] dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] text-[#101913] dark:text-[#F3F6F4] focus:outline-none focus:border-[#1B4332]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#101913] dark:text-[#F3F6F4] mb-1">
                  Sektor
                </label>
                <select
                  value={aspirationForm.category}
                  onChange={(e) => setAspirationForm({ ...aspirationForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F5EF] dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] text-[#101913] dark:text-[#F3F6F4] focus:outline-none focus:border-[#1B4332]"
                >
                  <option value="Infrastruktur">Infrastruktur</option>
                  <option value="Drainase & Banjir">Drainase &amp; Banjir</option>
                  <option value="Lingkungan">Lingkungan</option>
                  <option value="Penerangan Umum">Penerangan Umum</option>
                  <option value="Fasilitas Sosial">Fasilitas Sosial</option>
                  <option value="Pendidikan">Pendidikan</option>
                  <option value="Kesehatan">Kesehatan</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#101913] dark:text-[#F3F6F4] mb-1">
                  Kecamatan / Wilayah
                </label>
                <select
                  value={aspirationForm.district}
                  onChange={(e) => setAspirationForm({ ...aspirationForm, district: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F5EF] dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] text-[#101913] dark:text-[#F3F6F4] focus:outline-none focus:border-[#1B4332]"
                >
                  <option value="Bogor Tengah">Bogor Tengah</option>
                  <option value="Bogor Selatan">Bogor Selatan</option>
                  <option value="Bogor Timur">Bogor Timur</option>
                  <option value="Bogor Barat">Bogor Barat</option>
                  <option value="Bogor Utara">Bogor Utara</option>
                  <option value="Tanah Sareal">Tanah Sareal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#101913] dark:text-[#F3F6F4] mb-1">
                Dinas / Instansi Rencana Pengampu
              </label>
              <select
                value={aspirationForm.responsibleAgency}
                onChange={(e) => setAspirationForm({ ...aspirationForm, responsibleAgency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#F7F5EF] dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] text-[#101913] dark:text-[#F3F6F4] focus:outline-none focus:border-[#1B4332]"
              >
                <option value="Dinas PUPR Kota Bogor">Dinas PUPR Kota Bogor</option>
                <option value="Dinas Perhubungan Kota Bogor">Dinas Perhubungan Kota Bogor</option>
                <option value="Dinas Lingkungan Hidup Kota Bogor">Dinas Lingkungan Hidup Kota Bogor</option>
                <option value="Dinas Kesehatan Kota Bogor">Dinas Kesehatan Kota Bogor</option>
                <option value="Dinas Pendidikan Kota Bogor">Dinas Pendidikan Kota Bogor</option>
                <option value="BPBD Kota Bogor">BPBD Kota Bogor</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#101913] dark:text-[#F3F6F4] mb-1">
                Deskripsi Masalah &amp; Usulan Solusi
              </label>
              <textarea
                required
                rows={3}
                value={aspirationForm.description}
                onChange={(e) => setAspirationForm({ ...aspirationForm, description: e.target.value })}
                placeholder="Jelaskan kondisi saat ini, lokasi spesifik, dan dampak positif bagi warga sekitar jika usulan ini direalisasikan..."
                className="w-full p-3 rounded-xl bg-[#F7F5EF] dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] text-[#101913] dark:text-[#F3F6F4] focus:outline-none focus:border-[#1B4332] resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsNewAspirationModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E3E0D6] dark:border-[#26352E] text-[#4F5A52] dark:text-[#9EACA3] font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] font-bold hover:bg-[#14352A] dark:hover:bg-[#34D399] transition-all shadow-sm cursor-pointer"
              >
                Kirim Usulan Aspirasi
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </main>
</>
);
};
