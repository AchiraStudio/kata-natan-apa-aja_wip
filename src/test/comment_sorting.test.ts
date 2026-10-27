import { describe, it, expect } from 'vitest';
import { isCommentAuthoredByUser, sortCommentsForUser } from '../utils/commentSorting';
import { FeedComment } from '../services/adapters/types';
import { UserProfile } from '../types/domain';

describe('Comment Sorting & Elevation for Active User', () => {
  const aliceProfile: UserProfile = {
    id: 'usr-alice-123',
    username: 'alice_bogor',
    displayName: 'Alice Warga',
    avatarUrl: 'https://example.com/alice.jpg',
    role: 'citizen',
  };

  const bobProfile: UserProfile = {
    id: 'usr-bob-456',
    username: 'bob_santoso',
    displayName: 'Bob Santoso',
    avatarUrl: 'https://example.com/bob.jpg',
    role: 'citizen',
  };

  const mockComments: FeedComment[] = [
    {
      id: 'c-1',
      authorId: 'usr-charlie',
      authorName: 'Charlie',
      avatarUrl: 'https://example.com/charlie.jpg',
      body: 'Mohon dicek ya pak.',
      timeAgo: '3 jam lalu',
      likes: 2,
    },
    {
      id: 'c-2',
      authorId: 'usr-alice-123',
      authorName: 'Alice Warga',
      avatarUrl: 'https://example.com/alice.jpg',
      body: 'Kemarin lewat sini memang parah lubangnya.',
      timeAgo: '1 jam lalu',
      likes: 5,
    },
    {
      id: 'c-3',
      authorId: 'usr-bob-456',
      authorName: 'Bob Santoso',
      avatarUrl: 'https://example.com/bob.jpg',
      body: 'Tim kami dari warga RT 02 siap gotong royong.',
      timeAgo: '30 menit lalu',
      likes: 1,
    },
  ];

  it('correctly identifies whether a comment belongs to the viewing user', () => {
    expect(isCommentAuthoredByUser(mockComments[1], aliceProfile)).toBe(true);
    expect(isCommentAuthoredByUser(mockComments[0], aliceProfile)).toBe(false);
    expect(isCommentAuthoredByUser(mockComments[2], bobProfile)).toBe(true);
  });

  it('matches by username even without authorId or with different casing', () => {
    const commentWithOnlyUsername: FeedComment = {
      id: 'c-4',
      authorName: '@alice_bogor',
      avatarUrl: '',
      body: 'Test comment',
      timeAgo: 'Baru saja',
      likes: 0,
    };
    expect(isCommentAuthoredByUser(commentWithOnlyUsername, aliceProfile)).toBe(true);
  });

  it('elevates Alice comment to the top when Alice is the active viewer', () => {
    const sorted = sortCommentsForUser(mockComments, aliceProfile);
    expect(sorted[0].id).toBe('c-2');
    expect(sorted[0].authorName).toBe('Alice Warga');
    expect(sorted.length).toBe(3);
  });

  it('elevates Bob comment to the top when Bob is the active viewer', () => {
    const sorted = sortCommentsForUser(mockComments, bobProfile);
    expect(sorted[0].id).toBe('c-3');
    expect(sorted[0].authorName).toBe('Bob Santoso');
    expect(sorted.length).toBe(3);
  });

  it('preserves existing comment order when viewing user has no comments on post', () => {
    const visitor: UserProfile = {
      id: 'usr-stranger',
      username: 'stranger',
      displayName: 'Pengunjung Baru',
      avatarUrl: '',
      role: 'citizen',
    };

    const sorted = sortCommentsForUser(mockComments, visitor);
    expect(sorted[0].id).toBe('c-1');
    expect(sorted[1].id).toBe('c-2');
    expect(sorted[2].id).toBe('c-3');
  });

  it('returns original array safely if user is null or undefined', () => {
    const sorted = sortCommentsForUser(mockComments, null);
    expect(sorted).toEqual(mockComments);
  });
});
