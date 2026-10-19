import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, ArrowRight } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { useTitik } from '../context/TitikContext';
import { Report, Facility } from '../types/domain';
import './MapView.css';

export const MapView: React.FC = () => {
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
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center of Kota Bogor
    const map = L.map(mapContainerRef.current, {
      center: [-6.595038, 106.790422],
      zoom: 13,
      zoomControl: true,
    });

    // High performance, clean civic cartography tiles (resolves OSM 403 access blocked)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
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
    <div className="h-screen w-full bg-[#F7F6F1] flex flex-col lg:flex-row overflow-hidden selection:bg-[#263F35] selection:text-white">
      {/* Mobile Top Header */}
      <header className="lg:hidden h-14 bg-[#F7F6F1] border-b border-[#E4E2DA] px-4 flex items-center justify-between shrink-0 z-20">
        <a href="/" className="inline-flex items-center gap-1.5 text-xl font-black tracking-tight text-[#20221D]">
          <span>TITIK</span>
          <span className="w-2 h-2 rounded-full bg-[#263F35]"></span>
        </a>
        <div className="flex items-center gap-2">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
            alt="Avatar"
            className="w-7 h-7 rounded-full object-cover border border-[#E4E2DA]"
          />
        </div>
      </header>

      {/* Left Navigation Hub */}
      <Sidebar currentPath="/map" />

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
          <div className="map-viewport-card relative flex-1 min-h-[500px] w-full rounded-3xl overflow-hidden border border-[#E4E2DA] shadow-xs">
            <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>

            {/* Entity Detail Overlay Drawer */}
            {selectedEntity && (
              <div className="map-entity-sheet absolute bottom-0 left-0 right-0 sm:bottom-4 sm:left-auto sm:right-4 sm:w-96 z-10 bg-white/95 backdrop-blur-md border border-[#E4E2DA] rounded-t-[36px] sm:rounded-3xl p-5 shadow-xl space-y-3.5 animate-fade-in">
                {selectedEntity.type === 'report' ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#686B65]">
                        {selectedEntity.data.publicReference}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-[#92400E]">
                        {selectedEntity.data.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[#20221D]">{selectedEntity.data.title}</h3>
                    <p className="text-xs text-[#686B65] line-clamp-2">
                      {selectedEntity.data.description}
                    </p>
                    <div className="pt-2 flex items-center justify-between">
                      <a
                        href={`/report/${selectedEntity.data.id}`}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#263F35] hover:underline"
                      >
                        <span>Lihat Laporan & APBD</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setSelectedEntity(null)}
                        className="px-3 py-1 rounded-full border border-[#E4E2DA] text-xs font-semibold text-[#686B65] hover:text-[#20221D] transition-colors cursor-pointer"
                      >
                        Tutup
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E7EBDD] text-[#263F35] font-semibold">
                        {selectedEntity.data.category}
                      </span>
                      <span className="text-xs text-[#686B65]">
                        {selectedEntity.data.activeReportsCount} Laporan
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[#20221D]">{selectedEntity.data.name}</h3>
                    <p className="text-xs text-[#686B65]">{selectedEntity.data.address}</p>
                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={openReportModal}
                        className="px-4 py-2 bg-[#263F35] hover:bg-[#1D3129] text-white rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        + Laporkan Fasilitas Ini
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedEntity(null)}
                        className="px-3 py-1 rounded-full border border-[#E4E2DA] text-xs font-semibold text-[#686B65] hover:text-[#20221D] transition-colors cursor-pointer"
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
