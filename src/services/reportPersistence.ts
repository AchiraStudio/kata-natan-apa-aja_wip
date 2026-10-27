import { Post, Report, ReportAttachment } from '../types/domain';
import { registerReportMediaType } from '../utils/reportEvidence';

interface PersistedReports {
  reports: Report[];
  posts: Post[];
}

const DATABASE_NAME = 'titik-report-evidence';
const DATABASE_VERSION = 2;
const OBJECT_STORE = 'submitted-reports';
const MEDIA_STORE = 'evidence-media';
const RECORD_KEY = 'reports-and-posts';

interface StoredMedia {
  id: string;
  blob: Blob;
}

const MEDIA_REFERENCE_PREFIX = 'titik-idb-media:';

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Penyimpanan lokal permanen tidak tersedia di browser ini.'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(OBJECT_STORE)) {
        request.result.createObjectStore(OBJECT_STORE);
      }
      if (!request.result.objectStoreNames.contains(MEDIA_STORE)) {
        request.result.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Gagal membuka penyimpanan laporan.'));
    request.onblocked = () => reject(new Error('Penyimpanan laporan sedang diblokir oleh tab browser lain.'));
  });
}

export async function loadPersistedReports(): Promise<PersistedReports | null> {
  if (typeof indexedDB === 'undefined') return null;

  const database = await openDatabase();
  try {
    const result = await new Promise<{ persisted?: PersistedReports; media: StoredMedia[] }>((resolve, reject) => {
      const transaction = database.transaction([OBJECT_STORE, MEDIA_STORE], 'readonly');
      const reportRequest = transaction.objectStore(OBJECT_STORE).get(RECORD_KEY);
      const mediaRequest = transaction.objectStore(MEDIA_STORE).getAll();
      transaction.oncomplete = () => resolve({
        persisted: reportRequest.result as PersistedReports | undefined,
        media: mediaRequest.result as StoredMedia[],
      });
      transaction.onerror = () => reject(transaction.error ?? new Error('Gagal memuat laporan tersimpan.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Pemuatan laporan dibatalkan.'));
    });
    if (!result.persisted) return null;

    const mediaUrls = new Map(result.media.map(({ id, blob }) => {
      const url = URL.createObjectURL(blob);
      registerReportMediaType(url, blob.type);
      return [id, url];
    }));
    const restoreMediaUrl = (url: string) => {
      if (!url.startsWith(MEDIA_REFERENCE_PREFIX)) return url;
      const restoredUrl = mediaUrls.get(decodeURIComponent(url.slice(MEDIA_REFERENCE_PREFIX.length)));
      if (!restoredUrl) throw new Error('Bukti foto atau video tersimpan tidak ditemukan.');
      return restoredUrl;
    };

    return {
      reports: result.persisted.reports.map((report) => ({
        ...report,
        mediaUrls: report.mediaUrls.map(restoreMediaUrl),
        supportingDocuments: report.supportingDocuments?.map((document) => ({
          ...document,
          dataUrl: restoreMediaUrl(document.dataUrl),
        })),
      })),
      posts: result.persisted.posts.map((post) => {
        const report = result.persisted?.reports.find((item) => item.id === post.relatedReportId);
        return {
          ...post,
          media: post.media.map((media) => ({ ...media, url: restoreMediaUrl(media.url) })),
          relatedReport: report
            ? {
                ...report,
                mediaUrls: report.mediaUrls.map(restoreMediaUrl),
                supportingDocuments: report.supportingDocuments?.map((document) => ({
                  ...document,
                  dataUrl: restoreMediaUrl(document.dataUrl),
                })),
              }
            : post.relatedReport,
        };
      }),
    };
  } finally {
    database.close();
  }
}

