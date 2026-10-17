import React from 'react';
import { useTitik } from '../context/TitikContext';
import { DiscrepancyDetector } from '../components/DiscrepancyDetector';
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

export const DiscrepancyView: React.FC = () => {
  const { discrepancies, theme } = useTitik();

  const chartData = [
    { name: 'Drainase Pajajaran', serapanKas: 95, keluhanWarga: 9 },
    { name: 'SDN Menteng 01', serapanKas: 56, keluhanWarga: 4 },
    { name: 'Jembatan Cibalok', serapanKas: 22, keluhanWarga: 7 },
    { name: 'Puskesmas Sempur', serapanKas: 91, keluhanWarga: 1 },
    { name: 'Pedestrian Kebun Raya', serapanKas: 97, keluhanWarga: 2 }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Editorial Masthead */}
      <div className="bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-6 sm:p-8 space-y-3 transition-colors">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8]">
          Evaluasi Pelaksanaan Proyek • Jabodetabek 2026
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-[#F9FAFB] tracking-tight">
          Selisih Pencairan Anggaran dan Kondisi Fisik Lapangan
        </h1>

        {/* Visual KPI Strip: Less Text, More Show */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 bg-[#FEF2F2] dark:bg-[#7F1D1D]/20 border border-[#FCA5A5] dark:border-[#991B1B] rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono-data font-bold uppercase text-[#991B1B] dark:text-[#FCA5A5]">Anomali Kritis</span>
              <div className="text-xl font-extrabold font-mono-data text-[#DC2626] dark:text-[#F87171]">3 Proyek</div>
              <span className="text-[11px] text-[#7F1D1D] dark:text-[#FCA5A5]/80">Serapan &gt;80% • Aduan &ge;4</span>
            </div>
            <span className="text-xs px-2 py-1 bg-[#DC2626] text-white font-bold rounded-lg font-mono-data">Prioritas 1</span>
          </div>

          <div className="p-3.5 bg-[#FFFBEB] dark:bg-[#78350F]/20 border border-[#FCD34D] dark:border-[#B45309] rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono-data font-bold uppercase text-[#92400E] dark:text-[#FCD34D]">Rata-rata Deviasi</span>
              <div className="text-xl font-extrabold font-mono-data text-[#D97706] dark:text-[#FBBF24]">+36%</div>
              <span className="text-[11px] text-[#92400E] dark:text-[#FCD34D]/80">Selisih Kas vs Fisik</span>
            </div>
            <span className="text-xs px-2 py-1 bg-[#D97706] text-white font-bold rounded-lg font-mono-data">Audit BAP</span>
          </div>

          <div className="p-3.5 bg-[#F0FDFA] dark:bg-[#134E4A]/20 border border-[#99F6E4] dark:border-[#115E59] rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono-data font-bold uppercase text-[#115E59] dark:text-[#99F6E4]">Laporan Warga</span>
              <div className="text-xl font-extrabold font-mono-data text-[#0D9488] dark:text-[#2DD4BF]">18 Kasus</div>
              <span className="text-[11px] text-[#134E4A] dark:text-[#99F6E4]/80">Koordinat Geotag Sah</span>
            </div>
            <span className="text-xs px-2 py-1 bg-[#0D9488] text-white font-bold rounded-lg font-mono-data">Tervalidasi</span>
          </div>
        </div>
      </div>

      {/* Comparative Chart */}
      <div className="bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-6 space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] dark:border-[#243042] pb-4">
          <div>
            <h3 className="font-bold text-base text-[#111827] dark:text-[#F9FAFB]">
              Perbandingan Persentase Dana Cair (%) dan Jumlah Laporan Warga
            </h3>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
              Sampel fasilitas publik di wilayah Jabodetabek per Kuartal IV 2026
            </p>
          </div>
          <span className="text-xs font-mono-data text-[#6B7280] dark:text-[#94A3B8]">
            Sumber: Simulasi SIKD & Laporan Warga
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke={theme === 'dark' ? '#243042' : '#F3F4F6'} 
              />
              <XAxis 
                dataKey="name" 
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
              <Legend 
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
              />
              <Bar 
                dataKey="serapanKas" 
                name="Dana Proyek Cair (%)" 
                fill={theme === 'dark' ? '#F9FAFB' : '#111827'} 
                radius={[4, 4, 0, 0]} 
              />
              <Bar 
                dataKey="keluhanWarga" 
                name="Laporan Kerusakan Aktif" 
                fill="#DC2626" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Discrepancy List */}
      <DiscrepancyDetector discrepancies={discrepancies} showAllLink={false} />

      {/* Audit Follow-up Procedure: Visual Pipeline */}
      <div className="bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-6 space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] dark:border-[#243042] pb-3">
          <div>
            <h3 className="font-bold text-base text-[#111827] dark:text-[#F9FAFB]">
              Alur Tindak Lanjut Temuan Lapangan
            </h3>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
              Mekanisme eskalasi data warga menuju audit fisik resmi
            </p>
          </div>
          <span className="text-xs font-mono-data text-[#0D9488] bg-[#0D9488]/10 px-2.5 py-1 rounded-full font-bold">
            Standar SIKD & PPK 2026
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#F8F9FA] dark:bg-[#101622] rounded-xl border border-[#E5E7EB] dark:border-[#243042] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono-data text-[10px] font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase">Tahap 01</span>
              <span className="text-[10px] font-mono-data font-bold text-[#0D9488] bg-[#0D9488]/10 px-2 py-0.5 rounded">Geotag Sah</span>
            </div>
            <div className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB]">Verifikasi Geotag & Kluster</div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] px-2 py-1 rounded font-mono-data text-[#111827] dark:text-[#F9FAFB]">GPS ±3.2m</span>
              <span className="text-[10px] bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] px-2 py-1 rounded font-mono-data text-[#111827] dark:text-[#F9FAFB]">Foto Fisik WIA</span>
              <span className="text-[10px] bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] px-2 py-1 rounded font-mono-data text-[#0D9488]">Agregasi Titik</span>
            </div>
          </div>

          <div className="p-4 bg-[#F8F9FA] dark:bg-[#101622] rounded-xl border border-[#E5E7EB] dark:border-[#243042] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono-data text-[10px] font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase">Tahap 02</span>
              <span className="text-[10px] font-mono-data font-bold text-[#D97706] bg-[#D97706]/10 px-2 py-0.5 rounded">Investigasi PPK</span>
            </div>
            <div className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB]">Uji Lapangan Inspektorat</div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] px-2 py-1 rounded font-mono-data text-[#111827] dark:text-[#F9FAFB]">BAP Fisik</span>
              <span className="text-[10px] bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] px-2 py-1 rounded font-mono-data text-[#111827] dark:text-[#F9FAFB]">Klarifikasi Termin</span>
              <span className="text-[10px] bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] px-2 py-1 rounded font-mono-data text-[#D97706]">Uji Mutu Beton</span>
            </div>
          </div>

          <div className="p-4 bg-[#F8F9FA] dark:bg-[#101622] rounded-xl border border-[#E5E7EB] dark:border-[#243042] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono-data text-[10px] font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase">Tahap 03</span>
              <span className="text-[10px] font-mono-data font-bold text-[#DC2626] bg-[#DC2626]/10 px-2 py-0.5 rounded">Klaim Garansi</span>
            </div>
            <div className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB]">Perbaikan Masa Garansi</div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] px-2 py-1 rounded font-mono-data text-[#111827] dark:text-[#F9FAFB]">Retensi 5% Ditahan</span>
              <span className="text-[10px] bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] px-2 py-1 rounded font-mono-data text-[#111827] dark:text-[#F9FAFB]">SPK Pemeliharaan</span>
              <span className="text-[10px] bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] px-2 py-1 rounded font-mono-data text-[#DC2626]">Audit Ulang</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
