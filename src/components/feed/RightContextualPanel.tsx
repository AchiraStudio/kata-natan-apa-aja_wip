import React, { useState } from 'react';
import {
  Shield,
  MapPin,
  Tag,
  ArrowRight,
  Send,
  Heart,
  FileText,
  MessageCircle,
} from 'lucide-react';
import { useTitik } from '../../context/TitikContext';
import { MOCK_COMMENTS } from '../../data/mockCivicData';

export const RightContextualPanel: React.FC = () => {
  const { activePost, addComment } = useTitik();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!activePost) {
    return (
      <aside className="w-96 xl:w-[420px] p-6 hidden xl:flex flex-col items-center justify-center text-center text-[#686B65] border-l border-[#E4E2DA] h-screen bg-[#F7F6F1]">
        <FileText className="w-8 h-8 text-[#686B65]/40 mb-2" />
        <p className="text-sm">Pilih atau gulir konten untuk melihat data laporan terkait.</p>
      </aside>
    );
  }

  const report = activePost.relatedReport;
  const comments = MOCK_COMMENTS[activePost.id] || MOCK_COMMENTS['post-001'] || [];

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(activePost.id, commentText.trim());
      setCommentText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="w-96 xl:w-[420px] shrink-0 hidden xl:flex flex-col gap-4 h-screen sticky top-0 p-5 border-l border-[#E4E2DA] bg-[#F7F6F1] z-30 select-none">
      {/* 1. TITIK REPORT Card (Matching Reference UI) */}
      {report ? (
        <div className="bg-white border border-[#E4E2DA] rounded-2xl p-4 shadow-xs space-y-3 shrink-0">
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#263F35]">
              <Shield className="w-4 h-4 fill-[#263F35]/10" />
              <span>TITIK REPORT</span>
            </div>
            <a
              href="/explore"
              className="text-xs font-medium text-[#686B65] hover:text-[#20221D] flex items-center gap-0.5 transition-colors"
            >
              <span>Lihat semua</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          {/* Issue Thumbnail & Title */}
          <div className="flex items-start gap-3">
            <img
              src={report.mediaUrls[0] || 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?q=80&w=300&auto=format&fit=crop'}
              alt={report.title}
              className="w-16 h-16 rounded-xl object-cover border border-[#E4E2DA] shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-[#686B65] font-medium">Laporan terkait</span>
              <h3 className="text-sm font-bold text-[#20221D] truncate leading-tight">
                {report.title}
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-[#686B65] mt-1 truncate">
                <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                <span className="truncate">{report.location.address}</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-[#92400E] border border-amber-300">
              {report.status === 'under_review' ? 'Menunggu verifikasi' : report.status.replace('_', ' ')}
            </span>
          </div>

          {/* ID Laporan & Kategori Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E4E2DA]/60 text-xs">
            <div>
              <div className="text-[10px] text-[#686B65]">ID Laporan</div>
              <div className="font-mono font-semibold text-[#20221D]">
                {report.publicReference}
              </div>
              <div className="text-[9px] text-[#686B65]">(Contoh data)</div>
            </div>

            <div>
              <div className="text-[10px] text-[#686B65]">Kategori</div>
              <div className="font-semibold text-[#20221D] flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#263F35]" />
                <span>{report.category}</span>
              </div>
            </div>
          </div>

          {/* Primary Action Button (Links to Dedicated Report & APBD Page) */}
          <a
            href={`/report/${report.id}`}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#263F35] text-white rounded-xl text-xs font-semibold hover:bg-[#1d3129] active:scale-[0.99] transition-all shadow-xs cursor-pointer"
          >
            <span>Lihat laporan & APBD</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      ) : (
        <div className="bg-white border border-[#E4E2DA] rounded-2xl p-4 text-center text-xs text-[#686B65] shrink-0">
          Post ini adalah diskusi umum tanpa berkas laporan langsung.
        </div>
      )}

      {/* 2. Expanded Full-Height Komentar Section (Takes up ALL remaining vertical space!) */}
      <div className="bg-white border border-[#E4E2DA] rounded-2xl p-4 shadow-xs flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DA]/60 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-[#20221D]">
            <MessageCircle className="w-4 h-4 text-[#263F35]" />
            <span>Komentar Warga ({activePost.commentsCount})</span>
          </div>
          <button type="button" className="text-xs text-[#686B65] hover:text-[#20221D] flex items-center gap-0.5">
            <span>Terbaru</span>
            <span>▾</span>
          </button>
        </div>

        {/* Scrollable Comment List (Spacious & Tall!) */}
        <div className="space-y-4 py-3 flex-1 overflow-y-auto no-scrollbar pr-1">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5 text-xs group">
              <img
                src={c.avatarUrl}
                alt={c.authorName}
                className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#E4E2DA]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-[#20221D] truncate">{c.authorName}</span>
                  <span className="text-[10px] text-[#686B65] shrink-0">{c.timeAgo}</span>
                </div>
                <p className="text-[11px] text-[#20221D] mt-1 leading-relaxed bg-[#F7F6F1]/70 p-2.5 rounded-xl border border-[#E4E2DA]/60">
                  {c.body}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#686B65] px-1">
                  <button type="button" className="flex items-center gap-1 hover:text-red-600 transition-colors">
                    <Heart className="w-3 h-3" />
                    <span>{c.likes}</span>
                  </button>
                  <button type="button" className="hover:text-[#20221D] transition-colors">
                    Balas
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Fixed Comment Composer at Bottom */}
        <form onSubmit={handleSendComment} className="pt-3 border-t border-[#E4E2DA] flex items-center gap-2 shrink-0">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
            alt="Your avatar"
            className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#E4E2DA]"
          />
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Tulis tanggapan atau kesaksian..."
            className="flex-1 bg-[#F7F6F1] border border-[#E4E2DA] rounded-full px-3.5 py-2 text-xs text-[#20221D] placeholder-[#686B65] focus:outline-none focus:border-[#263F35]"
          />
          <button
            type="submit"
            disabled={!commentText.trim() || isSubmitting}
            className="p-2 rounded-full bg-[#263F35] text-white hover:bg-[#1d3129] disabled:opacity-40 transition-opacity cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </aside>
  );
};
