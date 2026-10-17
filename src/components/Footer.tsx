import React from 'react';
import { Link } from 'react-router-dom';
import { useTitik } from '../context/TitikContext';
import { RotateCcw } from 'lucide-react';

export const Footer: React.FC = () => {
  const { resetDemoData } = useTitik();

  return (
    <footer className="bg-white border-t border-[#E5E7EB] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#111827] flex items-center justify-center text-white font-extrabold text-sm">
                T<span className="text-[#0D9488]">.</span>
              </div>
              <span className="font-extrabold text-lg tracking-tight text-[#111827]">TITIK.</span>
            </Link>
            
            <p className="text-xs sm:text-sm text-[#4B5563] max-w-sm leading-relaxed">
              <strong>Transparansi Infrastruktur, Anggaran & Tindak Komunitas.</strong><br />
              Observatorium layanan publik Kota Bogor yang menghubungkan koordinat fasilitas, alokasi APBD, dan laporan warga.
            </p>

            <div className="text-[11px] text-[#6B7280] font-medium pt-1">
              "See the issue. Trace the budget. Track the impact."
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-bold text-[#111827] uppercase tracking-wider text-[11px]">
              Navigasi
            </div>
            <ul className="space-y-1.5 text-[#4B5563]">
              <li>
                <Link to="/" className="hover:text-[#111827] transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/peta" className="hover:text-[#111827] transition-colors">
                  Peta Wilayah
                </Link>
              </li>
              <li>
                <Link to="/anggaran" className="hover:text-[#111827] transition-colors">
                  Anggaran APBD
                </Link>
              </li>
              <li>
                <Link to="/fasilitas" className="hover:text-[#111827] transition-colors">
                  Fasilitas Publik
                </Link>
              </li>
              <li>
                <Link to="/analisis" className="hover:text-[#111827] transition-colors">
                  Temuan Audit
                </Link>
              </li>
              <li>
                <Link to="/lapor" className="hover:text-[#111827] transition-colors">
                  Laporan Warga
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-bold text-[#111827] uppercase tracking-wider text-[11px]">
              Konteks Kompetisi
            </div>
            <p className="text-[#6B7280] text-[11px] leading-relaxed">
              Karya untuk <strong>Multimedia In Action (MIA) 2026: Web In Action (WIA)</strong>.
              <br />
              Tema: <em>"Designing Digital Futures: Powering Public Transparency"</em>.
            </p>
            <div className="pt-2">
              <button
                onClick={resetDemoData}
                className="text-[11px] font-semibold text-[#6B7280] hover:text-[#DC2626] flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Data Simulasi</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#6B7280] gap-2">
          <div>
            © 2026 TITIK. Sumber Data: Simulasi SIKD & Satu Data Kota Bogor TA 2026.
          </div>
          <div className="flex items-center gap-2 font-mono-data">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></span>
              <span>BAS Permendagri 77/2020</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
