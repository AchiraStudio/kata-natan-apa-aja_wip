import React from 'react';
import { useTitik } from '../context/TitikContext';
import { X, ShieldCheck, Database } from 'lucide-react';

export const DataSourceModal: React.FC = () => {
  const { isDataSourceModalOpen, setIsDataSourceModalOpen } = useTitik();

  if (!isDataSourceModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#111827]/30 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-6"
      onClick={() => setIsDataSourceModalOpen(false)}
    >
      <div
        className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xl max-w-2xl w-full overflow-hidden transition-all flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#111827] text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#111827] tracking-tight">
                Sumber Data & Metodologi SIKD
              </h3>
              <p className="text-xs text-[#6B7280]">
                Rincian sumber data, batas simulasi kompetisi, dan klasifikasi bukti
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDataSourceModalOpen(false)}
            className="p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-[#4B5563] leading-relaxed">
          
          {/* Important Notice */}
          <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-1.5">
            <div className="font-bold text-sm text-[#111827] flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#2563EB]" />
              <span>Konteks Simulasi Kompetisi MIA / WIA 2026</span>
            </div>
            <p className="text-xs text-[#4B5563]">
              <strong>TITIK.</strong> menggunakan struktur anggaran dan fasilitas publik Kota Bogor sesuai <em>Bagan Akun Standar (BAS) Permendagri No. 77/2020</em>. Angka anggaran, nama paket kontrak, dan laporan warga pada prototipe ini merupakan simulasi untuk mendemonstrasikan pelacakan anggaran publik.
            </p>
          </div>

          {/* 4 Data Integrity Classes */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#111827] uppercase tracking-wider text-[11px]">
              Empat Kategori Data di TITIK.
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono-data font-bold uppercase tracking-wider text-[#111827]">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                  <span>1. Data APBD (Simulasi SIKD)</span>
                </div>
                <div className="font-bold text-xs text-[#111827]">Alokasi & Realisasi Kas</div>
                <p className="text-[11px] text-[#6B7280]">
                  Pagu anggaran, nilai kontrak LPSE, dana cair (SP2D), dan sisa anggaran mengendap.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono-data font-bold uppercase tracking-wider text-[#111827]">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
                  <span>2. Laporan Warga</span>
                </div>
                <div className="font-bold text-xs text-[#111827]">Bukti Foto & Geotag</div>
                <p className="text-[11px] text-[#6B7280]">
                  Aduan kondisi fisik fasilitas yang dikirim warga beserta koordinat lokasi.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono-data font-bold uppercase tracking-wider text-[#111827]">
                  <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
                  <span>3. Tautan Anggaran</span>
                </div>
                <div className="font-bold text-xs text-[#111827]">Pencocokan Lokasi & Paket</div>
                <p className="text-[11px] text-[#6B7280]">
                  Hubungan antara lokasi kerusakan dengan paket proyek atau pos pemeliharaan dinas terkait.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono-data font-bold uppercase tracking-wider text-[#111827]">
                  <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
                  <span>4. Temuan Audit</span>
                </div>
                <div className="font-bold text-xs text-[#111827]">Indikator Pemeriksaan</div>
                <p className="text-[11px] text-[#6B7280]">
                  Selisih antara serapan anggaran dan kondisi fisik yang memerlukan pemeriksaan Inspektorat.
                </p>
              </div>
            </div>
          </div>

          {/* Transparency Principles */}
          <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2">
            <h5 className="font-bold text-xs text-[#111827]">Prinsip Verifikasi Kasus:</h5>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#6B7280]">
              <li>Selisih data ditampilkan sebagai indikator pemeriksaan lapangan, bukan vonis hukum.</li>
              <li>Tanggapan resmi dinas dan kontraktor dicatat pada <strong>Tahap 5: Tindak Lanjut Instansi</strong>.</li>
              <li>Kasus dinyatakan selesai setelah warga pelapor mengonfirmasi hasil perbaikan fisik di lapangan (Tahap 6).</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F8F9FA] border-t border-[#E5E7EB] flex items-center justify-between">
          <span className="text-[11px] text-[#6B7280] font-mono-data">
            BAS Permendagri 77/2020 • WIA 2026
          </span>
          <button
            onClick={() => setIsDataSourceModalOpen(false)}
            className="px-4 py-2 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
