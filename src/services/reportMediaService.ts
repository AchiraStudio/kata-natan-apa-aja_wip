// =============================================================================
// TITIK. — Report Media Service
// Handles photo validation, client-side EXIF stripping, and private storage upload
// =============================================================================

import { supabase, isSupabaseConfigured, getPublicStorageUrl } from '../lib/supabase';

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_REPORT = 5;

export interface ValidatedMediaFile {
  file: File;
  previewUrl: string;
  sanitizedBlob: Blob;
  sizeBytes: number;
  mimeType: string;
  fileName: string;
}

export interface UploadedMediaItem {
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
}

/**
 * Validates file type and size.
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Format '${file.type || 'unknown'}' tidak didukung. Harap gunakan format JPEG, PNG, atau WebP.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Ukuran file (${sizeMb} MB) melebihi batas maksimum 10 MB.`,
    };
  }

  return { valid: true };
};

/**
 * Strips EXIF metadata (embedded GPS coords, camera info) by re-rendering
 * through an HTML5 canvas element before uploading to Supabase Storage.
 * Protects reporter privacy so location comes strictly from explicit choices.
 */
export const stripExifAndSanitize = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Preserve full dimensions up to 2560px max width/height to optimize storage
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      const maxDimension = 2560;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        // Fallback to original if 2D context is unavailable
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        0.90
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal memproses file foto bukti.'));
    };

    img.src = objectUrl;
  });
};

/**
 * Uploads sanitized evidence photos to Supabase Storage 'report-evidence-private'.
 */
export const uploadEvidenceFiles = async (
  files: File[],
  submissionId: string,
  onProgress?: (uploadedCount: number, total: number) => void
): Promise<UploadedMediaItem[]> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase Storage tidak terhubung. Unggahan foto membutuhkan koneksi Supabase.');
  }

  const results: UploadedMediaItem[] = [];
  let current = 0;

  for (const file of files) {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Sanitize image & strip EXIF
    const sanitizedBlob = await stripExifAndSanitize(file);

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeUUID = crypto.randomUUID();
    const storagePath = `incoming/${submissionId}/${safeUUID}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('report-evidence-private')
      .upload(storagePath, sanitizedBlob, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Gagal mengunggah foto ${file.name}: ${uploadError.message}`);
    }

    results.push({
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      file_size_bytes: sanitizedBlob.size,
    });

    current++;
    if (onProgress) {
      onProgress(current, files.length);
    }
  }

  return results;
};

/**
 * Resolves appropriate public or signed thumbnail URL.
 */
export const resolveMediaUrl = (storagePath: string, isApprovedPublic: boolean): string => {
  if (!storagePath) return '';
  
  if (isApprovedPublic) {
    return getPublicStorageUrl('report-evidence-public', storagePath);
  }

  // If private and user has permission, signed URL would be requested
  return getPublicStorageUrl('report-evidence-private', storagePath);
};

