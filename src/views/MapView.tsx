import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { MapPin, ArrowRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { useTitik } from '../context/TitikContext';
import { useAuth } from '../context/AuthContext';
import { Report, Facility } from '../types/domain';
import { createCivicTileLayer } from '../utils/mapTiles';
import './MapView.css';

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

      {/* Main Full-Height Geospatial Map Viewport */}
      <main className="flex-1 h-screen overflow-hidden p-4 lg:p-6 w-full flex flex-col space-y-4 pb-20 lg:pb-6 min-w-0">
          {/* Header Banner with Subtle Geometric Ribbons & Angled Slashes (-35deg) */}
          <div className="map-hero-banner relative overflow-hidden rounded-2xl lg:rounded-3xl p-4 lg:px-6 lg:py-5 flex flex-wrap items-center justify-between gap-4 border border-[#263F35]/20 shadow-xs">
            {/* Geometric Angled Slashes Container */}
            <div className="map-slashes-container" aria-hidden="true">
              <div className="map-ambient-glow" />
              <div className="map-ribbon map-ribbon-1" />
              <div className="map-ribbon map-ribbon-2" />
              <div className="map-slash-line map-slash-1" />
              <div className="map-slash-line map-slash-2" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[#E7EBDD] border border-white/20 text-xs font-semibold mb-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Peta Geospasial Observatorium</span>
              </div>
              <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Peta Titik Infrastruktur Publik</h1>
              <p className="text-xs text-[#E7EBDD]/80 mt-0.5">Pemantauan titik laporan warga dan persebaran fasilitas publik Kota Bogor</p>
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`map-filter-chip px-3.5 py-1.5 rounded-full border transition-all cursor-pointer font-medium ${
                  filterType === 'all'
                    ? 'bg-white text-[#263F35] border-white font-bold shadow-xs'
                    : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'
                }`}
              >
                Semua Titik
              </button>

              <button
                type="button"
                onClick={() => setFilterType('reports')}
                className={`map-filter-chip px-3.5 py-1.5 rounded-full border transition-all cursor-pointer font-medium ${
                  filterType === 'reports'
                    ? 'bg-[#DC2626] text-white border-[#DC2626] font-bold shadow-xs'
                    : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'
                }`}
              >
                Laporan Warga (!)
              </button>

              <button
                type="button"
                onClick={() => setFilterType('facilities')}
                className={`map-filter-chip px-3.5 py-1.5 rounded-full border transition-all cursor-pointer font-medium ${
                  filterType === 'facilities'
                    ? 'bg-[#E7EBDD] text-[#263F35] border-[#E7EBDD] font-bold shadow-xs'
                    : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'
                }`}
              >
                Fasilitas Publik (F)
              </button>
            </div>
          </div>

          {/* Map Viewport & Overlay Inspector */}
          <div className="map-viewport-card relative flex-1 min-h-[500px] w-full rounded-3xl overflow-hidden border border-[#E4E2DA] dark:border-[#26352E] shadow-xs">
            <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>

            {/* Entity Detail Overlay Drawer */}
            {selectedEntity && (
              <div className="map-entity-sheet absolute bottom-0 left-0 right-0 sm:bottom-4 sm:left-auto sm:right-4 sm:w-96 z-10 bg-white/95 dark:bg-[#1A221E]/95 backdrop-blur-md border border-[#E4E2DA] dark:border-[#26352E] rounded-t-[36px] sm:rounded-3xl p-5 shadow-xl space-y-3.5 animate-fade-in">
                {selectedEntity.type === 'report' ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#686B65] dark:text-[#9EACA3]">
                        {selectedEntity.data.publicReference}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-[#92400E] dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                        {selectedEntity.data.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[#20221D] dark:text-[#F3F6F4]">{selectedEntity.data.title}</h3>
                    <p className="text-xs text-[#686B65] dark:text-[#9EACA3] line-clamp-2">
                      {selectedEntity.data.description}
                    </p>
                    <div className="pt-2 flex items-center justify-between">
                      <a
                        href={`/report/${selectedEntity.data.id}`}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#263F35] dark:text-[#34D399] hover:underline"
                      >
                        <span>Lihat Laporan & APBD</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setSelectedEntity(null)}
                        className="px-3 py-1 rounded-full border border-[#E4E2DA] dark:border-[#26352E] text-xs font-semibold text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] hover:bg-[#F7F6F1] dark:hover:bg-[#131916] transition-colors cursor-pointer"
                      >
                        Tutup
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E7EBDD] dark:bg-[#1A2E24] text-[#263F35] dark:text-[#34D399] font-semibold">
                        {selectedEntity.data.category}
                      </span>
                      <span className="text-xs text-[#686B65] dark:text-[#9EACA3]">
                        {selectedEntity.data.activeReportsCount} Laporan
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[#20221D] dark:text-[#F3F6F4]">{selectedEntity.data.name}</h3>
                    <p className="text-xs text-[#686B65] dark:text-[#9EACA3]">{selectedEntity.data.address}</p>
                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={openReportModal}
                        className="px-4 py-2 bg-[#263F35] dark:bg-[#10B981] hover:bg-[#1D3129] dark:hover:bg-[#34D399] text-white dark:text-[#0A1610] rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        + Laporkan Fasilitas Ini
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedEntity(null)}
                        className="px-3 py-1 rounded-full border border-[#E4E2DA] dark:border-[#26352E] text-xs font-semibold text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] hover:bg-[#F7F6F1] dark:hover:bg-[#131916] transition-colors cursor-pointer"
                      >
                        Tutup
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      <BottomNav />
    </div>
  );
};
