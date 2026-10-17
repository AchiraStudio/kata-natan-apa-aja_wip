// =============================================================================
// TITIK. — useReports Custom Hook
// React data hook for fetching, filtering, voting, and subscribing to reports
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { PublicCivicReport } from '../types/database';
import { 
  fetchPublishedReports, 
  voteReportPriority, 
  getOrCreateVoterCredential,
  sha256Hash 
} from '../services/reportService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface UseReportsOptions {
  category?: string;
  subdistrict?: string;
  search?: string;
  autoSubscribe?: boolean;
}

export const useReports = (options?: UseReportsOptions) => {
  const [reports, setReports] = useState<PublicCivicReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const category = options?.category;
  const subdistrict = options?.subdistrict;
  const search = options?.search;
  const autoSubscribe = options?.autoSubscribe ?? true;

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPublishedReports({
        category,
        subdistrict,
        search,
      });
      setReports(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data laporan.');
    } finally {
      setLoading(false);
    }
  }, [category, subdistrict, search]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Realtime channel subscription for published reports & votes if configured
  useEffect(() => {
    if (!autoSubscribe || !isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('titik_public_reports')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          loadReports();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'report_votes' },
        () => {
          loadReports();
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [autoSubscribe, loadReports]);

  const castVote = async (reportId: string) => {
    try {
      const { newCount } = await voteReportPriority(reportId);
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, votesCount: newCount, hasUserVoted: true } : r
        )
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    reports,
    loading,
    error,
    reload: loadReports,
    castVote,
    vote: castVote,
    isLive: isSupabaseConfigured,
  };
};
