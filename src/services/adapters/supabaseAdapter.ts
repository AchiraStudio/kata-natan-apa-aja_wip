import { supabase } from '../supabaseClient';
import {
  IDataAdapter,
  NewReportInput,
  RejectedReportEdits,
  ReportSubmitResult,
  FeedComment,
} from './types';
import { formatIndonesianTimeAgo } from '../../utils/timeAgo';
import { Post, Report, ReportStatus, Facility, BudgetSectorContext, UserProfile } from '../../types/domain';
import { DataError } from '../errors/DataError';

function mapPostgrestError(error: unknown, fallbackMessage: string): DataError {
  if (!error) return new DataError('network', fallbackMessage);
  const err = error as { code?: string; message?: string; details?: string; status?: number };
  const code = err.code || '';
  const msg = err.message || fallbackMessage;

  if (code === '42501' || code === 'PGRST301') {
    return new DataError('permission', `Akses ditolak: ${msg}`, error);
  }
  if (code === '23505') {
    return new DataError('conflict', `Data sudah ada: ${msg}`, error);
  }
  if (code === '23503' || code === '23514' || code === '22P02') {
    return new DataError('validation', `Validasi gagal: ${msg}`, error);
  }
  if (code === 'PGRST116') {
    return new DataError('not_found', `Data tidak ditemukan: ${msg}`, error);
  }
  if (err.status === 401) {
    return new DataError('auth', `Autentikasi diperlukan: ${msg}`, error);
  }
  return new DataError('network', msg, error);
}

function mapReportRow(row: any, isSupportedByMe = false): Report {
  const location =
    typeof row.location === 'object' && row.location !== null
      ? row.location
      : {
          latitude: -6.5971,
          longitude: 106.806,
          address: 'Kota Bogor',
          district: 'Bogor Tengah',
          city: 'Kota Bogor',
          province: 'Jawa Barat',
        };

  return {
    id: row.id,
    publicReference: row.public_reference,
    reporterUserId: row.reporter_user_id || undefined,
    secretFollowUpTokenHash: undefined,
    title: row.title,
    description: row.description,
    category: row.category,
    severity: row.severity,
    status: row.status,
    publicationStatus: row.publication_status,
    location,
    facilityName: row.facility_name || undefined,
    estimatedCost: row.estimated_cost ? Number(row.estimated_cost) : undefined,
    responsibleAgency: row.responsible_agency || 'Pemerintah Kota Bogor',
    mediaUrls: Array.isArray(row.media_urls) ? row.media_urls : [],
    supportingDocuments: Array.isArray(row.supporting_documents) ? row.supporting_documents : [],
    reporterType: row.reporter_type || 'verified_citizen',
    reporterDisplayName: row.reporter_display_name || undefined,
    supportCount:
      Array.isArray(row.supports) && row.supports.length > 0 && typeof row.supports[0]?.count === 'number'
        ? row.supports[0].count
        : (row.support_count ?? 0),
    isSupportedByMe,
    budgetContext:
      row.budget_context && Object.keys(row.budget_context).length > 0
        ? row.budget_context
        : {
            sectorId: 'sec-general',
            sectorName: row.category || 'Infrastruktur',
            subSectorName: row.responsible_agency || 'Dinas Teknis',
            paguAllocation: 25000000000,
            realizedSpending: 14000000000,
            executionRatePercent: 56.0,
            fiscalYear: 2026,
            responsibleAgency: row.responsible_agency || 'Pemerintah Kota Bogor',
            agencyAcronym: 'OPD',
            responsivenessScore: 82,
            avgResolutionDays: 14,
            lastUpdated: row.updated_at || row.created_at || new Date().toISOString(),
            dataSource: 'Simulasi SIKD / Portal Satu Data 2026',
            isSampleData: Boolean(row.is_demo),
          },
    events: Array.isArray(row.events) ? row.events : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isSampleData: Boolean(row.is_demo),
  };
}

