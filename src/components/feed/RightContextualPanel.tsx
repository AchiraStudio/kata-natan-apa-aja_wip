import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  MapPin,
  Tag,
  ArrowRight,
  Send,
  Heart,
  FileText,
  MessageCircle,
  X,
  Loader2,
  RotateCw,
} from 'lucide-react';
import { useTitik } from '../../context/TitikContext';
import { useAuth } from '../../context/AuthContext';
import { FeedComment } from '../../services/adapters/types';

export const RightContextualPanel: React.FC = () => {
  const navigate = useNavigate();
  const { activePost, addComment, getComments } = useTitik();
  const { profile } = useAuth();

  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loadedPostId, setLoadedPostId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState<{ id: string; authorName: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
  const [likesDeltaMap, setLikesDeltaMap] = useState<Record<string, number>>({});

  const inputRef = useRef<HTMLInputElement | null>(null);
  const commentsListRef = useRef<HTMLDivElement | null>(null);

  const refreshComments = async () => {
    if (!activePost || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const loaded = await getComments(activePost.id);
      setComments(loaded || []);
    } catch (err) {
      console.error('Failed to refresh comments in RightContextualPanel:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load comments when active post changes
  useEffect(() => {
    if (!activePost) return;

    let isMounted = true;
    getComments(activePost.id)
      .then((loaded) => {
        if (isMounted) {
          setComments(loaded || []);
          setLoadedPostId(activePost.id);
        }
      })
      .catch((err) => {
        console.error('Failed to load comments in RightContextualPanel:', err);
        if (isMounted) {
          setLoadedPostId(activePost.id);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activePost, getComments]);

  // Derived: a load is in flight while the rendered post has no settled result yet
  const isLoading = activePost != null && loadedPostId !== activePost.id;

  if (!activePost) {
    return (
      <aside className="w-96 xl:w-[420px] p-6 hidden xl:flex flex-col items-center justify-center text-center text-[#686B65] dark:text-[#9EACA3] border-l border-[#E4E2DA] dark:border-[#26352E] h-screen bg-[#F7F6F1] dark:bg-[#131916]">
        <FileText className="w-8 h-8 text-[#686B65]/40 dark:text-[#9EACA3]/40 mb-2" />
        <p className="text-sm">Pilih atau gulir konten untuk melihat data laporan terkait.</p>
      </aside>
    );
  }

  const report = activePost.relatedReport;

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    const authorName = profile?.displayName || profile?.username || 'Warga Anda';
    const avatarUrl =
      profile?.avatarUrl ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    try {
      const targetParentId = replyTarget?.id;

      const created = await addComment(
        activePost.id,
        trimmed,
        authorName,
        avatarUrl,
        targetParentId
      );

      if (created) {
        setComments((prev) => [created, ...prev]);
      } else {
        const optimistic: FeedComment = {
          id: `c-${Date.now()}`,
          authorName,
          avatarUrl,
          body: trimmed,
          timeAgo: 'Baru saja',
          likes: 0,
          ...(targetParentId ? { parentId: targetParentId } : {}),
        };
        setComments((prev) => [optimistic, ...prev]);
      }

      setCommentText('');
      setReplyTarget(null);

      if (targetParentId) {
        // When replying to a comment, maintain scroll at that comment instead of jumping to top!
        setTimeout(() => {
          const parentEl = commentsListRef.current?.querySelector(`[data-comment-id="${targetParentId}"]`);
          if (parentEl) {
            parentEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 80);
      } else {
        // Only brand-new top-level comments scroll to top
        if (commentsListRef.current) {
          commentsListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLike = (commentId: string) => {
    const isCurrentlyLiked = likedCommentIds.has(commentId);
    setLikedCommentIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyLiked) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
    setLikesDeltaMap((prev) => ({
      ...prev,
      [commentId]: (prev[commentId] || 0) + (isCurrentlyLiked ? -1 : 1),
    }));
  };

  return (
    <aside className="w-96 xl:w-[420px] shrink-0 hidden xl:flex flex-col gap-4 h-screen sticky top-0 p-5 border-l border-[#E4E2DA] dark:border-[#26352E] bg-[#F7F6F1] dark:bg-[#131916] z-30 select-none">
      {/* 1. TITIK REPORT Card (Matching Reference UI) */}
      {report ? (
        <div className="bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl p-4 shadow-xs space-y-3 shrink-0">
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#263F35] dark:text-[#10B981]">
              <Shield className="w-4 h-4 fill-[#263F35]/10 dark:fill-[#10B981]/20" />
              <span>TITIK REPORT</span>
            </div>
            <a
              href="/explore"
              onClick={(e) => {
                e.preventDefault();
                navigate('/explore');
              }}
              className="text-xs font-medium text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <span>Lihat semua</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          {/* Issue Thumbnail & Title */}
          <div className="flex items-start gap-3">
            <img
              src={
                report.mediaUrls[0] ||
                'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?q=80&w=300&auto=format&fit=crop'
              }
              alt={report.title}
              className="w-16 h-16 rounded-xl object-cover border border-[#E4E2DA] dark:border-[#26352E] shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-[#686B65] dark:text-[#9EACA3] font-medium">
                Laporan terkait
              </span>
              <h3 className="text-sm font-bold text-[#20221D] dark:text-[#F3F6F4] truncate leading-tight">
                {report.title}
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-[#686B65] dark:text-[#9EACA3] mt-1 truncate">
                <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                <span className="truncate">{report.location.address}</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-[#92400E] dark:text-amber-300 border border-amber-300 dark:border-amber-800/80">
              {report.status === 'under_review'
                ? 'Menunggu verifikasi'
                : report.status.replace('_', ' ')}
            </span>
          </div>

          {/* ID Laporan & Kategori Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E4E2DA]/60 dark:border-[#26352E] text-xs">
            <div>
              <div className="text-[10px] text-[#686B65] dark:text-[#9EACA3]">ID Laporan</div>
              <div className="font-mono font-semibold text-[#20221D] dark:text-[#F3F6F4]">
                {report.publicReference}
              </div>
              <div className="text-[9px] text-[#686B65] dark:text-[#9EACA3]">(Contoh data)</div>
            </div>

            <div>
              <div className="text-[10px] text-[#686B65] dark:text-[#9EACA3]">Kategori</div>
              <div className="font-semibold text-[#20221D] dark:text-[#F3F6F4] flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#263F35] dark:text-[#34D399]" />
                <span>{report.category}</span>
              </div>
            </div>
          </div>

          {/* Primary Action Button (Links to Dedicated Report & APBD Page) */}
          <a
            href={`/report/${report.id}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/report/${report.id}`);
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-xl text-xs font-semibold hover:bg-[#1d3129] dark:hover:bg-[#34D399] active:scale-[0.99] transition-all shadow-xs cursor-pointer"
          >
            <span>Lihat laporan & APBD</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl p-4 text-center text-xs text-[#686B65] dark:text-[#9EACA3] shrink-0">
          Post ini adalah diskusi umum tanpa berkas laporan langsung.
        </div>
      )}

      {/* 2. Expanded Full-Height Komentar Section with Threaded Replies */}
      <div className="bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl p-4 shadow-xs flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DA]/60 dark:border-[#26352E] shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-[#20221D] dark:text-[#F3F6F4]">
            <MessageCircle className="w-4 h-4 text-[#263F35] dark:text-[#34D399]" />
            <span>Komentar Warga ({loadedPostId === activePost.id ? comments.length : activePost.commentsCount})</span>
          </div>
          <button
            type="button"
            onClick={refreshComments}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] hover:bg-[#E4E2DA]/40 dark:hover:bg-[#26352E]/40 transition-colors cursor-pointer disabled:opacity-40"
            title="Segarkan komentar warga"
            aria-label="Segarkan komentar warga"
          >
            <RotateCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>

        {/* Scrollable Comment List with Threaded Sub-Replies */}
        <div
          ref={commentsListRef}
          className="space-y-4 py-3 flex-1 overflow-y-auto no-scrollbar pr-1"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-[#686B65] dark:text-[#9EACA3] space-y-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs">Memuat tanggapan warga...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#686B65] dark:text-[#9EACA3]">
              Belum ada komentar warga. Jadilah yang pertama memberikan kesaksian.
            </div>
          ) : (
            comments
              .filter((c) => !c.parentId)
              .map((c) => {
                const isLiked = likedCommentIds.has(c.id);
                const delta = likesDeltaMap[c.id] || 0;
                const currentLikes = Math.max(0, (c.likes || 0) + delta);
                const replies = comments.filter((reply) => reply.parentId === c.id);

                return (
                  <div key={c.id} data-comment-id={c.id} className="space-y-2.5 scroll-mt-2">
                    {/* Top-Level Comment */}
                    <div className="flex items-start gap-2.5 text-xs group">
                      <a
                        href={`/u/${c.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/u/${c.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`);
                        }}
                        className="shrink-0 cursor-pointer block hover:opacity-80 transition-opacity"
                        title={`Lihat profil ${c.authorName}`}
                      >
                        <img
                          src={c.avatarUrl}
                          alt={c.authorName}
                          className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#E4E2DA] dark:border-[#26352E] hover:scale-105 transition-transform"
                        />
                      </a>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <a
                            href={`/u/${c.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`}
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/u/${c.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`);
                            }}
                            className="font-semibold text-[#20221D] dark:text-[#F3F6F4] truncate hover:text-[#263F35] dark:hover:text-[#34D399] hover:underline transition-colors cursor-pointer"
                            title={`Lihat profil ${c.authorName}`}
                          >
                            {c.authorName}
                          </a>
                          <span className="text-[10px] text-[#686B65] dark:text-[#9EACA3] shrink-0 font-mono">
                            {c.timeAgo}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#20221D] dark:text-[#F3F6F4] mt-1 leading-relaxed bg-[#F7F6F1]/70 dark:bg-[#131916] p-2.5 rounded-xl border border-[#E4E2DA]/60 dark:border-[#26352E] break-words whitespace-pre-wrap">
                          {c.body}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#686B65] dark:text-[#9EACA3] px-1">
                          <button
                            type="button"
                            onClick={() => toggleLike(c.id)}
                            className={`flex items-center gap-1 transition-colors cursor-pointer ${
                              isLiked
                                ? 'text-red-500 font-semibold'
                                : 'hover:text-red-500 dark:hover:text-red-400'
                            }`}
                          >
                            <Heart
                              className={`w-3 h-3 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
                            />
                            <span>{currentLikes}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyTarget({ id: c.id, authorName: c.authorName });
                              inputRef.current?.focus();
                              const el = commentsListRef.current?.querySelector(`[data-comment-id="${c.id}"]`);
                              el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }}
                            className="hover:text-[#263F35] dark:hover:text-[#34D399] font-medium transition-colors cursor-pointer"
                          >
                            Balas
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Threaded Sub-Replies */}
                    {replies.length > 0 && (
                      <div className="ml-5 pl-3 border-l-2 border-[#E4E2DA] dark:border-[#26352E] space-y-2 pt-0.5">
                        {replies.map((reply) => {
                          const isReplyLiked = likedCommentIds.has(reply.id);
                          const replyDelta = likesDeltaMap[reply.id] || 0;
                          const currentReplyLikes = Math.max(0, (reply.likes || 0) + replyDelta);

                          return (
                            <div key={reply.id} data-comment-id={reply.id} className="flex items-start gap-2 text-xs scroll-mt-2">
                              <a
                                href={`/u/${reply.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(`/u/${reply.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`);
                                }}
                                className="shrink-0 cursor-pointer block hover:opacity-80 transition-opacity"
                                title={`Lihat profil ${reply.authorName}`}
                              >
                                <img
                                  src={reply.avatarUrl}
                                  alt={reply.authorName}
                                  className="w-5 h-5 rounded-full object-cover shrink-0 border border-[#E4E2DA] dark:border-[#26352E] hover:scale-105 transition-transform"
                                />
                              </a>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <a
                                    href={`/u/${reply.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      navigate(`/u/${reply.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`);
                                    }}
                                    className="font-semibold text-[11px] text-[#20221D] dark:text-[#F3F6F4] truncate hover:text-[#263F35] dark:hover:text-[#34D399] hover:underline transition-colors cursor-pointer"
                                    title={`Lihat profil ${reply.authorName}`}
                                  >
                                    {reply.authorName}
                                  </a>
                                  <span className="text-[9px] text-[#686B65] dark:text-[#9EACA3] shrink-0 font-mono">
                                    {reply.timeAgo}
                                  </span>
                                </div>
                                <p className="text-[10px] text-[#20221D] dark:text-[#F3F6F4] mt-0.5 leading-relaxed bg-[#F7F6F1]/50 dark:bg-[#131916]/80 p-2 rounded-lg border border-[#E4E2DA]/40 dark:border-[#26352E] break-words whitespace-pre-wrap">
                                  {reply.body}
                                </p>
                                <div className="flex items-center gap-3 mt-1 text-[9px] text-[#686B65] dark:text-[#9EACA3] px-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleLike(reply.id)}
                                    className={`flex items-center gap-1 transition-colors cursor-pointer ${
                                      isReplyLiked
                                        ? 'text-red-500 font-semibold'
                                        : 'hover:text-red-500 dark:hover:text-red-400'
                                    }`}
                                  >
                                    <Heart
                                      className={`w-2.5 h-2.5 ${isReplyLiked ? 'fill-red-500 text-red-500' : ''}`}
                                    />
                                    <span>{currentReplyLikes}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>

        {/* Reply Target Banner */}
        {replyTarget && (
          <div className="mb-2 px-3 py-1.5 rounded-lg bg-[#E7EBDD] dark:bg-[#1A2E24] text-[#263F35] dark:text-[#34D399] text-xs flex items-center justify-between shrink-0">
            <span className="truncate">
              Membalas <span className="font-bold">{replyTarget.authorName}</span>
            </span>
            <button
              type="button"
              onClick={() => setReplyTarget(null)}
              className="p-1 hover:opacity-75 transition-opacity cursor-pointer"
              aria-label="Batalkan balasan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Comment Composer at Bottom */}
        <form
          onSubmit={handleSendComment}
          className="pt-3 border-t border-[#E4E2DA] dark:border-[#26352E] flex items-center gap-2 shrink-0"
        >
          <img
            src={
              profile?.avatarUrl ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
            }
            alt="Your avatar"
            className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#E4E2DA] dark:border-[#26352E]"
          />
          <input
            ref={inputRef}
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={
              replyTarget
                ? `Tulis balasan untuk ${replyTarget.authorName}...`
                : 'Tulis tanggapan atau kesaksian...'
            }
            className="flex-1 bg-[#F7F6F1] dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-full px-3.5 py-2 text-xs text-[#20221D] dark:text-[#F3F6F4] placeholder-[#686B65] dark:placeholder-[#6C7D73] focus:outline-none focus:border-[#263F35] dark:focus:border-[#10B981]"
          />
          <button
            type="submit"
            disabled={!commentText.trim() || isSubmitting}
            className="p-2 rounded-full bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] hover:bg-[#1d3129] dark:hover:bg-[#34D399] disabled:opacity-40 transition-opacity cursor-pointer shrink-0"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </form>
      </div>
    </aside>
  );
};
