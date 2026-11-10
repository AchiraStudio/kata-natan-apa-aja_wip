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

    // Center of Jabodetabek
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


      {/* Main Full-Height Geospatial Map Viewport */}
      <main className="flex-1 min-w-0 w-full h-[calc(100dvh-3.5rem)] lg:h-screen overflow-hidden p-4 lg:p-6 flex flex-col gap-3 pb-24 lg:pb-6">
        {/* Compact Header Banner with Subtle Geometric Ribbons & Angled Slashes (-35deg) */}
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Geometric Angled Slashes Container */}

          <div className="relative z-10">
            <h1 className="text-xl lg:text-2xl font-bold text-ink leading-snug">
              Peta Titik Infrastruktur Publik
            </h1>
            <p className="text-sm text-ink-2 mt-0.5">
              Laporan warga dan fasilitas publik di Jabodetabek, lengkap dengan lokasinya.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-2 text-xs" role="tablist" aria-label="Filter Lapisan Peta">
            <button
              type="button"
              role="tab"
              aria-selected={filterType === 'all'}
              onClick={() => setFilterType('all')}
              className={`map-filter-chip px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer font-medium tabular-nums ${
                filterType === 'all'
                  ? 'bg-ink text-on-ink border-ink font-semibold'
                  : 'bg-surface-2 text-ink-2 border-transparent hover:text-ink'
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
              className={`map-filter-chip px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer font-medium tabular-nums ${
                filterType === 'reports'
                  ? 'bg-ink text-on-ink border-ink font-semibold'
                  : 'bg-surface-2 text-ink-2 border-transparent hover:text-ink'
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
              className={`map-filter-chip px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer font-medium tabular-nums ${
                filterType === 'facilities'
                  ? 'bg-ink text-on-ink border-ink font-semibold'
                  : 'bg-surface-2 text-ink-2 border-transparent hover:text-ink'
              }`}
            >
              <span>Fasilitas Publik</span>
              <span className="font-mono text-[11px] opacity-85">({facilities.length})</span>
            </button>
          </div>
        </div>

        {/* Map Viewport & Overlay Inspector */}
        <div className="map-viewport-card relative flex-1 min-h-[500px] w-full rounded-3xl overflow-hidden border border-line shadow-xs">
          <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>

          {/* Floating Entity Inspector Sheet */}
          {selectedEntity && (
            <aside
              aria-label="Inspektor Titik Peta"
              className="map-entity-sheet absolute bottom-0 left-0 right-0 sm:bottom-4 sm:left-auto sm:right-4 sm:w-[400px] z-10 bg-surface/95 backdrop-blur-md border border-line rounded-t-[36px] sm:rounded-3xl p-5 shadow-xl space-y-3.5 animate-fade-in"
            >
              {selectedEntity.type === 'report' ? (
                <>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums font-bold text-ink">
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
                      className="p-1 rounded-full text-ink-2 hover:text-ink hover:bg-canvas dark:hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base text-ink leading-snug">
                      {selectedEntity.data.title}
                    </h3>
                    <p className="text-xs text-ink-2 line-clamp-2 leading-relaxed">
                      {selectedEntity.data.description}
                    </p>
                  </div>

                  <div className="py-2.5 px-3 rounded-2xl bg-canvas dark:bg-surface-2 border border-line/70 dark:border-line space-y-1 text-[11px]">
                    <div className="flex items-center gap-1.5 text-ink font-medium truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                      <span className="truncate">{selectedEntity.data.location.address}, {selectedEntity.data.location.city}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-ink-2 truncate">
                      <Building2 className="w-3.5 h-3.5 text-brand shrink-0" />
                      <span className="truncate">{selectedEntity.data.responsibleAgency}</span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between gap-3">
                    <Link
                      to={`/report/${selectedEntity.data.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand hover:bg-brand-hover dark:hover:bg-brand text-on-brand text-xs font-bold transition-colors shadow-xs"
                    >
                      <span>Lihat Laporan & APBD</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSelectedEntity(null)}
                      className="px-3.5 py-1.5 rounded-full border border-line text-xs font-semibold text-ink-2 hover:text-ink hover:bg-canvas dark:hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-soft text-brand font-semibold">
                        {selectedEntity.data.category}
                      </span>
                      <span className="font-mono tabular-nums text-[11px] font-semibold text-ink-2">
                        {selectedEntity.data.activeReportsCount} Laporan Aktif
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedEntity(null)}
                      aria-label="Tutup detail fasilitas"
                      className="p-1 rounded-full text-ink-2 hover:text-ink hover:bg-canvas dark:hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-ink leading-snug">
                      {selectedEntity.data.name}
                    </h3>
                    <p className="text-xs text-ink-2">
                      {selectedEntity.data.address}
                    </p>
                  </div>

                  <div className="py-2.5 px-3 rounded-2xl bg-canvas dark:bg-surface-2 border border-line/70 dark:border-line flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-ink-2 truncate">
                      <Building2 className="w-3.5 h-3.5 text-brand shrink-0" />
                      <span className="truncate">{selectedEntity.data.responsibleAgency}</span>
                    </div>
                    <span className="font-mono tabular-nums font-semibold text-brand shrink-0">
                      {selectedEntity.data.resolvedReportsCount} Tuntas
                    </span>
                  </div>

                  <div className="pt-1 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={openReportModal}
                      className="px-4 py-2 bg-brand hover:bg-brand-hover dark:hover:bg-brand text-on-brand rounded-full text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      + Laporkan Fasilitas Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedEntity(null)}
                      className="px-3.5 py-1.5 rounded-full border border-line text-xs font-semibold text-ink-2 hover:text-ink hover:bg-canvas dark:hover:bg-surface-2 transition-colors cursor-pointer"
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
