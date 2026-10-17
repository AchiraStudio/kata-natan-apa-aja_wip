import React from 'react';
import { useTitik } from '../context/TitikContext';
import { SubdistrictType } from '../types';
import { MapPin, Building2, Coins, AlertCircle } from 'lucide-react';

interface Props {
  onSelectSubdistrict?: (sub: SubdistrictType) => void;
}

export const OfflineMapFallback: React.FC<Props> = () => {
  const { 
    facilities, 
    reports, 
    selectedSubdistrict, 
    setSelectedSubdistrict, 
    setSelectedFacility, 
    setSelectedReport,
    selectedFacility,
    selectedReport,
    theme
  } = useTitik();

  const isDark = theme === 'dark';

  // Kota Bogor 6 Subdistricts approximate polygonal SVG layout
  const subdistrictsSVG = [
    { name: 'Tanah Sareal', d: 'M 140 40 L 260 40 L 290 120 L 190 140 L 120 100 Z', center: [195, 85], color: isDark ? '#1E293B' : '#E0E7FF' },
    { name: 'Bogor Utara', d: 'M 260 40 L 380 50 L 390 140 L 290 120 Z', center: [330, 95], color: isDark ? '#243042' : '#FEF3C7' },
    { name: 'Bogor Barat', d: 'M 60 110 L 190 140 L 180 260 L 50 210 Z', center: [120, 180], color: isDark ? '#1C2E3D' : '#DCFCE7' },
    { name: 'Bogor Tengah', d: 'M 190 140 L 290 120 L 300 230 L 180 230 Z', center: [240, 180], color: isDark ? '#2D2438' : '#FEE2E2' },
    { name: 'Bogor Timur', d: 'M 290 120 L 390 140 L 410 270 L 300 230 Z', center: [350, 190], color: isDark ? '#172E3F' : '#E0F2FE' },
    { name: 'Bogor Selatan', d: 'M 180 230 L 300 230 L 320 370 L 160 350 Z', center: [240, 290], color: isDark ? '#2A1F3D' : '#F3E8FF' }
  ];

  return (
    <div className="relative w-full h-full min-h-[440px] bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-4 flex flex-col justify-between overflow-hidden shadow-tactile transition-colors">
      {/* Top Banner Notice */}
      <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5E7EB] dark:border-[#243042]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
          <span className="font-bold text-[#111827] dark:text-[#F9FAFB]">Peta Vektor Spasial Jabodetabek (Mode Resilient)</span>
        </div>
        <span className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
          Klik wilayah kecamatan untuk menyaring titik
        </span>
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 flex items-center justify-center p-2 relative">
        <svg 
          viewBox="0 0 460 400" 
          className="w-full h-full max-h-[380px] drop-shadow-sm select-none"
        >
          {/* Subdistricts Polygons */}
          {subdistrictsSVG.map(sub => {
            const isSelected = selectedSubdistrict === sub.name;
            const fillColor = isSelected 
              ? (isDark ? '#0D9488' : '#111827') 
              : sub.color;
            const strokeColor = isSelected 
              ? (isDark ? '#5EEAD4' : '#000000') 
              : (isDark ? '#334155' : '#D1D5DB');
            const textColor = isSelected 
              ? '#FFFFFF' 
              : (isDark ? '#CBD5E1' : '#374151');

            return (
              <g 
                key={sub.name}
                onClick={() => setSelectedSubdistrict(isSelected ? 'Semua' : sub.name as SubdistrictType)}
                className="cursor-pointer transition-all duration-200 group"
              >
                <path
                  d={sub.d}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  className="transition-colors group-hover:opacity-85"
                />
                <text
                  x={sub.center[0]}
                  y={sub.center[1]}
                  textAnchor="middle"
                  fill={textColor}
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="inherit"
                  className="pointer-events-none"
                >
                  {sub.name}
                </text>
              </g>
            );
          })}

          {/* Render Facility Coordinates as Cobalt Dots */}
          {facilities.map((fac, idx) => {
            const isSelected = selectedFacility?.id === fac.id;
            // Approximate position inside SVG based on subdistrict
            const matchSub = subdistrictsSVG.find(s => s.name === fac.subdistrict);
            const cx = matchSub ? matchSub.center[0] + ((idx % 3) - 1) * 22 : 230;
            const cy = matchSub ? matchSub.center[1] + ((idx % 2) - 0.5) * 25 : 180;

            return (
              <g 
                key={fac.id}
                onClick={() => setSelectedFacility(fac)}
                className="cursor-pointer"
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 9 : 6}
                  fill="#2563EB"
                  stroke={isDark ? '#0B0F17' : '#FFFFFF'}
                  strokeWidth="2"
                  className="transition-transform hover:scale-125"
                />
              </g>
            );
          })}

          {/* Render Report Coordinates as Crimson Dots */}
          {reports.map((rep, idx) => {
            const isSelected = selectedReport?.id === rep.id;
            const matchSub = subdistrictsSVG.find(s => s.name === rep.subdistrict);
            const cx = matchSub ? matchSub.center[0] + ((idx % 2) - 0.5) * 30 : 250;
            const cy = matchSub ? matchSub.center[1] - ((idx % 3) - 1) * 20 : 190;

            return (
              <g 
                key={rep.id}
                onClick={() => setSelectedReport(rep)}
                className="cursor-pointer"
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 9 : 6}
                  fill={rep.currentStep === 6 ? '#0D9488' : '#DC2626'}
                  stroke={isDark ? '#0B0F17' : '#FFFFFF'}
                  strokeWidth="2"
                  className="transition-transform hover:scale-125"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Subdistricts Quick Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E5E7EB] dark:border-[#243042] text-xs">
        <span className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] font-semibold mr-1">Filter Cepat:</span>
        <button
          onClick={() => setSelectedSubdistrict('Semua')}
          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
            selectedSubdistrict === 'Semua' 
              ? 'bg-[#111827] dark:bg-[#0D9488] text-white font-bold' 
              : 'bg-[#F8F9FA] dark:bg-[#1C2638] text-[#4B5563] dark:text-[#94A3B8] hover:bg-[#E5E7EB] dark:hover:bg-[#243042]'
          }`}
        >
          Semua Wilayah
        </button>
        {subdistrictsSVG.map(sub => (
          <button
            key={sub.name}
            onClick={() => setSelectedSubdistrict(sub.name as SubdistrictType)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              selectedSubdistrict === sub.name 
                ? 'bg-[#111827] dark:bg-[#0D9488] text-white font-bold' 
                : 'bg-[#F8F9FA] dark:bg-[#1C2638] text-[#4B5563] dark:text-[#94A3B8] hover:bg-[#E5E7EB] dark:hover:bg-[#243042]'
            }`}
          >
            {sub.name}
          </button>
        ))}
      </div>
    </div>
  );
};

