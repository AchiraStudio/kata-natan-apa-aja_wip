import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Heart, Send, MessageSquare, Loader2, RotateCw } from 'lucide-react';
import { useTitik } from '../../context/TitikContext';
import { useAuth } from '../../context/AuthContext';
import { FeedComment } from '../../services/adapters/types';

export type CommentItem = FeedComment;

interface CommentsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  commentsCount: number;
  onCommentAdded?: () => void;
}

export const CommentsBottomSheet: React.FC<CommentsBottomSheetProps> = ({
  isOpen,
  onClose,
  postId,
  commentsCount,
  onCommentAdded,
}) => {
  const { getComments, addComment } = useTitik();
  const { profile } = useAuth();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState<{ id: string; authorName: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
  const [likesDeltaMap, setLikesDeltaMap] = useState<Record<string, number>>({});

  const commentsListRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Native non-passive wheel isolation: stop propagation at the DOM level so FeedContainer never intercepts
  useEffect(() => {
    const sheetEl = sheetRef.current;
    if (!sheetEl || !isOpen) return;

    const stopWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };

    sheetEl.addEventListener('wheel', stopWheel, { passive: false });
    return () => {
      sheetEl.removeEventListener('wheel', stopWheel);
    };
  }, [isOpen]);

  const fetchComments = useCallback(async (isRefreshAction = false) => {
    if (isRefreshAction) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const loaded = await getComments(postId);
      setComments(loaded || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [postId, getComments]);

  // Load comments when sheet opens
  useEffect(() => {
    if (!isOpen) return;
    fetchComments(false);
  }, [isOpen, fetchComments]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Dispatch comments open/close event for bottom nav hiding & global isolation
  useEffect(() => {
    if (isOpen) {
      document.body.dataset.commentsOpen = 'true';
      window.dispatchEvent(new CustomEvent('titik-comments-toggle', { detail: { open: true } }));
    } else {
      delete document.body.dataset.commentsOpen;
      window.dispatchEvent(new CustomEvent('titik-comments-toggle', { detail: { open: false } }));
    }
    return () => {
      delete document.body.dataset.commentsOpen;
      window.dispatchEvent(new CustomEvent('titik-comments-toggle', { detail: { open: false } }));
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCommentText.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    const authorName = profile?.displayName || profile?.username || 'Warga Anda';
    const avatarUrl =
      profile?.avatarUrl ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    const targetParentId = replyTarget?.id;

    try {
      const created = await addComment(postId, trimmed, authorName, avatarUrl, targetParentId);
      if (created) {
        setComments((prev) => [created, ...prev]);
      } else {
        // Fallback optimistic comment
        const optimistic: CommentItem = {
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

      setNewCommentText('');
      setReplyTarget(null);
      onCommentAdded?.();

      if (targetParentId) {
        // When replying to a comment, maintain scroll at that comment instead of jumping to top!
        setTimeout(() => {
          const targetEl = commentsListRef.current?.querySelector(`[data-comment-id="${targetParentId}"]`);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 80);
      } else {
        // Only brand-new top-level comments scroll to top where the comment was prepended
        if (commentsListRef.current) {
          commentsListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
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
    <div
      data-scroll-isolated="true"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className={`absolute inset-0 z-50 flex flex-col justify-end bg-black/65 backdrop-blur-xs transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Bottom Sheet Container */}
      <div
        ref={sheetRef}
        data-scroll-isolated="true"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className={`w-full max-h-[75%] h-[70%] bg-[#151916] border-t border-white/10 rounded-t-[28px] sm:rounded-t-3xl flex flex-col shadow-2xl overscroll-y-contain transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag Handle & Header */}
        <div className="pt-2.5 pb-2 px-4 border-b border-white/10 flex flex-col shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/25 mx-auto mb-2" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white/95">
                Komentar Warga
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-mono text-[11px] font-semibold">
                {comments.length || commentsCount}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchComments(true);
                }}
                disabled={isLoading || isRefreshing}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                title="Segarkan komentar"
                aria-label="Segarkan komentar"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                aria-label="Tutup komentar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Comments List */}
        <div
          ref={commentsListRef}
          data-scroll-isolated="true"
          className="flex-1 overflow-y-auto px-4 py-3 space-y-4 no-scrollbar overscroll-y-contain touch-pan-y"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/40 space-y-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs">Memuat tanggapan warga...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5 text-white/40" />
              </div>
              <p className="text-sm font-semibold text-white/90">Belum ada komentar warga</p>
              <p className="text-xs text-white/50 mt-1 max-w-[240px]">
                Sampaikan kesaksian, kondisi terkini, atau tanggapan Anda mengenai titik laporan ini.
              </p>
              <button
                type="button"
                onClick={() => fetchComments(true)}
                disabled={isRefreshing}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs text-white/80 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
              >
                <RotateCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                <span>Cek Komentar Baru</span>
              </button>
            </div>
          ) : (
            comments.filter((item) => !item.parentId).map((item) => {
              const isLiked = likedCommentIds.has(item.id);
              const delta = likesDeltaMap[item.id] || 0;
              const currentLikes = Math.max(0, (item.likes || 0) + delta);
              const replies = comments.filter((comment) => comment.parentId === item.id);

              return (
                <div key={item.id} data-comment-id={item.id} className="flex items-start gap-3 group scroll-mt-2">
                  <a
                    href={`/u/${item.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onClose();
                      if (window.history && typeof window.history.pushState === 'function') {
                        window.history.pushState({}, '', `/u/${item.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`);
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      } else {
                        window.location.href = `/u/${item.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`;
                      }
                    }}
                    className="shrink-0 cursor-pointer block hover:opacity-80 transition-opacity"
                    title={`Lihat profil ${item.authorName}`}
                  >
                    <img
                      src={item.avatarUrl}
                      alt={item.authorName}
                      className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/15 hover:scale-105 transition-transform"
                    />
                  </a>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`/u/${item.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onClose();
                          if (window.history && typeof window.history.pushState === 'function') {
                            window.history.pushState({}, '', `/u/${item.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`);
                            window.dispatchEvent(new PopStateEvent('popstate'));
                          } else {
                            window.location.href = `/u/${item.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`;
                          }
                        }}
                        className="font-semibold text-xs text-white/95 hover:text-emerald-400 hover:underline transition-colors cursor-pointer truncate"
                      >
                        {item.authorName}
                      </a>
                      <span className="text-[10px] text-white/45 font-mono shrink-0">
                        • {item.timeAgo}
                      </span>
                    </div>

                    <p className="text-xs text-white/85 leading-relaxed mt-0.5 whitespace-pre-wrap break-words">
                      {item.body}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/50">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTarget({ id: item.id, authorName: item.authorName });
                          inputRef.current?.focus();
                          const el = commentsListRef.current?.querySelector(`[data-comment-id="${item.id}"]`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer transition-colors"
                      >
                        Balas
                      </button>
                    </div>

                    {replies.length > 0 && (
                      <div className="mt-3 ml-1 pl-3 border-l border-white/15 space-y-3">
                        {replies.map((reply) => {
                          const isReplyLiked = likedCommentIds.has(reply.id);
                          const replyDelta = likesDeltaMap[reply.id] || 0;
                          const currentReplyLikes = Math.max(0, (reply.likes || 0) + replyDelta);

                          return (
                            <div key={reply.id} data-comment-id={reply.id} className="flex items-start gap-2 justify-between scroll-mt-2">
                              <div className="flex items-start gap-2 min-w-0 flex-1">
                                <a
                                  href={`/u/${reply.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    onClose();
                                    if (window.history && typeof window.history.pushState === 'function') {
                                      window.history.pushState({}, '', `/u/${reply.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`);
                                      window.dispatchEvent(new PopStateEvent('popstate'));
                                    } else {
                                      window.location.href = `/u/${reply.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`;
                                    }
                                  }}
                                  className="shrink-0 cursor-pointer block hover:opacity-80 transition-opacity"
                                  title={`Lihat profil ${reply.authorName}`}
                                >
                                  <img
                                    src={reply.avatarUrl}
                                    alt={reply.authorName}
                                    className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-white/15 hover:scale-105 transition-transform"
                                  />
                                </a>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <a
                                      href={`/u/${reply.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        onClose();
                                        if (window.history && typeof window.history.pushState === 'function') {
                                          window.history.pushState({}, '', `/u/${reply.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`);
                                          window.dispatchEvent(new PopStateEvent('popstate'));
                                        } else {
                                          window.location.href = `/u/${reply.authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}`;
                                        }
                                      }}
                                      className="font-semibold text-[11px] text-white/90 hover:text-emerald-400 hover:underline transition-colors cursor-pointer truncate"
                                    >
                                      {reply.authorName}
                                    </a>
                                    <span className="text-[10px] text-white/45 font-mono shrink-0">
                                      • {reply.timeAgo}
                                    </span>
                                  </div>
                                  <p className="text-xs text-white/80 leading-relaxed mt-0.5 whitespace-pre-wrap break-words">
                                    {reply.body}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleLike(reply.id)}
                                className="flex flex-col items-center gap-0.5 p-1 text-white/50 hover:text-white transition-colors cursor-pointer shrink-0 active:scale-90"
                                title={isReplyLiked ? 'Batal suka' : 'Suka balasan'}
                              >
                                <Heart
                                  className={`w-3.5 h-3.5 transition-colors ${
                                    isReplyLiked ? 'fill-red-500 text-red-500' : ''
                                  }`}
                                />
                                <span className="text-[9px] font-mono">{currentReplyLikes}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleLike(item.id)}
                    className="flex flex-col items-center gap-0.5 p-1 text-white/50 hover:text-white transition-colors cursor-pointer shrink-0 active:scale-90"
                    title={isLiked ? 'Batal suka' : 'Suka komentar'}
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        isLiked ? 'fill-red-500 text-red-500' : ''
                      }`}
                    />
                    <span className="text-[10px] font-mono">{currentLikes}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sticky Input Bar at Bottom */}
        <form
          onSubmit={handleSubmit}
          className="p-3 sm:p-4 pb-[max(1rem,env(safe-area-inset-bottom,16px))] bg-[#111412]/95 backdrop-blur-md border-t border-white/10 shrink-0 relative z-10"
        >
          {replyTarget && (
            <div className="flex items-center justify-between mb-2 px-1 text-[11px] text-white/55">
              <span>Balas ke <span className="text-emerald-300">@{replyTarget.authorName}</span></span>
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                className="text-white/60 hover:text-white cursor-pointer"
                aria-label="Batalkan balasan"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <img
              src={
                profile?.avatarUrl ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
              }
              alt={profile?.displayName || 'Profil Anda'}
              className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
            />
            <input
              ref={inputRef}
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder={replyTarget ? `Balas ke @${replyTarget.authorName}...` : 'Tulis komentar...'}
              className="flex-1 bg-white/10 border border-white/10 focus:border-emerald-400/60 focus:bg-white/15 rounded-full px-4 py-2 text-xs text-white placeholder-white/40 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!newCommentText.trim() || isSubmitting}
              className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-400 transition-all shrink-0 active:scale-95 cursor-pointer shadow-md"
              title={replyTarget ? 'Kirim balasan' : 'Kirim komentar'}
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