function mapPostRow(
  row: any,
  isSaved = false,
  isLiked = false,
  isSupported = false
): Post {
  const relatedReport = row.relatedReport
    ? mapReportRow(row.relatedReport, isSupported)
    : undefined;

  const dynamicCommentsCount =
    Array.isArray(row.comments) && row.comments.length > 0 && typeof row.comments[0]?.count === 'number'
      ? row.comments[0].count
      : (row.comments_count ?? 0);

  const dynamicLikesCount =
    Array.isArray(row.likes) && row.likes.length > 0 && typeof row.likes[0]?.count === 'number'
      ? row.likes[0].count
      : (row.likes_count ?? 0);

  const dynamicSavesCount =
    Array.isArray(row.saves) && row.saves.length > 0 && typeof row.saves[0]?.count === 'number'
      ? row.saves[0].count
      : (row.saves_count ?? 0);

  const dynamicSupportCount = relatedReport
    ? relatedReport.supportCount
    : (Array.isArray(row.supports) && row.supports.length > 0 && typeof row.supports[0]?.count === 'number'
        ? row.supports[0].count
        : (row.support_count ?? 0));

  return {
    id: row.id,
    author: {
      id: row.author_id || 'usr-anon',
      username: row.author_username || 'warga',
      displayName: row.author_display_name || 'Warga TITIK',
      avatarUrl:
        row.author_avatar_url ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: row.author_role === 'admin' ? 'admin' : 'citizen',
    },
    body: row.body,
    postType: row.post_type || 'citizen_report',
    media: Array.isArray(row.media) ? row.media : [],
    locationTag: row.location_tag || 'Kota Bogor',
    relatedReportId: row.related_report_id || undefined,
    relatedReport,
    supportCount: dynamicSupportCount,
    isSupportedByMe: isSupported,
    likesCount: dynamicLikesCount,
    isLikedByMe: isLiked,
    commentsCount: dynamicCommentsCount,
    sharesCount: row.shares_count ?? 0,
    savesCount: dynamicSavesCount,
    isSavedByMe: isSaved,
    createdAt: row.created_at,
    isSampleData: Boolean(row.is_demo),
  };
}

function mapFacilityRow(row: any): Facility {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    address: row.address,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    responsibleAgency: row.responsible_agency,
    activeReportsCount: row.active_reports_count ?? 0,
    resolvedReportsCount: row.resolved_reports_count ?? 0,
  };
}

function mapBudgetSectorRow(row: any): BudgetSectorContext {
  const pagu = Number(row.allocated_budget || 0);
  const realized = Number(row.realization_budget || 0);
  const executionRate = pagu > 0 ? Math.round((realized / pagu) * 1000) / 10 : 0;
  return {
    sectorId: row.id,
    sectorName: row.sector || 'Infrastruktur Publik',
    subSectorName: row.department || 'Dinas PUPR',
    paguAllocation: pagu,
    realizedSpending: realized,
    executionRatePercent: executionRate,
    fiscalYear: row.fiscal_year || 2026,
    responsibleAgency: row.department || 'Pemerintah Kota Bogor',
    agencyAcronym: row.department
      ? row.department
          .split(' ')
          .map((w: string) => w[0])
          .join('')
      : 'OPD',
    responsivenessScore: 85,
    avgResolutionDays: 14,
    lastUpdated: row.created_at || new Date().toISOString(),
    dataSource: 'Satu Data Kota Bogor / APBD 2026',
    isSampleData: Boolean(row.is_demo),
  };
}

