import React, { useState, useMemo } from 'react';
import { useTitik } from '../context/TitikContext';
import { InteractiveMap } from '../components/InteractiveMap';
import { BudgetBreakdownCard } from '../components/BudgetBreakdownCard';
import { SUBDISTRICTS, SECTORS, formatRupiahShort } from '../data/titikRegionalData';
import { BudgetBreakdown } from '../types';
import { Search, ThumbsUp, ChevronRight } from 'lucide-react';

export const ObservatoryView: React.FC = () => {
  const {
    facilities,
    reports,
    discrepancies,
    selectedSubdistrict,
    setSelectedSubdistrict,
    selectedSector,
    setSelectedSector,
    pinFilter,
    setPinFilter,
    searchQuery,
    setSearchQuery,
    setSelectedFacility,
    setSelectedReport,
    setSelectedProject,
    selectedFacility,
    selectedReport
  } = useTitik();

  const [sidebarTab, setSidebarTab] = useState<'FACILITIES' | 'REPORTS' | 'BUDGET'>('FACILITIES');

  const filteredFacilities = facilities.filter(f => {
    if (selectedSubdistrict !== 'Semua' && f.subdistrict !== selectedSubdistrict) return false;
    if (selectedSector !== 'Semua' && f.sector !== selectedSector) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.address.toLowerCase().includes(q) || f.responsibleAgency.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredReports = reports.filter(r => {
    if (selectedSubdistrict !== 'Semua' && r.subdistrict !== selectedSubdistrict) return false;
    if (selectedSector !== 'Semua' && r.sector !== selectedSector) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.reporterHandle.toLowerCase().includes(q);
    }
    return true;
  });

  const aggregateBudget: BudgetBreakdown = useMemo(() => {
    let pagu = 0;
    let terikat = 0;
    let realisasi = 0;
    let count = 0;

    facilities.forEach(f => {
      if (selectedSubdistrict !== 'Semua' && f.subdistrict !== selectedSubdistrict) return;
      if (selectedSector !== 'Semua' && f.sector !== selectedSector) return;
      pagu += f.budgetSummary.paguAnggaran;
      terikat += f.budgetSummary.danaTerikatKontrak;
      realisasi += f.budgetSummary.realisasiPenyerapan;
      count++;
    });

    if (count === 0) {
      pagu = 2_600_000_000;
      terikat = 2_520_000_000;
      realisasi = 2_470_000_000;
    }

    return {
      paguAnggaran: pagu,
      danaTerikatKontrak: terikat,
      realisasiPenyerapan: realisasi,
      sisaPaguBelumTerikat: Math.max(0, pagu - terikat),
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi SIKD / Satu Data Kota Bogor 2026',
      lastUpdated: 'Oktober 2026'
    };
  }, [facilities, selectedSubdistrict, selectedSector]);

  const activeDiscrepancy = discrepancies.find(d => {
    if (selectedSubdistrict !== 'Semua' && d.subdistrict !== selectedSubdistrict) return false;
    if (selectedSector !== 'Semua' && d.sector !== selectedSector) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      
      {/* Top Filter & Layer Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama fasilitas, alamat, atau laporan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:border-[#111827]"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[#4B5563]">
              <span className="font-semibold text-[#111827]">Kecamatan:</span>
              <select
                value={selectedSubdistrict}
                onChange={e => setSelectedSubdistrict(e.target.value as any)}
                className="text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 font-medium text-[#111827] focus:outline-none focus:border-[#111827]"
              >
                <option value="Semua">Semua Kecamatan (6)</option>
                {SUBDISTRICTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#4B5563]">
              <span className="font-semibold text-[#111827]">Sektor:</span>
              <select
                value={selectedSector}
                onChange={e => setSelectedSector(e.target.value as any)}
                className="text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 font-medium text-[#111827] focus:outline-none focus:border-[#111827]"
              >
                <option value="Semua">Semua Sektor (9)</option>
                {SECTORS.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pin Layer Toggle Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E5E7EB] text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#6B7280] font-medium mr-1">Titik Peta:</span>
            
            <button
              onClick={() => setPinFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                pinFilter === 'ALL'
                  ? 'bg-[#111827] text-white font-semibold'
                  : 'bg-[#F8F9FA] text-[#4B5563] hover:text-[#111827] border border-[#E5E7EB]'
              }`}
            >
              Semua ({filteredFacilities.length + filteredReports.length})
            </button>

            <button
              onClick={() => {
                setPinFilter('FACILITY');
                setSidebarTab('FACILITIES');
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                pinFilter === 'FACILITY'
                  ? 'bg-[#111827] text-white font-semibold'
                  : 'bg-[#F8F9FA] text-[#4B5563] hover:text-[#111827] border border-[#E5E7EB]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
              <span>Fasilitas ({filteredFacilities.length})</span>
            </button>

            <button
              onClick={() => {
                setPinFilter('REPORT');
                setSidebarTab('REPORTS');
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                pinFilter === 'REPORT'
                  ? 'bg-[#111827] text-white font-semibold'
                  : 'bg-[#F8F9FA] text-[#4B5563] hover:text-[#111827] border border-[#E5E7EB]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
              <span>Laporan Warga ({filteredReports.length})</span>
            </button>
          </div>

          <div className="text-[11px] text-[#6B7280]">
            Klik titik pada peta atau baris di panel kanan untuk membuka rincian audit
          </div>
        </div>
      </div>

      {/* Discrepancy Notice Strip */}
      {activeDiscrepancy && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
              <span className="font-bold text-[#111827]">Catatan Pemeriksaan Wilayah:</span>
              <span className="text-[#6B7280] font-mono-data">
                Serapan {activeDiscrepancy.realizationPercent}% • {activeDiscrepancy.unresolvedReportsCount} laporan belum selesai
              </span>
            </div>
            <p className="text-xs text-[#4B5563]">
              <strong className="text-[#111827]">{activeDiscrepancy.facilityName}:</strong> {activeDiscrepancy.flagReason}
            </p>
          </div>
          <button
            onClick={() => {
              const fac = facilities.find(f => f.name.toLowerCase().includes(activeDiscrepancy.facilityName.toLowerCase()));
              if (fac) setSelectedFacility(fac);
            }}
            className="px-3.5 py-2 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-semibold rounded-lg shrink-0 self-start sm:self-auto transition-colors"
          >
            Buka Rincian Fasilitas
          </button>
        </div>
      )}

      {/* SPLIT-VIEW: MAP (7 COLS) + UNIFIED INSPECTOR SIDEBAR (5 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Map */}
        <div className="lg:col-span-7 space-y-2">
          <div className="h-[460px] lg:h-[620px] w-full">
            <InteractiveMap />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#6B7280] px-1 font-mono-data">
            <span>Wilayah: Kota Bogor (-6.5971, 106.8060)</span>
            <span>Sumber: Simulasi SIKD 2026</span>
          </div>
        </div>

        {/* Right Column: Unified Inspector Sidebar */}
        <aside className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-xl overflow-hidden flex flex-col lg:h-[620px]">
          
          {/* Top Compact Financial Strip */}
          <div className="p-4 bg-[#F8F9FA] border-b border-[#E5E7EB] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#111827]">
                Anggaran {selectedSubdistrict === 'Semua' ? 'Kota Bogor' : selectedSubdistrict}
              </span>
              <span className="text-[11px] text-[#6B7280]">
                {selectedSector === 'Semua' ? 'Semua Sektor' : selectedSector}
              </span>
            </div>

            <div className="grid grid-cols-3 divide-x divide-[#E5E7EB] bg-white rounded-lg border border-[#E5E7EB] p-2.5 text-left">
              <div className="pr-2">
                <div className="text-[10px] text-[#6B7280]">Pagu</div>
                <div className="text-xs font-bold text-[#111827] font-mono-data mt-0.5">
                  {formatRupiahShort(aggregateBudget.paguAnggaran)}
                </div>
              </div>
              <div className="px-2">
                <div className="text-[10px] text-[#6B7280] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></span>
                  <span>Realisasi</span>
                </div>
                <div className="text-xs font-bold text-[#111827] font-mono-data mt-0.5">
                  {formatRupiahShort(aggregateBudget.realisasiPenyerapan)}
                </div>
              </div>
              <div className="pl-2">
                <div className="text-[10px] text-[#6B7280] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
                  <span>Belum Terikat</span>
                </div>
                <div className="text-xs font-bold text-[#111827] font-mono-data mt-0.5">
                  {formatRupiahShort(aggregateBudget.sisaPaguBelumTerikat)}
                </div>
              </div>
            </div>
          </div>

          {/* Segmented Sidebar Navigation Tabs */}
          <div className="grid grid-cols-3 border-b border-[#E5E7EB] bg-white text-xs font-medium">
            <button
              onClick={() => setSidebarTab('FACILITIES')}
              className={`py-3 text-center border-b-2 transition-colors ${
                sidebarTab === 'FACILITIES'
                  ? 'border-[#111827] text-[#111827] font-bold bg-[#F8F9FA]/50'
                  : 'border-transparent text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Fasilitas ({filteredFacilities.length})
            </button>
            <button
              onClick={() => setSidebarTab('REPORTS')}
              className={`py-3 text-center border-b-2 transition-colors ${
                sidebarTab === 'REPORTS'
                  ? 'border-[#111827] text-[#111827] font-bold bg-[#F8F9FA]/50'
                  : 'border-transparent text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Laporan ({filteredReports.length})
            </button>
            <button
              onClick={() => setSidebarTab('BUDGET')}
              className={`py-3 text-center border-b-2 transition-colors ${
                sidebarTab === 'BUDGET'
                  ? 'border-[#111827] text-[#111827] font-bold bg-[#F8F9FA]/50'
                  : 'border-transparent text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              4 Status APBD
            </button>
          </div>

          {/* Scrollable Sidebar List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB]">
            
            {/* TAB 1: FACILITIES */}
            {sidebarTab === 'FACILITIES' && (
              <>
                {filteredFacilities.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#6B7280]">
                    Tidak ada fasilitas yang cocok dengan filter pencarian. Ubah filter kecamatan atau sektor di atas.
                  </div>
                ) : (
                  filteredFacilities.map(facility => {
                    const isSelected = selectedFacility?.id === facility.id;
                    return (
                      <div
                        key={facility.id}
                        onClick={() => {
                          setSelectedFacility(facility);
                          setSelectedReport(null);
                          setSelectedProject(null);
                        }}
                        className={`p-4 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected ? 'bg-[#F8F9FA]' : 'bg-white hover:bg-[#F8F9FA]/60'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                            <span className="font-medium text-[#4B5563]">{facility.sector}</span>
                            <span>•</span>
                            <span>{facility.subdistrict}</span>
                          </div>
                          <h4 className="font-bold text-sm text-[#111827] truncate">
                            {facility.name}
                          </h4>
                          <p className="text-xs text-[#6B7280] truncate">
                            {facility.address}
                          </p>
                          <div className="pt-1 flex items-center gap-3 text-[11px] text-[#4B5563]">
                            <span>Kondisi: <strong className="text-[#111827]">{facility.condition}</strong></span>
                            <span>•</span>
                            <span className="font-mono-data">{facility.activeReportsCount} laporan</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex flex-col items-end justify-between self-stretch">
                          <div className="text-xs font-mono-data font-bold text-[#111827]">
                            {formatRupiahShort(facility.budgetSummary.paguAnggaran)}
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* TAB 2: CITIZEN REPORTS */}
            {sidebarTab === 'REPORTS' && (
              <>
                {filteredReports.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#6B7280]">
                    Belum ada laporan warga pada filter wilayah ini.
                  </div>
                ) : (
                  filteredReports.map(report => {
                    const isSelected = selectedReport?.id === report.id;
                    return (
                      <div
                        key={report.id}
                        onClick={() => {
                          setSelectedReport(report);
                          setSelectedFacility(null);
                          setSelectedProject(null);
                        }}
                        className={`p-4 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected ? 'bg-[#F8F9FA]' : 'bg-white hover:bg-[#F8F9FA]/60'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 text-[11px] text-[#6B7280] font-mono-data">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
                            <span className="font-bold text-[#111827]">{report.id}</span>
                            <span>•</span>
                            <span>Tahap {report.currentStep}/6</span>
                          </div>
                          <h4 className="font-bold text-sm text-[#111827] line-clamp-1">
                            {report.title}
                          </h4>
                          <p className="text-xs text-[#4B5563] line-clamp-1">
                            {report.description}
                          </p>
                          <div className="text-[11px] text-[#6B7280] pt-0.5">
                            {report.subdistrict} • @{report.reporterHandle}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-mono-data font-semibold text-[#111827] shrink-0 bg-[#F8F9FA] px-2.5 py-1 rounded border border-[#E5E7EB]">
                          <ThumbsUp className="w-3 h-3 text-[#6B7280]" />
                          <span>{report.priorityVotes}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* TAB 3: FULL 4-TIER BUDGET BREAKDOWN */}
            {sidebarTab === 'BUDGET' && (
              <div className="p-4">
                <BudgetBreakdownCard
                  budget={aggregateBudget}
                  title={`Rincian Anggaran: ${selectedSubdistrict === 'Semua' ? 'Kota Bogor' : selectedSubdistrict}`}
                  subtitle={selectedSector === 'Semua' ? 'Gabungan 9 Sektor Layanan Publik' : `Sektor ${selectedSector}`}
                />
              </div>
            )}

          </div>

        </aside>

      </div>
    </div>
  );
};
