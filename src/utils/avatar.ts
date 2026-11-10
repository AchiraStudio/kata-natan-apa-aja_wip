/**
 * Stock photos that older code and old database rows used as a stand-in profile picture.
 * An account that never uploaded a photo must show its initials, never one of these.
 */
const PLACEHOLDER_AVATAR_MARKERS = [
  'photo-1535713875002-d1d0cf377fde',
  'photo-1472099645785-5658abf4ff4e',
];

export function isPlaceholderAvatar(url?: string | null): boolean {
  if (!url) return false;
  return PLACEHOLDER_AVATAR_MARKERS.some((marker) => url.includes(marker));
}

/** Returns the URL only when it is a real, user-supplied photo. */
export function resolveAvatarUrl(url?: string | null): string {
  const clean = typeof url === 'string' ? url.trim() : '';
  return clean && !isPlaceholderAvatar(clean) ? clean : '';
}
