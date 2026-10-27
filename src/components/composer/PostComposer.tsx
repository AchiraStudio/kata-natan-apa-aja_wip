import React, { useState, useRef } from 'react';
import { Image, Video, MapPin, X, AlertCircle, Loader2, Link2, Sparkles } from 'lucide-react';
import { useMediaUpload, uploadFileToSupabase } from './useMediaUpload';
import { useComposerDraft } from './useComposerDraft';
import { useAuth } from '../../context/AuthContext';
import { useTitik } from '../../context/useTitik';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { Post, PostMedia } from '../../types/domain';
import { generatePostId } from '../../utils/idGenerator';

interface PostComposerProps {
  onSuccess: (newPost: Post) => void;
  onCancel: () => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({ onSuccess, onCancel }) => {
  const { user, profile, isAuthenticated } = useAuth();
  const { facilities, refreshFeed } = useTitik();
  const { draft, updateDraft, clearDraft } = useComposerDraft();
  const { items, isProcessing, uploadError, addFiles, removeItem, clearAll } = useMediaUpload(4);

  const [postType, setPostType] = useState<'citizen_report' | 'community_discussion' | 'official_update'>(
    profile.role === 'admin' ? 'official_update' : 'community_discussion'
  );
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_CHARS = 2000;
  const remainingChars = MAX_CHARS - draft.caption.length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!draft.caption.trim()) {
      setSubmitError('Isi postingan tidak boleh kosong.');
      return;
    }

