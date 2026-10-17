import React, { useState } from 'react';
import { useTitik } from '../context/TitikContext';
import { SECTORS } from '../data/titikRegionalData';
import { SectorType } from '../types';
import { 
  ThumbsUp, 
  MapPin, 
  Search, 
  Plus, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { 
    reports, 
    setSelectedReport, 
    setIsReportModalOpen, 
    setPreselectedFacilityForReport,
    votePriority 
  } = useTitik();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Semua' | SectorType>('Semua');
  const [sortBy, setSortBy] = useState<'VOTES' | 'NEWEST' | 'STEP'>('VOTES');

  // Filter & Sort
  const filtered = reports.filter(r => {
    if (selectedCategory !== 'Semua' && r.sector !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.subdistrict.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'VOTES') return b.priorityVotes - a.priorityVotes;
    if (sortBy === 'STEP') return b.currentStep - a.currentStep;
    return b.id.localeCompare(a.id);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E7EB] shadow-tactile">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#DC2626]">
            <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
            <span>Partisipasi Komunitas Jabodetabek</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Laporan Warga & Kawal Anggaran ("Titik Masalah")
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5563]">
            Total {reports.length} kasus warga tercatat dengan bukti geotag presisi. Berikan Suara Prioritas untuk mempercepat penyelesaian.
          </p>
        </div>

        <button
          onClick={() => {
            setPreselectedFacilityForReport(null);
            setIsReportModalOpen(true);
          }}
          className="px-5 py-3 bg-[#111827] hover:bg-[#1F2937] text-white text-xs sm:text-sm font-bold rounded-xl shadow-tactile flex items-center justify-center gap-2 transition-all self-start md:self-auto transform active:scale-95"
        >
          <Plus className="w-4 h-4 text-[#0D9488]" />
          <span>+ Tandai Titik Masalah Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-tactile flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:max-w-sm">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul aduan atau wilayah..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:border-[#111827]"
          />
        </div>

        {/* Filter by Category & Sort */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value as any)}
            className="text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg px-3 py-2 font-medium text-[#111827] focus:outline-none"
          >
            <option value="Semua">Semua Sektor</option>
            {SECTORS.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg px-3 py-2 font-medium text-[#111827] focus:outline-none"
          >
            <option value="VOTES">Urutkan: Suara Prioritas Tertinggi</option>
            <option value="NEWEST">Urutkan: Kasus Paling Baru</option>
            <option value="STEP">Urutkan: Tahapan Audit</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(report => (
          <div
            key={report.id}
            className="bg-white rounded-2xl border border-[#E5E7EB] hover:border-[#111827] p-5 shadow-tactile shadow-tactile-hover transition-all flex flex-col justify-between group space-y-4"
          >
            <div className="space-y-3">
              {/* Photo & Status */}
              <div 
                onClick={() => setSelectedReport(report)}
                className="relative h-44 rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6] cursor-pointer"
              >
                <img 
                  src={report.photoUrl} 
                  alt={report.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono-data font-bold bg-[#111827]/80 backdrop-blur-xs text-white px-2 py-0.5 rounded">
                    {report.id}
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold bg-white/90 backdrop-blur-xs text-[#111827] px-2 py-0.5 rounded border border-[#E5E7EB]">
                    {report.sector}
                  </span>
                  <span className="text-[10px] font-bold bg-[#111827] text-white px-2 py-0.5 rounded font-mono-data">
                    Langkah {report.currentStep}/6
                  </span>
                </div>
              </div>

              {/* Title & Reporter */}
              <div 
                onClick={() => setSelectedReport(report)}
                className="cursor-pointer space-y-1"
              >
                <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                  <MapPin className="w-3 h-3 text-[#9CA3AF]" />
                  <span>{report.subdistrict}</span>
                  <span>•</span>
                  <span>@{report.reporterHandle}</span>
                </div>

                <h3 className="font-extrabold text-sm sm:text-base text-[#111827] group-hover:text-[#2563EB] transition-colors leading-snug line-clamp-2">
                  {report.title}
                </h3>

                <p className="text-xs text-[#4B5563] line-clamp-2 leading-relaxed">
                  {report.description}
                </p>
              </div>

              {/* Budget Link status badge */}
              <div className="text-[11px] text-[#4B5563] bg-[#F8F9FA] p-2 rounded-lg border border-[#E5E7EB]">
                <div className="text-[10px] text-[#6B7280] font-semibold">Tautan APBD:</div>
                <div className="font-medium truncate text-[#0D9488]">
                  {report.isBudgetLinkConfirmed ? report.linkedProjectTitle : 'Belum Ditautkan ke Proyek Aktif'}
                </div>
              </div>
            </div>

            {/* Card Action Row: Vote Priority */}
            <div className="pt-3 border-t border-[#F3F4F6] flex items-center justify-between">
              <button
                onClick={() => votePriority(report.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all transform active:scale-95 ${
                  report.userHasVoted
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'bg-[#F8F9FA] text-[#111827] hover:bg-[#E5E7EB] border border-[#E5E7EB]'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5 text-[#D97706]" />
                <span>{report.priorityVotes} Suara</span>
              </button>

              <button
                onClick={() => setSelectedReport(report)}
                className="text-xs font-semibold text-[#111827] hover:text-[#2563EB] transition-colors"
              >
                Rincian Audit &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

