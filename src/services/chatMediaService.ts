// =============================================================================
// Chat Media Service: Client-side compression and upload
// Supports images (JPG, PNG, WebP, GIF), documents (PDF, DOCX, etc.), audio
// =============================================================================

import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { MessageAttachment } from '../types/domain';

export async function compressImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<Blob> {
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
        reject(new Error('Canvas tidak tersedia.'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Gagal mengompresi gambar.'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal memproses berkas gambar.'));
    };

    img.src = objectUrl;
  });
}

/** Convert file or blob to base64 Data URL */
export function fileToDataUrl(fileOrBlob: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Gagal membaca berkas.'));
    reader.readAsDataURL(fileOrBlob);
  });
}

/** Upload media attachment for chat messages with automatic fallback */
export async function uploadChatAttachment(
  file: File,
  userId: string
): Promise<MessageAttachment> {
  const isImage = file.type.startsWith('image/');
  let payload: File | Blob = file;

  if (isImage && !file.type.includes('gif')) {
    try {
      payload = await compressImage(file);
    } catch {
      payload = file;
    }
  }

  // Attempt Supabase Storage upload if connected
  if (isSupabaseConfigured) {
    try {
      const ext = file.name.includes('.') ? file.name.split('.').pop() : isImage ? 'jpg' : 'bin';
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const contentType = file.type || 'application/octet-stream';

      // Try 'chat-attachments' bucket, with fallback to 'post-media'
      let bucket = 'chat-attachments';
      let uploadRes = await supabase.storage.from(bucket).upload(path, payload, {
        contentType,
        upsert: false,
      });

      if (uploadRes.error && uploadRes.error.message?.includes('not found')) {
        bucket = 'post-media';
        uploadRes = await supabase.storage.from(bucket).upload(path, payload, {
          contentType,
          upsert: false,
        });
      }

      if (!uploadRes.error && uploadRes.data) {
        const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(uploadRes.data.path);
        return {
          url: pubData.publicUrl,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
        };
      }
    } catch {
      // Fallback to local Data URL
    }
  }

  // Local fallback: Base64 Data URL
  const localUrl = await fileToDataUrl(payload);
  return {
    url: localUrl,
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
  };
}
