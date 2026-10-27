import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { hasExplicitAIGenerationMarker, registerReportMediaType } from '../../utils/reportEvidence';
import { PostMedia } from '../../types/domain';

export interface UploadedMediaItem {
  id: string;
  type: 'image' | 'video';
  file: File;
  dataUrl: string;
  storageUrl?: string;
  sizeBytes: number;
}

export async function stripExifAndCleanImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 900,
  quality = 0.85
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = {
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      };

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context tidak tersedia di browser ini.'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Gagal mengekspor gambar setelah pembersihan EXIF.'));
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({ blob, dataUrl: String(reader.result) });
          };
          reader.onerror = () => reject(new Error('Gagal membaca data URL gambar.'));
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Berkas gambar tidak dapat dibuka.'));
    };
    img.src = objectUrl;
  });
}

export async function uploadFileToSupabase(
  bucket: 'post-media' | 'avatars' | 'report-evidence-private',
  fileOrBlob: File | Blob,
  userId?: string,
  fileName = 'upload'
): Promise<string> {
  if (isSupabaseConfigured) {
    try {
      // Determine folder: Must match auth.uid() for storage RLS
      let folder = userId;
      if (!folder || folder === 'public') {
        const { data: userData } = await supabase.auth.getUser();
        folder = userData.user?.id || userId || 'public';
      }

      const cleanExt = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${cleanExt}`;
      const mimeType = (fileOrBlob as Blob).type || (cleanExt === 'png' ? 'image/png' : 'image/jpeg');

      const { data, error } = await supabase.storage.from(bucket).upload(path, fileOrBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: mimeType,
      });

      if (!error && data) {
        if (bucket === 'post-media' || bucket === 'avatars') {
          const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(path);
          return pubData.publicUrl;
        }
        return path;
      }
      if (error) {
        console.warn('Storage upload returned error, falling back:', error.message);
      }
    } catch (err) {
      console.warn('Storage upload fallback:', err);
    }
  }

  // Fallback to data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(fileOrBlob);
  });
}

export function useMediaUpload(maxFiles = 4, maxSizeBytes = 10 * 1024 * 1024) {
  const [items, setItems] = useState<UploadedMediaItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  const addFiles = useCallback(async (files: FileList | File[]) => {
    setUploadError('');
    setIsProcessing(true);
    const newItems: UploadedMediaItem[] = [];

    for (const file of Array.from(files)) {
      if (items.length + newItems.length >= maxFiles) {
        setUploadError(`Maksimal ${maxFiles} berkas media.`);
        break;
      }

      if (file.size > maxSizeBytes) {
        setUploadError(`Ukuran berkas ${file.name} melebihi batas maksimal 10 MB.`);
        continue;
      }

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        setUploadError(`Format berkas ${file.name} tidak didukung. Gunakan JPG, PNG, WebP, atau MP4.`);
        continue;
      }

      try {
        const buffer = await file.arrayBuffer();
        if (hasExplicitAIGenerationMarker(new Uint8Array(buffer))) {
          setUploadError(`Berkas ${file.name} terdeteksi memiliki penanda generatif AI.`);
          continue;
        }

        let finalDataUrl = '';
        if (isImage) {
          const cleaned = await stripExifAndCleanImage(file);
          finalDataUrl = cleaned.dataUrl;
        } else {
          finalDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }

        const itemType: PostMedia['type'] = isVideo ? 'video' : 'image';
        registerReportMediaType(finalDataUrl, file.type);

        newItems.push({
          id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: itemType,
          file,
          dataUrl: finalDataUrl,
          sizeBytes: file.size,
        });
      } catch (err) {
        console.error('File processing error:', err);
        setUploadError(`Gagal memproses berkas ${file.name}.`);
      }
    }

    setItems((prev) => [...prev, ...newItems]);
    setIsProcessing(false);
  }, [items.length, maxFiles, maxSizeBytes]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    setUploadError('');
  }, []);

  return {
    items,
    isProcessing,
    uploadError,
    addFiles,
    removeItem,
    clearAll,
    setUploadError,
  };
}
