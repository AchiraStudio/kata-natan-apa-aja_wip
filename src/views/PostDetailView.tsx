import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MapPin,
  Send,
  Loader2,
  AlertCircle,
  Check,
  CornerDownRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTitik } from '../context/TitikContext';
import { dataService } from '../services/dataService';
import { Post, Report } from '../types/domain';
import { FeedComment } from '../services/adapters/types';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { formatIndonesianTimeAgo } from '../utils/timeAgo';

export const PostDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isAuthenticated } = useAuth();
  const { openReportDetail } = useTitik();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Engagement state
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [savesCount, setSavesCount] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);

  // Comment input state
  const [commentText, setCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState<FeedComment | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const loadPostAndComments = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      const fetchedPost = await dataService.getPostById(id);
      if (!fetchedPost) {
        setError('Postingan tidak ditemukan.');
        setIsLoading(false);
        return;
      }

      setPost(fetchedPost);
      setIsLiked(Boolean(fetchedPost.isLikedByMe));
      setLikesCount(fetchedPost.likesCount || 0);
      setIsSaved(Boolean(fetchedPost.isSavedByMe));
      setSavesCount(fetchedPost.savesCount || 0);

      const fetchedComments = await dataService.getComments(id).catch(() => []);
      setComments(fetchedComments);
    } catch (err: unknown) {
      console.error('Failed to load post detail:', err);
      setError('Gagal memuat detail postingan.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPostAndComments();
  }, [loadPostAndComments]);

  const handleToggleLike = async () => {
    if (!post) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await dataService.togglePostLike(post.id, profile.id);
      setIsLiked(res.isLiked);
      setLikesCount(res.likesCount);
    } catch (err) {
      console.error('Toggle like error:', err);
      // rollback
      setIsLiked(!nextState);
      setLikesCount((prev) => (nextState ? Math.max(0, prev - 1) : prev + 1));
    }
  };

  const handleToggleSave = async () => {
    if (!post) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const nextState = !isSaved;
    setIsSaved(nextState);
    setSavesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await dataService.togglePostSave(post.id, profile.id);
      setIsSaved(res.isSaved);
      setSavesCount(res.savesCount);
    } catch (err) {
      console.error('Toggle save error:', err);
      // rollback
      setIsSaved(!nextState);
      setSavesCount((prev) => (nextState ? Math.max(0, prev - 1) : prev + 1));
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Postingan dari ${post?.author.displayName} di TITIK.`,
          text: post?.body.slice(0, 100),
          url,
        });
      } catch {
        // Dismissed
      }
    } else {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !commentText.trim()) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsSubmittingComment(true);
    setCommentError(null);

    try {
      const newComment = await dataService.addComment(
        post.id,
        profile.displayName,
        profile.avatarUrl,
        commentText.trim(),
        replyTarget?.id
      );

      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      setReplyTarget(null);
      if (post) {
        setPost({
          ...post,
          commentsCount: (post.commentsCount || 0) + 1,
        });
      }
    } catch (err: unknown) {
      console.error('Add comment error:', err);
      setCommentError((err as Error).message || 'Gagal mengirim komentar.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F1] dark:bg-[#0A100D] text-[#20221D] dark:text-[#F3F6F4] flex flex-col lg:flex-row pb-24 lg:pb-0">
      <Sidebar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 lg:py-8">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#686B65] dark:text-[#9EACA3] hover:text-[#263F35] dark:hover:text-[#34D399] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-8 h-8 text-[#263F35] dark:text-[#34D399] animate-spin mb-3" />
            <p className="text-xs font-medium text-[#686B65] dark:text-[#9EACA3]">
              Memuat postingan...
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && (error || !post) && (
          <div className="max-w-md mx-auto py-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#20221D] dark:text-[#F3F6F4]">
              {error || 'Postingan tidak ditemukan'}
            </h3>
            <p className="text-xs text-[#686B65] dark:text-[#9EACA3]">
              Postingan ini mungkin telah dihapus atau tautan tidak valid.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-xl text-xs font-bold hover:bg-[#1d3129] cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
        )}

        {/* Post Card */}
        {!isLoading && post && (
          <div className="space-y-6">
            <article className="bg-white dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl shadow-sm overflow-hidden">
              {/* Author Header */}
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#E4E2DA]/60 dark:border-[#26352E]/60">
                <Link
                  to={`/u/${post.author.username}`}
                  className="flex items-center gap-3 group"
                >
                  <img
                    src={post.author.avatarUrl}
                    alt={post.author.displayName}
                    className="w-11 h-11 rounded-full object-cover border border-[#E4E2DA] dark:border-[#26352E] group-hover:ring-2 group-hover:ring-[#263F35] transition-all"
                  />
                  <div>
                    <div className="text-sm font-bold text-[#20221D] dark:text-[#F3F6F4] group-hover:text-[#263F35] dark:group-hover:text-[#34D399] transition-colors">
                      {post.author.displayName}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#686B65] dark:text-[#9EACA3]">
                      <span>@{post.author.username}</span>
                      <span>•</span>
                      <span>{formatIndonesianTimeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-1.5 text-xs text-[#263F35] dark:text-[#34D399] font-semibold bg-[#E7EBDD] dark:bg-[#1A2E24] px-2.5 py-1 rounded-full">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{post.locationTag || 'Kota Bogor'}</span>
                </div>
              </div>

              {/* Media Container if any */}
              {post.media && post.media.length > 0 && (
                <div className="bg-stone-900 border-b border-[#E4E2DA]/60 dark:border-[#26352E]/60 overflow-hidden">
                  {post.media.map((item) =>
                    item.type === 'video' ? (
                      <video
                        key={item.id}
                        src={item.url}
                        controls
                        className="w-full max-h-[500px] object-contain mx-auto"
                      />
                    ) : (
                      <img
                        key={item.id}
                        src={item.url}
                        alt="Media Postingan"
                        className="w-full max-h-[500px] object-contain mx-auto"
                      />
                    )
                  )}
                </div>
              )}

              {/* Post Body */}
              <div className="p-5 space-y-4">
                <p className="text-sm sm:text-base text-[#20221D] dark:text-[#F3F6F4] leading-relaxed whitespace-pre-wrap">
                  {post.body}
                </p>

                {/* Related Civic Report Card */}
                {post.relatedReport && (
                  <div
                    onClick={() => openReportDetail(post.relatedReport as Report)}
                    className="p-4 rounded-2xl bg-[#F7F6F1] dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] hover:border-[#263F35]/40 dark:hover:border-[#10B981]/40 transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-[#263F35] dark:text-[#34D399]">
                        {post.relatedReport.publicReference}
                      </span>
                      <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-bold">
                        {post.relatedReport.status}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] group-hover:text-[#263F35] dark:group-hover:text-[#34D399]">
                      {post.relatedReport.title}
                    </h5>
                    <p className="text-[11px] text-[#686B65] dark:text-[#9EACA3] flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{post.relatedReport.location?.address || 'Kota Bogor'}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Engagement Bar */}
              <div className="px-5 py-3.5 bg-[#F7F6F1]/60 dark:bg-[#1A221E]/60 border-t border-[#E4E2DA] dark:border-[#26352E] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleToggleLike}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold transition-all active:scale-90 cursor-pointer ${
                      isLiked ? 'text-rose-600 dark:text-rose-400' : 'text-[#686B65] dark:text-[#9EACA3]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{likesCount} Suka</span>
                  </button>

                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#686B65] dark:text-[#9EACA3]">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    <span>{comments.length} Komentar</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleSave}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      isSaved
                        ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                        : 'text-[#686B65] dark:text-[#9EACA3] hover:bg-stone-200 dark:hover:bg-[#26352E]'
                    }`}
                    title={isSaved ? 'Hapus dari simpanan' : 'Simpan postingan'}
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    <span className="text-xs font-bold">{savesCount}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E4E2DA] dark:border-[#26352E] bg-white dark:bg-[#131916] text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] hover:bg-[#F7F6F1] dark:hover:bg-[#26352E] cursor-pointer"
                  >
                    {shareCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Bagikan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>

            {/* Comments Section */}
            <section className="bg-white dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-[#20221D] dark:text-[#F3F6F4]">
                Komentar Warga ({comments.length})
              </h3>

              {/* Comment Input */}
              {isAuthenticated ? (
                <form onSubmit={handleAddComment} className="space-y-2">
                  {replyTarget && (
                    <div className="flex items-center justify-between px-3 py-1.5 bg-[#E7EBDD] dark:bg-[#1A2E24] rounded-xl text-xs font-semibold text-[#263F35] dark:text-[#34D399]">
                      <span className="flex items-center gap-1">
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span>Membalas @{replyTarget.authorName}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setReplyTarget(null)}
                        className="text-[#686B65] hover:text-[#20221D] cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  )}

                  {commentError && (
                    <div className="text-xs text-rose-600 dark:text-rose-400">
                      {commentError}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      maxLength={1000}
                      placeholder={
                        replyTarget
                          ? `Tulis balasan untuk @${replyTarget.authorName}...`
                          : 'Tulis tanggapan atau masukan warga...'
                      }
                      className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-[#E4E2DA] dark:border-[#26352E] bg-[#F7F6F1] dark:bg-[#1A221E] text-[#20221D] dark:text-[#F3F6F4] focus:outline-none focus:ring-1 focus:ring-[#263F35]"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingComment || !commentText.trim()}
                      className="px-4 py-2.5 bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-xl text-xs font-bold hover:bg-[#1d3129] cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {isSubmittingComment ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Kirim</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#F7F6F1] dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] flex items-center justify-between text-xs">
                  <span className="text-[#686B65] dark:text-[#9EACA3]">
                    Masuk untuk memberikan tanggapan atau saran fasilitas publik.
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="px-3 py-1.5 bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-xl font-bold cursor-pointer"
                  >
                    Masuk
                  </button>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-3 pt-2">
                {comments.length === 0 ? (
                  <p className="text-xs text-center py-6 text-[#686B65] dark:text-[#9EACA3]">
                    Belum ada komentar. Jadilah warga pertama yang menanggapi!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        comment.parentId
                          ? 'ml-6 bg-[#F7F6F1]/50 dark:bg-[#1A221E]/50 border-[#E4E2DA]/60 dark:border-[#26352E]/60'
                          : 'bg-white dark:bg-[#131916] border-[#E4E2DA] dark:border-[#26352E]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Link
                          to={`/u/${comment.authorName.toLowerCase().replace(/\s+/g, '_')}`}
                          className="flex items-center gap-2 group"
                        >
                          <img
                            src={comment.avatarUrl}
                            alt={comment.authorName}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] group-hover:text-[#263F35] dark:group-hover:text-[#34D399]">
                            {comment.authorName}
                          </span>
                        </Link>
                        <span className="text-[10px] text-[#686B65] dark:text-[#9EACA3]">
                          {comment.timeAgo}
                        </span>
                      </div>

                      <p className="text-xs text-[#20221D] dark:text-[#D1DCD5] leading-relaxed pl-8">
                        {comment.body}
                      </p>

                      <div className="pl-8 pt-2 flex items-center gap-4 text-[10px] text-[#686B65] dark:text-[#9EACA3]">
                        {isAuthenticated && (
                          <button
                            type="button"
                            onClick={() => setReplyTarget(comment)}
                            className="font-bold hover:text-[#263F35] dark:hover:text-[#34D399] cursor-pointer"
                          >
                            Balas
                          </button>
                        )}
                        <span>{comment.likes || 0} Suka</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
