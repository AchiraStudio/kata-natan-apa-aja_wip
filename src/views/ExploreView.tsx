import React, { useMemo, useState } from 'react';
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
  Activity,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useTitik } from '../context/TitikContext';
import { useAuth } from '../context/AuthContext';
import { Facility, Report } from '../types/domain';
import { UserAvatar } from '../components/common/UserAvatar';
import './ExploreView.css';

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

const FACILITY_PHOTOS: Record<string, string> = {
  'fac-01': 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
  'fac-02': 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=600&q=80',
  'fac-03': 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=600&q=80',
  'fac-04': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=600&q=80',
};

export const ExploreView: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isAuthenticated } = useAuth();
  const { facilities, posts, openReportModal } = useTitik();
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  const filteredReportPosts = useMemo(
    () =>
      posts.filter((p) => {
        if (!p.relatedReport) return false;
        const r = p.relatedReport;
        const matchesCat = matchesReportSector(r, selectedCategory);
        const matchesQuery =
          !normalizedQuery ||
          r.title.toLowerCase().includes(normalizedQuery) ||
          r.description.toLowerCase().includes(normalizedQuery) ||
          r.publicReference.toLowerCase().includes(normalizedQuery) ||
          r.responsibleAgency.toLowerCase().includes(normalizedQuery) ||
          r.location.address.toLowerCase().includes(normalizedQuery) ||
          (r.facilityName && r.facilityName.toLowerCase().includes(normalizedQuery));
        return matchesCat && matchesQuery;
      }),
    [posts, selectedCategory, normalizedQuery]
  );

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
          {isAuthenticated && profile.role === 'admin' && (
            <Link
              to="/admin"
              className="p-1.5 rounded-full bg-amber-600/90 text-amber-100 hover:text-white transition-colors cursor-pointer"
              title="Portal Admin PUPR"
              aria-label="Portal Admin"
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
                11 Titik
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#F7F5EF] dark:bg-[#111714] border border-[#E3E0D6]/60 dark:border-[#222E28]">
              <div className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3] font-semibold">Ditindak Hari Ini</div>
              <div className="text-base sm:text-lg font-black text-[#2E5E8C] dark:text-sky-400 font-mono tabular-nums mt-0.5">
                3 Titik
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#F7F5EF] dark:bg-[#111714] border border-[#E3E0D6]/60 dark:border-[#222E28]">
              <div className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#2D6A4F]" />
                <span>Tuntas Pekan Ini</span>
              </div>
              <div className="text-base sm:text-lg font-black text-[#2D6A4F] dark:text-emerald-400 font-mono tabular-nums mt-0.5">
                19 Titik
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

        {/* Search & Integrated Civic Sector Filter Bar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-[#4F5A52] dark:text-[#9EACA3]" />
            <input
              type="text"
              placeholder="Cari nama fasilitas, jalan, kode referensi, atau dinas penanggung jawab..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="explore-search-input w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-full text-xs text-[#101913] dark:text-[#F3F6F4] placeholder-[#4F5A52] dark:placeholder-[#6C7D73] focus:outline-none focus:border-[#1B4332] dark:focus:border-[#10B981] shadow-xs transition-all"
            />
          </div>

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
        </div>

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
                  FACILITY_PHOTOS[f.id] ||
                  'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=600&q=80';

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
      </main>
    </>
  );
};
