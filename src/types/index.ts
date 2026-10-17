export type SectorType = 
  | 'Pendidikan' 
  | 'Kesehatan' 
  | 'Lingkungan & Drainase' 
  | 'Infrastruktur Jalan'
  | 'Transportasi Publik'
  | 'Ruang Terbuka Hijau'
  | 'Pengelolaan Persampahan'
  | 'Pasar Tradisional'
  | 'Layanan Administrasi';

export type SubdistrictType = 
  | 'Jakarta Pusat'
  | 'Jakarta Selatan'
  | 'Jakarta Timur'
  | 'Jakarta Barat'
  | 'Jakarta Utara'
  | 'Bogor Tengah'
  | 'Bogor Selatan'
  | 'Bogor Barat'
  | 'Bogor Timur'
  | 'Bogor Utara'
  | 'Tanah Sareal'
  | 'Depok'
  | 'Kota Tangerang'
  | 'Tangerang Selatan'
  | 'Kota Bekasi'
  | string;

export type FacilityCondition = 'Baik' | 'Rusak Ringan' | 'Rusak Sedang' | 'Rusak Berat' | 'Perlu Intervensi Kritis';

export type SourceType = 
  | 'OFFICIAL_SIMULATED' 
  | 'CITIZEN_SUBMISSION' 
  | 'INSPECTORATE_AUDIT' 
  | 'INFERRED_RELATIONSHIP';

export interface SourceMetadata {
  sourceName: string;
  sourceType: SourceType;
  reportingPeriod: string;
  publicationDate: string;
  verifiedBy?: string;
  confidenceLevel: 'Tinggi (98%)' | 'Sedang (75%)' | 'Dalam Peninjauan';
  methodologyNote: string;
  isSimulatedCompetitionData: boolean;
}

export interface BudgetBreakdown {
  paguAnggaran: number;            // 1. Total Approved Allocation
  danaTerikatKontrak: number;      // 2. Committed / Contracted Funds
  realisasiPenyerapan: number;     // 3. Realized Expenditure
  sisaPaguBelumTerikat: number;    // 4. Potentially Available (Pagu - Terikat)
  linkageConfidence: 'Tinggi (98%)' | 'Sedang (75%)' | 'Belum Terkonfirmasi';
  dataSource: string;              // e.g. "Simulasi SIKD / Satu Data Kota Bogor 2026"
  lastUpdated: string;
  sourceMetadata?: SourceMetadata;
}

export interface PublicFacility {
  id: string;
  name: string;
  sector: SectorType;
  subdistrict: SubdistrictType;
  address: string;
  coordinates: [number, number]; // [lat, lng]
  responsibleAgency: string;     // e.g. "Dinas Pendidikan Kota Bogor"
  condition: FacilityCondition;
  serviceCapacity: string;       // e.g. "650 Siswa Aktif" or "12.000 Pasien/Tahun"
  activeReportsCount: number;
  resolvedReportsCount: number;
  linkedProjectIds: string[];
  budgetSummary: BudgetBreakdown;
  photoUrl: string;
  isSaved?: boolean;
}

export interface BudgetProject {
  id: string;
  code: string;                  // e.g. "APBD-2026-PUPR-041"
  title: string;
  sector: SectorType;
  subdistrict: SubdistrictType;
  facilityId?: string;
  facilityName?: string;
  responsibleAgency: string;
  contractorName: string;
  progressPercent: number;
  status: 'Selesai' | 'Dalam Pengerjaan' | 'Tahap Lelang / Verifikasi';
  startDate: string;
  targetEndDate: string;
  budget: BudgetBreakdown;
  description: string;
  sourceMetadata?: SourceMetadata;
}

export interface BudgetActivity {
  id: string;
  code: string;
  name: string;
  pagu: number;
  terikat: number;
  realisasi: number;
}

export interface BudgetProgram {
  id: string;
  code: string;
  name: string;
  sector: SectorType;
  responsibleAgency: string;
  paguAnggaran: number;
  danaTerikatKontrak: number;
  realisasiPenyerapan: number;
  sisaPaguBelumTerikat: number;
  projectsCount: number;
  activities: BudgetActivity[];
}

export type ReportStepStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';

export interface AuditTimelineStep {
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  date: string;
  description: string;
  status: ReportStepStatus;
  actor: string;
  evidenceUrl?: string;
}

export interface CitizenReport {
  id: string;                    // e.g. "TITIK-BGR-2026-084"
  title: string;
  description: string;
  sector: SectorType;
  subdistrict: SubdistrictType;
  facilityId?: string;
  facilityName?: string;
  coordinates: [number, number];
  responsibleAgency: string;
  linkedProjectId?: string;
  linkedProjectTitle?: string;
  isBudgetLinkConfirmed: boolean;
  priorityVotes: number;         // "Suara Prioritas"
  userHasVoted?: boolean;
  isSaved?: boolean;
  reporterHandle: string;        // e.g. "warga_bgr_tengah"
  reportedAt: string;
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
  timeline: AuditTimelineStep[];
  photoUrl: string;
  severity: 'Rendah' | 'Sedang' | 'Kritis';
  evidenceFilesCount?: number;
}

export interface DiscrepancyFlag {
  id: string;
  title: string;
  sector: SectorType;
  subdistrict: SubdistrictType;
  facilityName: string;
  projectCode: string;
  projectTitle: string;
  realizationPercent: number;    // High budget spent, e.g. 94%
  unresolvedReportsCount: number;// Persistent community complaints, e.g. 8
  flagReason: string;
  agencyName: string;
  auditRecommendation: string;
  coordinates: [number, number];
  severity: 'Tinggi' | 'Sedang';
  confidenceLevel: 'Tinggi (98%)' | 'Sedang (75%)';
  observedPattern: string;
}

export interface MonthlyDigest {
  monthYear: string;
  headline: string;
  totalBudgetAllocated: number;
  totalBudgetRealized: number;
  newCompletedProjects: number;
  activeDiscrepanciesCount: number;
  editorialSummary: string;
  verifiedReportsCount: number;
}

export interface SectorMeta {
  id: SectorType;
  label: string;
  description: string;
  defaultAgency: string;
  color: string;
}
