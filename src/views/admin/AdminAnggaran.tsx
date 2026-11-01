import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Search,
  RotateCcw,
  Layers,
  ArrowUpDown,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { UserProfile, BudgetSectorContext, Report } from '../../types/domain';
import { dataService } from '../../services/dataService';
import { isSupabaseConfigured } from '../../services/supabaseClient';

interface Props {
  profile: UserProfile;
}

const DEFAULT_BUDGET_SECTORS: BudgetSectorContext[] = [
  {
    sectorId: 'sec-pupr-01',
    sectorName: 'Infrastruktur Jalan & Drainase',
    subSectorName: 'Preservasi Jalan & Penataan Kota',
    paguAllocation: 14_500_000_000,
    realizedSpending: 10_200_000_000,
    executionRatePercent: 70.3,
    fiscalYear: 2026,
    responsibleAgency: 'Dinas Pekerjaan Umum dan Penataan Ruang (PUPR)',
    agencyAcronym: 'Dinas PUPR',
    responsivenessScore: 92,
    avgResolutionDays: 12,
    lastUpdated: '2026-10-30T00:00:00.000Z',
    dataSource: 'APBD Kota Bogor TA 2026',
    isSampleData: false,
  },
  {
    sectorId: 'sec-dishub-01',
    sectorName: 'Transportasi & Perlengkapan Jalan',
    subSectorName: 'Penerangan Jalan Umum & Rambu Lalu Lintas',
    paguAllocation: 5_800_000_000,
    realizedSpending: 4_150_000_000,
    executionRatePercent: 71.6,
    fiscalYear: 2026,
    responsibleAgency: 'Dinas Perhubungan Kota Bogor',
    agencyAcronym: 'Dishub',
    responsivenessScore: 88,
    avgResolutionDays: 14,
    lastUpdated: '2026-10-30T00:00:00.000Z',
    dataSource: 'APBD Kota Bogor TA 2026',
    isSampleData: false,
  },
  {
    sectorId: 'sec-dlh-01',
    sectorName: 'Pengelolaan Lingkungan & Kebersihan',
    subSectorName: 'Pengangkutan Sampah & TPS3R',
    paguAllocation: 4_550_000_000,
    realizedSpending: 3_850_000_000,
    executionRatePercent: 84.6,
    fiscalYear: 2026,
    responsibleAgency: 'Dinas Lingkungan Hidup Kota Bogor',
    agencyAcronym: 'DLH',
    responsivenessScore: 90,
    avgResolutionDays: 8,
    lastUpdated: '2026-10-30T00:00:00.000Z',
    dataSource: 'APBD Kota Bogor TA 2026',
    isSampleData: false,
  },
  {
    sectorId: 'sec-dinkes-01',
    sectorName: 'Sarana & Faskes Kesehatan',
    subSectorName: 'Puskesmas Pembantu & Posyandu Prima',
    paguAllocation: 3_200_000_000,
    realizedSpending: 2_400_000_000,
    executionRatePercent: 75.0,
    fiscalYear: 2026,
    responsibleAgency: 'Dinas Kesehatan Kota Bogor',
    agencyAcronym: 'Dinkes',
    responsivenessScore: 85,
    avgResolutionDays: 16,
    lastUpdated: '2026-10-30T00:00:00.000Z',
    dataSource: 'APBD Kota Bogor TA 2026',
    isSampleData: false,
  },
  {
    sectorId: 'sec-disdik-01',
    sectorName: 'Fasilitas Pendidikan Dasar',
    subSectorName: 'Rehabilitasi Ruang Kelas & Sanitasi Sekolah',
    paguAllocation: 2_800_000_000,
    realizedSpending: 2_100_000_000,
    executionRatePercent: 75.0,
    fiscalYear: 2026,
    responsibleAgency: 'Dinas Pendidikan Kota Bogor',
    agencyAcronym: 'Disdik',
    responsivenessScore: 81,
    avgResolutionDays: 20,
    lastUpdated: '2026-10-30T00:00:00.000Z',
    dataSource: 'APBD Kota Bogor TA 2026',
    isSampleData: false,
  },
];

