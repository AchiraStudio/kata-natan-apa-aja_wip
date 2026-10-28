import { Report, ReportStatus, ReportEvent } from '../../types/domain';

export type AdminSortOption = 'newest' | 'oldest' | 'severity';

export interface ReportDraft {
  publicResponse: string;
  internalNote: string;
  lastUpdated: number;
}

export interface ZoomMedia {
  url: string;
  type: 'image' | 'video';
  title: string;
  address: string;
}

export type ComposerTab = 'public' | 'internal';

export interface AdminMetricsSummary {
  underReview: number;
  needsInfo: number;
  forwarded: number;
  resolved: number;
}

export type StatusFilterValue = 'all' | ReportStatus;

export { type Report, type ReportStatus, type ReportEvent };
