import React from 'react';
import { Link } from 'react-router-dom';
import { useTitik } from '../context/TitikContext';
import { RotateCcw } from 'lucide-react';

export const Footer: React.FC = () => {
  const { resetDemoData } = useTitik();

  return (
    <footer className="footer-wrapper mt-20">
      <div className="footer-container space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#111827] flex items-center justify-center text-white font-extrabold text-sm">
                T<span className="text-[#0D9488]">.</span>
              </div>
              <span className="footer-brand-title text-lg">TITIK.</span>
            </Link>
            
            <p className="text-xs sm:text-sm text-[#4B5563] max-w-sm leading-relaxed">
              <strong>Transparansi Infrastruktur, Anggaran & Tindak Komunitas.</strong><br />
              Observatorium layanan publik wilayah Jabodetabek yang menghubungkan koordinat fasilitas, alokasi APBD, dan laporan warga.
            </p>

            <div className="text-[11px] text-[#6B7280] font-medium pt-1">
              "See the issue. Trace the budget. Track the impact."
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="footer-col-title">
              Navigasi
            </div>
            <ul className="space-y-1.5 text-[#4B5563]">
              <li>
                <Link to="/" className="footer-link">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/peta" className="footer-link">
                  Peta Wilayah
                </Link>
              </li>
              <li>
                <Link to="/anggaran" className="footer-link">
                  Anggaran APBD
                </Link>
              </li>
              <li>
                <Link to="/fasilitas" className="footer-link">
                  Fasilitas Publik
                </Link>
              </li>
              <li>
                <Link to="/analisis" className="footer-link">
                  Temuan Audit
                </Link>
              </li>
              <li>
                <Link to="/lapor" className="footer-link">
                  Laporan Warga
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2 text-xs">
            <div className="footer-col-title">
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

        <div className="footer-bottom-bar">
          <div>
            © 2026 TITIK. Sumber Data: Simulasi SIKD & Satu Data Daerah Jabodetabek TA 2026.
          </div>
        </div>
      </div>
    </footer>
  );
};
