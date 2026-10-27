import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IDataAdapter, NewReportInput, RejectedReportEdits, ReportSubmitResult, FeedComment } from './types';
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

  async getFeedPosts(
    tab?: 'for_you' | 'following' | 'nearby',
    category?: string,
    userId?: string
  ): Promise<Post[]> {
    // Attempt Supabase fetch if client available, otherwise fallback
    if (!this.client) {
      return this.fallbackMock.getFeedPosts(tab, category, userId);
    }
    try {
      let query = this.client
        .from('posts')
        .select('*, relatedReport:reports(*)');

      if (category && category !== 'Semua') {
        query = query.ilike('category', `%${category}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !data || data.length === 0) {
        return this.fallbackMock.getFeedPosts(tab, category, userId);
      }

      let savedPostIds = new Set<string>();
      let supportedReportIds = new Set<string>();

      if (userId) {
        const [savesRes, supportsRes] = await Promise.all([
          this.client.from('post_saves').select('post_id').eq('user_id', userId),
          this.client.from('report_supports').select('report_id').eq('user_id', userId),
        ]);
        if (savesRes.data) {
          savedPostIds = new Set(savesRes.data.map((r: any) => r.post_id));
        }
        if (supportsRes.data) {
          supportedReportIds = new Set(supportsRes.data.map((r: any) => r.report_id));
        }
      }

      const submittedPosts = await this.fallbackMock.getSubmittedFeedPosts(tab, category);
      const remotePosts = data.map((row: any) => {
        const isSaved = userId ? savedPostIds.has(row.id) : (row.is_saved_by_me ?? false);
        const relatedReport = row.relatedReport ? {
          ...row.relatedReport,
          publicReference: row.relatedReport.public_reference || row.relatedReport.publicReference,
          supportCount: row.relatedReport.support_count ?? row.relatedReport.supportCount ?? 0,
          isSupportedByMe: userId ? supportedReportIds.has(row.relatedReport.id) : (row.relatedReport.is_supported_by_me ?? false),
          reporterType: row.relatedReport.reporter_type || row.relatedReport.reporterType,
          reporterDisplayName: row.relatedReport.reporter_display_name || row.relatedReport.reporterDisplayName,
          location: row.relatedReport.location || {
            latitude: row.relatedReport.latitude,
            longitude: row.relatedReport.longitude,
            address: row.relatedReport.address,
            city: row.relatedReport.city,
          },
          mediaUrls: row.relatedReport.media_urls || row.relatedReport.mediaUrls || [],
          events: row.relatedReport.events || [],
        } : undefined;

        const isSupported = relatedReport ? relatedReport.isSupportedByMe : false;

        return {
          id: row.id,
          author: row.author || {
            id: row.author_id,
            name: row.author_name || 'Warga',
            username: row.author_username || 'warga',
            avatarUrl: row.author_avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
            badge: row.author_badge || undefined,
          },
          media: Array.isArray(row.media) ? row.media : [{ id: 'm-1', type: 'image', url: row.media_url || '/images/feed/k001.png' }],
          body: row.body,
          locationTag: row.location_tag || row.locationTag,
          relatedReportId: row.related_report_id || row.relatedReportId,
          relatedReport,
          supportCount: row.support_count ?? row.supportCount ?? 0,
          isSupportedByMe: isSupported,
          commentsCount: row.comments_count ?? row.commentsCount ?? 0,
          sharesCount: row.shares_count ?? row.sharesCount ?? 0,
          savesCount: row.saves_count ?? row.savesCount ?? 0,
          isSavedByMe: isSaved,
          createdAt: row.created_at ? formatIndonesianTimeAgo(row.created_at) : (row.createdAt || 'Baru saja'),
        } as Post;
      });

      const remotePostIds = new Set(remotePosts.map((post) => post.id));
      return [...submittedPosts.filter((post) => !remotePostIds.has(post.id)), ...remotePosts];
    } catch {
      return this.fallbackMock.getFeedPosts(tab, category, userId);
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

  async resubmitRejectedReport(
    reportId: string,
    reporterUserId: string,
    edits: RejectedReportEdits
  ): Promise<Report> {
    return this.fallbackMock.resubmitRejectedReport(reportId, reporterUserId, edits);
  }

  async deleteReport(reportId: string): Promise<void> {
    return this.fallbackMock.deleteReport(reportId);
  }

  async updateReportStatus(
    reportId: string,
    newStatus: ReportStatus,
    actorName: string,
    description: string
  ): Promise<Report> {
    return this.fallbackMock.updateReportStatus(reportId, newStatus, actorName, description);
  }

  async toggleReportSupport(reportId: string, userId?: string): Promise<{ supportCount: number; isSupported: boolean }> {
    if (!this.client || !userId) {
      return this.fallbackMock.toggleReportSupport(reportId, userId);
    }
    try {
      const { data: existing, error: checkErr } = await this.client
        .from('report_supports')
        .select('id')
        .eq('report_id', reportId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkErr && checkErr.code !== 'PGRST116') {
        return this.fallbackMock.toggleReportSupport(reportId, userId);
      }

      if (existing) {
        await this.client.from('report_supports').delete().eq('report_id', reportId).eq('user_id', userId);
      } else {
        await this.client.from('report_supports').insert({ report_id: reportId, user_id: userId });
      }

      const { data: updatedReport } = await this.client
        .from('reports')
        .select('support_count')
        .eq('id', reportId)
        .single();

      const supportCount = updatedReport?.support_count ?? (existing ? 0 : 1);
      const isSupported = !existing;

      await this.fallbackMock.toggleReportSupport(reportId, userId);
      return { supportCount, isSupported };
    } catch (err) {
      console.warn('Supabase toggleReportSupport failed, falling back:', err);
      return this.fallbackMock.toggleReportSupport(reportId, userId);
    }
  }

  async togglePostSave(postId: string, userId: string): Promise<{ savesCount: number; isSaved: boolean }> {
    if (!this.client) {
      return this.fallbackMock.togglePostSave(postId, userId);
    }
    try {
      const { data: existing, error: checkErr } = await this.client
        .from('post_saves')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkErr && checkErr.code !== 'PGRST116') {
        return this.fallbackMock.togglePostSave(postId, userId);
      }

      if (existing) {
        await this.client.from('post_saves').delete().eq('post_id', postId).eq('user_id', userId);
      } else {
        await this.client.from('post_saves').insert({ post_id: postId, user_id: userId });
      }

      const { data: updatedPost } = await this.client
        .from('posts')
        .select('saves_count')
        .eq('id', postId)
        .single();

      const savesCount = updatedPost?.saves_count ?? (existing ? 0 : 1);
      const isSaved = !existing;

      await this.fallbackMock.togglePostSave(postId, userId);
      return { savesCount, isSaved };
    } catch (err) {
      console.warn('Supabase togglePostSave failed, falling back:', err);
      return this.fallbackMock.togglePostSave(postId, userId);
    }
  }

  async togglePostLike(postId: string, userId: string): Promise<{ likesCount: number; isLiked: boolean }> {
    if (!this.client) {
      return this.fallbackMock.togglePostLike(postId, userId);
    }
    try {
      const { data: existing, error: checkErr } = await this.client
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkErr && checkErr.code !== 'PGRST116') {
        return this.fallbackMock.togglePostLike(postId, userId);
      }

      if (existing) {
        await this.client.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
      } else {
        await this.client.from('post_likes').insert({ post_id: postId, user_id: userId });
      }

      const { data: updatedPost } = await this.client
        .from('posts')
        .select('support_count')
        .eq('id', postId)
        .single();

      const likesCount = updatedPost?.support_count ?? (existing ? 0 : 1);
      const isLiked = !existing;

      await this.fallbackMock.togglePostLike(postId, userId);
      return { likesCount, isLiked };
    } catch (err) {
      console.warn('Supabase togglePostLike failed, falling back:', err);
      return this.fallbackMock.togglePostLike(postId, userId);
    }
  }

  async getSavedPosts(userId: string): Promise<Post[]> {
    if (!this.client) {
      return this.fallbackMock.getSavedPosts(userId);
    }
    try {
      const { data, error } = await this.client
        .from('post_saves')
        .select('post_id, post:posts(*, relatedReport:reports(*))')
        .eq('user_id', userId);

      if (error || !data) {
        return this.fallbackMock.getSavedPosts(userId);
      }

      return (data || [])
        .map((row: any) => row.post as unknown as Post)
        .filter(Boolean)
        .map((post: Post) => ({
          ...post,
          isSavedByMe: true,
        }));
    } catch (err) {
      console.warn('Supabase getSavedPosts failed, falling back:', err);
      return this.fallbackMock.getSavedPosts(userId);
    }
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

      if (error || !data) {
        return this.fallbackMock.getComments(postId);
      }

      const localComments = await this.fallbackMock.getComments(postId);
      const remoteIds = new Set(data.map((r: any) => r.id));
      const pendingLocal = localComments.filter((c) => !remoteIds.has(c.id));

      const remoteMapped = data.map((row: any) => ({
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

      return [...pendingLocal, ...remoteMapped];
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
