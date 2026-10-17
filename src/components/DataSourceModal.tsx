import React from 'react';
import { useTitik } from '../context/TitikContext';
import { X, ShieldCheck, Database, FileText, AlertCircle, ExternalLink } from 'lucide-react';

export const DataSourceModal: React.FC = () => {
  const { isDataSourceModalOpen, setIsDataSourceModalOpen } = useTitik();

  if (!isDataSourceModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-2xl w-full overflow-hidden transition-all flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0D9488] text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#111827] tracking-tight">
                Transparansi Data & Metodologi SIKD
              </h3>
              <p className="text-xs text-[#6B7280]">
                Kejelasan integritas sumber data, batas simulasi, dan klasifikasi kebenaran publik
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
          <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] space-y-1.5 text-[#1E40AF]">
            <div className="font-bold text-sm flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#2563EB]" />
              Konteks Simulasi Kompetisi MIA / WIA 2026
            </div>
            <p className="text-xs text-[#1E3A8A]">
              Platform <strong>TITIK.</strong> menyajikan data anggaran dan fasilitas publik Kota Bogor berbasis <em>Bagan Akun Standar (BAS) Permendagri No. 77/2020</em>. Seluruh angka finansial, nama proyek, dan kasus warga disimulasikan secara realistis untuk menunjukkan kapabilitas penelusuran akuntabilitas publik tanpa menyebarkan klaim fitnah atau manipulasi data rill.
            </p>
          </div>

          {/* 4 Data Integrity Classes */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#111827] uppercase tracking-wider text-[11px]">
              Klasifikasi Integritas Data di Platform Ini:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                  1. Official Simulated
                </span>
                <div className="font-bold text-xs text-[#111827]">Data Anggaran APBD SIKD</div>
                <p className="text-[11px] text-[#6B7280]">
                  Alokasi pagu, kontrak pengadaan LPSE, dan persentase penyerapan kas daerah.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded border border-[#FECACA]">
                  2. Citizen Submissions
                </span>
                <div className="font-bold text-xs text-[#111827]">Laporan Masalah Komunitas</div>
                <p className="text-[11px] text-[#6B7280]">
                  Aduan warga berbasis geotag foto fisik yang telah melalui verifikasi kurator independen.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D9488] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#BBF7D0]">
                  3. Inferred Linkage
                </span>
                <div className="font-bold text-xs text-[#111827]">Tautan Anggaran Otomatis</div>
                <p className="text-[11px] text-[#6B7280]">
                  Korelasi spasial antara lokasi kerusakan dan pos belanja pemeliharaan rutin terdekat.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded border border-[#FDE68A]">
                  4. Inspectorate Audit Flag
                </span>
                <div className="font-bold text-xs text-[#111827]">Radar Anomali Belanja</div>
                <p className="text-[11px] text-[#6B7280]">
                  Indikasi ketimpangan serapan vs keluhan yang direkomendasikan untuk uji petik lapangan.
                </p>
              </div>
            </div>
          </div>

          {/* Transparency Principles */}
          <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2">
            <h5 className="font-bold text-xs text-[#111827]">Prinsip Verifikasi Suara Prioritas:</h5>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#6B7280]">
              <li>TITIK tidak pernah mempublikasikan tuduhan korupsi secara sepihak; anomali dilabeli sebagai <em>indikator audit</em>.</li>
              <li>Hak jawab instansi pemerintah dan vendor rekanan selalu disediakan melalui status <strong>Tahap 5: Respon Resmi</strong>.</li>
              <li>Status penyelesaian hanya dianggap <em>Tuntas</em> jika telah tervalidasi kembali oleh warga pelapor di lapangan (Tahap 6).</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F8F9FA] border-t border-[#E5E7EB] flex items-center justify-between">
          <span className="text-[11px] text-[#9CA3AF]">
            Dokumentasi Terbuka WIA 2026
          </span>
          <button
            onClick={() => setIsDataSourceModalOpen(false)}
            className="px-4 py-2 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Saya Memahami
          </button>
        </div>

      </div>
    </div>
  );
};

