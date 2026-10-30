import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import L from 'leaflet';
import { MapPin, ArrowRight, ShieldAlert, Building2, X } from 'lucide-react';
import { useTitik } from '../context/TitikContext';
import { useAuth } from '../context/AuthContext';
import { Report, Facility } from '../types/domain';
import { createCivicTileLayer } from '../utils/mapTiles';
import { UserAvatar } from '../components/common/UserAvatar';
import './MapView.css';

function formatReportStatusLabel(status: Report['status']): string {
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

export const MapView: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isAuthenticated } = useAuth();
  const { posts, facilities, openReportModal } = useTitik();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [selectedEntity, setSelectedEntity] = useState<
    { type: 'report'; data: Report } | { type: 'facility'; data: Facility } | null
  >(null);
  const [filterType, setFilterType] = useState<'all' | 'reports' | 'facilities'>('all');

  const reports = posts.map((p) => p.relatedReport).filter((r): r is Report => Boolean(r));
  const totalPoints = reports.length + facilities.length;

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Guard against Leaflet container reuse in React SPA transitions
    const container = mapContainerRef.current as HTMLElement & { _leaflet_id?: number | null };
    if (container._leaflet_id) {
      delete container._leaflet_id;
    }

    // Center of Kota Bogor
    const map = L.map(mapContainerRef.current, {
      center: [-6.595038, 106.790422],
      zoom: 13,
      zoomControl: true,
    });

    // High performance, clean civic cartography tiles with automatic fallback
    createCivicTileLayer(L).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers based on Filters
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Custom Icon Generator with dedicated CSS classes (Zero Raw Inline Styles)
    const createCustomIcon = (variant: 'report' | 'facility', label: string) =>
      L.divIcon({
        className: 'custom-map-pin',
        html: `<div class="map-pin-badge map-pin-badge--${variant}">${label}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

    // Add Report Markers (Red '!')
    if (filterType === 'all' || filterType === 'reports') {
      reports.forEach((r) => {
        const marker = L.marker([r.location.latitude, r.location.longitude], {
          icon: createCustomIcon('report', '!'),
        }).addTo(map);

        marker.on('click', () => {
          setSelectedEntity({ type: 'report', data: r });
        });
      });
    }

    // Add Facility Markers (Forest Green 'F')
    if (filterType === 'all' || filterType === 'facilities') {
      facilities.forEach((f) => {
        const marker = L.marker([f.latitude, f.longitude], {
          icon: createCustomIcon('facility', 'F'),
        }).addTo(map);

        marker.on('click', () => {
          setSelectedEntity({ type: 'facility', data: f });
        });
      });
    }
  }, [reports, facilities, filterType]);

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


      {/* Main Full-Height Geospatial Map Viewport */}
      <main className="flex-1 h-screen overflow-hidden p-4 lg:p-6 w-full flex flex-col space-y-3.5 pb-20 lg:pb-6 min-w-0">
        {/* Compact Header Banner with Subtle Geometric Ribbons & Angled Slashes (-35deg) */}
        <div className="map-hero-banner relative overflow-hidden rounded-2xl lg:rounded-3xl px-4 py-3.5 lg:px-6 lg:py-4 flex flex-wrap items-center justify-between gap-3 border border-[#263F35]/20 shadow-xs shrink-0">
          {/* Geometric Angled Slashes Container */}
          <div className="map-slashes-container" aria-hidden="true">
            <div className="map-ambient-glow" />
            <div className="map-ribbon map-ribbon-1" />
            <div className="map-ribbon map-ribbon-2" />
            <div className="map-slash-line map-slash-1" />
            <div className="map-slash-line map-slash-2" />
          </div>

          <div className="relative z-10">
            <h1 className="text-lg lg:text-xl font-bold text-white tracking-tight leading-snug">
              Peta Titik Infrastruktur Publik
            </h1>
            <p className="text-xs text-[#E7EBDD]/85 mt-0.5">
              Pemantauan geospasial laporan warga dan persebaran fasilitas publik wilayah Jabodetabek.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-2 text-xs" role="tablist" aria-label="Filter Lapisan Peta">
            <button
              type="button"
              role="tab"
              aria-selected={filterType === 'all'}
              onClick={() => setFilterType('all')}
              className={`map-filter-chip px-3.5 py-1.5 rounded-full border transition-all cursor-pointer font-medium tabular-nums ${
                filterType === 'all'
                  ? 'bg-white text-[#263F35] border-white font-bold shadow-xs'
                  : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'
              }`}
            >
              <span>Semua Titik</span>
              <span className="font-mono text-[11px] opacity-85">({totalPoints})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filterType === 'reports'}
              onClick={() => setFilterType('reports')}
              className={`map-filter-chip px-3.5 py-1.5 rounded-full border transition-all cursor-pointer font-medium tabular-nums ${
                filterType === 'reports'
                  ? 'bg-[#DC2626] text-white border-[#DC2626] font-bold shadow-xs'
                  : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'
              }`}
            >
              <span>Laporan Warga</span>
              <span className="font-mono text-[11px] opacity-90">({reports.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filterType === 'facilities'}
              onClick={() => setFilterType('facilities')}
              className={`map-filter-chip px-3.5 py-1.5 rounded-full border transition-all cursor-pointer font-medium tabular-nums ${
                filterType === 'facilities'
                  ? 'bg-[#E7EBDD] text-[#263F35] border-[#E7EBDD] font-bold shadow-xs'
                  : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'
              }`}
            >
              <span>Fasilitas Publik</span>
              <span className="font-mono text-[11px] opacity-85">({facilities.length})</span>
            </button>
          </div>
        </div>

        {/* Map Viewport & Overlay Inspector */}
        <div className="map-viewport-card relative flex-1 min-h-[500px] w-full rounded-3xl overflow-hidden border border-[#E4E2DA] dark:border-[#26352E] shadow-xs">
          <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>

          {/* Floating Entity Inspector Sheet */}
          {selectedEntity && (
            <aside
              aria-label="Inspektor Titik Peta"
              className="map-entity-sheet absolute bottom-0 left-0 right-0 sm:bottom-4 sm:left-auto sm:right-4 sm:w-[400px] z-10 bg-white/95 dark:bg-[#1A221E]/95 backdrop-blur-md border border-[#E4E2DA] dark:border-[#26352E] rounded-t-[36px] sm:rounded-3xl p-5 shadow-xl space-y-3.5 animate-fade-in"
            >
              {selectedEntity.type === 'report' ? (
                <>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums font-bold text-[#20221D] dark:text-[#F3F6F4]">
                        {selectedEntity.data.publicReference}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-[#92400E] dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                        {formatReportStatusLabel(selectedEntity.data.status)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedEntity(null)}
                      aria-label="Tutup detail titik"
                      className="p-1 rounded-full text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] hover:bg-[#F7F6F1] dark:hover:bg-[#131916] transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base text-[#20221D] dark:text-[#F3F6F4] leading-snug">
                      {selectedEntity.data.title}
                    </h3>
                    <p className="text-xs text-[#686B65] dark:text-[#9EACA3] line-clamp-2 leading-relaxed">
                      {selectedEntity.data.description}
                    </p>
                  </div>

                  <div className="py-2.5 px-3 rounded-2xl bg-[#F7F6F1] dark:bg-[#131916] border border-[#E4E2DA]/70 dark:border-[#26352E] space-y-1 text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#20221D] dark:text-[#F3F6F4] font-medium truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                      <span className="truncate">{selectedEntity.data.location.address}, {selectedEntity.data.location.city}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#686B65] dark:text-[#9EACA3] truncate">
                      <Building2 className="w-3.5 h-3.5 text-[#263F35] dark:text-[#34D399] shrink-0" />
                      <span className="truncate">{selectedEntity.data.responsibleAgency}</span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between gap-3">
                    <Link
                      to={`/report/${selectedEntity.data.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#263F35] dark:bg-[#10B981] hover:bg-[#1D3129] dark:hover:bg-[#34D399] text-white dark:text-[#0A1610] text-xs font-bold transition-colors shadow-xs"
                    >
                      <span>Lihat Laporan & APBD</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSelectedEntity(null)}
                      className="px-3.5 py-1.5 rounded-full border border-[#E4E2DA] dark:border-[#26352E] text-xs font-semibold text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] hover:bg-[#F7F6F1] dark:hover:bg-[#131916] transition-colors cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E7EBDD] dark:bg-[#1A2E24] text-[#263F35] dark:text-[#34D399] font-semibold">
                        {selectedEntity.data.category}
                      </span>
                      <span className="font-mono tabular-nums text-[11px] font-semibold text-[#686B65] dark:text-[#9EACA3]">
                        {selectedEntity.data.activeReportsCount} Laporan Aktif
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedEntity(null)}
                      aria-label="Tutup detail fasilitas"
                      className="p-1 rounded-full text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] hover:bg-[#F7F6F1] dark:hover:bg-[#131916] transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-[#20221D] dark:text-[#F3F6F4] leading-snug">
                      {selectedEntity.data.name}
                    </h3>
                    <p className="text-xs text-[#686B65] dark:text-[#9EACA3]">
                      {selectedEntity.data.address}
                    </p>
                  </div>

                  <div className="py-2.5 px-3 rounded-2xl bg-[#F7F6F1] dark:bg-[#131916] border border-[#E4E2DA]/70 dark:border-[#26352E] flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#686B65] dark:text-[#9EACA3] truncate">
                      <Building2 className="w-3.5 h-3.5 text-[#263F35] dark:text-[#34D399] shrink-0" />
                      <span className="truncate">{selectedEntity.data.responsibleAgency}</span>
                    </div>
                    <span className="font-mono tabular-nums font-semibold text-[#263F35] dark:text-[#34D399] shrink-0">
                      {selectedEntity.data.resolvedReportsCount} Tuntas
                    </span>
                  </div>

                  <div className="pt-1 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={openReportModal}
                      className="px-4 py-2 bg-[#263F35] dark:bg-[#10B981] hover:bg-[#1D3129] dark:hover:bg-[#34D399] text-white dark:text-[#0A1610] rounded-full text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      + Laporkan Fasilitas Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedEntity(null)}
                      className="px-3.5 py-1.5 rounded-full border border-[#E4E2DA] dark:border-[#26352E] text-xs font-semibold text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] hover:bg-[#F7F6F1] dark:hover:bg-[#131916] transition-colors cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </>
              )}
            </aside>
          )}
        </div>
      </main>
    </>
  );
};