export async function savePersistedReports(reports: Report[], posts: Post[]): Promise<void> {
  const database = await openDatabase();
  try {
    const existingMedia = await new Promise<Map<string, Blob>>((resolve, reject) => {
      const transaction = database.transaction(MEDIA_STORE, 'readonly');
      const request = transaction.objectStore(MEDIA_STORE).getAll() as IDBRequest<StoredMedia[]>;
      request.onsuccess = () => resolve(new Map(request.result.map(({ id, blob }) => [id, blob])));
      request.onerror = () => reject(request.error ?? new Error('Gagal membaca bukti media tersimpan.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Pembacaan bukti media dibatalkan.'));
    });
    const mediaBlobs = new Map<string, Blob>();
    const mediaIdsByReport = new Map<string, string[]>();
    const saveMediaUrl = async (reportId: string, index: number, url: string) => {
      if (!url.startsWith('data:') && !url.startsWith('blob:')) return url;
      const id = `${reportId}-${index}`;
      if (!mediaBlobs.has(id)) {
        let blob = existingMedia.get(id);
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Media mengembalikan status ${response.status}.`);
          blob = await response.blob();
        } catch (error) {
          if (!blob) {
            console.warn(`Bukti media ${id} tidak dapat dipertahankan saat menyimpan laporan.`, error);
            return null;
          }
        }
        mediaBlobs.set(id, blob);
      }
      return `${MEDIA_REFERENCE_PREFIX}${encodeURIComponent(id)}`;
    };

    const storedReports = await Promise.all(reports.map(async (report) => {
      const urls = (await Promise.all(
        report.mediaUrls.map((url, index) => saveMediaUrl(report.id, index, url))
      )).filter((url): url is string => url !== null);
      const supportingDocuments = (await Promise.all(
        (report.supportingDocuments ?? []).map(async (document, index) => {
          const dataUrl = await saveMediaUrl(report.id, report.mediaUrls.length + index, document.dataUrl);
          return dataUrl ? { ...document, dataUrl } : null;
        })
      )).filter((document): document is ReportAttachment => document !== null);
      mediaIdsByReport.set(report.id, report.mediaUrls.map((url, index) => (
        (url.startsWith('data:') || url.startsWith('blob:')) && mediaBlobs.has(`${report.id}-${index}`)
          ? `${report.id}-${index}`
          : ''
      )));
      return { ...report, mediaUrls: urls, supportingDocuments };
    }));
    const storedReportsById = new Map(storedReports.map((report) => [report.id, report]));
    const storedPosts = await Promise.all(posts.map(async (post) => {
      const reportId = post.relatedReportId;
      const reportMediaIds = reportId ? mediaIdsByReport.get(reportId) : undefined;
      const media = (await Promise.all(post.media.map(async (item, index) => {
        const matchingReportMediaIndex = reportId
          ? reports.find((report) => report.id === reportId)?.mediaUrls.indexOf(item.url) ?? -1
          : -1;
        const matchingId = matchingReportMediaIndex >= 0
          ? reportMediaIds?.[matchingReportMediaIndex]
          : undefined;
        const url = matchingId
          ? `${MEDIA_REFERENCE_PREFIX}${encodeURIComponent(matchingId)}`
          : await saveMediaUrl(post.id, index, item.url);
        return url ? { ...item, url } : null;
      }))).filter((item): item is Post['media'][number] => item !== null);
      return {
        ...post,
        media,
        relatedReport: reportId ? storedReportsById.get(reportId) ?? post.relatedReport : post.relatedReport,
      };
    }));

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction([OBJECT_STORE, MEDIA_STORE], 'readwrite');
      const mediaStore = transaction.objectStore(MEDIA_STORE);
      mediaStore.clear();
      mediaBlobs.forEach((blob, id) => mediaStore.put({ id, blob } satisfies StoredMedia));
      transaction.objectStore(OBJECT_STORE).put(
        { reports: storedReports, posts: storedPosts } satisfies PersistedReports,
        RECORD_KEY
      );
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Gagal menyimpan laporan.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Penyimpanan laporan dibatalkan.'));
    });
  } finally {
    database.close();
  }
}

export async function clearPersistedReports(): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction([OBJECT_STORE, MEDIA_STORE], 'readwrite');
      transaction.objectStore(OBJECT_STORE).clear();
      transaction.objectStore(MEDIA_STORE).clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Gagal membersihkan database IndexedDB.'));
    });
    database.close();
  } catch (err) {
    console.warn('Could not clear IndexedDB persisted reports:', err);
  }
}
