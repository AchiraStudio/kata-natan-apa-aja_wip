import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { X, Send, RotateCw, BadgeCheck } from 'lucide-react';
import { useTitik } from '../../context/TitikContext';
import { useAuth } from '../../context/AuthContext';
import { FeedComment } from '../../services/adapters/types';
import { UserAvatar } from '../common/UserAvatar';
import { groupCommentThreads } from '../../utils/commentSorting';

export type CommentItem = FeedComment;

interface CommentsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  commentsCount: number;
  onCommentAdded?: () => void;
  onCommentsCountChange?: (count: number) => void;
}

interface ReplyTarget {
  /** Top-level comment the reply is attached to. */
  parentId: string;
  /** Person being answered, shown in the composer. */
  authorName: string;
  mention: string;
}

const profileLinkFor = (c: CommentItem): string | null => {
  const handle = (c.authorUsername || '').replace(/^@+/, '').trim();
  return handle ? `/u/${encodeURIComponent(handle)}` : null;
};

/** Threaded comments for one post. Replies attach to the top-level comment they answer. */
export const CommentsBottomSheet: React.FC<CommentsBottomSheetProps> = ({
  isOpen,
  onClose,
  postId,
  commentsCount,
  onCommentAdded,
  onCommentsCountChange,
}) => {
  const { getComments, addComment } = useTitik();
  const { profile, isAuthenticated } = useAuth();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [draft, setDraft] = useState('');
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const countChangeRef = useRef(onCommentsCountChange);
  const knownCountRef = useRef(commentsCount);

  useEffect(() => {
    countChangeRef.current = onCommentsCountChange;
    knownCountRef.current = commentsCount;
  }, [onCommentsCountChange, commentsCount]);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const loaded = (await getComments(postId)) || [];
      setComments(loaded);
      setHasFetched(true);
      if (loaded.length !== knownCountRef.current) countChangeRef.current?.(loaded.length);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [postId, getComments]);

  // Load when opened or when the post changes; reset the composer between posts
  useEffect(() => {
    if (!isOpen) return;
    setReplyTarget(null);
    setSubmitError(null);
    fetchComments();
  }, [isOpen, postId, fetchComments]);

  // Escape closes; the nav bar and feed hotkeys listen for this state
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.dataset.commentsOpen = 'true';
    window.dispatchEvent(new CustomEvent('titik-comments-toggle', { detail: { open: true } }));
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(focusTimer);
      delete document.body.dataset.commentsOpen;
      window.dispatchEvent(new CustomEvent('titik-comments-toggle', { detail: { open: false } }));
    };
  }, [isOpen, onClose]);

  // The feed intercepts wheel events for post-to-post paging: keep scrolling inside the sheet
  useEffect(() => {
    const el = sheetRef.current;
    if (!el || !isOpen) return;
    const stop = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener('wheel', stop, { passive: false });
    return () => el.removeEventListener('wheel', stop);
  }, [isOpen]);

  const threads = useMemo(() => groupCommentThreads(comments), [comments]);

  const startReply = (root: CommentItem, target: CommentItem) => {
    setReplyTarget({ parentId: root.id, authorName: target.authorName, mention: target.authorName });
    setSubmitError(null);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || isSubmitting || !isAuthenticated) return;

    setIsSubmitting(true);
    setSubmitError(null);
    const authorName = profile?.displayName || profile?.username || 'Warga';
    try {
      const created = await addComment(postId, body, authorName, profile?.avatarUrl, replyTarget?.parentId);
      if (!created) throw new Error('empty response');
      const mine: CommentItem = { ...created, authorRole: profile?.role, authorUsername: profile?.username };
      setComments((prev) => [...prev, mine]);
      setDraft('');
      onCommentAdded?.();
      const parentId = replyTarget?.parentId;
      setReplyTarget(null);
      setTimeout(() => {
        const anchor = parentId ? listRef.current?.querySelector(`[data-comment-id="${CSS.escape(created.id)}"]`) : null;
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        else listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      }, 60);
    } catch (err) {
      console.error('Failed to add comment:', err);
      setSubmitError('Komentar belum terkirim. Periksa koneksi, lalu coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = (c: CommentItem, root: CommentItem, isReply: boolean) => {
    const href = profileLinkFor(c);
    const isOfficial = c.authorRole === 'admin';
    const name = href ? (
      <Link to={href} onClick={onClose} className="font-semibold text-ink hover:underline truncate">
        {c.authorName}
      </Link>
    ) : (
      <span className="font-semibold text-ink truncate">{c.authorName}</span>
    );
    return (
      <li key={c.id} data-comment-id={c.id} className="flex gap-3 scroll-mt-2">
        <UserAvatar
          src={c.avatarUrl}
          alt={c.authorName}
          name={c.authorName}
          role={c.authorRole}
          className={`${isReply ? 'w-7 h-7' : 'w-9 h-9'} rounded-full object-cover shrink-0`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[13px] min-w-0">
            {name}
            {isOfficial && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand shrink-0">
                <BadgeCheck className="w-3.5 h-3.5" /> Respons resmi
              </span>
            )}
            <span className="text-[11px] text-ink-3 shrink-0">{c.timeAgo}</span>
          </div>
          <p className={`mt-0.5 text-sm whitespace-pre-wrap break-words ${isOfficial ? 'text-ink' : 'text-ink-2'}`}>{c.body}</p>
          <button
            type="button"
            onClick={() => startReply(root, c)}
            className="mt-1 text-xs font-semibold text-ink-3 hover:text-ink cursor-pointer"
          >
            Balas
          </button>
        </div>
      </li>
    );
  };

  const total = hasFetched ? comments.length : commentsCount;

  return (
    <div
      data-scroll-isolated="true"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className={`absolute inset-0 z-50 flex flex-col justify-end bg-[var(--scrim)] transition-opacity duration-200 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Komentar warga"
        aria-hidden={!isOpen}
        data-scroll-isolated="true"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className={`w-full h-[72%] flex flex-col bg-surface text-ink rounded-t-2xl overscroll-y-contain transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="shrink-0 flex items-center justify-between gap-2 px-4 h-14 border-b border-line-soft">
          <h3 className="text-[15px] font-bold">
            Komentar <span className="text-ink-3 font-medium tabular-nums">{total}</span>
          </h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={fetchComments}
              disabled={isLoading}
              aria-label="Muat ulang komentar"
              title="Muat ulang"
              className="w-10 h-10 rounded-lg flex items-center justify-center text-ink-2 hover:text-ink hover:bg-surface-2 disabled:opacity-40 cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup komentar"
              className="w-10 h-10 rounded-lg flex items-center justify-center text-ink-2 hover:text-ink hover:bg-surface-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 no-scrollbar">
          {isLoading && !hasFetched ? (
            <p role="status" className="py-12 text-center text-sm text-ink-2">
              Memuat komentar
            </p>
          ) : loadError ? (
            <div role="alert" className="py-12 text-center space-y-3">
              <p className="text-sm text-ink-2">Komentar belum dapat dimuat.</p>
              <button type="button" onClick={fetchComments} className="titik-pill-btn titik-pill-btn-secondary">
                Coba lagi
              </button>
            </div>
          ) : threads.length === 0 ? (
            <div className="py-12 text-center space-y-1">
              <p className="font-display text-base font-semibold">Belum ada komentar</p>
              <p className="text-sm text-ink-2">Bagikan kesaksian atau informasi tambahan dari lokasi.</p>
            </div>
          ) : (
            <ul className="space-y-5">
              {threads.map(({ root, replies }) => (
                <React.Fragment key={root.id}>
                  {renderComment(root, root, false)}
                  {replies.length > 0 && (
                    <li>
                      <ul className="ml-12 space-y-4 pl-3 border-l border-line">
                        {replies.map((r) => renderComment(r, root, true))}
                      </ul>
                    </li>
                  )}
                </React.Fragment>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-line-soft px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {isAuthenticated ? (
            <form onSubmit={handleSubmit} className="space-y-2">
              {replyTarget && (
                <div className="flex items-center justify-between gap-2 text-xs text-ink-2">
                  <span className="truncate">
                    Membalas <strong className="text-ink">{replyTarget.authorName}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyTarget(null)}
                    aria-label="Batalkan balasan"
                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-surface-2 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {submitError && (
                <p role="alert" className="text-xs text-st-ditolak">
                  {submitError}
                </p>
              )}
              <div className="flex items-center gap-2">
                <UserAvatar
                  src={profile?.avatarUrl}
                  alt={profile?.displayName || 'Anda'}
                  name={profile?.displayName}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={replyTarget ? `Balas ${replyTarget.mention}` : 'Tulis komentar'}
                  aria-label="Tulis komentar"
                  maxLength={1000}
                  autoComplete="off"
                  className="titik-pill-input flex-1 px-3.5 min-h-11"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || isSubmitting}
                  aria-label="Kirim komentar"
                  className="w-11 h-11 rounded-lg bg-brand text-on-brand flex items-center justify-center hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-[18px] h-[18px]" />
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-ink-2 text-center py-1">
              <Link to="/login" className="font-semibold text-ink underline underline-offset-2">
                Masuk
              </Link>{' '}
              untuk menulis atau membalas komentar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
