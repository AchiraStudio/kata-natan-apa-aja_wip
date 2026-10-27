import { UserProfile } from '../types/domain';

export function isCommentAuthoredByUser(
  comment: { authorName: string; authorId?: string },
  currentUser: UserProfile | null | undefined
): boolean {
  if (!currentUser) return false;

  // 1. Direct author ID match
  if (
    comment.authorId &&
    (comment.authorId === currentUser.id ||
      comment.authorId === `usr-${currentUser.username}` ||
      comment.authorId === currentUser.username)
  ) {
    return true;
  }

  // 2. Display name match (case-insensitive)
  if (
    currentUser.displayName &&
    comment.authorName.trim().toLowerCase() === currentUser.displayName.trim().toLowerCase()
  ) {
    return true;
  }

  // 3. Username match (case-insensitive, removing leading @)
  if (currentUser.username) {
    const cleanUser = currentUser.username.trim().toLowerCase().replace(/^@/, '');
    const cleanAuthor = comment.authorName.trim().toLowerCase().replace(/^@/, '');
    if (cleanAuthor === cleanUser) {
      return true;
    }
  }

  return false;
}

/**
 * Sorts comments so that comments created by the viewing user appear on top.
 * User's own comments are pinned first, followed by comments from other citizens.
 */
export function sortCommentsForUser<T extends { authorName: string; authorId?: string }>(
  comments: T[],
  currentUser: UserProfile | null | undefined
): T[] {
  if (!currentUser || comments.length <= 1) {
    return comments;
  }

  const userComments: T[] = [];
  const otherComments: T[] = [];

  for (const comment of comments) {
    if (isCommentAuthoredByUser(comment, currentUser)) {
      userComments.push(comment);
    } else {
      otherComments.push(comment);
    }
  }

  if (userComments.length === 0) {
    return comments;
  }

  return [...userComments, ...otherComments];
}

