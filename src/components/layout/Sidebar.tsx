import React from 'react';
import {
  Home,
  Users,
  Compass,
  MapPin,
  Bookmark,
  Plus,
  GraduationCap,
  HeartPulse,
  Leaf,
  Building2,
  MoreHorizontal,
  ShieldAlert,
  Search,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { useTitik } from '../../context/TitikContext';
import { useAuth } from '../../context/AuthContext';
import { TitikLogo } from '../common/TitikLogo';

interface SidebarProps {
  currentPath?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath = '/' }) => {
  const { profile } = useAuth();
  const {
    openReportModal,
    selectedCategory,
    setSelectedCategory,
    activeFeedTab,
    setActiveFeedTab,
    setSearchModalOpen,
  } = useTitik();

  const navItems = [
    { label: 'Home', icon: Home, href: '/', active: currentPath === '/' && activeFeedTab === 'for_you' },
    {
      label: 'Following',
      icon: Users,
      href: '#',
      onClick: () => setActiveFeedTab('following'),
      active: activeFeedTab === 'following',
    },
    { label: 'Explore', icon: Compass, href: '/explore', active: currentPath === '/explore' },
    { label: 'Map', icon: MapPin, href: '/map', active: currentPath === '/map' },
    { label: 'Saved', icon: Bookmark, href: '#', active: false },
  ];

  const categories = [
    { name: 'Pendidikan', icon: GraduationCap },
    { name: 'Kesehatan', icon: HeartPulse },
    { name: 'Lingkungan', icon: Leaf },
    { name: 'Infrastruktur', icon: Building2 },
    { name: 'Lainnya', icon: MoreHorizontal },
  ];

  return (
    <aside className="w-64 xl:w-72 shrink-0 hidden lg:flex flex-col justify-between h-screen sticky top-0 border-r border-[#E4E2DA] p-5 bg-[#F7F6F1] select-none z-30">
      {/* Top Section: Brand + Integrated Search + Nav */}
      <div className="space-y-5 overflow-y-auto no-scrollbar pr-1">
        {/* Brand Logotype with Official SVG Logo Mark */}
        <div>
          <a href="/" className="inline-flex items-center gap-2.5 text-2xl font-black tracking-tight text-[#20221D] group cursor-pointer">
            <TitikLogo className="w-8 h-8 transition-transform group-hover:scale-105 shrink-0" />
            <div className="flex items-center">
              <span>TITIK</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#263F35] ml-0.5"></span>
            </div>
          </a>
          <p className="mt-1 text-[11px] text-[#686B65] leading-relaxed">
            Transparansi Infrastruktur, Anggaran & Tindak Komunitas
          </p>
        </div>

        {/* Integrated Global Search Bar (Combined into Sidebar) */}
        <div>
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white rounded-xl border border-[#E4E2DA] text-xs text-[#686B65] hover:border-[#263F35]/40 hover:text-[#20221D] transition-colors shadow-xs group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#686B65] group-hover:text-[#20221D] transition-colors" />
              <span>Cari fasilitas, topik...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[#686B65] bg-[#F7F6F1] border border-[#E4E2DA] rounded">
              ⌘ K
            </kbd>
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                  }
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  item.active
                    ? 'bg-[#E7EBDD] text-[#263F35]'
                    : 'text-[#20221D] hover:bg-white hover:text-[#263F35]'
                }`}
              >
                <Icon className={`w-5 h-5 ${item.active ? 'text-[#263F35]' : 'text-[#686B65]'}`} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Prominent CTA Button (Fixed typo from screenshot) */}
        <div>
          <button
            type="button"
            onClick={openReportModal}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#263F35] text-white rounded-xl font-medium text-sm hover:bg-[#1d3129] active:scale-[0.99] transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Laporkan Masalah</span>
          </button>
        </div>

        {/* Popular Categories */}
        <div className="pt-1">
          <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-[#686B65] mb-1.5">
            Kategori Populer
          </h3>
          <div className="space-y-0.5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? 'Semua' : cat.name)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#E7EBDD] text-[#263F35] font-semibold'
                      : 'text-[#686B65] hover:text-[#20221D] hover:bg-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Civic Transparency Links */}
        <div className="pt-2 border-t border-[#E4E2DA]/60 space-y-1">
          <a
            href="/alur"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentPath === '/alur'
                ? 'bg-[#E7EBDD] text-[#263F35] font-semibold'
                : 'text-[#686B65] hover:text-[#20221D] hover:bg-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#263F35]" />
            <span>Alur Akuntabilitas 4 Tahap</span>
          </a>
          <a
            href="/track"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#686B65] hover:text-[#20221D] hover:bg-white transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-[#263F35]" />
            <span>Lacak Laporan Anonim</span>
          </a>
          <a
            href="/admin"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#686B65] hover:text-[#20221D] hover:bg-white transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#92400E]" />
            <span>Portal Tinjauan Admin</span>
          </a>
        </div>
      </div>

      {/* Bottom Section: Combined Citizen Account & Login / Switch Button */}
      <div className="pt-3 border-t border-[#E4E2DA]">
        <a
          href="/login"
          className="flex items-center justify-between p-2.5 bg-white border border-[#E4E2DA] rounded-xl shadow-xs hover:border-[#263F35]/40 transition-all group"
          title="Kelola Akun & Generator Warga"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="w-8 h-8 rounded-full object-cover border border-[#E4E2DA] shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#20221D] truncate group-hover:text-[#263F35]">
                {profile.displayName}
              </div>
              <div className="text-[10px] text-[#263F35] font-semibold truncate">
                {profile.role === 'admin'
                  ? 'Admin Instansi PUPR'
                  : profile.role === 'moderator'
                  ? 'Moderator Verifikasi'
                  : profile.isVerified
                  ? 'Warga Terverifikasi'
                  : 'Warga Kota Bogor'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="p-1 rounded-lg text-[#686B65] group-hover:text-[#20221D] group-hover:bg-[#F7F6F1] transition-colors">
              <LogIn className="w-4 h-4" />
            </span>
          </div>
        </a>
      </div>
    </aside>
  );
};