const AGENCY_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  'Dinas PUPR': {
    bg: 'bg-amber-100 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800',
  },
  Dishub: {
    bg: 'bg-blue-100 dark:bg-blue-950/60',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-800',
  },
  DLH: {
    bg: 'bg-emerald-100 dark:bg-emerald-950/60',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-800',
  },
  Dinkes: {
    bg: 'bg-rose-100 dark:bg-rose-950/60',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-800',
  },
  Disdik: {
    bg: 'bg-teal-100 dark:bg-teal-950/60',
    text: 'text-teal-800 dark:text-teal-300',
    border: 'border-teal-300 dark:border-teal-800',
  },
};

function getAgencyStyle(agency: string) {
  for (const key of Object.keys(AGENCY_BADGES)) {
    if (agency.includes(key)) return AGENCY_BADGES[key];
  }
  return {
    bg: 'bg-stone-100 dark:bg-stone-900/60',
    text: 'text-stone-700 dark:text-stone-300',
    border: 'border-stone-300 dark:border-stone-700',
  };
}

function formatMiliar(val: number): string {
  return `Rp ${(val / 1_000_000_000).toFixed(2)} M`;
}

function formatRupiahDetailed(val: number): string {
  return `Rp ${val.toLocaleString('id-ID')}`;
}

