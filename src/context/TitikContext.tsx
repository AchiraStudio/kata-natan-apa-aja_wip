import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Post, Report, ReportStatus, Facility, BudgetSectorContext } from '../types/domain';
import { dataService } from '../services/dataService';
import { FeedComment, NewReportInput, ReportSubmitResult } from '../services/adapters/types';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

export interface TitikContextType {
  posts: Post[];
  activePost: Post | null;
  activeFeedTab: 'for_you' | 'following' | 'nearby';
  selectedCategory: string;
  facilities: Facility[];
  budgetSectors: BudgetSectorContext[];
  composerOpen: boolean;
  composerTab: 'post' | 'report';
  openComposer: (tab?: 'post' | 'report') => void;
  closeComposer: () => void;
  reportModalOpen: boolean;
  openReportModal: () => void;
  closeReportModal: () => void;
  reportDetailOpen: boolean;
  selectedReport: Report | null;
  searchModalOpen: boolean;
  landingBannerOpen: boolean;
  isLoading: boolean;
  setActivePostId: (id: string) => void;
  setActiveFeedTab: (tab: 'for_you' | 'following' | 'nearby') => void;
  setSelectedCategory: (category: string) => void;
  openReportDetail: (report: Report) => void;
  closeReportDetail: () => void;
  setSearchModalOpen: (open: boolean) => void;
  setLandingBannerOpen: (open: boolean) => void;
  currentUserId?: string;
  toggleSupport: (reportId: string) => Promise<void>;
  toggleReportSave?: (reportId: string) => Promise<{ isSaved: boolean }>;
  togglePostSave?: (postId: string) => Promise<void>;
  togglePostLike?: (postId: string) => Promise<void>;
  addComment: (
    postId: string,
    body: string,
    authorName?: string,
    avatarUrl?: string,
    parentId?: string
  ) => Promise<FeedComment>;
  updatePostCommentsCount?: (postId: string, count: number) => void;
  getComments: (postId: string) => Promise<FeedComment[]>;
  submitReport: (input: NewReportInput) => Promise<ReportSubmitResult>;
  deleteReport: (reportId: string) => Promise<void>;
  updateReportStatus: (reportId: string, status: ReportStatus, description: string) => Promise<void>;
  refreshFeed: () => Promise<void>;
}

export const TitikContext = createContext<TitikContextType | undefined>(undefined);

