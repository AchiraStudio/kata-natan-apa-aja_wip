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
  const { budgetPrograms, budgetProjects, setIsDataSourceModalOpen, theme } = useTitik();

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
      <div className="bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-6 sm:p-8 space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#243042] pb-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8]">
              Data Terbuka Keuangan Daerah • APBD Wilayah Jabodetabek 2026
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-[#F9FAFB] tracking-tight">
              Rincian Pagu, Kontrak, dan Pencairan Kas Daerah
            </h1>
          </div>

          <button
            onClick={() => setIsDataSourceModalOpen(true)}
            className="px-3.5 py-2 bg-[#F8F9FA] dark:bg-[#1C2638] hover:bg-[#E5E7EB] dark:hover:bg-[#243042] border border-[#E5E7EB] dark:border-[#243042] rounded-lg text-xs font-semibold text-[#111827] dark:text-[#F9FAFB] self-start sm:self-auto transition-colors whitespace-nowrap"
          >
            Sumber & Metodologi Data
          </button>
        </div>

        {/* 4-Metric Visual KPI Summary: Less Text, More Show */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-[#F8F9FA] dark:bg-[#101622] rounded-xl border border-[#E5E7EB] dark:border-[#243042]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-data font-bold uppercase text-[#6B7280] dark:text-[#94A3B8]">Pagu APBD</span>
              <span className="text-[10px] font-mono-data font-bold text-[#111827] dark:text-[#F9FAFB] bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] px-1.5 py-0.2 rounded">100%</span>
            </div>
            <div className="text-base sm:text-lg font-extrabold font-mono-data text-[#111827] dark:text-[#F9FAFB] mt-1">
              {formatRupiahShort(totalCityBudget.paguAnggaran)}
            </div>
            <div className="w-full h-1 bg-[#111827] dark:bg-[#F9FAFB] rounded-full mt-2" />
          </div>

          <div className="p-3 bg-[#F8F9FA] dark:bg-[#101622] rounded-xl border border-[#E5E7EB] dark:border-[#243042]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-data font-bold uppercase text-[#D97706]">Terikat Kontrak</span>
              <span className="text-[10px] font-mono-data font-bold text-[#D97706] bg-[#D97706]/10 px-1.5 py-0.2 rounded">
                {Math.round((totalCityBudget.danaTerikatKontrak / totalCityBudget.paguAnggaran) * 100)}%
              </span>
            </div>
            <div className="text-base sm:text-lg font-extrabold font-mono-data text-[#D97706] mt-1">
              {formatRupiahShort(totalCityBudget.danaTerikatKontrak)}
            </div>
            <div className="w-full h-1 bg-[#D97706] rounded-full mt-2" />
          </div>

          <div className="p-3 bg-[#F8F9FA] dark:bg-[#101622] rounded-xl border border-[#E5E7EB] dark:border-[#243042]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-data font-bold uppercase text-[#0D9488]">Kas Daerah Cair</span>
              <span className="text-[10px] font-mono-data font-bold text-[#0D9488] bg-[#0D9488]/10 px-1.5 py-0.2 rounded">
                {Math.round((totalCityBudget.realisasiPenyerapan / totalCityBudget.paguAnggaran) * 100)}%
              </span>
            </div>
            <div className="text-base sm:text-lg font-extrabold font-mono-data text-[#0D9488] mt-1">
              {formatRupiahShort(totalCityBudget.realisasiPenyerapan)}
            </div>
            <div className="w-full h-1 bg-[#0D9488] rounded-full mt-2" />
          </div>

          <div className="p-3 bg-[#F8F9FA] dark:bg-[#101622] rounded-xl border border-[#E5E7EB] dark:border-[#243042]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-data font-bold uppercase text-[#6B7280] dark:text-[#94A3B8]">Belum Terikat</span>
              <span className="text-[10px] font-mono-data font-bold text-[#6B7280] dark:text-[#94A3B8] bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] px-1.5 py-0.2 rounded">
                {Math.round((totalCityBudget.sisaPaguBelumTerikat / totalCityBudget.paguAnggaran) * 100)}%
              </span>
            </div>
            <div className="text-base sm:text-lg font-extrabold font-mono-data text-[#6B7280] dark:text-[#94A3B8] mt-1">
              {formatRupiahShort(totalCityBudget.sisaPaguBelumTerikat)}
            </div>
            <div className="w-full h-1 bg-[#9CA3AF] dark:bg-[#475569] rounded-full mt-2" />
          </div>
        </div>
      </div>

      {/* 4-Tier City Breakdown */}
      <BudgetBreakdownCard
        budget={totalCityBudget}
        title="Rekapitulasi Anggaran 9 Sektor Layanan Publik Wilayah Jabodetabek"
        subtitle="Akumulasi program kerja dinas teknis per 30 September 2026"
      />

      {/* Sector Allocation vs Realization Chart */}
      <div className="bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-6 space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] dark:border-[#243042] pb-3">
          <div>
            <h3 className="font-bold text-base text-[#111827] dark:text-[#F9FAFB]">
              Perbandingan Pagu, Nilai Kontrak, dan Pencairan Kas per Sektor
            </h3>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
              Nominal ditampilkan dalam satuan Juta Rupiah (Jt)
            </p>
          </div>
          <span className="text-xs font-mono-data text-[#6B7280] dark:text-[#94A3B8]">
            Satuan: Juta Rupiah
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sectorChartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke={theme === 'dark' ? '#243042' : '#F3F4F6'} 
              />
              <XAxis 
                dataKey="fullName" 
                tick={{ fontSize: 11, fill: theme === 'dark' ? '#94A3B8' : '#4B5563' }}
                axisLine={{ stroke: theme === 'dark' ? '#243042' : '#E5E7EB' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: theme === 'dark' ? '#94A3B8' : '#4B5563' }}
                axisLine={{ stroke: theme === 'dark' ? '#243042' : '#E5E7EB' }}
                tickLine={false}
              />
              <Tooltip 
                formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')} Jt`, '']}
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#151D2A' : '#FFFFFF',
                  borderRadius: '8px',
                  border: `1px solid ${theme === 'dark' ? '#243042' : '#E5E7EB'}`,
                  color: theme === 'dark' ? '#F9FAFB' : '#111827',
                  boxShadow: theme === 'dark' ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: '12px',
                  fontFamily: 'inherit'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="pagu" name="1. Pagu Anggaran" fill={theme === 'dark' ? '#F9FAFB' : '#111827'} radius={[4, 4, 0, 0]} />
              <Bar dataKey="terikat" name="2. Terikat Kontrak" fill="#D97706" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realisasi" name="3. Realisasi Fisik" fill="#0D9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Program & Activities Hierarchy Table (Accessible Data Table Alternative) */}
      <div className="bg-white dark:bg-[#151D2A] rounded-2xl border border-[#E5E7EB] dark:border-[#243042] shadow-tactile overflow-hidden space-y-4 p-5 sm:p-6 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#243042] pb-4">
          <div>
            <h3 className="font-extrabold text-base text-[#111827] dark:text-[#F9FAFB]">
              Hierarki Program & Rincian Kegiatan APBD
            </h3>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
              Tabel data perbendaharaan terverifikasi dengan opsi pelacakan sub-kegiatan
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari program / kode..."
                value={searchTableQuery}
                onChange={e => setSearchTableQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg text-[#111827] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] dark:placeholder:text-[#64748B] focus:outline-none"
              />
            </div>

            <select
              value={selectedSectorFilter}
              onChange={e => setSelectedSectorFilter(e.target.value as any)}
              className="text-xs bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg px-2.5 py-1.5 text-[#111827] dark:text-[#F9FAFB] focus:outline-none font-medium"
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
              <tr className="border-b border-[#E5E7EB] dark:border-[#243042] bg-[#F8F9FA] dark:bg-[#101622] text-[#6B7280] dark:text-[#94A3B8] uppercase text-[10px] font-bold tracking-wider">
                <th className="py-2.5 px-3">Kode Program</th>
                <th className="py-2.5 px-3">Nama Program / Kegiatan</th>
                <th className="py-2.5 px-3">Instansi Pelaksana</th>
                <th className="py-2.5 px-3 text-right">Pagu Resmi</th>
                <th className="py-2.5 px-3 text-right">Terikat Kontrak</th>
                <th className="py-2.5 px-3 text-right">Realisasi (%)</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#243042]">
              {filteredPrograms.map(prog => {
                const isExpanded = expandedProgramId === prog.id;
                const realPct = Math.round((prog.realisasiPenyerapan / prog.paguAnggaran) * 100);

                return (
                  <React.Fragment key={prog.id}>
                    {/* Program Row */}
                    <tr className="hover:bg-[#F9FAFB] dark:hover:bg-[#1C2638] transition-colors group">
                      <td className="py-3 px-3 font-mono-data font-bold text-[#111827] dark:text-[#F9FAFB]">
                        {prog.code}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#111827] dark:text-[#F9FAFB]">
                        {prog.name}
                        <div className="text-[10px] font-normal text-[#6B7280] dark:text-[#94A3B8]">
                          Sektor: {prog.sector} • {prog.projectsCount} Paket Pekerjaan
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#4B5563] dark:text-[#94A3B8]">
                        {prog.responsibleAgency}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-data font-bold text-[#111827] dark:text-[#F9FAFB]">
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
                          className="px-2.5 py-1 rounded bg-[#F3F4F6] dark:bg-[#1F2937] hover:bg-[#E5E7EB] dark:hover:bg-[#334155] text-[#111827] dark:text-[#F9FAFB] text-[11px] font-medium transition-colors"
                        >
                          {isExpanded ? 'Tutup Kegiatan' : 'Rincian Kegiatan'}
                        </button>
                      </td>
                    </tr>

                    {/* Sub-activities Accordion */}
                    {isExpanded && (
                      <tr className="bg-[#F8F9FA]/70 dark:bg-[#101622]/70">
                        <td colSpan={7} className="p-3 pl-8">
                          <div className="space-y-2 border-l-2 border-[#111827] dark:border-[#0D9488] pl-3 py-1">
                            <div className="text-[11px] font-bold text-[#111827] dark:text-[#F9FAFB]">
                              Rincian Sub-Kegiatan di Bawah Program {prog.code}:
                            </div>
                            <div className="space-y-1.5">
                              {prog.activities.map(act => (
                                <div 
                                  key={act.id} 
                                  className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-white dark:bg-[#151D2A] p-2 rounded border border-[#E5E7EB] dark:border-[#243042] gap-1"
                                >
                                  <div>
                                    <span className="font-mono-data font-semibold text-[#6B7280] dark:text-[#94A3B8] mr-2">[{act.code}]</span>
                                    <span className="font-medium text-[#111827] dark:text-[#F9FAFB]">{act.name}</span>
                                  </div>
                                  <div className="flex items-center gap-3 font-mono-data text-[11px]">
                                    <span className="text-[#6B7280] dark:text-[#94A3B8]">Pagu: {formatRupiahShort(act.pagu)}</span>
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

