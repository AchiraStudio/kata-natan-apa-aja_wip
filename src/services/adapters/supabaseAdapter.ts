import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IDataAdapter, NewReportInput, ReportSubmitResult, FeedComment } from './types';
import { formatIndonesianTimeAgo } from '../../utils/timeAgo';
import { MockDataAdapter } from './mockAdapter';
import { Post, Report, ReportStatus, Facility, BudgetSectorContext } from '../../types/domain';

export class SupabaseDataAdapter implements IDataAdapter {
  private client: SupabaseClient | null = null;
  private fallbackMock: MockDataAdapter;

  constructor() {
    this.fallbackMock = new MockDataAdapter();
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (url && key) {
      try {
        this.client = createClient(url, key);
      } catch (err) {
        console.warn('Supabase client initialization failed, falling back to local mock adapter:', err);
      }
    }
  }

  async getFeedPosts(tab?: 'for_you' | 'following' | 'nearby', category?: string): Promise<Post[]> {
    // Attempt Supabase fetch if client available, otherwise fallback
    if (!this.client) {
      return this.fallbackMock.getFeedPosts(tab, category);
    }
    try {
      // If table exists and online, fetch; otherwise fallback
      const { data, error } = await this.client
        .from('posts')
        .select('*, relatedReport:reports(*)')
        .limit(20);

      if (error || !data || data.length === 0) {
        return this.fallbackMock.getFeedPosts(tab, category);
      }
      const submittedPosts = await this.fallbackMock.getSubmittedFeedPosts(tab, category);
      const remotePosts = data as unknown as Post[];
      const remotePostIds = new Set(remotePosts.map((post) => post.id));
      return [...submittedPosts.filter((post) => !remotePostIds.has(post.id)), ...remotePosts];
    } catch {
      return this.fallbackMock.getFeedPosts(tab, category);
    }
  }

  async getReportByReference(reference: string): Promise<Report | null> {
    if (!this.client) {
      return this.fallbackMock.getReportByReference(reference);
    }
    try {
      const { data, error } = await this.client
        .from('reports')
        .select('*')
        .eq('public_reference', reference)
        .single();

      if (error || !data) {
        return this.fallbackMock.getReportByReference(reference);
      }
      return data as unknown as Report;
    } catch {
      return this.fallbackMock.getReportByReference(reference);
    }
  }

  async getMyReports(reporterUserId: string): Promise<Report[]> {
    return this.fallbackMock.getMyReports(reporterUserId);
  }

  async verifyReportTracking(reference: string, token: string): Promise<Report | null> {
    return this.fallbackMock.verifyReportTracking(reference, token);
  }

  async submitReport(input: NewReportInput): Promise<ReportSubmitResult> {
    return this.fallbackMock.submitReport(input);
  }

  async updateReportStatus(
    reportId: string,
    newStatus: ReportStatus,
    actorName: string,
    description: string
  ): Promise<Report> {
    return this.fallbackMock.updateReportStatus(reportId, newStatus, actorName, description);
  }

  async toggleReportSupport(reportId: string): Promise<{ supportCount: number; isSupported: boolean }> {
    return this.fallbackMock.toggleReportSupport(reportId);
  }

  async addComment(
    postId: string,
    authorName: string,
    avatarUrl: string,
    body: string,
    parentId?: string
  ): Promise<FeedComment> {
    if (!this.client) {
      return this.fallbackMock.addComment(postId, authorName, avatarUrl, body, parentId);
    }

    const newId = `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    try {
      const { data, error } = await this.client
        .from('comments')
        .insert({
          id: newId,
          post_id: postId,
          author_name: authorName,
          avatar_url: avatarUrl,
          body,
          parent_id: parentId || null,
          likes: 0,
          created_at: nowIso,
        })
        .select()
        .single();

      if (!error && data) {
        // Keep fallback mock in sync so optimistic local state remains coherent
        await this.fallbackMock.addComment(postId, authorName, avatarUrl, body, parentId);

        return {
          id: data.id,
          authorName: data.author_name,
          avatarUrl: data.avatar_url,
          body: data.body,
          timeAgo: 'Baru saja',
          likes: data.likes || 0,
          parentId: data.parent_id || undefined,
        };
      }

      console.warn('Supabase comment insert returned error, falling back to local mock adapter:', error);
      return this.fallbackMock.addComment(postId, authorName, avatarUrl, body, parentId);
    } catch (err) {
      console.warn('Supabase comment insert failed, falling back to local mock adapter:', err);
      return this.fallbackMock.addComment(postId, authorName, avatarUrl, body, parentId);
    }
  }

  async getComments(postId: string): Promise<FeedComment[]> {
    if (!this.client) {
      return this.fallbackMock.getComments(postId);
    }

    try {
      const { data, error } = await this.client
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        // Fall back to mock comments if table has not been seeded or returned empty
        return this.fallbackMock.getComments(postId);
      }

      return data.map((row: any) => ({
        id: row.id,
        authorName: row.author_name,
        avatarUrl:
          row.avatar_url ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        body: row.body,
        timeAgo: formatIndonesianTimeAgo(row.created_at),
        likes: typeof row.likes === 'number' ? row.likes : 0,
        parentId: row.parent_id || undefined,
      }));
    } catch (err) {
      console.warn('Failed to query comments from Supabase, falling back to local:', err);
      return this.fallbackMock.getComments(postId);
    }
  }

  async getFacilities(query?: string, category?: string): Promise<Facility[]> {
    return this.fallbackMock.getFacilities(query, category);
  }

  async getBudgetSectors(): Promise<BudgetSectorContext[]> {
    return this.fallbackMock.getBudgetSectors();
  }
}