    if (draft.caption.length > MAX_CHARS) {
      setSubmitError(`Isi postingan melebihi batas ${MAX_CHARS} karakter.`);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload files to Storage if online
      const mediaList: PostMedia[] = [];
      for (const item of items) {
        let finalUrl = item.dataUrl;
        if (isSupabaseConfigured && isAuthenticated) {
          try {
            finalUrl = await uploadFileToSupabase('post-media', item.file, user?.id, item.file.name);
          } catch (uploadErr) {
            console.warn('Storage upload fallback to dataUrl:', uploadErr);
          }
        }
        mediaList.push({
          id: item.id,
          type: item.type,
          url: finalUrl,
          aspectRatio: '4/5',
        });
      }

      // 2. Insert to Supabase via RPC or table
      const requestId = crypto.randomUUID ? crypto.randomUUID() : undefined;
      let createdPost: Post;

      if (isSupabaseConfigured && isAuthenticated) {
        const { data, error } = await supabase.rpc('create_post', {
          p_request_id: requestId,
          p_body: draft.caption.trim(),
          p_post_type: postType,
          p_media: mediaList,
          p_location_tag: draft.locationTag.trim() || 'Kota Bogor',
          p_related_report_id: null,
        });

        if (error) {
          throw new Error(error.message || 'Gagal menerbitkan postingan.');
        }

        createdPost = {
          id: data.id,
          author: profile,
          body: data.body,
          postType: data.post_type,
          media: Array.isArray(data.media) ? data.media : mediaList,
          locationTag: data.location_tag,
          supportCount: 0,
          likesCount: 0,
          savesCount: 0,
          commentsCount: 0,
          sharesCount: 0,
          createdAt: data.created_at || new Date().toISOString(),
          isSampleData: false,
        };
      } else {
        // Local / demo creation
        createdPost = {
          id: generatePostId(),
          author: profile,
          body: draft.caption.trim(),
          postType,
          media: mediaList,
          locationTag: draft.locationTag.trim() || 'Kota Bogor',
          supportCount: 0,
          likesCount: 0,
          savesCount: 0,
          commentsCount: 0,
          sharesCount: 0,
          createdAt: new Date().toISOString(),
          isSampleData: false,
        };
      }

      clearDraft();
      clearAll();
      await refreshFeed();
      onSuccess(createdPost);
    } catch (err) {
      console.error('Post creation failed:', err);
      setSubmitError(err instanceof Error ? err.message : 'Gagal mempublikasikan postingan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Post Type Selector */}
      <div className="flex items-center gap-2 p-1 bg-[#E4E2DA]/50 dark:bg-[#1A221E] rounded-xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => setPostType('community_discussion')}
          className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
            postType === 'community_discussion'
              ? 'bg-white dark:bg-[#26352E] text-[#263F35] dark:text-[#34D399] shadow-xs'
              : 'text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4]'
          }`}
        >
          Diskusi Warga
        </button>
        <button
          type="button"
          onClick={() => setPostType('citizen_report')}
          className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
            postType === 'citizen_report'
              ? 'bg-white dark:bg-[#26352E] text-[#263F35] dark:text-[#34D399] shadow-xs'
              : 'text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4]'
          }`}
        >
          Kabar Lapangan
        </button>
        {profile.role === 'admin' && (
          <button
            type="button"
            onClick={() => setPostType('official_update')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
              postType === 'official_update'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 shadow-xs'
                : 'text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4]'
            }`}
          >
            Pembaruan Resmi
          </button>
        )}
      </div>

      {/* Author Preview */}
      <div className="flex items-center gap-3">
        <img
          src={profile.avatarUrl}
          alt={profile.displayName}
          className="w-9 h-9 rounded-full object-cover ring-1 ring-[#E4E2DA] dark:ring-[#26352E]"
        />
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] truncate">
            {profile.displayName}
          </p>
          <p className="text-[11px] text-[#686B65] dark:text-[#9EACA3] truncate">
            @{profile.username} • {profile.district || 'Kota Bogor'}
          </p>
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          rows={4}
          value={draft.caption}
          onChange={(e) => updateDraft({ caption: e.target.value })}
          placeholder="Bagikan situasi fasilitas publik, kondisi jalan, atau tanggapan Anda..."
          className="w-full p-3.5 bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-xl text-sm text-[#20221D] dark:text-[#F3F6F4] placeholder:text-[#686B65] focus:outline-hidden focus:ring-2 focus:ring-[#263F35] dark:focus:ring-[#10B981] transition-all resize-none"
          maxLength={MAX_CHARS}
          required
        />
        <div className="flex items-center justify-between mt-1 px-1">
          <span className="text-[11px] text-[#686B65] dark:text-[#9EACA3]">
            Privasi: Terbuka untuk umum di linimasa TITIK
          </span>
          <span
            className={`text-[11px] font-mono tabular-nums ${
              remainingChars < 100
                ? 'text-rose-600 font-bold'
                : 'text-[#686B65] dark:text-[#9EACA3]'
            }`}
          >
            {remainingChars} / {MAX_CHARS}
          </span>
        </div>
      </div>

      {/* Location Input */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-xl">
        <MapPin className="w-4 h-4 text-[#263F35] dark:text-[#34D399] shrink-0" />
        <input
          type="text"
          value={draft.locationTag}
          onChange={(e) => updateDraft({ locationTag: e.target.value })}
          placeholder="Lokasi (contoh: Bogor Tengah, Jl. Pajajaran)"
          className="w-full bg-transparent text-xs text-[#20221D] dark:text-[#F3F6F4] placeholder:text-[#686B65] focus:outline-hidden"
        />
      </div>

      {/* Optional Linked Facility */}
      {facilities.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-xl">
          <Link2 className="w-4 h-4 text-[#686B65] dark:text-[#9EACA3] shrink-0" />
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="w-full bg-transparent text-xs text-[#20221D] dark:text-[#F3F6F4] focus:outline-hidden"
          >
            <option value="">Hubungkan dengan fasilitas publik (opsional)...</option>
            {facilities.map((fac) => (
              <option key={fac.id} value={fac.id} className="dark:bg-[#1A221E]">
                {fac.name} ({fac.category})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Media Previews */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square rounded-xl overflow-hidden bg-black/5 dark:bg-black/30 border border-[#E4E2DA] dark:border-[#26352E] group"
            >
              {item.type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center bg-black/60 text-white">
                  <Video className="w-6 h-6" />
                </div>
              ) : (
                <img
                  src={item.dataUrl}
                  alt="Bukti media"
                  className="w-full h-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                aria-label="Hapus media"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error Notices */}
      {(uploadError || submitError) && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError || submitError}</span>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-2 flex items-center justify-between border-t border-[#E4E2DA] dark:border-[#26352E]">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="post-media-input"
            disabled={items.length >= 4 || isProcessing}
          />
          <label
            htmlFor="post-media-input"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E2DA] dark:border-[#26352E] text-xs font-semibold cursor-pointer transition-colors ${
              items.length >= 4 || isProcessing
                ? 'opacity-50 cursor-not-allowed bg-transparent text-[#686B65]'
                : 'hover:bg-white dark:hover:bg-[#1A221E] text-[#263F35] dark:text-[#34D399]'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Image className="w-3.5 h-3.5" />
            )}
            <span>Tambah Foto/Video ({items.length}/4)</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !draft.caption.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#263F35] dark:bg-[#10B981] hover:bg-[#1d3129] dark:hover:bg-[#34D399] text-white dark:text-[#0A1610] rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menerbitkan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Terbitkan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
