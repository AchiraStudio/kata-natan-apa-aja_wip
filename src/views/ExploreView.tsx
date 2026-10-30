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

export const ExploreView: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isAuthenticated } = useAuth();
  const { facilities, posts, openReportModal } = useTitik();
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

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
      <header className="lg:hidden h-14 bg-[#F7F6F1] dark:bg-[#131916] border-b border-[#E4E2DA] dark:border-[#26352E] px-4 flex items-center justify-between shrink-0 z-20">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          className="inline-flex items-center gap-1.5 text-xl font-black tracking-tight text-[#20221D] dark:text-[#F3F6F4]"
        >
          <span>TITIK</span>
          <span className="w-2 h-2 rounded-full bg-[#263F35] dark:bg-[#10B981]"></span>
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
            <Link to={'/u/' + profile.username} className="flex items-center" title={'Profil ' + profile.displayName}>
              <UserAvatar
                src={profile.avatarUrl}
                alt={profile.displayName}
                name={profile.displayName}
                role={profile.role}
                className="w-7 h-7 rounded-full object-cover border border-[#E4E2DA] dark:border-[#26352E]"
              />
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-2.5 py-1 rounded-xl bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] text-xs font-bold"
            >
              Masuk
            </Link>
          )}
        </div>
      </header>


      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto no-scrollbar p-4 lg:p-8 w-full max-w-6xl space-y-6 pb-24 lg:pb-12 min-w-0">
        {/* Header Hero Banner with Geometric Ribbons & Angled Slashes (-35deg) */}
        <div className="explore-hero-banner relative overflow-hidden rounded-3xl px-6 py-5 lg:px-8 lg:py-6 flex flex-wrap items-center justify-between gap-5 border border-[#263F35]/20 shadow-xs">
          {/* Geometric Angled Slashes Container */}
          <div className="explore-slashes-container" aria-hidden="true">
            <div className="explore-ambient-glow" />
            <div className="explore-ribbon explore-ribbon-1" />
            <div className="explore-ribbon explore-ribbon-2" />
            <div className="explore-slash-line explore-slash-1" />
            <div className="explore-slash-line explore-slash-2" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <h1 className="text-2xl lg:text-[28px] font-bold tracking-tight text-white leading-tight">
              Direktori Fasilitas & Wilayah Kota Bogor
            </h1>
            <p className="text-xs lg:text-sm text-[#E7EBDD]/90 mt-1 leading-relaxed">
              Telusuri fasilitas layanan publik, pantau laporan warga per sektor, dan periksa keterkaitan pagu APBD 2026.
            </p>
          </div>

          <button
            type="button"
            onClick={openReportModal}
            className="explore-pill-btn relative z-10 px-5 py-2.5 rounded-full bg-[#263F35] dark:bg-[#10B981] hover:bg-[#1D3129] dark:hover:bg-[#34D399] text-white dark:text-[#0A1610] border border-white/30 hover:border-white/60 text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 shrink-0"
          >
            <span>+ Laporkan Masalah</span>
          </button>
        </div>

        {/* Search & Integrated Civic Sector Filter Bar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-[#686B65] dark:text-[#9EACA3]" />
            <input
              type="text"
              placeholder="Cari nama fasilitas, jalan, kode referensi, atau dinas penanggung jawab..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="explore-search-input w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-full text-xs text-[#20221D] dark:text-[#F3F6F4] placeholder-[#686B65] dark:placeholder-[#6C7D73] focus:outline-none focus:border-[#263F35] dark:focus:border-[#10B981] shadow-xs transition-all"
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
                      ? 'bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] font-semibold shadow-xs'
                      : 'bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] hover:border-[#263F35]/30 dark:hover:border-[#10B981]/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{sector.name}</span>
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[11px] font-mono tabular-nums ${
                      isSelected
                        ? 'bg-white/20 dark:bg-[#0A1610]/20 text-white dark:text-[#0A1610] font-bold'
                        : 'bg-[#F7F6F1] dark:bg-[#131916] text-[#686B65] dark:text-[#9EACA3]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Registered Public Facilities Grid */}
        <section aria-labelledby="explore-facilities-heading">
          <div className="flex items-center justify-between mb-3">
            <h2
              id="explore-facilities-heading"
              className="text-xs font-bold uppercase tracking-wider text-[#686B65] dark:text-[#9EACA3] tabular-nums"
            >
              Fasilitas Terdaftar ({filteredFacilities.length})
            </h2>
            {selectedCategory !== 'Semua' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('Semua')}
                className="text-xs font-semibold text-[#263F35] dark:text-[#34D399] hover:underline cursor-pointer"
              >
                Tampilkan Semua Sektor
              </button>
            )}
          </div>

          {filteredFacilities.length === 0 ? (
            <div className="bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl p-6 text-center">
              <p className="text-xs text-[#686B65] dark:text-[#9EACA3]">
                Tidak ada fasilitas yang cocok dengan filter sektor atau kata kunci pencarian saat ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFacilities.map((f) => (
                <article
                  key={f.id}
                  className="explore-facility-card bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl p-5 shadow-xs hover:border-[#263F35]/40 dark:hover:border-[#10B981]/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#263F35] dark:text-[#34D399]">
                        {f.category}
                      </span>
                      <span
                        className={`text-[11px] font-mono tabular-nums font-semibold ${
                          f.activeReportsCount > 0
                            ? 'text-[#B45309] dark:text-amber-400'
                            : 'text-[#686B65] dark:text-[#9EACA3]'
                        }`}
                      >
                        {f.activeReportsCount} Laporan Aktif
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#20221D] dark:text-[#F3F6F4] leading-snug">
                      {f.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-[#686B65] dark:text-[#9EACA3]">
                      <MapPin className="w-3.5 h-3.5 text-[#263F35] dark:text-[#34D399] shrink-0" />
                      <span className="truncate">{f.address}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E4E2DA]/70 dark:border-[#26352E] flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#686B65] dark:text-[#9EACA3] text-[11px] truncate">
                      Instansi: <strong className="font-semibold text-[#20221D] dark:text-[#F3F6F4]">{f.responsibleAgency}</strong>
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-[#686B65] dark:text-[#9EACA3] shrink-0">
                      {f.resolvedReportsCount} Tuntas
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Recent Community Reports Filtered by Sector & Search */}
        <section className="pt-2" aria-labelledby="explore-reports-heading">
          <div className="flex items-center justify-between mb-3">
            <h2
              id="explore-reports-heading"
              className="text-xs font-bold uppercase tracking-wider text-[#686B65] dark:text-[#9EACA3] tabular-nums"
            >
              Laporan Komunitas Terbaru ({filteredReportPosts.length})
            </h2>
          </div>

          {filteredReportPosts.length === 0 ? (
            <div className="bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl p-6 text-center">
              <p className="text-xs text-[#686B65] dark:text-[#9EACA3]">
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
                    className="explore-incident-card group bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl overflow-hidden shadow-xs hover:border-[#263F35] dark:hover:border-[#10B981] transition-all cursor-pointer flex flex-col justify-between"
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
                          <span className="font-mono tabular-nums font-bold text-[#686B65] dark:text-[#9EACA3]">
                            {r.publicReference}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100/80 dark:bg-amber-950/60 text-[#92400E] dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80">
                            {formatStatusLabel(r.status)}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-[#20221D] dark:text-[#F3F6F4] line-clamp-1 group-hover:text-[#263F35] dark:group-hover:text-[#34D399] transition-colors">
                          {r.title}
                        </h3>
                        <p className="text-xs text-[#686B65] dark:text-[#9EACA3] line-clamp-2 leading-relaxed">
                          {r.description}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2 border-t border-[#E4E2DA]/60 dark:border-[#26352E] flex items-center justify-between text-[11px] text-[#686B65] dark:text-[#9EACA3]">
                      <span className="truncate max-w-[75%]">{r.location.city}</span>
                      <span className="inline-flex items-center gap-0.5 font-semibold text-[#263F35] dark:text-[#34D399] shrink-0">
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
