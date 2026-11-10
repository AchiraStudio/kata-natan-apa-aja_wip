import React, { useState, useRef, useEffect } from 'react';
import { ImagePlus, Video, MapPin, X, Loader2 } from 'lucide-react';
import { useMediaUpload, uploadFileToSupabase } from './useMediaUpload';
import { useComposerDraft } from './useComposerDraft';
import { useAuth } from '../../context/AuthContext';
import { useTitik } from '../../context/useTitik';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { Post, PostMedia } from '../../types/domain';
import { generatePostId } from '../../utils/idGenerator';
import { UserAvatar } from '../common/UserAvatar';
import { Field, Segmented, FormFooter, PrimaryButton, GhostButton, ErrorNote, INPUT_CLASS } from './ui';

interface PostComposerProps {
  onSuccess: (newPost: Post) => void;
  onCancel: () => void;
  /** True while there is text or media that closing would lose. */
  onDirtyChange?: (dirty: boolean) => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({ onSuccess, onCancel, onDirtyChange }) => {
  const { user, profile, isAuthenticated } = useAuth();
  const { refreshFeed } = useTitik();
  const { draft, updateDraft, clearDraft } = useComposerDraft();
  const { items, isProcessing, uploadError, addFiles, removeItem, clearAll } = useMediaUpload(4);

  const [postType, setPostType] = useState<'citizen_report' | 'community_discussion' | 'official_update'>(
    profile.role === 'admin' ? 'official_update' : 'community_discussion'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_CHARS = 2000;
  const isDirty = draft.caption.trim().length > 0 || items.length > 0;
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);
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

  const typeOptions: Array<{ value: typeof postType; label: string }> = [
    { value: 'community_discussion', label: 'Diskusi warga' },
    { value: 'citizen_report', label: 'Kabar lapangan' },
    ...(profile.role === 'admin' ? [{ value: 'official_update' as const, label: 'Pembaruan resmi' }] : []),
  ];
  const nearLimit = remainingChars <= 200;

  return (
    <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
        <div className="flex items-center gap-3">
          <UserAvatar src={profile.avatarUrl} alt={profile.displayName} name={profile.displayName} role={profile.role} className="w-10 h-10 rounded-full object-cover shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink truncate">{profile.displayName}</p>
            <p className="text-xs text-ink-3 truncate">
              @{profile.username}
              {profile.district ? ` / ${profile.district}` : ''}
            </p>
          </div>
        </div>

        <Segmented
          label="Jenis postingan"
          value={postType}
          onChange={setPostType}
          options={typeOptions}
        />

        <Field label="Isi postingan" htmlFor="post-body" hint="Tampil terbuka di linimasa TITIK. Jangan cantumkan data pribadi orang lain.">
          <textarea
            id="post-body"
            autoFocus
            rows={6}
            value={draft.caption}
            onChange={(e) => updateDraft({ caption: e.target.value })}
            placeholder="Ceritakan kondisi fasilitas publik, jalan, atau tanggapan Anda."
            className="titik-pill-input px-3.5 py-3 text-base sm:text-sm leading-relaxed resize-y min-h-36"
            maxLength={MAX_CHARS}
            required
          />
        </Field>

        <Field label="Lokasi" htmlFor="post-location">
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" aria-hidden="true" />
            <input
              id="post-location"
              type="text"
              value={draft.locationTag}
              onChange={(e) => updateDraft({ locationTag: e.target.value })}
              placeholder="Contoh: Bogor Tengah, Jl. Pajajaran"
              className={`${INPUT_CLASS} pl-10`}
            />
          </div>
        </Field>

        <Field label="Foto atau video" optional hint="Sampai 4 berkas, masing-masing maksimal 10 MB.">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            multiple
            onChange={handleFileChange}
            className="sr-only"
            id="post-media-input"
            disabled={items.length >= 4 || isProcessing}
          />
          <ul className="grid grid-cols-4 gap-2">
            {items.map((item) => (
              <li key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-surface-2">
                {item.type === 'video' ? (
                  <span className="w-full h-full flex items-center justify-center text-ink-2">
                    <Video className="w-6 h-6" aria-hidden="true" />
                  </span>
                ) : (
                  <img src={item.dataUrl} alt="Foto yang dilampirkan" className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/65 text-white flex items-center justify-center hover:bg-st-ditolak transition-colors cursor-pointer"
                  aria-label="Hapus lampiran"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
            {items.length < 4 && (
              <li>
                <label
                  htmlFor="post-media-input"
                  className={`aspect-square rounded-lg border border-dashed border-line flex flex-col items-center justify-center gap-1 text-ink-2 transition-colors focus-within:outline-2 ${
                    isProcessing ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:border-brand hover:text-brand'
                  }`}
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <ImagePlus className="w-5 h-5" aria-hidden="true" />}
                  <span className="text-[11px] font-medium tabular-nums">{items.length}/4</span>
                </label>
              </li>
            )}
          </ul>
        </Field>

        {(uploadError || submitError) && <ErrorNote>{uploadError || submitError}</ErrorNote>}
      </div>

      <FormFooter
        start={
          <span className={`tabular-nums ${nearLimit ? 'font-semibold text-st-baru' : ''}`} aria-live="polite">
            {nearLimit ? `${remainingChars} karakter tersisa` : `${draft.caption.length}/${MAX_CHARS}`}
          </span>
        }
      >
        <GhostButton onClick={onCancel}>Batal</GhostButton>
        <PrimaryButton type="submit" disabled={isSubmitting || isProcessing || !draft.caption.trim()}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Menerbitkan
            </>
          ) : (
            'Terbitkan'
          )}
        </PrimaryButton>
      </FormFooter>
    </form>
  );
};