export const TitikProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isAuthenticated } = useAuth();
  const currentUserId = user?.id || (isAuthenticated ? profile.id : undefined);

  const [posts, setPosts] = useState<Post[]>([]);
  const [activePostId, setActivePostIdState] = useState<string>('');
  const [activeFeedTab, setActiveFeedTab] = useState<'for_you' | 'following' | 'nearby'>('for_you');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [budgetSectors, setBudgetSectors] = useState<BudgetSectorContext[]>([]);

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerTab, setComposerTab] = useState<'post' | 'report'>('post');

  const [reportDetailOpen, setReportDetailOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [landingBannerOpen, setLandingBannerOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const openComposer = (tab: 'post' | 'report' = 'post') => {
    setComposerTab(tab);
    setComposerOpen(true);
  };

  const closeComposer = () => {
    setComposerOpen(false);
  };

  const openReportModal = () => openComposer('report');
  const closeReportModal = closeComposer;
  const reportModalOpen = composerOpen && composerTab === 'report';

  const refreshFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const feed = await dataService.getFeedPosts(activeFeedTab, selectedCategory, currentUserId);
      setPosts(feed);
      if (feed.length > 0) {
        setActivePostIdState((prev) => prev || feed[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeFeedTab, selectedCategory, currentUserId]);

  useEffect(() => {
    let isMounted = true;
    dataService.getFeedPosts(activeFeedTab, selectedCategory, currentUserId).then((feed) => {
      if (isMounted) {
        setPosts(feed);
        if (feed.length > 0) {
          setActivePostIdState((prev) => prev || feed[0].id);
        }
        setIsLoading(false);
      }
    }).catch((error: unknown) => {
      console.error('Failed to load feed:', error);
      if (isMounted) setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [activeFeedTab, selectedCategory, currentUserId]);

  useEffect(() => {
    // Initial fetch of facilities & budget sectors
    dataService.getFacilities().then(setFacilities).catch((err) => console.warn('Facilities load:', err));
    dataService.getBudgetSectors().then(setBudgetSectors).catch((err) => console.warn('Budget load:', err));
  }, []);

  // Supabase Realtime Listener (Live Reactive Sync)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('titik-public-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            refreshFeed();
          } else if (payload.eventType === 'UPDATE') {
            const updatedRow: any = payload.new;
            if (updatedRow && updatedRow.id) {
              setPosts((prev) =>
                prev.map((p) => {
                  if (p.relatedReportId === updatedRow.id && p.relatedReport) {
                    return {
                      ...p,
                      supportCount:
                        typeof updatedRow.support_count === 'number'
                          ? updatedRow.support_count
                          : p.supportCount,
                      relatedReport: {
                        ...p.relatedReport,
                        status: updatedRow.status || p.relatedReport.status,
                        officialResponse:
                          updatedRow.official_response ?? p.relatedReport.officialResponse,
                        internalNotes:
                          updatedRow.internal_notes ?? p.relatedReport.internalNotes,
                        evidence_verification_status:
                          updatedRow.evidence_verification_status ??
                          p.relatedReport.evidence_verification_status,
                        supportCount:
                          typeof updatedRow.support_count === 'number'
                            ? updatedRow.support_count
                            : p.relatedReport.supportCount,
                        description: updatedRow.description || p.relatedReport.description,
                        updatedAt: updatedRow.updated_at || p.relatedReport.updatedAt,
                      },
                    };
                  }
                  return p;
                })
              );
              setSelectedReport((current) => {
                if (current && current.id === updatedRow.id) {
                  return {
                    ...current,
                    status: updatedRow.status || current.status,
                    officialResponse:
                      updatedRow.official_response ?? current.officialResponse,
                    internalNotes:
                      updatedRow.internal_notes ?? current.internalNotes,
                    evidence_verification_status:
                      updatedRow.evidence_verification_status ??
                      current.evidence_verification_status,
                    supportCount:
                      typeof updatedRow.support_count === 'number'
                        ? updatedRow.support_count
                        : current.supportCount,
                    description: updatedRow.description || current.description,
                    updatedAt: updatedRow.updated_at || current.updatedAt,
                  };
                }
                return current;
              });
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setPosts((prev) =>
                prev.filter((p) => p.relatedReportId !== deletedId && p.id !== deletedId)
              );
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'facilities' },
        () => {
          dataService.getFacilities().then(setFacilities).catch(() => {});
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        (payload) => {
          const newComment: any = payload.new;
          if (newComment && newComment.post_id) {
            setPosts((prev) =>
              prev.map((p) => {
                if (p.id === newComment.post_id) {
                  return { ...p, commentsCount: (p.commentsCount || 0) + 1 };
                }
                return p;
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshFeed]);

  const activePost = posts.find((p) => p.id === activePostId) || posts[0] || null;

  const setActivePostId = (id: string) => {
    setActivePostIdState(id);
  };

  const openReportDetail = (report: Report) => {
    setSelectedReport(report);
    setReportDetailOpen(true);
  };

  const closeReportDetail = () => {
    setReportDetailOpen(false);
    setSelectedReport(null);
  };

  const toggleSupport = async (reportId: string) => {
    const postWithReport = posts.find((p) => p.relatedReportId === reportId);
    const wasSupported = postWithReport?.isSupportedByMe ?? false;
    const prevCount = postWithReport?.supportCount ?? 0;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.relatedReportId === reportId && p.relatedReport) {
          const isSupported = !wasSupported;
          const supportCount = isSupported ? prevCount + 1 : Math.max(0, prevCount - 1);
          return {
            ...p,
            isSupportedByMe: isSupported,
            supportCount,
            relatedReport: {
              ...p.relatedReport,
              isSupportedByMe: isSupported,
              supportCount,
            },
          };
        }
        return p;
      })
    );

    try {
      const res = await dataService.toggleReportSupport(reportId, currentUserId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.relatedReportId === reportId && p.relatedReport) {
            return {
              ...p,
              isSupportedByMe: res.isSupported,
              supportCount: res.supportCount,
              relatedReport: {
                ...p.relatedReport,
                isSupportedByMe: res.isSupported,
                supportCount: res.supportCount,
              },
            };
          }
          return p;
        })
      );
    } catch (err) {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.relatedReportId === reportId && p.relatedReport) {
            return {
              ...p,
              isSupportedByMe: wasSupported,
              supportCount: prevCount,
              relatedReport: {
                ...p.relatedReport,
                isSupportedByMe: wasSupported,
                supportCount: prevCount,
              },
            };
          }
          return p;
        })
      );
      throw err;
    }
  };

  const toggleReportSave = async (reportId: string) => {
    const reportInFeed = posts.find((post) => post.relatedReportId === reportId)?.relatedReport;
    const report = selectedReport?.id === reportId ? selectedReport : reportInFeed;
    const wasSaved = report?.isSavedByMe ?? false;
    const updateSavedState = (isSavedByMe: boolean) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.relatedReportId === reportId && post.relatedReport
            ? {
                ...post,
                relatedReport: { ...post.relatedReport, isSavedByMe },
              }
            : post
        )
      );
      setSelectedReport((prev) =>
        prev?.id === reportId ? { ...prev, isSavedByMe } : prev
      );
    };

    updateSavedState(!wasSaved);
    try {
      const result = await dataService.toggleReportSave(reportId, currentUserId);
      updateSavedState(result.isSaved);
      return result;
    } catch (error) {
      updateSavedState(wasSaved);
      throw error;
    }
  };

  const togglePostSave = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    const wasSaved = post?.isSavedByMe ?? false;
    const prevCount = post?.savesCount ?? 0;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isSaved = !wasSaved;
          const savesCount = isSaved ? prevCount + 1 : Math.max(0, prevCount - 1);
          return {
            ...p,
            isSavedByMe: isSaved,
            savesCount,
          };
        }
        return p;
      })
    );

    try {
      const res = await dataService.togglePostSave(postId, currentUserId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isSavedByMe: res.isSaved, savesCount: res.savesCount }
            : p
        )
      );
    } catch (err) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isSavedByMe: wasSaved, savesCount: prevCount }
            : p
        )
      );
      throw err;
    }
  };

  const togglePostLike = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    const wasLiked = post?.isLikedByMe ?? false;
    const prevCount = post?.likesCount ?? 0;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !wasLiked;
          const likesCount = isLiked ? prevCount + 1 : Math.max(0, prevCount - 1);
          return {
            ...p,
            isLikedByMe: isLiked,
            likesCount,
          };
        }
        return p;
      })
    );

    try {
      const res = await dataService.togglePostLike(postId, currentUserId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLikedByMe: res.isLiked, likesCount: res.likesCount }
            : p
        )
      );
    } catch (err) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLikedByMe: wasLiked, likesCount: prevCount }
            : p
        )
      );
      throw err;
    }
  };

  const getComments = async (postId: string) => {
    return dataService.getComments(postId);
  };

  const updatePostCommentsCount = useCallback((postId: string, count: number) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, commentsCount: count } : p))
    );
  }, []);

  const addComment = async (
    postId: string,
    body: string,
    authorName?: string,
    avatarUrl?: string,
    parentId?: string
  ) => {
    const finalAuthor = authorName || (isAuthenticated ? profile.displayName : 'Warga Anonim');
    const finalAvatar =
      avatarUrl ||
      (isAuthenticated
        ? profile.avatarUrl
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
    const created = await dataService.addComment(postId, finalAuthor, finalAvatar, body, parentId);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
    );
    return created;
  };

  const submitReport = async (input: NewReportInput) => {
    const result = await dataService.submitReport(input);
    const [submittedPost] = await dataService.getFeedPosts('for_you', 'Semua');
    setActiveFeedTab('for_you');
    setSelectedCategory('Semua');

    if (submittedPost?.relatedReportId === result.report.id) {
      setPosts((currentPosts) => [
        submittedPost,
        ...currentPosts.filter((post) => post.id !== submittedPost.id),
      ]);
      setActivePostIdState(submittedPost.id);
    } else {
      await refreshFeed();
    }
    return result;
  };

  const updateReportStatus = async (reportId: string, status: ReportStatus, description: string) => {
    const updated = await dataService.updateReportStatus(reportId, status, 'admin TITIK', description);
    setPosts((prev) =>
      prev.map((p) => {
        if (p.relatedReportId === reportId) {
          return { ...p, relatedReport: updated };
        }
        return p;
      })
    );
    if (selectedReport?.id === reportId) {
      setSelectedReport(updated);
    }
  };

  const deleteReport = async (reportId: string) => {
    await dataService.deleteReport(reportId);
    setPosts((prev) => prev.filter((post) => post.relatedReportId !== reportId));
    if (selectedReport?.id === reportId) {
      setSelectedReport(null);
      setReportDetailOpen(false);
    }
  };

  return (
    <TitikContext.Provider
      value={{
        posts,
        activePost,
        activeFeedTab,
        selectedCategory,
        facilities,
        budgetSectors,
        composerOpen,
        composerTab,
        openComposer,
        closeComposer,
        reportModalOpen,
        openReportModal,
        closeReportModal,
        reportDetailOpen,
        selectedReport,
        searchModalOpen,
        landingBannerOpen,
        isLoading,
        setActivePostId,
        setActiveFeedTab,
        setSelectedCategory,
        openReportDetail,
        closeReportDetail,
        setSearchModalOpen,
        setLandingBannerOpen,
        currentUserId,
        toggleSupport,
        toggleReportSave,
        togglePostSave,
        togglePostLike,
        addComment,
        getComments,
        updatePostCommentsCount,
        submitReport,
        deleteReport,
        updateReportStatus,
        refreshFeed,
      }}
    >
      {children}
    </TitikContext.Provider>
  );
};

export { useTitik } from './useTitik';
