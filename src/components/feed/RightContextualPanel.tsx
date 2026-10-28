import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
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

const STATUS_BADGE_MAP: Record<string, { label: string; classes: string }> = {
  submitted: {
    label: 'Laporan diterima',
    classes: 'bg-stone-100 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700',
  },
  under_review: {
    label: 'Menunggu verifikasi',
    classes: 'bg-amber-50 dark:bg-amber-950/50 text-[#92400E] dark:text-amber-300 border-amber-200 dark:border-amber-800/70',
  },
  needs_info: {
    label: 'Perlu info tambahan',
    classes: 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/70',
  },
  accepted_for_routing: {
    label: 'Disetujui rute dinas',
    classes: 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800/70',
  },
  forwarded_to_institution: {
    label: 'Diteruskan ke dinas',
    classes: 'bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/70',
  },
  institution_responded: {
    label: 'Dinas merespons',
    classes: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/70',
  },
  resolved: {
    label: 'Selesai ditangani',
    classes: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70',
  },
  rejected: {
    label: 'Belum dapat diproses',
    classes: 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-700',
  },
};

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
      <aside className="w-96 xl:w-[400px] p-6 hidden xl:flex flex-col items-center justify-center text-center text-[#686B65] dark:text-[#9EACA3] border-l border-[#E4E2DA] dark:border-[#222E28] h-screen bg-[#F7F6F1] dark:bg-[#0F1512]">
        <FileText className="w-7 h-7 text-[#686B65]/40 dark:text-[#9EACA3]/40 mb-2" />
        <p className="text-xs">Pilih atau gulir konten untuk melihat berkas laporan dan kesaksian warga.</p>
      </aside>
    );
  }

  const report = activePost.relatedReport;
  const statusInfo = report
    ? STATUS_BADGE_MAP[report.status] || {
        label: report.status.replace(/_/g, ' '),
        classes: 'bg-amber-50 dark:bg-amber-950/50 text-[#92400E] dark:text-amber-300 border-amber-200 dark:border-amber-800/70',
      }
    : null;

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
        setTimeout(() => {
          const parentEl = commentsListRef.current?.querySelector(`[data-comment-id="${targetParentId}"]`);
          if (parentEl) {
            parentEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 80);
      } else {
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

  const displayedCommentsCount = loadedPostId === activePost.id ? comments.length : activePost.commentsCount;

  return (
    <aside className="w-96 xl:w-[400px] shrink-0 hidden xl:flex flex-col h-screen sticky top-0 border-l border-[#E4E2DA] dark:border-[#222E28] bg-[#F7F6F1] dark:bg-[#0F1512] z-30 select-none divide-y divide-[#E4E2DA] dark:divide-[#222E28]">
      {/* 1. Compact Editorial Report Context Header */}
      {report ? (
        <div className="p-5 space-y-3.5 shrink-0 bg-white/60 dark:bg-[#131B17]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-[11px] font-bold tracking-tight text-[#263F35] dark:text-[#34D399]">
                {report.publicReference}
              </span>
              <span className="text-[#686B65]/40 dark:text-[#9EACA3]/40">•</span>
              <span className="text-[11px] font-medium text-[#686B65] dark:text-[#9EACA3] truncate">
                {report.category}
              </span>
            </div>
            {statusInfo && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${statusInfo.classes}`}>
                {statusInfo.label}
              </span>
            )}
          </div>

          <div className="flex items-start gap-3">
            <img
              src={
                report.mediaUrls[0] ||
                'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?q=80&w=300&auto=format&fit=crop'
              }
              alt={report.title}
              className="w-14 h-14 rounded-xl object-cover border border-[#E4E2DA] dark:border-[#24322B] shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-[#20221D] dark:text-[#F3F6F4] line-clamp-2 leading-snug">
                {report.title}
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-[#686B65] dark:text-[#9EACA3] mt-1 truncate">
                <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                <span className="truncate">{report.location.address}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <a
              href={`/report/${report.id}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/report/${report.id}`);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#08130E] rounded-xl text-xs font-bold hover:bg-[#1d3129] dark:hover:bg-[#34D399] active:scale-[0.99] transition-all cursor-pointer"
            >
              <span>Lihat laporan & APBD</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <a
              href="/explore"
              onClick={(e) => {
                e.preventDefault();
                navigate('/explore');
              }}
              className="py-2 px-3 rounded-xl border border-[#E4E2DA] dark:border-[#24322B] text-xs font-semibold text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] hover:bg-white dark:hover:bg-[#1A241F] transition-colors cursor-pointer shrink-0"
            >
              Direktori
            </a>
          </div>
        </div>
      ) : (
        <div className="px-5 py-3.5 text-xs text-[#686B65] dark:text-[#9EACA3] shrink-0 bg-white/40 dark:bg-[#131B17]">
          Diskusi komunitas terbuka tanpa berkas laporan terlampir.
        </div>
      )}

      {/* 2. Seamless Full-Height Citizen Comments Stream (Un-boxed Editorial Typography) */}
      <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden px-5 py-4">
        {/* Stream Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DA]/70 dark:border-[#222E28] shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-[#20221D] dark:text-[#F3F6F4]">
            <MessageCircle className="w-4 h-4 text-[#263F35] dark:text-[#34D399]" />
            <span className="tabular-nums">Komentar Warga ({displayedCommentsCount})</span>
          </div>
          <button
            type="button"
            onClick={refreshComments}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] hover:bg-white/60 dark:hover:bg-[#161F1B] transition-colors cursor-pointer disabled:opacity-40"
            title="Segarkan komentar warga"
            aria-label="Segarkan komentar warga"
          >
            <RotateCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>

        {/* Scrollable Un-boxed Comment List */}
        <div
          ref={commentsListRef}
          className="divide-y divide-[#E4E2DA]/50 dark:divide-[#1D2823] py-1 flex-1 overflow-y-auto no-scrollbar pr-1"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#686B65] dark:text-[#9EACA3] space-y-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs">Memuat tanggapan warga...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#686B65] dark:text-[#9EACA3]">
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
                  <div key={c.id} data-comment-id={c.id} className="py-3.5 space-y-2.5 scroll-mt-2">
                    {/* Top-Level Comment */}
                    <div className="flex items-start gap-2.5 text-xs group">
                      <a
                        href={`/u/${c.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/u/${c.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`);
                        }}
                        className="shrink-0 cursor-pointer block hover:opacity-80 transition-opacity mt-0.5"
                        title={`Lihat profil ${c.authorName}`}
                      >
                        <img
                          src={c.avatarUrl}
                          alt={c.authorName}
                          className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#E4E2DA] dark:border-[#26352E]"
                        />
                      </a>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <a
                            href={`/u/${c.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`}
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/u/${c.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`);
                            }}
                            className="font-semibold text-xs text-[#20221D] dark:text-[#F3F6F4] truncate hover:text-[#263F35] dark:hover:text-[#34D399] hover:underline transition-colors cursor-pointer"
                            title={`Lihat profil ${c.authorName}`}
                          >
                            {c.authorName}
                          </a>
                          <span className="text-[10px] text-[#686B65] dark:text-[#8FA096] shrink-0 font-mono">
                            {c.timeAgo}
                          </span>
                        </div>
                        <p className="text-xs text-[#20221D]/90 dark:text-[#D5DFD9] mt-1 leading-relaxed break-words whitespace-pre-wrap select-text">
                          {c.body}
                        </p>
                        <div className="flex items-center gap-4 mt-1.5 text-[11px] text-[#686B65] dark:text-[#8FA096]">
                          <button
                            type="button"
                            onClick={() => toggleLike(c.id)}
                            className={`flex items-center gap-1 transition-colors cursor-pointer tabular-nums ${
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
                      <div className="ml-6 pl-3 border-l border-[#E4E2DA] dark:border-[#26352E] space-y-2.5 pt-0.5">
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
                                className="shrink-0 cursor-pointer block hover:opacity-80 transition-opacity mt-0.5"
                                title={`Lihat profil ${reply.authorName}`}
                              >
                                <img
                                  src={reply.avatarUrl}
                                  alt={reply.authorName}
                                  className="w-5 h-5 rounded-full object-cover shrink-0 border border-[#E4E2DA] dark:border-[#26352E]"
                                />
                              </a>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
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
                                  <span className="text-[10px] text-[#686B65] dark:text-[#8FA096] shrink-0 font-mono">
                                    {reply.timeAgo}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#20221D]/90 dark:text-[#D5DFD9] mt-0.5 leading-relaxed break-words whitespace-pre-wrap select-text">
                                  {reply.body}
                                </p>
                                <div className="flex items-center gap-3 mt-1 text-[10px] text-[#686B65] dark:text-[#8FA096]">
                                  <button
                                    type="button"
                                    onClick={() => toggleLike(reply.id)}
                                    className={`flex items-center gap-1 transition-colors cursor-pointer tabular-nums ${
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
          <div className="mb-2 px-3 py-1.5 rounded-lg bg-[#E7EBDD] dark:bg-[#192B22] text-[#263F35] dark:text-[#34D399] text-xs flex items-center justify-between shrink-0">
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
          className="pt-3 border-t border-[#E4E2DA] dark:border-[#222E28] flex items-center gap-2 shrink-0"
        >
          <img
            src={
              profile?.avatarUrl ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
            }
            alt="Avatar Anda"
            className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#E4E2DA] dark:border-[#26352E]"
          />
          <input
            ref={inputRef}
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={
              replyTarget
                ? `Balas ${replyTarget.authorName}...`
                : 'Tulis tanggapan atau kesaksian...'
            }
            className="flex-1 bg-white dark:bg-[#161F1B] border border-[#E4E2DA] dark:border-[#24322B] rounded-full px-3.5 py-2 text-xs text-[#20221D] dark:text-[#F3F6F4] placeholder-[#686B65] dark:placeholder-[#6C7D73] focus:outline-none focus:border-[#263F35] dark:focus:border-[#10B981]"
          />
          <button
            type="submit"
            disabled={!commentText.trim() || isSubmitting}
            className="p-2 rounded-full bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#08130E] hover:bg-[#1d3129] dark:hover:bg-[#34D399] disabled:opacity-40 transition-opacity cursor-pointer shrink-0"
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
