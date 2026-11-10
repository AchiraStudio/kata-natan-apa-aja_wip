import { PostMedia } from '../types/domain';
import { getReportMediaType } from './reportEvidence';

const ASPECT_RATIOS = new Set(['9/16', '1/1', '3/4', '4/3', '4/5', '16/9']);

function isPostMediaAspectRatio(value: unknown): value is NonNullable<PostMedia['aspectRatio']> {
  return typeof value === 'string' && ASPECT_RATIOS.has(value.replace(':', '/'));
}

function normalizeMediaItem(value: unknown, index: number): PostMedia | null {
  if (typeof value === 'string') {
    if (!value) return null;
    return {
      id: `media-${index}`,
      type: getReportMediaType(value),
      url: value,
      aspectRatio: '9/16',
    };
  }

  if (typeof value !== 'object' || value === null || !('url' in value)) return null;
  const media = value as Record<string, unknown>;
  if (typeof media.url !== 'string' || !media.url) return null;

  return {
    id: typeof media.id === 'string' ? media.id : `media-${index}`,
    type: media.type === 'video' || media.type === 'image' ? media.type : getReportMediaType(media.url),
    url: media.url,
    ...(typeof media.posterUrl === 'string' ? { posterUrl: media.posterUrl } : {}),
    ...(isPostMediaAspectRatio(media.aspectRatio)
      ? { aspectRatio: media.aspectRatio.replace(':', '/') as PostMedia['aspectRatio'] }
      : {}),
    ...(typeof media.durationSeconds === 'number' ? { durationSeconds: media.durationSeconds } : {}),
  };
}

export function normalizePostMedia(media: unknown, fallbackMediaUrls: string[] = []): PostMedia[] {
  const items = Array.isArray(media) && media.length > 0 ? media : fallbackMediaUrls;
  return items
    .map((item, index) => normalizeMediaItem(item, index))
    .filter((item): item is PostMedia => item !== null);
}
