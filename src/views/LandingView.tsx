import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTitik } from '../context/TitikContext';
import { 
  ACCOUNTABILITY_FUNNEL, 
  CURRENT_MONTHLY_DIGEST,
  formatRupiahShort 
} from '../data/titikRegionalData';
import { MapPin, ChevronRight } from 'lucide-react';

export const LandingView: React.FC = () => {
  const navigate = useNavigate();
  const { 
    facilities, 
    setSelectedFacility, 
    reports,
    discrepancies 
  } = useTitik();

  return (
    <div className="space-y-16 pb-20">
      
      {/* 1. EDITORIAL HERO SECTION */}
      <section className="pt-12 sm:pt-16 pb-6 max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
          Observatorium Layanan Publik & APBD • Kota Bogor
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#111827] tracking-tight leading-[1.08] max-w-4xl mx-auto">
          See the issue. <br className="hidden sm:inline" />
          Trace the budget. <br className="hidden sm:inline" />
          Track the impact<span className="text-[#0D9488]">.</span>
        </h1>

        <p className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
          Setiap fasilitas umum memiliki alokasi anggaran pemeliharaan. Periksa realisasi APBD Kota Bogor di lingkungan Anda, laporkan kerusakan fisik beserta titik koordinatnya, dan pantau perbaikan oleh dinas terkait.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/peta')}
            className="w-full sm:w-auto px-6 py-3 bg-[#111827] hover:bg-[#1F2937] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4 text-[#0D9488]" />
            <span>Buka Peta & Anggaran Wilayah</span>
          </button>

          <button
            onClick={() => navigate('/analisis')}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-[#F3F4F6] text-[#111827] border border-[#E5E7EB] text-sm font-semibold rounded-lg transition-colors"
          >
            Periksa Selisih Serapan & Kondisi Fisik
          </button>
        </div>

        {/* Regional Summary Ledger */}
        <div className="pt-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E7EB] bg-white rounded-xl border border-[#E5E7EB]">
            <div className="p-4 text-left">
              <div className="text-[11px] text-[#6B7280] font-medium">Pagu Terdata (SIKD)</div>
              <div className="text-lg font-extrabold text-[#111827] font-mono-data mt-1">
                Rp 20,5 M
              </div>
              <div className="text-[11px] text-[#4B5563] mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></span>
                <span>9 Sektor Layanan</span>
              </div>
            </div>

            <div className="p-4 text-left">
              <div className="text-[11px] text-[#6B7280] font-medium">Fasilitas Publik</div>
              <div className="text-lg font-extrabold text-[#111827] font-mono-data mt-1">
                {facilities.length} Titik
              </div>
              <div className="text-[11px] text-[#4B5563] mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                <span>6 Kecamatan</span>
              </div>
            </div>

            <div className="p-4 text-left">
              <div className="text-[11px] text-[#6B7280] font-medium">Laporan Warga Aktif</div>
              <div className="text-lg font-extrabold text-[#111827] font-mono-data mt-1">
                {reports.length} Kasus
              </div>
              <div className="text-[11px] text-[#4B5563] mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
                <span>Koordinat & Foto</span>
              </div>
            </div>

            <div className="p-4 text-left">
              <div className="text-[11px] text-[#6B7280] font-medium">Proyek Perlu Audit</div>
              <div className="text-lg font-extrabold text-[#111827] font-mono-data mt-1">
                {discrepancies.length} Paket
              </div>
              <div className="text-[11px] text-[#4B5563] mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
                <span>Serapan vs Keluhan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PUBLIC FACILITY DIRECTORY PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E5E7EB] pb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Profil Fasilitas & Alokasi Pemeliharaan
            </div>
            <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight mt-1">
              Fasilitas Publik dalam Pemantauan Warga
            </h2>
          </div>

          <button
            onClick={() => navigate('/fasilitas')}
            className="text-xs font-semibold text-[#111827] hover:text-[#2563EB] flex items-center gap-1 self-start sm:self-auto transition-colors"
          >
            <span>Lihat Semua Fasilitas ({facilities.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {facilities.slice(0, 4).map(facility => (
            <div
              key={facility.id}
              onClick={() => {
                setSelectedFacility(facility);
                navigate(`/fasilitas/${facility.id}`);
              }}
              className="bg-white rounded-xl border border-[#E5E7EB] hover:border-[#111827] p-4 transition-colors cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="relative h-36 rounded-lg overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6]">
                  <img 
                    src={facility.photoUrl} 
                    alt={facility.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold bg-white/95 text-[#111827] px-2 py-0.5 rounded border border-[#E5E7EB]">
                      {facility.sector}
                    </span>
                    <span className="text-[10px] font-bold bg-[#111827] text-white px-2 py-0.5 rounded font-mono-data">
                      {formatRupiahShort(facility.budgetSummary.paguAnggaran)}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-[#111827] group-hover:text-[#2563EB] transition-colors line-clamp-1">
                    {facility.name}
                  </h3>
                  <div className="text-xs text-[#6B7280] mt-0.5">
                    {facility.subdistrict} • {facility.responsibleAgency}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                <span className="text-[#4B5563] flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    facility.condition === 'Baik' ? 'bg-[#0D9488]' : facility.condition === 'Perlu Intervensi Kritis' ? 'bg-[#DC2626]' : 'bg-[#D97706]'
                  }`}></span>
                  <span>{facility.condition}</span>
                </span>
                <span className="font-mono-data font-semibold text-[#111827]">
                  {facility.activeReportsCount} laporan
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. MONTHLY REPORT ("CATATAN BULANAN") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                Ringkasan Bulanan • {CURRENT_MONTHLY_DIGEST.monthYear}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
                {CURRENT_MONTHLY_DIGEST.headline}
              </h2>
            </div>

            <div className="text-xs text-[#6B7280] font-mono-data self-start sm:self-auto whitespace-nowrap">
              Periode Jan - Okt 2026
            </div>
          </div>

          <p className="text-sm text-[#4B5563] leading-relaxed max-w-4xl">
            {CURRENT_MONTHLY_DIGEST.editorialSummary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E5E7EB] bg-[#F8F9FA] rounded-xl border border-[#E5E7EB]">
            <div className="p-4 space-y-1">
              <div className="text-xs font-semibold text-[#4B5563] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
                <span>Proyek Selesai & Diverifikasi</span>
              </div>
              <div className="text-2xl font-extrabold text-[#111827] font-mono-data">
                {CURRENT_MONTHLY_DIGEST.newCompletedProjects} Paket
              </div>
              <p className="text-xs text-[#6B7280]">
                Termasuk perbaikan IGD Puskesmas Sempur dan jalur pedestrian Kebun Raya.
              </p>
            </div>

            <div className="p-4 space-y-1">
              <div className="text-xs font-semibold text-[#4B5563] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
                <span>Sisa Pagu Belum Terikat Kontrak</span>
              </div>
              <div className="text-2xl font-extrabold text-[#111827] font-mono-data">
                Rp 2,87 Miliar
              </div>
              <p className="text-xs text-[#6B7280]">
                Alokasi APBD yang belum dilelang dan dapat diusulkan untuk perbaikan mendesak.
              </p>
            </div>

            <div className="p-4 space-y-1">
              <div className="text-xs font-semibold text-[#4B5563] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
                <span>Proyek dengan Selisih Temuan</span>
              </div>
              <div className="text-2xl font-extrabold text-[#111827] font-mono-data">
                {CURRENT_MONTHLY_DIGEST.activeDiscrepanciesCount} Lokasi
              </div>
              <p className="text-xs text-[#6B7280]">
                Pencairan kas daerah di atas 50%, tetapi keluhan kerusakan fisik masih berlanjut.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CASE RESOLUTION STAGES (NO PILL SOUP) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="border-b border-[#E5E7EB] pb-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
            Alur Penanganan Laporan
          </div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight mt-1">
            Tahapan Penyelesaian Kasus Warga Kota Bogor
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E7EB] bg-white rounded-xl border border-[#E5E7EB]">
          {ACCOUNTABILITY_FUNNEL.map(item => (
            <div 
              key={item.step}
              className="p-5 space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-[#6B7280] font-mono-data">
                <span>TAHAP 0{item.step}</span>
                <span className="text-[#111827] font-semibold">{item.pct} dari total</span>
              </div>
              
              <div className="text-3xl font-extrabold text-[#111827] font-mono-data pt-1">
                {item.count}
              </div>

              <div className="font-bold text-sm text-[#111827]">
                {item.label}
              </div>

              <p className="text-xs text-[#4B5563] leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. 4-TIER BUDGET CLASSIFICATION (STRICT DAYLIGHT EDITORIAL, NO DARK MODE) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="max-w-3xl space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Struktur Data Keuangan Daerah
            </div>
            <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">
              Empat Kategori Anggaran pada Setiap Fasilitas Publik
            </h2>
            <p className="text-sm text-[#4B5563] leading-relaxed">
              Selisih antara pagu anggaran dan realisasi kas tidak otomatis menjadi dana bebas. TITIK memisahkan data anggaran ke dalam empat status sesuai Bagan Akun Standar (BAS) Permendagri No. 77/2020:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono-data text-[#6B7280]">
                <span className="w-2 h-2 rounded-full bg-[#111827]"></span>
                <span>01 • ALOKASI</span>
              </div>
              <h4 className="font-bold text-sm text-[#111827]">1. Pagu Anggaran</h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Batas tertinggi anggaran yang disetujui DPRD dan Pemerintah Kota Bogor dalam dokumen APBD tahun berjalan.
              </p>
            </div>

            <div className="p-4 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono-data text-[#6B7280]">
                <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
                <span>02 • KOMITMEN</span>
              </div>
              <h4 className="font-bold text-sm text-[#111827]">2. Dana Terikat Kontrak</h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Nilai anggaran yang sudah tercantum dalam Surat Perjanjian Kerja (SPK) dengan kontraktor pelaksana proyek.
              </p>
            </div>

            <div className="p-4 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono-data text-[#6B7280]">
                <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
                <span>03 • PENCAIRAN</span>
              </div>
              <h4 className="font-bold text-sm text-[#111827]">3. Realisasi Penyerapan</h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Dana yang telah dibayarkan Kas Daerah kepada kontraktor berdasarkan berita acara pemeriksaan kemajuan fisik.
              </p>
            </div>

            <div className="p-4 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono-data text-[#6B7280]">
                <span className="w-2 h-2 rounded-full bg-[#6B7280]"></span>
                <span>04 • SELISIH PAGU</span>
              </div>
              <h4 className="font-bold text-sm text-[#111827]">4. Sisa Belum Terikat</h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Sisa pagu yang belum dikontrakkan. Penggunaan dana ini memerlukan prosedur lelang atau perubahan penjabaran APBD.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
