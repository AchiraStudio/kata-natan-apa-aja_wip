import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  PublicFacility, 
  BudgetProject, 
  BudgetProgram,
  CitizenReport, 
  DiscrepancyFlag, 
  SubdistrictType, 
  SectorType,
  RealtimeSyncStatus,
  TelemetryEvent
} from '../types';
import { 
  INITIAL_FACILITIES, 
  INITIAL_BUDGET_PROJECTS, 
  INITIAL_BUDGET_PROGRAMS, 
  INITIAL_REPORTS, 
  INITIAL_DISCREPANCIES 
} from '../data/titikRegionalData';
import { fetchPublishedReports } from '../services/reportService';
import { isSupabaseConfigured } from '../lib/supabase';

interface TitikContextType {
  // Filter States
  selectedSubdistrict: 'Semua' | SubdistrictType;
  setSelectedSubdistrict: (sub: 'Semua' | SubdistrictType) => void;
  selectedSector: 'Semua' | SectorType;
  setSelectedSector: (sec: 'Semua' | SectorType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  pinFilter: 'ALL' | 'FACILITY' | 'PROJECT' | 'REPORT';
  setPinFilter: (filter: 'ALL' | 'FACILITY' | 'PROJECT' | 'REPORT') => void;

  // Data Collections
  facilities: PublicFacility[];
  budgetProjects: BudgetProject[];
  budgetPrograms: BudgetProgram[];
  reports: CitizenReport[];
  discrepancies: DiscrepancyFlag[];

  // Selected Detail Drawer
  selectedFacility: PublicFacility | null;
  setSelectedFacility: (fac: PublicFacility | null) => void;
  selectedReport: CitizenReport | null;
  setSelectedReport: (rep: CitizenReport | null) => void;
  selectedProject: BudgetProject | null;
  setSelectedProject: (prj: BudgetProject | null) => void;

  // Modals & Overlays
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isDataSourceModalOpen: boolean;
  setIsDataSourceModalOpen: (open: boolean) => void;
  isReportModalOpen: boolean;
  setIsReportModalOpen: (open: boolean) => void;
  preselectedFacilityForReport: PublicFacility | null;
  setPreselectedFacilityForReport: (fac: PublicFacility | null) => void;

  // View Navigation Compatibility
  activeView: 'landing' | 'observatory' | 'discrepancy' | 'reports';
  setActiveView: (view: 'landing' | 'observatory' | 'discrepancy' | 'reports') => void;

  // Watchlist (Saved items)
  savedFacilityIds: string[];
  savedReportIds: string[];
  toggleSaveFacility: (id: string) => void;
  toggleSaveReport: (id: string) => void;

  // Theme Management
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Realtime & Offline Telemetry Engine
  syncStatus: RealtimeSyncStatus;
  lastSyncedAt: string;
  isOfflineSimulated: boolean;
  realtimeChannelState: 'CONNECTED' | 'SUBSCRIBED' | 'OFFLINE';
  liveEventsCount: number;
  latestTelemetryEvent: TelemetryEvent | null;
  triggerManualSync: () => Promise<void>;
  toggleOfflineSimulation: () => void;
  simulateIncomingEvent: () => void;
  clearLatestEvent: () => void;

  // Actions
  addCitizenReport: (report: Omit<CitizenReport, 'id' | 'reportedAt' | 'priorityVotes' | 'userHasVoted' | 'currentStep' | 'timeline'>) => CitizenReport;
  votePriority: (reportId: string) => void;
  resetDemoData: () => void;
}

const STORAGE_KEY_REPORTS = 'titik_reports_storage_v2';
const STORAGE_KEY_VOTES = 'titik_voted_report_ids_v2';
const STORAGE_KEY_SAVED_FACILITIES = 'titik_saved_facilities_v2';
const STORAGE_KEY_SAVED_REPORTS = 'titik_saved_reports_v2';
const STORAGE_KEY_THEME = 'titik-theme';

const TitikContext = createContext<TitikContextType | undefined>(undefined);

export const TitikProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<'Semua' | SubdistrictType>('Semua');
  const [selectedSector, setSelectedSector] = useState<'Semua' | SectorType>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [pinFilter, setPinFilter] = useState<'ALL' | 'FACILITY' | 'PROJECT' | 'REPORT'>('ALL');