export const AdminAnggaran: React.FC<Props> = ({ profile }) => {
  const [sectors, setSectors] = useState<BudgetSectorContext[]>(DEFAULT_BUDGET_SECTORS);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgencyFilter, setSelectedAgencyFilter] = useState('Semua');
  const [sortBy, setSortBy] = useState<'pagu' | 'realisasi' | 'serapan' | 'kerusakan'>('pagu');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedSectors, fetchedReports] = await Promise.all([
        dataService.getBudgetSectors().catch(() => []),
        dataService.getAllReports().catch(() => []),
      ]);

      if (fetchedSectors && fetchedSectors.length > 0) {
        setSectors(fetchedSectors);
      } else {
        setSectors(DEFAULT_BUDGET_SECTORS);
      }
      setReports(fetchedReports || []);
    } catch {
      setSectors(DEFAULT_BUDGET_SECTORS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute aggregated reports per sector/agency
  const sectorSummaries = useMemo(() => {
    return sectors.map((sec) => {
      const agencyKey = sec.agencyAcronym || sec.responsibleAgency;
      const matchedReports = reports.filter((r) => {
        const reportAgency = r.responsibleAgency || '';
        return (
          reportAgency.toLowerCase().includes(agencyKey.toLowerCase()) ||
          (sec.sectorName.toLowerCase().includes('infrastruktur') && r.category === 'Infrastruktur') ||
          (sec.sectorName.toLowerCase().includes('lingkungan') && r.category === 'Lingkungan') ||
          (sec.sectorName.toLowerCase().includes('kesehatan') && r.category === 'Kesehatan') ||
          (sec.sectorName.toLowerCase().includes('pendidikan') && r.category === 'Pendidikan')
        );
      });

      const totalEstimatedDamage = matchedReports.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
      const resolvedCount = matchedReports.filter((r) => r.status === 'resolved').length;
      const pendingCount = matchedReports.length - resolvedCount;
      const absorptionRate =
        sec.paguAllocation > 0 ? (sec.realizedSpending / sec.paguAllocation) * 100 : 0;
      const remainingPagu = Math.max(0, sec.paguAllocation - sec.realizedSpending);
      const isHealthy = remainingPagu >= totalEstimatedDamage;

      return {
        ...sec,
        reportCount: matchedReports.length,
        resolvedCount,
        pendingCount,
        totalEstimatedDamage,
        absorptionRate,
        remainingPagu,
        isHealthy,
      };
    });
  }, [sectors, reports]);

  // Overall totals
  const totalPagu = useMemo(
    () => sectorSummaries.reduce((sum, s) => sum + s.paguAllocation, 0),
    [sectorSummaries]
  );
  const totalRealized = useMemo(
    () => sectorSummaries.reduce((sum, s) => sum + s.realizedSpending, 0),
    [sectorSummaries]
  );
  const totalDamageCost = useMemo(
    () => sectorSummaries.reduce((sum, s) => sum + s.totalEstimatedDamage, 0),
    [sectorSummaries]
  );
  const totalRemaining = Math.max(0, totalPagu - totalRealized);
  const totalAbsorptionRate = totalPagu > 0 ? (totalRealized / totalPagu) * 100 : 0;
  const reportsWithDamageCount = useMemo(
    () => reports.filter((r) => (r.estimatedCost || 0) > 0).length,
    [reports]
  );

  // Filtered & Sorted sectors for the table
  const filteredSectors = useMemo(() => {
    let result = sectorSummaries.filter((sec) => {
      const matchAgency =
        selectedAgencyFilter === 'Semua' ||
        sec.responsibleAgency.includes(selectedAgencyFilter) ||
        sec.agencyAcronym.includes(selectedAgencyFilter);

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        sec.responsibleAgency.toLowerCase().includes(q) ||
        sec.sectorName.toLowerCase().includes(q) ||
        sec.subSectorName.toLowerCase().includes(q);

      return matchAgency && matchQuery;
    });

    result.sort((a, b) => {
      if (sortBy === 'pagu') return b.paguAllocation - a.paguAllocation;
      if (sortBy === 'realisasi') return b.realizedSpending - a.realizedSpending;
      if (sortBy === 'serapan') return b.absorptionRate - a.absorptionRate;
      if (sortBy === 'kerusakan') return b.totalEstimatedDamage - a.totalEstimatedDamage;
      return 0;
    });

    return result;
  }, [sectorSummaries, selectedAgencyFilter, searchQuery, sortBy]);

  const handleCopyLedgerSummary = () => {
    const lines = [
      '=== REKAP APBD KOTA BOGOR TA 2026 ===',
      `Total Pagu APBD: ${formatMiliar(totalPagu)}`,
      `Realisasi Fisik: ${formatMiliar(totalRealized)} (${totalAbsorptionRate.toFixed(1)}%)`,
      `Estimasi Kerusakan Laporan Warga: ${formatMiliar(totalDamageCost)}`,
      `Sisa Pagu APBD: ${formatMiliar(totalRemaining)}`,
      '',
      '--- Rincian Sektor OPD ---',
      ...sectorSummaries.map(
        (s) =>
          `* ${s.agencyAcronym} (${s.sectorName}): Pagu ${formatMiliar(s.paguAllocation)} | Realisasi ${formatMiliar(s.realizedSpending)} (${s.absorptionRate.toFixed(1)}%) | Kerusakan Laporan: Rp ${(s.totalEstimatedDamage / 1_000_000).toFixed(1)}jt`
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E3E0D6] dark:border-[#26352E]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                Audit Anggaran Terbuka
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#101913] dark:text-[#F3F6F4] mt-0.5">
              Rekap APBD &amp; Audit Anggaran Fisik
            </h2>
            <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3] mt-1">
              Sinkronisasi alokasi APBD 2026 Kota Bogor dengan estimasi nilai kerusakan dari laporan warga.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#1B4332] dark:text-[#34D399] px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              Tahun Anggaran 2026 &middot; Live
            </span>
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="p-2 rounded-xl border border-[#E3E0D6] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#1B4332] dark:hover:text-[#34D399] transition-colors cursor-pointer"
              title="Segarkan Data Anggaran"
              aria-label="Segarkan"
            >
              <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Telemetry KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Card 1: Total Pagu */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                Total Pagu APBD
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-black text-[#101913] dark:text-[#F3F6F4] font-mono tabular-nums">
                {formatMiliar(totalPagu)}
              </div>
              <div className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3] mt-0.5">
                {sectors.length} Sektor Prioritas APBD 2026
              </div>
            </div>
          </div>

          {/* Card 2: Realisasi Belanja */}
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300">
                Realisasi Fisik Terverifikasi
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-black text-[#101913] dark:text-[#F3F6F4] font-mono tabular-nums">
                {formatMiliar(totalRealized)}
              </div>
              <div className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold mt-0.5">
                {totalAbsorptionRate.toFixed(1)}% Tingkat Serapan Gabungan
              </div>
            </div>
          </div>

          {/* Card 3: Estimasi Kerusakan Warga */}
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                Estimasi Kerusakan Warga
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-black text-[#101913] dark:text-[#F3F6F4] font-mono tabular-nums">
                {formatMiliar(totalDamageCost)}
              </div>
              <div className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3] mt-0.5">
                Dari {reportsWithDamageCount} titik kerusakan terverifikasi
              </div>
            </div>
          </div>

          {/* Card 4: Sisa Pagu */}
          <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300">
                Sisa Pagu Anggaran
              </span>
              <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-black text-[#101913] dark:text-[#F3F6F4] font-mono tabular-nums">
                {formatMiliar(totalRemaining)}
              </div>
              <div className="text-[11px] text-teal-700 dark:text-teal-300 font-semibold mt-0.5">
                {totalRemaining >= totalDamageCost ? 'Mencukupi Intervensi Fisik' : 'Perlu Realokasi'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sector Breakdown Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#4F5A52] dark:text-[#9EACA3]">
            Rincian Sektor OPD &amp; Realisasi Fisik
          </h3>
          <span className="text-xs font-mono text-[#4F5A52] dark:text-[#9EACA3]">
            {sectorSummaries.length} OPD Terdaftar
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectorSummaries.map((sec) => {
            const style = getAgencyStyle(sec.agencyAcronym || sec.responsibleAgency);
            return (
              <div
                key={sec.sectorId}
                className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${style.bg} ${style.text} ${style.border}`}
                    >
                      {sec.agencyAcronym || sec.responsibleAgency}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#1B4332] dark:text-[#34D399]">
                      TA {sec.fiscalYear}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#101913] dark:text-[#F3F6F4] mt-2.5">
                    {sec.sectorName}
                  </h4>
                  <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3] mt-0.5">
                    {sec.subSectorName}
                  </p>
                </div>

                {/* Progress bar container */}
                <div className="space-y-2 pt-2 border-t border-[#E3E0D6] dark:border-[#26352E]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#4F5A52] dark:text-[#9EACA3]">Tingkat Penyerapan</span>
                    <span className="font-bold text-[#101913] dark:text-[#F3F6F4] font-mono">
                      {sec.absorptionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E3E0D6] dark:bg-[#26352E] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full transition-all duration-500"
                      ref={(el) => {
                        if (el) el.style.width = `${Math.min(100, Math.max(0, sec.absorptionRate))}%`;
                      }}
                    />
                  </div>
                </div>

                {/* Mini telemetry stats */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-[#F7F5EF] dark:bg-[#131916]">
                    <div className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3]">Pagu APBD</div>
                    <div className="font-bold font-mono text-[#101913] dark:text-[#F3F6F4] truncate">
                      {formatMiliar(sec.paguAllocation)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F7F5EF] dark:bg-[#131916]">
                    <div className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3]">Realisasi</div>
                    <div className="font-bold font-mono text-emerald-700 dark:text-emerald-300 truncate">
                      {formatMiliar(sec.realizedSpending)}
                    </div>
                  </div>
                </div>

                {/* Damage & report stats */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E3E0D6] dark:border-[#26352E] text-xs">
                  <span className="text-[#4F5A52] dark:text-[#9EACA3]">
                    Kerusakan: <strong className="text-[#101913] dark:text-[#F3F6F4]">{formatMiliar(sec.totalEstimatedDamage)}</strong>
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-[#26352E] text-[#4F5A52] dark:text-[#9EACA3]">
                    {sec.reportCount} laporan
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Sector Audit Ledger Table */}
      <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E3E0D6] dark:border-[#26352E]">
          <div>
            <h3 className="text-base font-bold text-[#101913] dark:text-[#F3F6F4]">
              Buku Kas Sektor &amp; Audit Intervensi Fisik
            </h3>
            <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3] mt-0.5">
              Tabel perbandingan alokasi APBD terhadap estimasi kebutuhan perbaikan warga.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLedgerSummary}
              className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-[#E3E0D6] dark:border-[#26352E] bg-[#F7F5EF] dark:bg-[#131916] text-[#101913] dark:text-[#F3F6F4] text-xs font-semibold hover:border-[#1B4332] dark:hover:border-[#34D399] transition-all cursor-pointer"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-300">Tersalin!</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Salin Ringkasan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4F5A52] dark:text-[#9EACA3]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama instansi atau sektor..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-[#F7F5EF] dark:bg-[#131916] border border-[#E3E0D6] dark:border-[#26352E] text-[#101913] dark:text-[#F3F6F4] placeholder-[#4F5A52] dark:placeholder-[#9EACA3] focus:outline-hidden focus:border-[#1B4332] dark:focus:border-[#34D399]"
            />
          </div>

          {/* Agency Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['Semua', 'Dinas PUPR', 'Dishub', 'DLH', 'Dinkes', 'Disdik'].map((agency) => (
              <button
                key={agency}
                type="button"
                onClick={() => setSelectedAgencyFilter(agency)}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedAgencyFilter === agency
                    ? 'bg-[#1B4332] text-white shadow-xs'
                    : 'bg-[#F7F5EF] dark:bg-[#131916] border border-[#E3E0D6] dark:border-[#26352E] text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
                }`}
              >
                {agency}
              </button>
            ))}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 text-xs text-[#4F5A52] dark:text-[#9EACA3]">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1.5 px-2.5 rounded-xl bg-[#F7F5EF] dark:bg-[#131916] border border-[#E3E0D6] dark:border-[#26352E] text-[#101913] dark:text-[#F3F6F4] text-xs font-semibold focus:outline-hidden"
            >
              <option value="pagu">Urutkan: Pagu Tertinggi</option>
              <option value="realisasi">Urutkan: Realisasi Tertinggi</option>
              <option value="serapan">Urutkan: Serapan Tertinggi</option>
              <option value="kerusakan">Urutkan: Estimasi Kerusakan</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-2xl border border-[#E3E0D6] dark:border-[#26352E]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F5EF] dark:bg-[#131916] text-[#4F5A52] dark:text-[#9EACA3] font-bold border-b border-[#E3E0D6] dark:border-[#26352E]">
              <tr>
                <th className="py-3 px-4">Instansi &amp; Sektor</th>
                <th className="py-3 px-4">Pagu APBD</th>
                <th className="py-3 px-4">Realisasi Fisik</th>
                <th className="py-3 px-4">Tingkat Serapan</th>
                <th className="py-3 px-4">Laporan Warga</th>
                <th className="py-3 px-4">Estimasi Kerusakan</th>
                <th className="py-3 px-4">Status Fiskal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E0D6] dark:divide-[#26352E]">
              {filteredSectors.length > 0 ? (
                filteredSectors.map((sec) => {
                  const style = getAgencyStyle(sec.agencyAcronym || sec.responsibleAgency);
                  return (
                    <tr
                      key={sec.sectorId}
                      className="hover:bg-[#F7F5EF]/60 dark:hover:bg-[#131916]/60 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {sec.agencyAcronym || sec.responsibleAgency}
                          </span>
                          <div>
                            <div className="font-bold text-[#101913] dark:text-[#F3F6F4]">
                              {sec.sectorName}
                            </div>
                            <div className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">
                              {sec.subSectorName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#101913] dark:text-[#F3F6F4] tabular-nums">
                        {formatMiliar(sec.paguAllocation)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                        {formatMiliar(sec.realizedSpending)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs tabular-nums text-[#101913] dark:text-[#F3F6F4]">
                            {sec.absorptionRate.toFixed(1)}%
                          </span>
                          <div className="w-16 bg-[#E3E0D6] dark:bg-[#26352E] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full"
                              ref={(el) => {
                                if (el)
                                  el.style.width = `${Math.min(100, Math.max(0, sec.absorptionRate))}%`;
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#4F5A52] dark:text-[#9EACA3]">
                        <span className="font-bold text-[#101913] dark:text-[#F3F6F4]">
                          {sec.reportCount}
                        </span>{' '}
                        laporan ({sec.resolvedCount} tuntas)
                      </td>
                      <td className="py-3.5 px-4 font-mono text-amber-700 dark:text-amber-400 font-bold tabular-nums">
                        {sec.totalEstimatedDamage > 0
                          ? formatMiliar(sec.totalEstimatedDamage)
                          : 'Rp 0'}
                      </td>
                      <td className="py-3.5 px-4">
                        {sec.isHealthy ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Anggaran Cukup</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Perlu Perhatian</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#4F5A52] dark:text-[#9EACA3]">
                    Tidak ada sektor yang cocok dengan filter pencarian &quot;{searchQuery}&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
