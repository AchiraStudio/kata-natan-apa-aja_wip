import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  GraduationCap,
  HeartPulse,
  Leaf,
  Building2,
  MapPin,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { useTitik } from '../context/TitikContext';
import { useAuth } from '../context/AuthContext';
import './ExploreView.css';

export const ExploreView: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isAuthenticated } = useAuth();
  const { facilities, posts, openReportModal } = useTitik();
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: 'Semua', icon: Compass },
    { name: 'Infrastruktur', icon: Building2 },
    { name: 'Lingkungan', icon: Leaf },
    { name: 'Pendidikan', icon: GraduationCap },
    { name: 'Kesehatan', icon: HeartPulse },
  ];

  const filteredFacilities = facilities.filter((f) => {
    const matchesCat = selectedCategory === 'Semua' || f.category === selectedCategory;
    const matchesQuery =
      !searchQuery ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="h-screen w-full max-w-[1680px] mx-auto bg-[#F7F6F1] dark:bg-[#0C100E] flex flex-col lg:flex-row overflow-hidden selection:bg-[#263F35] dark:selection:bg-[#10B981] selection:text-white dark:selection:text-[#0A1610]">
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
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
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

      {/* Left Navigation Hub */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto no-scrollbar p-4 lg:p-8 w-full max-w-6xl space-y-6 pb-24 lg:pb-12 min-w-0">
          {/* Header Hero Banner with Geometric Ribbons & Angled Slashes (-35deg) */}
          <div className="explore-hero-banner relative overflow-hidden rounded-3xl p-6 lg:p-8 flex flex-wrap items-center justify-between gap-6 border border-[#263F35]/20 shadow-xs">
            {/* Geometric Angled Slashes Container */}
            <div className="explore-slashes-container" aria-hidden="true">
              <div className="explore-ambient-glow" />
              <div className="explore-ribbon explore-ribbon-1" />
              <div className="explore-ribbon explore-ribbon-2" />
              <div className="explore-slash-line explore-slash-1" />
              <div className="explore-slash-line explore-slash-2" />
            </div>

            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[#E7EBDD] border border-white/20 text-xs font-semibold mb-2">
                <Compass className="w-3.5 h-3.5" />
                <span>Eksplorasi Fasilitas & Sektor Publik</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                Direktori Fasilitas & Wilayah Kota Bogor
              </h1>
              <p className="text-xs lg:text-sm text-[#E7EBDD]/90 mt-1.5 leading-relaxed">
                Temukan fasilitas publik, pantau laporan komunitas sekitar, dan kaitkan dengan pagu APBD 2026.
              </p>
            </div>

            <button
              type="button"
              onClick={openReportModal}
              className="explore-pill-btn relative z-10 px-5 py-3 rounded-full bg-[#263F35] dark:bg-[#10B981] hover:bg-[#1D3129] dark:hover:bg-[#34D399] text-white dark:text-[#0A1610] border border-white/30 hover:border-white/60 text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <span>+ Laporkan Masalah</span>
            </button>
          </div>

          {/* Search & Category Filter Pills */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-3.5 text-[#686B65] dark:text-[#9EACA3]" />
              <input
                type="text"
                placeholder="Cari nama fasilitas, jalan, atau dinas penanggung jawab..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="explore-search-input w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-full text-xs text-[#20221D] dark:text-[#F3F6F4] placeholder-[#686B65] dark:placeholder-[#6C7D73] focus:outline-none focus:border-[#263F35] dark:focus:border-[#10B981] shadow-xs transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {categories.map((c) => {
                const Icon = c.icon;
                const isSelected = selectedCategory === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedCategory(c.name)}
                    className={`explore-category-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] font-semibold shadow-xs'
                        : 'bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] hover:border-[#263F35]/30 dark:hover:border-[#10B981]/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Facilities Cards Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#686B65] dark:text-[#9EACA3] mb-3">
              Fasilitas Terdaftar ({filteredFacilities.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFacilities.map((f) => (
                <div
                  key={f.id}
                  className="explore-facility-card bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl p-5 shadow-xs hover:border-[#263F35]/40 dark:hover:border-[#10B981]/40 transition-all flex flex-col justify-between space-y-3.5"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E7EBDD] dark:bg-[#1A2E24] text-[#263F35] dark:text-[#34D399] font-semibold">
                        {f.category}
                      </span>
                      <span className="text-[#686B65] dark:text-[#9EACA3] font-mono">
                        {f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#20221D] dark:text-[#F3F6F4]">{f.name}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-[#686B65] dark:text-[#9EACA3] mt-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="truncate">{f.address}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E4E2DA]/60 dark:border-[#26352E] flex items-center justify-between text-xs">
                    <span className="text-[#686B65] dark:text-[#9EACA3] text-[11px] truncate">
                      Dinas: {f.responsibleAgency}
                    </span>
                    <span className="font-semibold text-[#263F35] dark:text-[#34D399] text-[11px] shrink-0">
                      {f.activeReportsCount} Laporan Aktif
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reports in this Category */}
          <div className="pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#686B65] dark:text-[#9EACA3] mb-3">
              Laporan Komunitas Terbaru
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((p) => {
                if (!p.relatedReport) return null;
                const r = p.relatedReport;
                return (
                  <a
                    key={p.id}
                    href={`/report/${r.id}`}
                    className="explore-incident-card bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl overflow-hidden shadow-xs hover:border-[#263F35] dark:hover:border-[#10B981] transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <img
                      src={r.mediaUrls[0]}
                      alt={r.title}
                      className="w-full h-36 object-cover"
                    />
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-[#686B65] dark:text-[#9EACA3]">
                          {r.publicReference}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-[#92400E] dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                          {r.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-[#20221D] dark:text-[#F3F6F4] line-clamp-1">{r.title}</h4>
                      <p className="text-[11px] text-[#686B65] dark:text-[#9EACA3] line-clamp-2">{r.description}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </main>
      <BottomNav />
    </div>
  );
};
