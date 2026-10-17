import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useTitik } from '../context/TitikContext';
import { KOTA_BOGOR_COORDINATES } from '../data/titikRegionalData';
import { OfflineMapFallback } from './OfflineMapFallback';
import { Layers, MapPin } from 'lucide-react';

export const InteractiveMap: React.FC = () => {
  const [mapMode, setMapMode] = useState<'LEAFLET' | 'SVG'>('LEAFLET');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

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
    selectedReport
  } = useTitik();

  // Initialize Map
  useEffect(() => {
    if (mapMode !== 'LEAFLET') return;
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      try {
        const map = L.map(mapContainerRef.current, {
          center: KOTA_BOGOR_COORDINATES,
          zoom: 13,
          zoomControl: false,
          attributionControl: false
        });

        // Daylight Minimalist Tile Layer (CartoDB Positron)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);

        // Attribution
        L.control.attribution({ position: 'bottomright', prefix: '© OpenStreetMap, © CARTO • TITIK. SIKD' }).addTo(map);

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
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isSelected ? '38px' : '30px'};
            height: ${isSelected ? '38px' : '30px'};
            background-color: #2563EB;
            color: #FFFFFF;
            border-radius: 50%;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
            cursor: pointer;
            transition: all 0.2s ease;
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
          ">
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
          <div style="font-family: inherit; padding: 4px; max-width: 220px;">
            <div style="font-size: 10px; font-weight: 700; color: #2563EB; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
              Fasilitas Publik • ${fac.sector}
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #111827; line-height: 1.3; margin-bottom: 4px;">
              ${fac.name}
            </div>
            <div style="font-size: 11px; color: #4B5563; margin-bottom: 6px;">
              ${fac.address}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E5E7EB; padding-top: 6px;">
              <span style="font-size: 10px; color: #6B7280;">Kondisi: <strong>${fac.condition}</strong></span>
              <span style="font-size: 11px; font-weight: 700; color: #111827;">${fac.activeReportsCount} Laporan</span>
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
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isSelected ? '36px' : '28px'};
            height: ${isSelected ? '36px' : '28px'};
            background-color: ${color};
            color: #FFFFFF;
            border-radius: 50%;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 12px ${isCompleted ? 'rgba(13, 148, 136, 0.4)' : 'rgba(220, 38, 38, 0.4)'};
            cursor: pointer;
            transition: all 0.2s ease;
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
          ">
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
          <div style="font-family: inherit; padding: 4px; max-width: 220px;">
            <div style="font-size: 10px; font-weight: 700; color: ${color}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
              ${isCompleted ? 'Tuntas Terverifikasi' : 'Titik Masalah Warga'}
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #111827; line-height: 1.3; margin-bottom: 4px;">
              ${rep.title}
            </div>
            <div style="font-size: 10px; color: #4B5563; margin-bottom: 6px;">
              Oleh: @${rep.reporterHandle} • Langkah ${rep.currentStep}/6
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E5E7EB; padding-top: 6px;">
              <span style="font-size: 11px; font-weight: 700; color: #111827;">${rep.priorityVotes} Suara Prioritas</span>
              <span style="font-size: 10px; color: #2563EB;">Lihat Audit &rarr;</span>
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
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            background-color: #D97706;
            color: #FFFFFF;
            border-radius: 50%;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 12px rgba(217, 119, 6, 0.4);
            cursor: pointer;
            transition: all 0.2s ease;
          ">
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
          <div style="font-family: inherit; padding: 4px; max-width: 220px;">
            <div style="font-size: 10px; font-weight: 700; color: #D97706; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
              Proyek APBD • ${prj.progressPercent}% Progres
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #111827; line-height: 1.3; margin-bottom: 4px;">
              ${prj.title}
            </div>
            <div style="font-size: 10px; color: #4B5563; margin-bottom: 6px;">
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
    <div className="relative w-full h-full min-h-[440px] rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6] shadow-tactile">
      
      {/* Switch Map Engine Mode Pill */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-2 py-1 rounded-lg border border-[#E5E7EB] shadow-xs flex items-center gap-1.5 text-[11px] font-semibold text-[#111827]">
        <button
          onClick={() => setMapMode('LEAFLET')}
          className={`px-2 py-0.5 rounded transition-colors ${mapMode === 'LEAFLET' ? 'bg-[#111827] text-white' : 'text-[#6B7280] hover:text-[#111827]'}`}
        >
          Peta Satelit/Tile
        </button>
        <button
          onClick={() => setMapMode('SVG')}
          className={`px-2 py-0.5 rounded transition-colors ${mapMode === 'SVG' ? 'bg-[#111827] text-white' : 'text-[#6B7280] hover:text-[#111827]'}`}
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
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] shadow-sm text-xs space-y-1.5 pointer-events-auto">
        <div className="font-bold text-[#111827] text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#111827]"></span>
          Legenda Titik
        </div>
        <div className="flex items-center gap-2 text-[#4B5563]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] ring-2 ring-white"></span>
          <span>Fasilitas Publik</span>
        </div>
        <div className="flex items-center gap-2 text-[#4B5563]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] ring-2 ring-white"></span>
          <span>Proyek APBD Aktif</span>
        </div>
        <div className="flex items-center gap-2 text-[#4B5563]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] ring-2 ring-white"></span>
          <span>Titik Masalah Warga</span>
        </div>
        <div className="flex items-center gap-2 text-[#4B5563]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488] ring-2 ring-white"></span>
          <span>Tuntas Terverifikasi</span>
        </div>
      </div>
    </div>
  );
};
