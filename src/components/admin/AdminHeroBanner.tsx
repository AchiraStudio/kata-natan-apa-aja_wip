import React from 'react';
import { RotateCcw } from 'lucide-react';

interface AdminHeroBannerProps {
  onRefresh: () => void;
  isLoading?: boolean;
}

export const AdminHeroBanner: React.FC<AdminHeroBannerProps> = ({
  onRefresh,
  isLoading = false,
}) => {
  return (
    <div className="admin-hero-banner relative overflow-hidden rounded-3xl p-6 lg:p-7 flex flex-wrap items-center justify-between gap-6 border border-[#1B4332]/20 shadow-xs">
      {/* Geometric Angled Slashes Container (-35deg) */}
      <div className="admin-slashes-container" aria-hidden="true">
        <div className="admin-ambient-glow" />
        <div className="admin-ribbon admin-ribbon-1" />
        <div className="admin-ribbon admin-ribbon-2" />
        <div className="admin-slash-line admin-slash-1" />
        <div className="admin-slash-line admin-slash-2" />
      </div>

      <div className="relative z-10 max-w-2xl">
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
          Antrean Tinjauan & Validasi Laporan
        </h1>
        <p className="text-xs lg:text-sm text-[#E7EBDD]/90 mt-1.5 leading-relaxed">
          Verifikasi bukti fisik, rute ke dinas penanggung jawab, dan perbarui status akuntabilitas publik.
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        aria-label="Segarkan"
        title="Segarkan Antrean"
        className="admin-refresh-btn relative z-10 flex items-center gap-2 px-5 py-2.5 bg-white/95 hover:bg-white border border-white/30 rounded-full text-xs font-bold text-[#101913] hover:text-[#1B4332] shadow-xs cursor-pointer transition-all disabled:opacity-60"
      >
        <RotateCcw className={`w-3.5 h-3.5 text-[#1B4332] ${isLoading ? 'animate-spin' : ''}`} />
        <span>Segarkan Antrean</span>
      </button>
    </div>
  );
};
