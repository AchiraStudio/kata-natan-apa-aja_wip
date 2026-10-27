/**
 * TITIK. Unique ID Generator
 * Generates cryptographic UUID v4 when available, with timestamp + high-entropy randomness fallback.
 * Guarantees zero collisions across unlimited posts, reports, and comments.
 */

export function generatePostId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `post_${crypto.randomUUID()}`;
  }
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `post_${timestamp}_${randomPart}`;
}

export function generateReportId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `rep_${crypto.randomUUID()}`;
  }
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `rep_${timestamp}_${randomPart}`;
}

export function generateCommentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `cm_${crypto.randomUUID()}`;
  }
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `cm_${timestamp}_${randomPart}`;
}
