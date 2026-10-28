import { supabase, isSupabaseConfigured } from './supabaseClient';
import { DataError } from './errors/DataError';

export interface StorageUploadResult {
  path: string;
  publicUrl?: string;
}

export class StorageService {
  /**
   * Upload user profile avatar to the 'avatars' bucket.
   */
  async uploadAvatar(
    fileOrBlob: File | Blob,
    userId?: string,
    fileName = 'avatar'
  ): Promise<string> {
    return this.uploadPublicFile('avatars', fileOrBlob, userId, fileName);
  }

  /**
   * Upload user profile banner to the 'avatars' bucket.
   */
  async uploadBanner(
    fileOrBlob: File | Blob,
    userId?: string,
    fileName = 'banner'
  ): Promise<string> {
    return this.uploadPublicFile('avatars', fileOrBlob, userId, fileName);
  }

  /**
   * Upload post attachment media to the 'post-media' bucket.
   */
  async uploadPostMedia(
    fileOrBlob: File | Blob,
    userId?: string,
    fileName = 'media'
  ): Promise<string> {
    return this.uploadPublicFile('post-media', fileOrBlob, userId, fileName);
  }

  /**
   * Upload private citizen evidence to the 'report-evidence-private' bucket.
   * Returns storage object path within the private bucket.
   */
  async uploadPrivateEvidence(
    fileOrBlob: File | Blob,
    userId?: string,
    fileName = 'evidence'
  ): Promise<string> {
    if (!isSupabaseConfigured) {
      throw new DataError('network', 'Koneksi Supabase belum terkonfigurasi untuk upload bukti privat.');
    }

    let folder = userId;
    if (!folder) {
      const { data: userData } = await supabase.auth.getUser();
      folder = userData.user?.id || 'anon';
    }

    const cleanExt = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${cleanExt}`;
    const mimeType = (fileOrBlob as Blob).type || (cleanExt === 'png' ? 'image/png' : 'image/jpeg');

    const { data, error } = await supabase.storage
      .from('report-evidence-private')
      .upload(path, fileOrBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: mimeType,
      });

    if (error || !data) {
      throw new DataError('network', `Gagal mengunggah bukti ke storage: ${error?.message || 'Gagal menyimpan berkas.'}`);
    }

    return path;
  }

  /**
   * Generate short-lived signed URL for private evidence inspection on 'report-evidence-private'.
   * Accessible only by authenticated reviewer/admin.
   */
  async getPrivateEvidenceUrl(storagePath: string, expiresInSeconds = 3600): Promise<string> {
    if (!storagePath || !storagePath.trim()) {
      throw new DataError('validation', 'Path berkas bukti privat tidak boleh kosong.');
    }

    const cleanPath = storagePath.trim();

    if (!isSupabaseConfigured) {
      // Deterministic URL format for unconfigured/test environments
      return `https://supabase.local/storage/v1/object/sign/report-evidence-private/${cleanPath}?token=exp_${Date.now() + expiresInSeconds * 1000}`;
    }

    try {
      const { data, error } = await supabase.storage
        .from('report-evidence-private')
        .createSignedUrl(cleanPath, expiresInSeconds);

      if (error || !data?.signedUrl) {
        throw new DataError('network', `Gagal membuat signed URL bukti privat: ${error?.message || 'Berkas tidak ditemukan.'}`);
      }

      return data.signedUrl;
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw new DataError('network', 'Terjadi kesalahan saat memproses URL bukti privat.', err);
    }
  }

  private async uploadPublicFile(
    bucket: 'avatars' | 'post-media',
    fileOrBlob: File | Blob,
    userId?: string,
    fileName = 'upload'
  ): Promise<string> {
    if (!isSupabaseConfigured) {
      // Fallback to data URL when unconfigured for local preview
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(fileOrBlob);
      });
    }

    try {
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

      if (error || !data) {
        throw new DataError('network', `Gagal mengunggah berkas ke ${bucket}: ${error?.message || 'Kesalahan penyimpanan.'}`);
      }

      const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(path);
      return pubData.publicUrl;
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw new DataError('network', `Terjadi kesalahan saat mengunggah berkas ke ${bucket}.`, err);
    }
  }
}

export const storageService = new StorageService();
export const getPrivateEvidenceUrl = (storagePath: string, expiresInSeconds = 3600) =>
  storageService.getPrivateEvidenceUrl(storagePath, expiresInSeconds);
