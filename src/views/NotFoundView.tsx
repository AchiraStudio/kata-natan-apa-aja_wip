import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTitik } from '../context/TitikContext';
import { 
  MapPin, 
  Building2, 
  Coins, 
  Search, 
  Home, 
  ArrowRight
} from 'lucide-react';

export const NotFoundView: React.FC = () => {
  const navigate = useNavigate();
  const { setIsSearchOpen } = useTitik();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-8">
      
      <div className="inline-flex items-center gap-2 text-xs font-mono-data font-bold uppercase tracking-wider text-[#DC2626]">
        <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
        <span>404 • Halaman Tidak Ditemukan</span>
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
          Alamat atau kode kasus tidak terdaftar.
        </h1>
        <p className="text-sm sm:text-base text-[#4B5563] max-w-xl mx-auto leading-relaxed">
          Periksa kembali URL yang Anda masukkan, atau gunakan pencarian cepat untuk menemukan fasilitas publik, paket anggaran, dan laporan warga di wilayah Jabodetabek.
        </p>
      </div>

      <div className="max-w-md mx-auto pt-2">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full p-3.5 bg-white hover:bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#6B7280] flex items-center justify-between transition-all group"
        >
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#111827]" />
            <span>Cari fasilitas, proyek, atau aduan...</span>
          </span>
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono-data bg-[#F8F9FA] text-[#4B5563] rounded border border-[#E5E7EB]">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="pt-6 border-t border-[#E5E7EB] max-w-2xl mx-auto">
        <div className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-4">
          Halaman Utama
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <button
            onClick={() => navigate('/')}
            className="p-4 bg-white hover:border-[#111827] border border-[#E5E7EB] rounded-xl transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <Home className="w-4 h-4 text-[#111827]" />
              <div>
                <div className="text-xs font-bold text-[#111827]">Beranda</div>
                <div className="text-[11px] text-[#6B7280]">Ringkasan APBD & sorotan kasus</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#111827]" />
          </button>

          <button
            onClick={() => navigate('/peta')}
            className="p-4 bg-white hover:border-[#111827] border border-[#E5E7EB] rounded-xl transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-[#2563EB]" />
              <div>
                <div className="text-xs font-bold text-[#111827]">Peta Wilayah</div>
                <div className="text-[11px] text-[#6B7280]">Peta interaktif 6 kecamatan</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#111827]" />
          </button>

          <button
            onClick={() => navigate('/anggaran')}
            className="p-4 bg-white hover:border-[#111827] border border-[#E5E7EB] rounded-xl transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <Coins className="w-4 h-4 text-[#0D9488]" />
              <div>
                <div className="text-xs font-bold text-[#111827]">Anggaran APBD</div>
                <div className="text-[11px] text-[#6B7280]">Rincian 4 status dana daerah</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#111827]" />
          </button>

          <button
            onClick={() => navigate('/fasilitas')}
            className="p-4 bg-white hover:border-[#111827] border border-[#E5E7EB] rounded-xl transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-[#D97706]" />
              <div>
                <div className="text-xs font-bold text-[#111827]">Fasilitas Publik</div>
                <div className="text-[11px] text-[#6B7280]">Daftar sekolah, puskesmas, drainase</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#111827]" />
          </button>
        </div>
      </div>

    </div>
  );
};
