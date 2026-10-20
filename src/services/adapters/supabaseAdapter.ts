import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IDataAdapter, NewReportInput, ReportSubmitResult } from './types';
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
      return data as unknown as Post[];
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

  async verifyReportTracking(reference: string, token: string): Promise<Report | null> {
    return this.fallbackMock.verifyReportTracking(reference, token);
  }

  async submitReport(input: NewReportInput): Promise<ReportSubmitResult> {
    // For reliable demo and local offline presentation, fallback handles full state
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

  async addComment(postId: string, authorName: string, avatarUrl: string, body: string, parentId?: string) {
    return this.fallbackMock.addComment(postId, authorName, avatarUrl, body, parentId);
  }

  async getComments(postId: string) {
    return this.fallbackMock.getComments(postId);
  }

  async getFacilities(query?: string, category?: string): Promise<Facility[]> {
    return this.fallbackMock.getFacilities(query, category);
  }

  async getBudgetSectors(): Promise<BudgetSectorContext[]> {
    return this.fallbackMock.getBudgetSectors();
  }
}

