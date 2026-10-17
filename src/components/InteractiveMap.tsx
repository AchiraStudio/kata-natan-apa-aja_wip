import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useTitik } from '../context/TitikContext';
import { OfflineMapFallback } from './OfflineMapFallback';
import { Layers, MapPin } from 'lucide-react';

export const InteractiveMap: React.FC = () => {
  const [mapMode, setMapMode] = useState<'LEAFLET' | 'SVG'>('LEAFLET');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const rawCartoKey = import.meta.env.VITE_CARTO_API_KEY;
  const cartoApiKey = typeof rawCartoKey === 'string'
    ? rawCartoKey.replace(/['";]/g, '').trim()
    : undefined;
  const rawCartoStyle = import.meta.env.VITE_CARTO_STYLE;
  const cartoStyle = typeof rawCartoStyle === 'string' && rawCartoStyle.trim()
    ? rawCartoStyle.trim()
    : 'light_all';
  const mapTilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY?.trim();

  const { 
    facilities, 
    budgetProjects, 
    reports, 
    selectedSubdistrict, 
    selectedSector, 
    pinFilter,
    setSelectedFacility,
    setSelectedReport,
    setSelectedProject,
    selectedFacility,
    selectedReport,
    theme
  } = useTitik();

  // Initialize Map
  useEffect(() => {
    if (mapMode !== 'LEAFLET') return;
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      try {
        const map = L.map(mapContainerRef.current, {
          center: [-6.35, 106.8],
          zoom: 9,
          zoomControl: false,
          attributionControl: false
        });

        // Dynamic CARTO style: Dark Matter in dark mode, Positron in light mode
        const activeStyle = theme === 'dark' ? 'dark_all' : cartoStyle;
        let tileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/${activeStyle}/{z}/{x}/{y}{r}.png`;
        let tileAttribution = '© OpenStreetMap contributors, © CARTO';

        if (cartoApiKey) {
          tileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/${activeStyle}/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoApiKey)}`;
        } else if (mapTilerApiKey) {
          tileUrl = `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${encodeURIComponent(mapTilerApiKey)}`;
          tileAttribution = '© MapTiler, © OpenStreetMap contributors';
        }

        const layer = L.tileLayer(tileUrl, {
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);

        tileLayerRef.current = layer;

        // Attribution
        L.control.attribution({ position: 'bottomright', prefix: `${tileAttribution} • TITIK. SIKD` }).addTo(map);

        // Zoom control
        L.control.zoom({ position: 'topright' }).addTo(map);

        markersLayerRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
      } catch (err) {
        console.warn('Leaflet initialization failed, switching to SVG fallback', err);
        setMapMode('SVG');
      }
    }

    return () => {
      // Map cleanup on unmount or switch
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapMode]);

  // Update Tile Layer dynamically when Theme changes
  useEffect(() => {
    if (mapMode !== 'LEAFLET' || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const activeStyle = theme === 'dark' ? 'dark_all' : cartoStyle;

    let tileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/${activeStyle}/{z}/{x}/{y}{r}.png`;
    if (cartoApiKey) {
      tileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/${activeStyle}/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoApiKey)}`;
    } else if (mapTilerApiKey) {
      tileUrl = `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${encodeURIComponent(mapTilerApiKey)}`;
    }

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [theme, cartoStyle, cartoApiKey, mapTilerApiKey, mapMode]);

  // Update Markers when filters or data change
  useEffect(() => {
    if (mapMode !== 'LEAFLET') return;
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // 1. Facility Markers (Cobalt)
    if (pinFilter === 'ALL' || pinFilter === 'FACILITY') {
      facilities.forEach(fac => {
        if (selectedSubdistrict !== 'Semua' && fac.subdistrict !== selectedSubdistrict) return;
        if (selectedSector !== 'Semua' && fac.sector !== selectedSector) return;

        const isSelected = selectedFacility?.id === fac.id;

        const iconHtml = `
          <div class="map-pin-base map-pin-facility ${isSelected ? 'w-[38px] h-[38px] scale-110' : 'w-[30px] h-[30px]'}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21h18"/>
              <path d="M5 21V7l8-4v18"/>
              <path d="M19 21V11l-6-4"/>
              <path d="M9 9v.01"/>
              <path d="M9 13v.01"/>
              <path d="M9 17v.01"/>
            </svg>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'titik-custom-marker-facility',
          html: iconHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -18]
        });

        const marker = L.marker(fac.coordinates, { icon: customIcon });
        
        marker.bindPopup(`
          <div class="map-popup-card">
            <div class="map-popup-badge-facility">
              Fasilitas Publik • ${fac.sector}
            </div>
            <div class="map-popup-title">
              ${fac.name}
            </div>
            <div class="map-popup-address">
              ${fac.address}
            </div>
            <div class="map-popup-footer">
              <span class="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">Kondisi: <strong>${fac.condition}</strong></span>
              <span class="text-[11px] font-bold text-[#111827] dark:text-[#F9FAFB]">${fac.activeReportsCount} Laporan</span>
            </div>
          </div>
        `);

        marker.on('click', () => {
          setSelectedFacility(fac);
          setSelectedReport(null);
          setSelectedProject(null);
        });

        markersLayer.addLayer(marker);
      });
    }

    // 2. Citizen Report Markers (Terracotta Crimson / Emerald if completed)
    if (pinFilter === 'ALL' || pinFilter === 'REPORT') {
      reports.forEach(rep => {
        if (selectedSubdistrict !== 'Semua' && rep.subdistrict !== selectedSubdistrict) return;
        if (selectedSector !== 'Semua' && rep.sector !== selectedSector) return;

        const isCompleted = rep.currentStep === 6;
        const color = isCompleted ? '#0D9488' : '#DC2626';
        const isSelected = selectedReport?.id === rep.id;

        const iconHtml = `
          <div class="map-pin-base ${isCompleted ? 'map-pin-report-green' : 'map-pin-report-urgent'} ${isSelected ? 'w-[36px] h-[36px] scale-110' : 'w-[28px] h-[28px]'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              ${isCompleted 
                ? '<path d="M20 6L9 17l-5-5"/>'
                : '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>'
              }
            </svg>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'titik-custom-marker-report',
          html: iconHtml,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -18]
        });

        const marker = L.marker(rep.coordinates, { icon: customIcon });

        marker.bindPopup(`
          <div class="map-popup-card">
            <div class="map-popup-badge-report ${isCompleted ? 'text-[#0D9488]' : 'text-[#DC2626]'}">
              ${isCompleted ? 'Tuntas Terverifikasi' : 'Titik Masalah Warga'}
            </div>
            <div class="map-popup-title">
              ${rep.title}
            </div>
            <div class="map-popup-desc">
              Oleh: ${rep.reporterHandle && rep.reporterHandle !== 'warga_terverifikasi' ? '@' + rep.reporterHandle : 'Warga Terverifikasi'} • ${isCompleted ? 'Tuntas Terverifikasi' : 'Dalam Peninjauan'}
            </div>
            <div class="map-popup-footer">
              <span class="text-[11px] font-bold text-[#111827] dark:text-[#F9FAFB]">${rep.priorityVotes} Suara Prioritas</span>
              <span class="text-[10px] text-[#2563EB] dark:text-[#60A5FA]">Lihat Audit &rarr;</span>
            </div>
          </div>
        `);

        marker.on('click', () => {
          setSelectedReport(rep);
          setSelectedFacility(null);
          setSelectedProject(null);
        });

        markersLayer.addLayer(marker);
      });
    }

    // 3. Active Project Pins (Amber)
    if (pinFilter === 'ALL' || pinFilter === 'PROJECT') {
      budgetProjects.forEach(prj => {
        if (selectedSubdistrict !== 'Semua' && prj.subdistrict !== selectedSubdistrict) return;
        if (selectedSector !== 'Semua' && prj.sector !== selectedSector) return;

        const linkedFac = facilities.find(f => f.id === prj.facilityId);
        if (!linkedFac) return;

        const prjCoord: [number, number] = [
          linkedFac.coordinates[0] + 0.0018,
          linkedFac.coordinates[1] + 0.0018
        ];

        const iconHtml = `
          <div class="map-pin-base map-pin-project w-[28px] h-[28px]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'titik-custom-marker-project',
          html: iconHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -16]
        });

        const marker = L.marker(prjCoord, { icon: customIcon });

        marker.bindPopup(`
          <div class="map-popup-card">
            <div class="map-popup-badge-project">
              Proyek APBD • ${prj.progressPercent}% Progres
            </div>
            <div class="map-popup-title">
              ${prj.title}
            </div>
            <div class="map-popup-desc">
              Pagu: <strong>Rp ${(prj.budget.paguAnggaran / 1_000_000).toFixed(0)} Jt</strong>
            </div>
          </div>
        `);

        marker.on('click', () => {
          setSelectedProject(prj);
          setSelectedFacility(null);
          setSelectedReport(null);
        });

        markersLayer.addLayer(marker);
      });
    }

  }, [mapMode, facilities, budgetProjects, reports, selectedSubdistrict, selectedSector, pinFilter, selectedFacility, selectedReport]);

  // Center or pan to selected facility/report
  useEffect(() => {
    if (mapMode !== 'LEAFLET') return;
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedFacility) {
      map.flyTo(selectedFacility.coordinates, 15, { duration: 1 });
    } else if (selectedReport) {
      map.flyTo(selectedReport.coordinates, 15, { duration: 1 });
    }
  }, [mapMode, selectedFacility, selectedReport]);

  return (
    <div className="relative w-full h-full min-h-[440px] rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-[#243042] bg-[#F3F4F6] dark:bg-[#0B0F17] shadow-tactile transition-colors">
      
      {/* Switch Map Engine Mode Pill */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 dark:bg-[#151D2A]/95 backdrop-blur-xs px-2 py-1 rounded-lg border border-[#E5E7EB] dark:border-[#243042] shadow-xs flex items-center gap-1.5 text-[11px] font-semibold text-[#111827] dark:text-[#F9FAFB]">
        <button
          onClick={() => setMapMode('LEAFLET')}
          className={`px-2 py-0.5 rounded transition-colors ${mapMode === 'LEAFLET' ? 'bg-[#111827] dark:bg-[#0D9488] text-white' : 'text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white'}`}
        >
          Peta Satelit/Tile
        </button>
        <button
          onClick={() => setMapMode('SVG')}
          className={`px-2 py-0.5 rounded transition-colors ${mapMode === 'SVG' ? 'bg-[#111827] dark:bg-[#0D9488] text-white' : 'text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white'}`}
        >
          Vektor Resilient
        </button>
      </div>

      {mapMode === 'LEAFLET' ? (
        <div ref={mapContainerRef} className="w-full h-full" />
      ) : (
        <OfflineMapFallback />
      )}

      {/* Floating Map Legend (Daylight Minimalist) */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 dark:bg-[#151D2A]/95 backdrop-blur-sm px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#243042] shadow-sm text-xs space-y-1.5 pointer-events-auto">
        <div className="font-bold text-[#111827] dark:text-[#F9FAFB] text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#111827] dark:bg-[#0D9488]"></span>
          Legenda Titik
        </div>
        <div className="flex items-center gap-2 text-[#4B5563] dark:text-[#94A3B8]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] ring-2 ring-white dark:ring-[#151D2A]"></span>
          <span>Fasilitas Publik</span>
        </div>
        <div className="flex items-center gap-2 text-[#4B5563] dark:text-[#94A3B8]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] ring-2 ring-white dark:ring-[#151D2A]"></span>
          <span>Proyek APBD Aktif</span>
        </div>
        <div className="flex items-center gap-2 text-[#4B5563] dark:text-[#94A3B8]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] ring-2 ring-white dark:ring-[#151D2A]"></span>
          <span>Titik Masalah Warga</span>
        </div>
        <div className="flex items-center gap-2 text-[#4B5563] dark:text-[#94A3B8]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488] ring-2 ring-white dark:ring-[#151D2A]"></span>
          <span>Tuntas Terverifikasi</span>
        </div>
      </div>
    </div>
  );
};
