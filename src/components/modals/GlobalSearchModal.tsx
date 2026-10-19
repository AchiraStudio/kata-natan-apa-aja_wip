import React, { useState } from 'react';
import { Search, X, Building, FileText, ArrowRight } from 'lucide-react';
import { useTitik } from '../../context/TitikContext';

export const GlobalSearchModal: React.FC = () => {
  const { searchModalOpen, setSearchModalOpen, facilities, posts } = useTitik();
  const [query, setQuery] = useState('');

  if (!searchModalOpen) return null;

  const filteredFacilities = facilities.filter(
    (f) =>
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.address.toLowerCase().includes(query.toLowerCase())
  );

  const filteredPosts = posts.filter(
    (p) =>
      p.body.toLowerCase().includes(query.toLowerCase()) ||
      p.locationTag.toLowerCase().includes(query.toLowerCase()) ||
      p.relatedReport?.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white border border-[#E4E2DA] rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#E4E2DA] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#686B65]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari fasilitas, lokasi, atau topik laporan..."
            className="flex-1 text-sm text-[#20221D] placeholder-[#686B65] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setSearchModalOpen(false)}
            className="p-1 rounded-full text-[#686B65] hover:text-[#20221D] hover:bg-[#F7F6F1]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 max-h-96 overflow-y-auto no-scrollbar space-y-4 text-xs">
          {/* Reports Match */}
          <div>
            <h4 className="font-bold uppercase tracking-wider text-[#686B65] mb-2 text-[10px]">
              Laporan Warga ({filteredPosts.length})
            </h4>
            <div className="space-y-1.5">
              {filteredPosts.slice(0, 3).map((p) => (
                <a
                  key={p.id}
                  href={p.relatedReport ? `/report/${p.relatedReport.id}` : '#'}
                  onClick={() => {
                    setSearchModalOpen(false);
                  }}
                  className="p-2.5 rounded-xl bg-[#F7F6F1] hover:bg-[#E7EBDD]/60 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#263F35]" />
                    <div>
                      <div className="font-bold text-[#20221D]">{p.relatedReport?.title || p.body.slice(0, 40)}</div>
                      <div className="text-[11px] text-[#686B65]">{p.locationTag}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#686B65]" />
                </a>
              ))}
            </div>
          </div>

          {/* Facilities Match */}
          <div>
            <h4 className="font-bold uppercase tracking-wider text-[#686B65] mb-2 text-[10px]">
              Fasilitas Publik Terdaftar ({filteredFacilities.length})
            </h4>
            <div className="space-y-1.5">
              {filteredFacilities.slice(0, 3).map((f) => (
                <div
                  key={f.id}
                  className="p-2.5 rounded-xl bg-[#F7F6F1] hover:bg-[#E7EBDD]/60 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Building className="w-4 h-4 text-[#686B65]" />
                    <div>
                      <div className="font-bold text-[#20221D]">{f.name}</div>
                      <div className="text-[11px] text-[#686B65]">{f.address}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-white border border-[#E4E2DA] font-semibold text-[#263F35]">
                    {f.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 bg-[#F7F6F1] border-t border-[#E4E2DA] text-center text-[10px] text-[#686B65] font-mono">
          Gunakan tombol Esc untuk menutup pencarian
        </div>
      </div>
    </div>
  );
};
