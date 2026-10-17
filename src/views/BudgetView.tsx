import React, { useState, useMemo } from 'react';
import { useTitik } from '../context/TitikContext';
import { BudgetBreakdownCard } from '../components/BudgetBreakdownCard';
import { 
  formatRupiahFull, 
  formatRupiahShort, 
  SECTOR_DEFINITIONS 
} from '../data/titikRegionalData';
import { SectorType, BudgetBreakdown } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Coins, 
  Building2, 
  Search, 
  FileText, 
  ArrowUpDown, 
  ChevronRight, 
  Info,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';

export const BudgetView: React.FC = () => {
  const { budgetPrograms, budgetProjects, setIsDataSourceModalOpen } = useTitik();

  const [selectedSectorFilter, setSelectedSectorFilter] = useState<'Semua' | SectorType>('Semua');
  const [searchTableQuery, setSearchTableQuery] = useState('');
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>('PRG-DISDIK-01');

  // Sector Aggregate Chart Data
  const sectorChartData = useMemo(() => {
    return budgetPrograms.map(prog => ({
      name: prog.sector.split(' ')[0], // short name
      fullName: prog.sector,
      pagu: Math.round(prog.paguAnggaran / 1_000_000), // in Millions
      terikat: Math.round(prog.danaTerikatKontrak / 1_000_000),
      realisasi: Math.round(prog.realisasiPenyerapan / 1_000_000)
    }));
  }, [budgetPrograms]);

  // Overall City Budget Breakdown
  const totalCityBudget: BudgetBreakdown = useMemo(() => {
    let pagu = 0;
    let terikat = 0;
    let realisasi = 0;

    budgetPrograms.forEach(p => {
      pagu += p.paguAnggaran;
      terikat += p.danaTerikatKontrak;
      realisasi += p.realisasiPenyerapan;
    });

    return {
      paguAnggaran: pagu,
      danaTerikatKontrak: terikat,
      realisasiPenyerapan: realisasi,
      sisaPaguBelumTerikat: Math.max(0, pagu - terikat),
      linkageConfidence: 'Tinggi (98%)',
      dataSource: 'Simulasi Terbuka Format SIKD Kemendagri & Portal Satu Data Jabodetabek 2026',
      lastUpdated: '15 Oktober 2026'
    };
  }, [budgetPrograms]);

  // Filtered Programs for Table
  const filteredPrograms = budgetPrograms.filter(prog => {
    if (selectedSectorFilter !== 'Semua' && prog.sector !== selectedSectorFilter) return false;
    if (searchTableQuery.trim()) {
      const q = searchTableQuery.toLowerCase();
      return prog.name.toLowerCase().includes(q) || prog.code.includes(q) || prog.responsibleAgency.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Editorial Masthead */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Data Terbuka Keuangan Daerah • APBD Wilayah Jabodetabek 2026
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              Rincian Pagu, Kontrak, dan Pencairan Kas Daerah
            </h1>
          </div>

          <button
            onClick={() => setIsDataSourceModalOpen(true)}
            className="px-3.5 py-2 bg-[#F8F9FA] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#111827] self-start sm:self-auto transition-colors whitespace-nowrap"
          >
            Sumber & Metodologi Data
          </button>
        </div>

        <p className="text-sm text-[#4B5563] leading-relaxed max-w-4xl">
          Data di bawah ini menyajikan susunan anggaran daerah mulai dari tingkat sektor layanan, program dinas, hingga sub-kegiatan proyek fisik. Setiap baris memisahkan nilai pagu awal, dana yang sudah terikat kontrak, dan pembayaran yang telah cair.
        </p>
      </div>

      {/* 4-Tier City Breakdown */}
      <BudgetBreakdownCard
        budget={totalCityBudget}
        title="Rekapitulasi Anggaran 9 Sektor Layanan Publik Wilayah Jabodetabek"
        subtitle="Akumulasi program kerja dinas teknis per 30 September 2026"
      />

      {/* Sector Allocation vs Realization Chart */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-3">
          <div>
            <h3 className="font-bold text-base text-[#111827]">
              Perbandingan Pagu, Nilai Kontrak, dan Pencairan Kas per Sektor
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Nominal ditampilkan dalam satuan Juta Rupiah (Jt)
            </p>
          </div>
          <span className="text-xs font-mono-data text-[#6B7280]">
            Satuan: Juta Rupiah
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sectorChartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis 
                dataKey="fullName" 
                tick={{ fontSize: 11, fill: '#4B5563' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#4B5563' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
              />
              <Tooltip 
                formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')} Jt`, '']}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: '12px',
                  fontFamily: 'inherit'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="pagu" name="1. Pagu Anggaran" fill="#111827" radius={[4, 4, 0, 0]} />
              <Bar dataKey="terikat" name="2. Terikat Kontrak" fill="#D97706" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realisasi" name="3. Realisasi Fisik" fill="#0D9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Program & Activities Hierarchy Table (Accessible Data Table Alternative) */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-tactile overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
          <div>
            <h3 className="font-extrabold text-base text-[#111827]">
              Hierarki Program & Rincian Kegiatan APBD
            </h3>
            <p className="text-xs text-[#6B7280]">
              Tabel data perbendaharaan terverifikasi dengan opsi pelacakan sub-kegiatan
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari program / kode..."
                value={searchTableQuery}
                onChange={e => setSearchTableQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none"
              />
            </div>

            <select
              value={selectedSectorFilter}
              onChange={e => setSelectedSectorFilter(e.target.value as any)}
              className="text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[#111827] focus:outline-none font-medium"
            >
              <option value="Semua">Semua Sektor</option>
              {SECTOR_DEFINITIONS.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280] uppercase text-[10px] font-bold tracking-wider">
                <th className="py-2.5 px-3">Kode Program</th>
                <th className="py-2.5 px-3">Nama Program / Kegiatan</th>
                <th className="py-2.5 px-3">Instansi Pelaksana</th>
                <th className="py-2.5 px-3 text-right">Pagu Resmi</th>
                <th className="py-2.5 px-3 text-right">Terikat Kontrak</th>
                <th className="py-2.5 px-3 text-right">Realisasi (%)</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filteredPrograms.map(prog => {
                const isExpanded = expandedProgramId === prog.id;
                const realPct = Math.round((prog.realisasiPenyerapan / prog.paguAnggaran) * 100);

                return (
                  <React.Fragment key={prog.id}>
                    {/* Program Row */}
                    <tr className="hover:bg-[#F9FAFB] transition-colors group">
                      <td className="py-3 px-3 font-mono-data font-bold text-[#111827]">
                        {prog.code}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#111827]">
                        {prog.name}
                        <div className="text-[10px] font-normal text-[#6B7280]">
                          Sektor: {prog.sector} • {prog.projectsCount} Paket Pekerjaan
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#4B5563]">
                        {prog.responsibleAgency}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-data font-bold text-[#111827]">
                        {formatRupiahShort(prog.paguAnggaran)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-data text-[#D97706] font-semibold">
                        {formatRupiahShort(prog.danaTerikatKontrak)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-data font-bold text-[#0D9488]">
                        {realPct}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setExpandedProgramId(isExpanded ? null : prog.id)}
                          className="px-2.5 py-1 rounded bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] text-[11px] font-medium transition-colors"
                        >
                          {isExpanded ? 'Tutup Kegiatan' : 'Rincian Kegiatan'}
                        </button>
                      </td>
                    </tr>

                    {/* Sub-activities Accordion */}
                    {isExpanded && (
                      <tr className="bg-[#F8F9FA]/70">
                        <td colSpan={7} className="p-3 pl-8">
                          <div className="space-y-2 border-l-2 border-[#111827] pl-3 py-1">
                            <div className="text-[11px] font-bold text-[#111827]">
                              Rincian Sub-Kegiatan di Bawah Program {prog.code}:
                            </div>
                            <div className="space-y-1.5">
                              {prog.activities.map(act => (
                                <div 
                                  key={act.id} 
                                  className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-white p-2 rounded border border-[#E5E7EB] gap-1"
                                >
                                  <div>
                                    <span className="font-mono-data font-semibold text-[#6B7280] mr-2">[{act.code}]</span>
                                    <span className="font-medium text-[#111827]">{act.name}</span>
                                  </div>
                                  <div className="flex items-center gap-3 font-mono-data text-[11px]">
                                    <span className="text-[#6B7280]">Pagu: {formatRupiahShort(act.pagu)}</span>
                                    <span className="text-[#0D9488] font-bold">Realisasi: {formatRupiahShort(act.realisasi)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