export class SupabaseDataAdapter implements IDataAdapter {
  async getFeedPosts(
    tab: 'for_you' | 'following' | 'nearby' = 'for_you',
    category?: string,
    userId?: string
  ): Promise<Post[]> {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          relatedReport:reports(*, supports:report_supports(count)),
          comments:comments(count),
          likes:post_likes(count),
          saves:post_saves(count)
        `);

      if (category && category !== 'Semua') {
        query = query.ilike('category', `%${category}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(100);

      if (error) {
        throw mapPostgrestError(error, 'Gagal memuat postingan linimasa.');
      }

      if (!data || data.length === 0) {
        return [];
      }

      let savedPostIds = new Set<string>();
      let likedPostIds = new Set<string>();
      let supportedReportIds = new Set<string>();

      if (userId) {
        const [savesRes, likesRes, supportsRes] = await Promise.all([
          supabase.from('post_saves').select('post_id').eq('user_id', userId),
          supabase.from('post_likes').select('post_id').eq('user_id', userId),
          supabase.from('report_supports').select('report_id').eq('user_id', userId),
        ]);

        if (savesRes.data) {
          savedPostIds = new Set(savesRes.data.map((r: { post_id: string }) => r.post_id));
        }
        if (likesRes.data) {
          likedPostIds = new Set(likesRes.data.map((r: { post_id: string }) => r.post_id));
        }
        if (supportsRes.data) {
          supportedReportIds = new Set(supportsRes.data.map((r: { report_id: string }) => r.report_id));
        }
      }

      return data.map((row: any) =>
        mapPostRow(
          row,
          userId ? savedPostIds.has(row.id) : false,
          userId ? likedPostIds.has(row.id) : false,
          row.related_report_id && userId ? supportedReportIds.has(row.related_report_id) : false
        )
      );
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Terjadi kesalahan saat memuat linimasa.');
    }
  }

  async getReportByReference(reference: string): Promise<Report | null> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('public_reference', reference)
        .maybeSingle();

      if (error) {
        throw mapPostgrestError(error, 'Gagal mencari laporan.');
      }
      if (!data) return null;
      return mapReportRow(data);
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Terjadi kesalahan saat memuat laporan.');
    }
  }

  async verifyReportTracking(reference: string, token: string): Promise<Report | null> {
    try {
      const { data, error } = await supabase.rpc('get_report_by_follow_up_token', {
        p_reference: reference.trim().toUpperCase(),
        p_token: token.trim(),
      });

      if (error) {
        throw mapPostgrestError(error, 'Gagal memverifikasi token pelacakan.');
      }
      if (!data) return null;
      return mapReportRow(data);
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Gagal memeriksa status pelacakan laporan.');
    }
  }

  async submitReport(input: NewReportInput): Promise<ReportSubmitResult> {
    try {
      const { data, error } = await supabase.rpc('submit_report', {
        p_request_id: crypto.randomUUID ? crypto.randomUUID() : undefined,
        p_title: input.title,
        p_description: input.description,
        p_category: input.category,
        p_severity: input.severity,
        p_location: {
          latitude: input.latitude,
          longitude: input.longitude,
          address: input.address,
        },
        p_responsible_agency: input.facilityName
          ? `Dinas terkait ${input.facilityName}`
          : 'Pemerintah Kota Bogor',
        p_media_urls: input.mediaUrls,
        p_supporting_documents: input.supportingDocuments || [],
        p_reporter_type: input.reporterType,
        p_reporter_display_name: input.reporterDisplayName || null,
        p_is_anonymous: input.reporterType === 'anonymous',
        p_link_to_feed: true,
      });

      if (error) {
        throw mapPostgrestError(error, 'Gagal mengirim laporan warga.');
      }

      const createdReport: Report = {
        id: data.report_id,
        publicReference: data.public_reference,
        reporterUserId: input.reporterType === 'anonymous' ? undefined : input.reporterUserId,
        title: input.title,
        description: input.description,
        category: input.category,
        severity: input.severity,
        status: 'submitted',
        publicationStatus: 'published',
        location: {
          latitude: input.latitude,
          longitude: input.longitude,
          address: input.address,
          district: 'Bogor Tengah',
          city: 'Kota Bogor',
          province: 'Jawa Barat',
        },
        facilityName: input.facilityName,
        estimatedCost: input.estimatedCost,
        responsibleAgency: 'Pemerintah Kota Bogor',
        mediaUrls: input.mediaUrls,
        supportingDocuments: input.supportingDocuments || [],
        reporterType: input.reporterType,
        reporterDisplayName: input.reporterType === 'anonymous' ? undefined : input.reporterDisplayName,
        supportCount: 0,
        budgetContext: {
          sectorId: 'sec-auto',
          sectorName: input.category,
          subSectorName: 'Pelayanan Publik',
          paguAllocation: 25000000000,
          realizedSpending: 15000000000,
          executionRatePercent: 60.0,
          fiscalYear: 2026,
          responsibleAgency: 'Pemerintah Kota Bogor',
          agencyAcronym: 'PUPR',
          responsivenessScore: 85,
          avgResolutionDays: 14,
          lastUpdated: new Date().toISOString(),
          dataSource: 'Portal Satu Data 2026',
          isSampleData: false,
        },
        events: [
          {
            id: 'ev-1',
            reportId: data.report_id,
            eventType: 'SUBMITTED',
            actorType: 'citizen',
            actorName: input.reporterDisplayName || 'Pelapor',
            description: 'Laporan berhasil diajukan ke sistem TITIK.',
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isSampleData: false,
      };

      return {
        report: createdReport,
        publicReference: data.public_reference,
        secretFollowUpToken: data.token,
      };
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Terjadi kesalahan saat menyimpan laporan.');
    }
  }

  async getMyReports(reporterUserId: string): Promise<Report[]> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('reporter_user_id', reporterUserId)
        .order('created_at', { ascending: false });

      if (error) {
        throw mapPostgrestError(error, 'Gagal memuat laporan saya.');
      }
      return (data || []).map((row: any) => mapReportRow(row));
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Terjadi kesalahan saat memuat daftar laporan.');
    }
  }

  async resubmitRejectedReport(
    reportId: string,
    reporterUserId: string,
    edits: RejectedReportEdits
  ): Promise<Report> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .update({
          title: edits.title,
          description: edits.description,
          category: edits.category,
          severity: edits.severity,
          status: 'submitted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId)
        .eq('reporter_user_id', reporterUserId)
        .select()
        .single();

      if (error) {
        throw mapPostgrestError(error, 'Gagal mengajukan ulang laporan.');
      }
      return mapReportRow(data);
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Gagal memperbarui laporan.');
    }
  }

  async deleteReport(reportId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('admin_delete_report', {
        p_report_id: reportId,
      });
      if (error) {
        // Fallback to direct delete if RPC not installed
        const { error: directErr } = await supabase.from('reports').delete().eq('id', reportId);
        if (directErr) {
          throw mapPostgrestError(directErr, 'Gagal menghapus laporan.');
        }
      }
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Gagal menghapus laporan.');
    }
  }

  async updateReportStatus(
    reportId: string,
    newStatus: ReportStatus,
    _actorName: string,
    description: string
  ): Promise<Report> {
    try {
      const { data, error } = await supabase.rpc('admin_update_report_status', {
        p_report_id: reportId,
        p_status: newStatus,
        p_notes: description,
      });

      if (error) {
        throw mapPostgrestError(error, 'Gagal memperbarui status laporan.');
      }
      return mapReportRow(data);
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Gagal memperbarui status laporan.');
    }
  }

  async toggleReportSupport(
    reportId: string,
    userId?: string
  ): Promise<{ supportCount: number; isSupported: boolean }> {
    if (!userId) {
      throw new DataError('auth', 'Autentikasi diperlukan untuk mendukung laporan.');
    }
    try {
      const { data, error } = await supabase.rpc('toggle_report_support', {
        p_report_id: reportId,
      });
      if (error) {
        throw mapPostgrestError(error, 'Gagal memperbarui dukungan.');
      }
      return {
        supportCount: data.support_count,
        isSupported: data.is_supported,
      };
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Gagal mendukung laporan.');
    }
  }

  async togglePostSave(
    postId: string,
    userId?: string
  ): Promise<{ savesCount: number; isSaved: boolean }> {
    if (!userId) {
      throw new DataError('auth', 'Autentikasi diperlukan untuk menyimpan postingan.');
    }
    try {
      const { data, error } = await supabase.rpc('toggle_post_save', {
        p_post_id: postId,
      });
      if (error) {
        throw mapPostgrestError(error, 'Gagal menyimpan postingan.');
      }
      return {
        savesCount: data.saves_count,
        isSaved: data.is_saved,
      };
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Gagal menyimpan postingan.');
    }
  }

  async togglePostLike(
    postId: string,
    userId?: string
  ): Promise<{ likesCount: number; isLiked: boolean }> {
    if (!userId) {
      throw new DataError('auth', 'Autentikasi diperlukan untuk menyukai postingan.');
    }
    try {
      const { data, error } = await supabase.rpc('toggle_post_like', {
        p_post_id: postId,
      });
      if (error) {
        throw mapPostgrestError(error, 'Gagal menyukai postingan.');
      }
      return {
        likesCount: data.likes_count,
        isLiked: data.is_liked,
      };
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Gagal menyukai postingan.');
    }
  }

  async getSavedPosts(userId: string): Promise<Post[]> {
    try {
      const { data, error } = await supabase
        .from('post_saves')
        .select(`
          post_id,
          post:posts(
            *,
            relatedReport:reports(*, supports:report_supports(count)),
            comments:comments(count),
            likes:post_likes(count),
            saves:post_saves(count)
          )
        `)
        .eq('user_id', userId);

      if (error) {
        throw mapPostgrestError(error, 'Gagal memuat postingan tersimpan.');
      }

      return (data || [])
        .map((row: any) => row.post)
        .filter(Boolean)
        .map((row: any) => mapPostRow(row, true, false, false));
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Gagal memuat postingan tersimpan.');
    }
  }

  async addComment(
    postId: string,
    authorName: string,
    avatarUrl: string,
    body: string,
    parentId?: string
  ): Promise<FeedComment> {
    const newId = `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || null;
      const { data, error } = await supabase
        .from('comments')
        .insert({
          author_id: currentUserId,
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

      if (error) {
        throw mapPostgrestError(error, 'Gagal mengirim komentar.');
      }

      return {
        id: data.id,
        authorId: data.author_id || currentUserId || undefined,
        authorName: data.author_name,
        avatarUrl: data.avatar_url,
        body: data.body,
        timeAgo: 'Baru saja',
        likes: data.likes || 0,
        parentId: data.parent_id || undefined,
      };
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Terjadi kesalahan saat mengirim komentar.');
    }
  }

  async getComments(postId: string): Promise<FeedComment[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        throw mapPostgrestError(error, 'Gagal memuat komentar.');
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        authorId: row.author_id || undefined,
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
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Gagal mengambil komentar.');
    }
  }

  async getFacilities(query?: string, category?: string): Promise<Facility[]> {
    try {
      let q = supabase.from('facilities').select('*');
      if (category && category !== 'Semua') {
        q = q.eq('category', category);
      }
      if (query && query.trim()) {
        q = q.ilike('name', `%${query.trim()}%`);
      }
      const { data, error } = await q.order('name', { ascending: true });
      if (error) {
        throw mapPostgrestError(error, 'Gagal memuat daftar fasilitas.');
      }
      return (data || []).map(mapFacilityRow);
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Gagal memuat fasilitas.');
    }
  }

  async getBudgetSectors(): Promise<BudgetSectorContext[]> {
    try {
      const { data, error } = await supabase
        .from('budget_sectors')
        .select('*')
        .order('allocated_budget', { ascending: false });

      if (error) {
        throw mapPostgrestError(error, 'Gagal memuat alokasi anggaran.');
      }
      return (data || []).map(mapBudgetSectorRow);
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Gagal memuat sektor anggaran.');
    }
  }

  async getAllReports(): Promise<Report[]> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw mapPostgrestError(error, 'Gagal memuat semua laporan.');
      }
      return (data || []).map((row) => mapReportRow(row));
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Gagal memuat laporan.');
    }
  }

  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    try {
      const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
      const { data, error } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (error) {
        throw mapPostgrestError(error, 'Gagal memuat profil pengguna.');
      }
      if (!data) return null;

      return {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        role: data.role === 'admin' ? 'admin' : 'citizen',
        bio: data.bio || undefined,
        district: data.district || undefined,
        isVerified: Boolean(data.is_verified),
        createdAt: data.created_at,
        bannerUrl: data.banner_url || undefined,
        backgroundTheme: data.background_theme || undefined,
        websiteUrl: data.website_url || undefined,
        customStatus: data.custom_status || undefined,
      };
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Gagal memuat profil pengguna.');
    }
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          relatedReport:reports(*, supports:report_supports(count)),
          comments:comments(count),
          likes:post_likes(count),
          saves:post_saves(count)
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw mapPostgrestError(error, 'Gagal memuat postingan pengguna.');
      }
      return (data || []).map((row) => mapPostRow(row, false, false, false));
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Gagal memuat postingan pengguna.');
    }
  }

  async getUserReports(userId: string): Promise<Report[]> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, supports:report_supports(count)')
        .eq('reporter_user_id', userId)
        .neq('reporter_type', 'anonymous')
        .order('created_at', { ascending: false });

      if (error) {
        throw mapPostgrestError(error, 'Gagal memuat laporan pengguna.');
      }
      return (data || []).map((row) => mapReportRow(row));
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Gagal memuat laporan pengguna.');
    }
  }

  async getPostById(postId: string): Promise<Post | null> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          relatedReport:reports(*, supports:report_supports(count)),
          comments:comments(count),
          likes:post_likes(count),
          saves:post_saves(count)
        `)
        .eq('id', postId)
        .maybeSingle();

      if (error) {
        throw mapPostgrestError(error, 'Gagal memuat postingan.');
      }
      if (!data) return null;
      return mapPostRow(data, false, false, false);
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Gagal memuat postingan.');
    }
  }

  async updateProfile(payload: {
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    bio?: string;
    district?: string;
    bannerUrl?: string;
    backgroundTheme?: string;
    websiteUrl?: string;
    customStatus?: string;
  }): Promise<UserProfile> {
    try {
      let data: any = null;
      let rpcError: any = null;

      try {
        const res = await supabase.rpc('update_my_profile', {
          p_display_name: payload.displayName?.trim() || null,
          p_username: payload.username?.trim().toLowerCase() || null,
          p_avatar_url: payload.avatarUrl || null,
          p_bio: payload.bio || null,
          p_district: payload.district || null,
          p_banner_url: payload.bannerUrl || null,
          p_background_theme: payload.backgroundTheme || null,
          p_website_url: payload.websiteUrl || null,
          p_custom_status: payload.customStatus || null,
        });
        data = res.data;
        rpcError = res.error;
      } catch (e) {
        rpcError = e;
      }

      // Fallback: If RPC failed (e.g. signature mismatch on remote DB), direct update profiles via RLS
      if (rpcError || !data) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new DataError('auth', 'Autentikasi diperlukan untuk memperbarui profil.');

        const updateFields: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (payload.displayName !== undefined) updateFields.display_name = payload.displayName.trim();
        if (payload.username !== undefined) updateFields.username = payload.username.trim().toLowerCase();
        if (payload.avatarUrl !== undefined) updateFields.avatar_url = payload.avatarUrl;
        if (payload.bio !== undefined) updateFields.bio = payload.bio;
        if (payload.district !== undefined) updateFields.district = payload.district;
        if (payload.bannerUrl !== undefined) updateFields.banner_url = payload.bannerUrl;
        if (payload.backgroundTheme !== undefined) updateFields.background_theme = payload.backgroundTheme;
        if (payload.websiteUrl !== undefined) updateFields.website_url = payload.websiteUrl;
        if (payload.customStatus !== undefined) updateFields.custom_status = payload.customStatus;

        const { data: directData, error: directErr } = await supabase
          .from('profiles')
          .update(updateFields)
          .eq('id', user.id)
          .select()
          .single();

        if (directErr) {
          throw mapPostgrestError(directErr, 'Gagal memperbarui profil.');
        }
        data = directData;
      }

      return {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        role: data.role === 'admin' ? 'admin' : 'citizen',
        bio: data.bio || undefined,
        district: data.district || undefined,
        isVerified: Boolean(data.is_verified),
        createdAt: data.created_at,
        bannerUrl: data.banner_url || undefined,
        backgroundTheme: data.background_theme || undefined,
        websiteUrl: data.website_url || undefined,
        customStatus: data.custom_status || undefined,
      };
    } catch (err) {
      if (err instanceof DataError) throw err;
      throw mapPostgrestError(err, 'Gagal memperbarui profil.');
    }
  }
}