  const [facilities] = useState<PublicFacility[]>(INITIAL_FACILITIES);
  const [budgetProjects] = useState<BudgetProject[]>(INITIAL_BUDGET_PROJECTS);
  const [budgetPrograms] = useState<BudgetProgram[]>(INITIAL_BUDGET_PROGRAMS);
  const [discrepancies] = useState<DiscrepancyFlag[]>(INITIAL_DISCREPANCIES);

  const [selectedFacility, setSelectedFacility] = useState<PublicFacility | null>(null);
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);
  const [selectedProject, setSelectedProject] = useState<BudgetProject | null>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDataSourceModalOpen, setIsDataSourceModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [preselectedFacilityForReport, setPreselectedFacilityForReport] = useState<PublicFacility | null>(null);
  const [activeView, setActiveView] = useState<'landing' | 'observatory' | 'discrepancy' | 'reports'>('landing');

  // LocalStorage-backed reports
  const [reports, setReports] = useState<CitizenReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REPORTS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_REPORTS;
  });

  // Track voted IDs
  const [votedIds, setVotedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VOTES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Watchlists
  const [savedFacilityIds, setSavedFacilityIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_FACILITIES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return ['FAC-BGR-001', 'FAC-BGR-003'];
  });

  const [savedReportIds, setSavedReportIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_REPORTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return ['TITIK-BGR-2026-084'];
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
    } catch {
      // ignore
    }
  }, [reports]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VOTES, JSON.stringify(votedIds));
    } catch {
      // ignore
    }
  }, [votedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_FACILITIES, JSON.stringify(savedFacilityIds));
    } catch {
      // ignore
    }
  }, [savedFacilityIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_REPORTS, JSON.stringify(savedReportIds));
    } catch {
      // ignore
    }
  }, [savedReportIds]);

  // Synchronize reports with Supabase published reports when configured
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    fetchPublishedReports()
      .then((pubReports) => {
        if (pubReports && pubReports.length > 0) {
          const mapped: CitizenReport[] = pubReports.map((p) => {
            const fac = p.facilityId ? INITIAL_FACILITIES.find(f => f.id === p.facilityId) : undefined;
            const agencyRel = p.relations?.find(r => r.targetType === 'agency');
            const projectRel = p.relations?.find(r => r.targetType === 'budget_project');
            const project = projectRel ? INITIAL_BUDGET_PROJECTS.find(bp => bp.id === projectRel.targetId) : undefined;

            const timeline = (p.events && p.events.length > 0)
              ? p.events.map((e, idx) => ({
                  stepNumber: ((idx + 1) as 1 | 2 | 3 | 4 | 5 | 6),
                  title: e.statusBadge || e.eventType || 'Peristiwa Terverifikasi',
                  date: e.date,
                  description: e.description,
                  status: 'COMPLETED' as const,
                  actor: e.actorType === 'agency' ? 'Instansi Terkait' : 'Warga / Sistem'
                }))
              : [
                  {
                    stepNumber: 1 as const,
                    title: 'Laporan Diterima Warga',
                    date: p.observedAt || 'Baru Saja',
                    description: p.description,
                    status: 'COMPLETED' as const,
                    actor: 'Warga Pelapor'
                  }
                ];

            return {
              id: p.publicReference || p.id,
              title: p.title,
              description: p.description,
              sector: p.category as SectorType,
              subdistrict: p.subdistrict as SubdistrictType,
              facilityId: p.facilityId,
              facilityName: fac?.name || p.facilityName,
              coordinates: p.coordinates,
              responsibleAgency: agencyRel?.targetId || fac?.responsibleAgency || 'Dinas Teknis Terkait',
              linkedProjectId: project?.id,
              linkedProjectTitle: project?.title,
              isBudgetLinkConfirmed: agencyRel?.matchStatus === 'confirmed',
              priorityVotes: p.votesCount,
              userHasVoted: p.hasUserVoted,
              reporterHandle: 'warga_terverifikasi',
              reportedAt: p.observedAt,
              currentStep: (Math.min(timeline.length, 6) as 1 | 2 | 3 | 4 | 5 | 6),
              timeline,
              photoUrl: p.approvedMedia?.[0]?.url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
              severity: p.severity,
              evidenceFilesCount: p.approvedMedia?.length || 0,
            };
          });
          setReports(mapped);
        }
      })
      .catch((err) => console.warn('Could not sync reports from Supabase:', err));
  }, []);

  // Dynamic Light / Dark Theme Management
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY_THEME);
        if (saved === 'dark' || saved === 'light') return saved;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
      }
    } catch {
      // ignore
    }
    return 'light';
  });

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_THEME, newTheme);
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Sync .dark class on mount and theme change
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch {
      // ignore
    }
  }, [theme]);

  // Realtime & Offline Telemetry Engine State
  const [syncStatus, setSyncStatus] = useState<RealtimeSyncStatus>('LIVE');
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() => {
    const now = new Date();
    return `${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB (Otomatis)`;
  });
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);
  const [realtimeChannelState, setRealtimeChannelState] = useState<'CONNECTED' | 'SUBSCRIBED' | 'OFFLINE'>('SUBSCRIBED');
  const [liveEventsCount, setLiveEventsCount] = useState<number>(3);
  const [latestTelemetryEvent, setLatestTelemetryEvent] = useState<TelemetryEvent | null>({
    id: 'evt-init',
    timestamp: '13:25 WIB',
    message: 'SIKD Kemendagri & Portal Satu Data terhubung. Channel realtime aktif.',
    type: 'SIKD_SYNC'
  });

  const clearLatestEvent = useCallback(() => {
    setLatestTelemetryEvent(null);
  }, []);

  const triggerManualSync = useCallback(async () => {
    if (isOfflineSimulated) {
      setSyncStatus('OFFLINE');
      setLatestTelemetryEvent({
        id: `evt-${Date.now()}`,
        timestamp: `${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
        message: 'Koneksi SIKD gagal: Mode Offline simulasi aktif. Menampilkan cache lokal.',
        type: 'SIKD_SYNC'
      });
      return;
    }
    setSyncStatus('SYNCING');
    await new Promise(resolve => setTimeout(resolve, 850));
    setSyncStatus('LIVE');
    const timeStr = `${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
    setLastSyncedAt(timeStr);
    setLiveEventsCount(prev => prev + 1);
    setLatestTelemetryEvent({
      id: `evt-${Date.now()}`,
      timestamp: timeStr,
      message: 'Sinkronisasi SIKD Kemendagri & Satu Data sukses. 24 data divalidasi.',
      type: 'SIKD_SYNC'
    });
  }, [isOfflineSimulated]);

  const toggleOfflineSimulation = useCallback(() => {
    setIsOfflineSimulated(prev => {
      const next = !prev;
      const timeStr = `${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
      if (next) {
        setSyncStatus('OFFLINE');
        setRealtimeChannelState('OFFLINE');
        setLatestTelemetryEvent({
          id: `evt-${Date.now()}`,
          timestamp: timeStr,
          message: 'Mode Offline aktif. Data disajikan dari cache lokal terverifikasi.',
          type: 'SIKD_SYNC'
        });
      } else {
        setSyncStatus('SYNCING');
        setRealtimeChannelState('CONNECTED');
        setTimeout(() => {
          setSyncStatus('LIVE');
          setRealtimeChannelState('SUBSCRIBED');
          setLastSyncedAt(timeStr);
          setLatestTelemetryEvent({
            id: `evt-${Date.now()}`,
            timestamp: timeStr,
            message: 'Koneksi pulih. Channel Supabase Realtime kembali SUBSCRIBED.',
            type: 'SIKD_SYNC'
          });
        }, 700);
      }
      return next;
    });
  }, []);

  const simulateIncomingEvent = useCallback(() => {
    if (isOfflineSimulated) return;
    const timeStr = `${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
    const randomPool: Array<{ message: string; type: 'REPORT' | 'VOTE' | 'SIKD_SYNC' }> = [
      { message: 'Warga Bogor Tengah memberikan suara prioritas untuk Drainase Pajajaran.', type: 'VOTE' },
      { message: 'Laporan baru terverifikasi geotag: Retakan Trotoar Kebun Raya Timur.', type: 'REPORT' },
      { message: 'Inspektorat menjadwalkan audit fisik untuk paket jalan berkas #BGR-2026-04.', type: 'SIKD_SYNC' },
      { message: 'Suara prioritas warga melampaui kuorum di Puskesmas Sempur (54 Suara).', type: 'VOTE' }
    ];
    const picked = randomPool[Math.floor(Math.random() * randomPool.length)];
    setLiveEventsCount(prev => prev + 1);
    setLatestTelemetryEvent({
      id: `evt-${Date.now()}`,
      timestamp: timeStr,
      message: picked.message,
      type: picked.type
    });
  }, [isOfflineSimulated]);

  // Periodic SIKD polling simulation (every 45 seconds when online)
  useEffect(() => {
    if (isOfflineSimulated) return;
    const interval = setInterval(() => {
      const timeStr = `${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
      setLastSyncedAt(timeStr);
    }, 45000);
    return () => clearInterval(interval);
  }, [isOfflineSimulated]);

  // Global keydown for Cmd+K / Ctrl+K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsDataSourceModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSaveFacility = (id: string) => {
    setSavedFacilityIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSaveReport = (id: string) => {
    setSavedReportIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const addCitizenReport = (
    newReportData: Omit<CitizenReport, 'id' | 'reportedAt' | 'priorityVotes' | 'userHasVoted' | 'currentStep' | 'timeline'>
  ): CitizenReport => {
    const timestampStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + `, ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

    const newId = `TITIK-BGR-2026-${String(reports.length + 101).padStart(3, '0')}`;

    const newReport: CitizenReport = {
      ...newReportData,
      id: newId,
      reportedAt: timestampStr,
      priorityVotes: 1,
      userHasVoted: true,
      currentStep: 2,
      timeline: [
        {
          stepNumber: 1,
          title: 'Laporan Diterima Warga',
          date: timestampStr,
          description: 'Laporan warga berhasil dimasukkan ke sistem observasi publik TITIK.',
          status: 'COMPLETED',
          actor: 'Warga Pelapor'
        },
        {
          stepNumber: 2,
          title: 'Verifikasi Bukti Visual & Geotag',
          date: 'Sedang Berjalan',
          description: 'Tim kurasi komunitas sedang memvalidasi foto dan titik koordinat.',
          status: 'IN_PROGRESS',
          actor: 'Kurator Komunitas WIA'
        },
        {
          stepNumber: 3,
          title: 'Dinas Penanggung Jawab',
          date: 'Menunggu Langkah 2',
          description: `Disposisi kasus diarahkan ke ${newReportData.responsibleAgency}.`,
          status: 'PENDING',
          actor: newReportData.responsibleAgency
        },
        {
          stepNumber: 4,
          title: 'Tautan Anggaran APBD',
          date: 'Menunggu Langkah 3',
          description: newReportData.isBudgetLinkConfirmed 
            ? `Terkait dengan pos anggaran: ${newReportData.linkedProjectTitle}`
            : 'Menunggu pencocokan pos pemeliharaan berkala SIKD.',
          status: 'PENDING',
          actor: 'Sistem SIKD'
        },
        {
          stepNumber: 5,
          title: 'Respon Resmi Dinas',
          date: 'Menunggu Langkah 4',
          description: 'Konfirmasi instruksi kerja kepada PPK instansi.',
          status: 'PENDING',
          actor: newReportData.responsibleAgency
        },
        {
          stepNumber: 6,
          title: 'Tuntas Terverifikasi Komunitas',
          date: 'Menunggu Penyelesaian',
          description: 'Inspeksi hasil perbaikan oleh warga sekitar lokasi kejadian.',
          status: 'PENDING',
          actor: 'Warga Sekitar'
        }
      ]
    };

    setReports(prev => [newReport, ...prev]);
    setVotedIds(prev => [...prev, newId]);

    const timeStr = `${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
    setLiveEventsCount(prev => prev + 1);
    setLatestTelemetryEvent({
      id: `evt-${Date.now()}`,
      timestamp: timeStr,
      message: `Laporan baru (${newId}) tersimpan di database TITIK & disiarkan via Realtime.`,
      type: 'REPORT'
    });

    return newReport;
  };

  const votePriority = (reportId: string) => {
    let nextVoted = false;
    setReports(prev => prev.map(rep => {
      if (rep.id === reportId) {
        const alreadyVoted = votedIds.includes(reportId);
        nextVoted = !alreadyVoted;
        const newVotes = alreadyVoted ? Math.max(1, rep.priorityVotes - 1) : rep.priorityVotes + 1;
        return {
          ...rep,
          priorityVotes: newVotes,
          userHasVoted: !alreadyVoted
        };
      }
      return rep;
    }));

    setVotedIds(prev => {
      if (prev.includes(reportId)) {
        return prev.filter(id => id !== reportId);
      } else {
        return [...prev, reportId];
      }
    });

    const timeStr = `${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
    setLiveEventsCount(prev => prev + 1);
    setLatestTelemetryEvent({
      id: `evt-${Date.now()}`,
      timestamp: timeStr,
      message: nextVoted
        ? `Suara prioritas diverifikasi di database TITIK untuk ${reportId}.`
        : `Suara dibatalkan untuk ${reportId}.`,
      type: 'VOTE'
    });
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY_REPORTS);
    localStorage.removeItem(STORAGE_KEY_VOTES);
    localStorage.removeItem(STORAGE_KEY_SAVED_FACILITIES);
    localStorage.removeItem(STORAGE_KEY_SAVED_REPORTS);
    setReports(INITIAL_REPORTS);
    setVotedIds([]);
    setSavedFacilityIds(['FAC-BGR-001', 'FAC-BGR-003']);
    setSavedReportIds(['TITIK-BGR-2026-084']);
    setLiveEventsCount(3);
    setLatestTelemetryEvent({
      id: `evt-${Date.now()}`,
      timestamp: `${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
      message: 'State demo direset ke default pabrikan.',
      type: 'SIKD_SYNC'
    });
  };

  return (
    <TitikContext.Provider
      value={{
        selectedSubdistrict,
        setSelectedSubdistrict,
        selectedSector,
        setSelectedSector,
        searchQuery,
        setSearchQuery,
        pinFilter,
        setPinFilter,
        facilities,
        budgetProjects,
        budgetPrograms,
        reports,
        discrepancies,
        selectedFacility,
        setSelectedFacility,
        selectedReport,
        setSelectedReport,
        selectedProject,
        setSelectedProject,
        isSearchOpen,
        setIsSearchOpen,
        isDataSourceModalOpen,
        setIsDataSourceModalOpen,
        isReportModalOpen,
        setIsReportModalOpen,
        preselectedFacilityForReport,
        setPreselectedFacilityForReport,
        activeView,
        setActiveView,
        savedFacilityIds,
        savedReportIds,
        toggleSaveFacility,
        toggleSaveReport,
        addCitizenReport,
        votePriority,
        resetDemoData,
        theme,
        setTheme,
        toggleTheme,
        syncStatus,
        lastSyncedAt,
        isOfflineSimulated,
        realtimeChannelState,
        liveEventsCount,
        latestTelemetryEvent,
        triggerManualSync,
        toggleOfflineSimulation,
        simulateIncomingEvent,
        clearLatestEvent
      }}
    >
      {children}
    </TitikContext.Provider>
  );
};

export const useTitik = () => {
  const context = useContext(TitikContext);
  if (!context) {
    throw new Error('useTitik must be used within a TitikProvider');
  }
  return context;
};
