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
  const { discrepancies } = useTitik();

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
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 sm:p-8 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
          Evaluasi Pelaksanaan Proyek • Kota Bogor 2026
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
          Selisih Pencairan Anggaran dan Kondisi Fisik Lapangan
        </h1>

        <p className="text-sm text-[#4B5563] max-w-3xl leading-relaxed">
          Pencairan anggaran yang tinggi pada laporan keuangan daerah belum tentu menandakan masalah di lapangan selesai. Halaman ini membandingkan persentase dana proyek yang telah cair dengan jumlah laporan kerusakan yang dikirim warga di lokasi yang sama.
        </p>
      </div>

      {/* Comparative Chart */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-4">
          <div>
            <h3 className="font-bold text-base text-[#111827]">
              Perbandingan Persentase Dana Cair (%) dan Jumlah Laporan Warga
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Lima sampel fasilitas publik di Kota Bogor per Kuartal IV 2026
            </p>
          </div>
          <span className="text-xs font-mono-data text-[#6B7280]">
            Sumber: Simulasi SIKD & Laporan Warga
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis 
                dataKey="name" 
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
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
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
                fill="#111827" 
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

      {/* Audit Follow-up Procedure */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 sm:p-8 space-y-5">
        <div className="border-b border-[#E5E7EB] pb-3">
          <h3 className="font-bold text-base text-[#111827]">
            Prosedur Tindak Lanjut Temuan Lapangan
          </h3>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Bagaimana laporan warga digunakan dalam pengawasan proyek daerah
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E5E7EB] bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] text-xs text-[#4B5563]">
          <div className="p-4 space-y-1.5">
            <div className="font-mono-data text-[11px] text-[#6B7280]">TAHAP 01</div>
            <div className="font-bold text-sm text-[#111827]">Pengumpulan Bukti Koordinat</div>
            <p className="leading-relaxed">
              Warga di sekitar lokasi proyek mengirim foto kerusakan disertai koordinat GPS. Laporan pada fasilitas yang sama digabungkan agar jumlah warga terdampak terlihat jelas.
            </p>
          </div>

          <div className="p-4 space-y-1.5">
            <div className="font-mono-data text-[11px] text-[#6B7280]">TAHAP 02</div>
            <div className="font-bold text-sm text-[#111827]">Pemeriksaan Fisik Inspektorat</div>
            <p className="leading-relaxed">
              Apabila proyek yang sudah mencairkan termin anggaran masih menerima laporan kerusakan berulang, Inspektorat Daerah menjadwalkan pemeriksaan fisik bersama Pejabat Pembuat Komitmen (PPK).
            </p>
          </div>

          <div className="p-4 space-y-1.5">
            <div className="font-mono-data text-[11px] text-[#6B7280]">TAHAP 03</div>
            <div className="font-bold text-sm text-[#111827]">Perbaikan Masa Pemeliharaan</div>
            <p className="leading-relaxed">
              Kontraktor pelaksana wajib memperbaiki kerusakan selama masa pemeliharaan kontrak sebelum jaminan pemeliharaan dicairkan oleh pemerintah daerah.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
