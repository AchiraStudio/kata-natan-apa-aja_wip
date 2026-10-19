import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Post, Report, ReportStatus, Facility, BudgetSectorContext } from '../types/domain';
import { dataService } from '../services/dataService';
import { NewReportInput, ReportSubmitResult } from '../services/adapters/types';

interface TitikContextType {
  posts: Post[];
  activePost: Post | null;
  activeFeedTab: 'for_you' | 'following' | 'nearby';
  selectedCategory: string;
  facilities: Facility[];
  budgetSectors: BudgetSectorContext[];
  reportModalOpen: boolean;
  reportDetailOpen: boolean;
  selectedReport: Report | null;
  searchModalOpen: boolean;
  landingBannerOpen: boolean;
  isLoading: boolean;
  setActivePostId: (id: string) => void;
  setActiveFeedTab: (tab: 'for_you' | 'following' | 'nearby') => void;
  setSelectedCategory: (category: string) => void;
  openReportModal: () => void;
  closeReportModal: () => void;
  openReportDetail: (report: Report) => void;
  closeReportDetail: () => void;
  setSearchModalOpen: (open: boolean) => void;
  setLandingBannerOpen: (open: boolean) => void;
  toggleSupport: (reportId: string) => Promise<void>;
  addComment: (postId: string, body: string) => Promise<void>;
  submitReport: (input: NewReportInput) => Promise<ReportSubmitResult>;
  updateReportStatus: (reportId: string, status: ReportStatus, description: string) => Promise<void>;
  refreshFeed: () => Promise<void>;
}

export const TitikContext = createContext<TitikContextType | undefined>(undefined);

export const TitikProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activePostId, setActivePostIdState] = useState<string>('');
  const [activeFeedTab, setActiveFeedTab] = useState<'for_you' | 'following' | 'nearby'>('for_you');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [budgetSectors, setBudgetSectors] = useState<BudgetSectorContext[]>([]);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportDetailOpen, setReportDetailOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [landingBannerOpen, setLandingBannerOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const refreshFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const feed = await dataService.getFeedPosts(activeFeedTab, selectedCategory);
      setPosts(feed);
      if (feed.length > 0) {
        setActivePostIdState((prev) => prev || feed[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeFeedTab, selectedCategory]);

  useEffect(() => {
    let isMounted = true;
    dataService.getFeedPosts(activeFeedTab, selectedCategory).then((feed) => {
      if (isMounted) {
        setPosts(feed);
        if (feed.length > 0) {
          setActivePostIdState((prev) => prev || feed[0].id);
        }
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeFeedTab, selectedCategory]);

  useEffect(() => {
    // Initial fetch of facilities & budget sectors
    dataService.getFacilities().then(setFacilities);
    dataService.getBudgetSectors().then(setBudgetSectors);
  }, []);

  const activePost = posts.find((p) => p.id === activePostId) || posts[0] || null;

  const setActivePostId = (id: string) => {
    setActivePostIdState(id);
  };

  const openReportModal = () => setReportModalOpen(true);
  const closeReportModal = () => setReportModalOpen(false);

  const openReportDetail = (report: Report) => {
    setSelectedReport(report);
    setReportDetailOpen(true);
  };

  const closeReportDetail = () => {
    setReportDetailOpen(false);
    setSelectedReport(null);
  };

  const toggleSupport = async (reportId: string) => {
    await dataService.toggleReportSupport(reportId);
    // Refresh local feed state optimistically
    setPosts((prev) =>
      prev.map((p) => {
        if (p.relatedReportId === reportId && p.relatedReport) {
          const wasSupported = p.isSupportedByMe ?? false;
          const isSupported = !wasSupported;
          const supportCount = isSupported ? p.supportCount + 1 : Math.max(0, p.supportCount - 1);
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
  };

  const addComment = async (postId: string, body: string) => {
    const authorName = 'Warga Anda';
    const avatarUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
    await dataService.addComment(postId, authorName, avatarUrl, body);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
    );
  };

  const submitReport = async (input: NewReportInput) => {
    const result = await dataService.submitReport(input);
    await refreshFeed();
    if (result.report) {
      setActivePostIdState(posts[0]?.id || '');
    }
    return result;
  };

  const updateReportStatus = async (reportId: string, status: ReportStatus, description: string) => {
    const updated = await dataService.updateReportStatus(reportId, status, 'Admin TITIK', description);
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

  return (
    <TitikContext.Provider
      value={{
        posts,
        activePost,
        activeFeedTab,
        selectedCategory,
        facilities,
        budgetSectors,
        reportModalOpen,
        reportDetailOpen,
        selectedReport,
        searchModalOpen,
        landingBannerOpen,
        isLoading,
        setActivePostId,
        setActiveFeedTab,
        setSelectedCategory,
        openReportModal,
        closeReportModal,
        openReportDetail,
        closeReportDetail,
        setSearchModalOpen,
        setLandingBannerOpen,
        toggleSupport,
        addComment,
        submitReport,
        updateReportStatus,
        refreshFeed,
      }}
    >
      {children}
    </TitikContext.Provider>
  );
};

export { useTitik } from './useTitik';
