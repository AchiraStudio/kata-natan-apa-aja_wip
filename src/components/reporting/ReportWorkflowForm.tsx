// =============================================================================
// TITIK. — Shared Citizen Report Workflow Form
// Unified 3-step reporting component shared by /lapor and ReportModal
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  MapPin, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Building2, 
  Loader2,
  Info,
  Lock,
  Droplets,
  Construction,
  GraduationCap,
  HeartPulse,
  Trees,
  Bus,
  Sparkles,
  Plus,
  Check
} from 'lucide-react';
import { SectorType, SubdistrictType } from '../../types';
import { SUBDISTRICTS } from '../../data/titikRegionalData';
import { useTitik } from '../../context/TitikContext';
import { validateImageFile } from '../../services/reportMediaService';
import { requestCurrentPosition } from '../../services/locationService';
import { submitCitizenReport } from '../../services/reportService';
import { isSupabaseConfigured } from '../../lib/supabase';
import { SubmissionResult } from '../../types/database';
import confetti from 'canvas-confetti';

const DRAFT_STORAGE_KEY = 'titik_report_draft_v2';

// Visual Category Cards for Step 1
const SECTOR_VISUAL_CARDS: Array<{
  sector: SectorType;
  label: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  iconBg: string;
}> = [
  {
    sector: 'Lingkungan & Drainase',
    label: 'Drainase & Banjir',
    badge: 'Saluran Air',
    icon: Droplets,
    accentColor: '#0284C7',
    iconBg: 'bg-[#0284C7]/15 text-[#0284C7]',
  },
  {
    sector: 'Infrastruktur Jalan',
    label: 'Jalan & Jembatan',
    badge: 'Aspal & Trotoar',
    icon: Construction,
    accentColor: '#D97706',
    iconBg: 'bg-[#D97706]/15 text-[#D97706]',
  },
  {
    sector: 'Pendidikan',
    label: 'Gedung Sekolah',
    badge: 'Sarana Belajar',
    icon: GraduationCap,
    accentColor: '#6366F1',
    iconBg: 'bg-[#6366F1]/15 text-[#6366F1]',
  },
  {
    sector: 'Kesehatan',
    label: 'Puskesmas / RS',
    badge: 'Layanan Medis',
    icon: HeartPulse,
    accentColor: '#DC2626',
    iconBg: 'bg-[#DC2626]/15 text-[#DC2626]',
  },
  {
    sector: 'Ruang Terbuka Hijau',
    label: 'Taman & RTH',
    badge: 'Pohon & Fasos',
    icon: Trees,
    accentColor: '#16A34A',
    iconBg: 'bg-[#16A34A]/15 text-[#16A34A]',
  },
  {
    sector: 'Pengelolaan Persampahan',
    label: 'Timbunan Sampah',
    badge: 'Kebersihan',
    icon: Trash2,
    accentColor: '#EA580C',
    iconBg: 'bg-[#EA580C]/15 text-[#EA580C]',
  },
  {
    sector: 'Transportasi Publik',
    label: 'Halte & Moda',
    badge: 'Mobilitas',
    icon: Bus,
    accentColor: '#0D9488',
    iconBg: 'bg-[#0D9488]/15 text-[#0D9488]',
  },
  {
    sector: 'Layanan Administrasi',
    label: 'Kantor & Lainnya',
    badge: 'Layanan Publik',
    icon: Building2,
    accentColor: '#64748B',
    iconBg: 'bg-[#64748B]/15 text-[#64748B]',
  },
];

// Quick 1-Tap Issue Presets
const QUICK_ISSUE_PRESETS: Array<{
  chipText: string;
  category: SectorType;
  severity: 'Rendah' | 'Sedang' | 'Kritis';
  titleSuggestion: string;
}> = [
  {
    chipText: '🌊 Drainase Meluap',
    category: 'Lingkungan & Drainase',
    severity: 'Kritis',
    titleSuggestion: 'Saluran drainase mampet memicu genangan banjir',
  },
  {
    chipText: '🕳️ Jalan Berlubang',
    category: 'Infrastruktur Jalan',
    severity: 'Sedang',
    titleSuggestion: 'Jalan amblas & berlubang membahayakan pengguna jalan',
  },
  {
    chipText: '🏫 Atap Kelas Rusak',
    category: 'Pendidikan',
    severity: 'Kritis',
    titleSuggestion: 'Kerusakan fisik plafon ruang belajar sekolah',
  },
  {
    chipText: '🗑️ Tumpukan Sampah',
    category: 'Pengelolaan Persampahan',
    severity: 'Sedang',
    titleSuggestion: 'Sampah liar menumpuk di bahu jalan lingkungan',
  },
  {
    chipText: '💡 PJU Padam',
    category: 'Infrastruktur Jalan',
    severity: 'Rendah',
    titleSuggestion: 'Lampu penerangan jalan umum padam total di malam hari',
  },
];

// Severity Cards Configuration
const SEVERITY_CONFIG: Array<{
  level: 'Rendah' | 'Sedang' | 'Kritis';
  label: string;
  badge: string;
  detail: string;
  borderColor: string;
  activeBg: string;
  textColor: string;
}> = [
  {
    level: 'Rendah',
    label: 'Rendah',
    badge: 'Gangguan Ringan',
    detail: 'Kerusakan minor, akses warga tetap normal',
    borderColor: 'border-[#0D9488]',
    activeBg: 'bg-[#0D9488] text-white shadow-xs',
    textColor: 'text-[#0D9488]',
  },
  {
    level: 'Sedang',
    label: 'Sedang',
    badge: 'Aktivitas Terhambat',
    detail: 'Menghambat lalu lintas atau aktivitas publik harian',
    borderColor: 'border-[#D97706]',
    activeBg: 'bg-[#D97706] text-white shadow-xs',
    textColor: 'text-[#D97706]',
  },
  {
    level: 'Kritis',
    label: 'Kritis',
    badge: 'Bahaya Jiwa / Akut',
    detail: 'Risiko keselamatan mendesak atau banjir meluas',
    borderColor: 'border-[#DC2626]',
    activeBg: 'bg-[#DC2626] text-white shadow-xs',
    textColor: 'text-[#DC2626]',
  },
];

interface Props {
  initialFacilityId?: string;
  onSuccess?: (result: SubmissionResult) => void;
  onCancel?: () => void;
  compactMode?: boolean;
}

export const ReportWorkflowForm: React.FC<Props> = ({
  initialFacilityId,
  onSuccess,
  onCancel,
  compactMode = false,
}) => {
  const { facilities, budgetProjects, reports } = useTitik();

  // Current workflow step: 1 = Issue & Photos, 2 = Location, 3 = Review & Submit
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SectorType>('Lingkungan & Drainase');
  const [severity, setSeverity] = useState<'Rendah' | 'Sedang' | 'Kritis'>('Sedang');
  const [subdistrict, setSubdistrict] = useState<SubdistrictType>('Bogor Tengah');
  const [facilityId, setFacilityId] = useState<string>(initialFacilityId || '');
  const [observedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Real Photo Uploads
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Location Fields
  const [coordinates, setCoordinates] = useState<[number, number]>([-6.5971, 106.8060]);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isApproximate, setIsApproximate] = useState(false);
  const [addressText, setAddressText] = useState('');
  const [acquisitionMethod, setAcquisitionMethod] = useState<'gps' | 'map_pin' | 'address_search' | 'approximate'>('map_pin');

  // Privacy Fields
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [reporterHandle, setReporterHandle] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState<{ text: string; percent: number }>({
    text: '',
    percent: 0,
  });
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  // Restore draft from sessionStorage if available
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.title) setTitle(d.title);
        if (d.description) setDescription(d.description);
        if (d.category) setCategory(d.category);
        if (d.subdistrict) setSubdistrict(d.subdistrict);
        if (d.facilityId) setFacilityId(d.facilityId);
        if (d.coordinates) setCoordinates(d.coordinates);
        if (d.addressText) setAddressText(d.addressText);
      }
    } catch (e) {
      console.warn('Draft restoration ignored:', e);
    }
  }, []);

  // Save draft whenever critical text changes
  useEffect(() => {
    if (submissionResult) return;
    const draftPayload = {
      title,
      description,
      category,
      subdistrict,
      facilityId,
      coordinates,
      addressText,
    };
    try {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
    } catch {
      // Ignore quota error
    }
  }, [title, description, category, subdistrict, facilityId, coordinates, addressText, submissionResult]);

  // Sync initialFacilityId
  useEffect(() => {
    if (initialFacilityId) {
      setFacilityId(initialFacilityId);
      const fac = facilities.find((f) => f.id === initialFacilityId);
      if (fac) {
        setSubdistrict(fac.subdistrict as SubdistrictType);
        setCategory(fac.sector as SectorType);
        setCoordinates([fac.coordinates[0], fac.coordinates[1]]);
      }
    }
  }, [initialFacilityId, facilities]);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      filePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [filePreviews]);

  // Handle Photo Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    if (selectedFiles.length + files.length > 5) {
      setUploadError('Maksimum 5 foto bukti per laporan.');
      return;
    }

    for (const file of files) {
      const v = validateImageFile(file);
      if (!v.valid) {
        setUploadError(v.error || 'File tidak valid.');
        return;
      }
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // User-Initiated GPS Action
  const handleRequestGps = async () => {
    setIsGpsLoading(true);
    setGpsError(null);
    try {
      const pos = await requestCurrentPosition();
      setCoordinates([pos.latitude, pos.longitude]);
      setGpsAccuracy(pos.accuracyMeters);
      setAcquisitionMethod('gps');
    } catch (err: any) {
      setGpsError(err.message || 'Gagal membaca sensor lokasi.');
    } finally {
      setIsGpsLoading(false);
    }
  };

  // Selected Facility & Linked Project
  const selectedFacility = facilities.find((f) => f.id === facilityId);
  const linkedProject = selectedFacility && selectedFacility.linkedProjectIds.length > 0
    ? budgetProjects.find((p) => p.id === selectedFacility.linkedProjectIds[0])
    : null;

  // Handle Final Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);
    setIsSubmitting(true);

    try {
      const result = await submitCitizenReport(
        {
          title,
          description,
          category,
          severity,
          subdistrict,
          facilityId: facilityId || undefined,
          facilityName: selectedFacility?.name,
          preciseCoordinates: coordinates,
          accuracyMeters: gpsAccuracy || undefined,
          acquisitionMethod,
          isApproximate,
          addressText: addressText || undefined,
          evidenceFiles: selectedFiles,
          isAnonymous,
          reporterHandle: isAnonymous ? undefined : reporterHandle.replace('@', '').trim() || undefined,
          observedAt: observedDate,
        },
        (text, percent) => {
          setSubmissionProgress({ text, percent });
        }
      );

      // Clear draft on successful submission
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      setSubmissionResult(result);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      setSubmissionError(err.message || 'Terjadi kesalahan saat memproses laporan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // UNCONFIGURED SUPABASE BLOCKING STATE
  // Per architectural protocol: Never pretend a demo submission is saved remotely without Supabase
  if (!isSupabaseConfigured) {
    return (
      <div className="bg-white dark:bg-[#151D2A] rounded-2xl border border-[#E5E7EB] dark:border-[#243042] p-6 sm:p-8 space-y-5 text-center max-w-xl mx-auto my-4 transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-[#FEF3C7] dark:bg-[#D97706]/15 text-[#D97706] flex items-center justify-center mx-auto border border-[#FDE68A] dark:border-[#D97706]/30 shadow-xs">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D97706] font-mono-data">
            Koneksi Supabase Belum Terkonfigurasi
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] dark:text-[#F9FAFB] tracking-tight">
            Pelaporan Publik Memerlukan Backend Aktif
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] leading-relaxed max-w-md mx-auto">
            Untuk memastikan integritas bukti foto lapangan, koordinat geospasial presisi, dan jejak audit yang tidak dapat dimanipulasi, formulir pelaporan warga memerlukan koneksi Supabase PostgreSQL aktif.
          </p>
        </div>

        <div className="p-4 bg-[#F8F9FA] dark:bg-[#101622] rounded-xl border border-[#E5E7EB] dark:border-[#243042] text-left text-xs space-y-2 font-mono-data">
          <div className="text-[11px] font-bold text-[#111827] dark:text-[#F9FAFB] font-sans">
            Variabel Lingkungan yang Dibutuhkan (.env):
          </div>
          <div className="text-[#0D9488] break-all">VITE_SUPABASE_URL=https://[project-id].supabase.co</div>
          <div className="text-[#0D9488] break-all">VITE_SUPABASE_ANON_KEY=eyJhbGciOi...</div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] dark:bg-[#1C2638] dark:hover:bg-[#243042] text-[#111827] dark:text-[#F9FAFB] text-xs font-bold rounded-xl transition-all"
            >
              Kembali
            </button>
          )}
          <a
            href="https://github.com/AchiraStudio/kata-natan-apa-aja_wip/blob/main/docs/SUPABASE_SETUP.md"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm"
          >
            <span>Panduan Setup Supabase</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // SUCCESS CONFIRMATION STATE
  if (submissionResult) {
    return (
      <div className="bg-white dark:bg-[#151D2A] rounded-2xl border border-[#0D9488]/40 p-6 sm:p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-[#ECFDF5] dark:bg-[#0D9488]/20 text-[#0D9488] flex items-center justify-center mx-auto border-2 border-[#A7F3D0] dark:border-[#0D9488]/40">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488] font-mono-data">
            Laporan Berhasil Dicatat & Masuk Antrean Kurasi
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] dark:text-[#F9FAFB] tracking-tight">
            Nomor Referensi Kasus Publik
          </h2>
          <div className="inline-block px-4 py-2 bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-xl text-base font-mono-data font-extrabold text-[#111827] dark:text-[#F9FAFB]">
            {submissionResult.publicReference}
          </div>
        </div>

        <div className="p-3.5 bg-[#F8F9FA] dark:bg-[#101622] rounded-xl border border-[#E5E7EB] dark:border-[#243042] text-xs text-[#4B5563] dark:text-[#94A3B8] max-w-lg mx-auto space-y-2 text-left">
          <div className="flex items-center gap-1.5 font-bold text-[#111827] dark:text-[#F9FAFB]">
            <Lock className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Kunci Akses Pemantauan Mandiri (Follow-Up Token)</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Token rahasia telah disimpan pada peramban Anda untuk memantau status kurasi. Laporan akan tampil di publik dan peta setelah diverifikasi tim moderator independen.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-5 py-2.5 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white text-xs font-bold rounded-xl transition-all"
            >
              Selesai & Tutup
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sleek Top Header & Simulation Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#243042] pb-4">
        {/* Stepper Steps */}
        <div className="flex items-center gap-2 sm:gap-3">
          {[
            { num: 1, label: 'Masalah & Bukti' },
            { num: 2, label: 'Lokasi Geospasial' },
            { num: 3, label: 'Tinjau & Publikasi' },
          ].map((s) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num === 1) setStep(1);
                  if (s.num === 2 && title.trim().length >= 5 && description.trim().length >= 10) setStep(2);
                  if (s.num === 3 && title.trim().length >= 5 && description.trim().length >= 10) setStep(3);
                }}
                className={`flex items-center gap-2 text-xs font-bold transition-all py-1 px-2.5 rounded-lg ${
                  isActive
                    ? 'bg-[#111827] text-white dark:bg-[#0D9488] shadow-xs'
                    : isCompleted
                    ? 'text-[#0D9488] hover:bg-[#0D9488]/10'
                    : 'text-[#9CA3AF] dark:text-[#64748B] hover:text-[#111827] dark:hover:text-[#F9FAFB]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono-data font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isCompleted
                      ? 'bg-[#0D9488] text-white'
                      : 'bg-[#E5E7EB] dark:bg-[#243042] text-[#4B5563] dark:text-[#94A3B8]'
                  }`}
                >
                  {isCompleted ? '✓' : s.num}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Micro-Badge (Sleek, Non-Intrusive) */}
        {!isSupabaseConfigured && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFFBEB] dark:bg-[#78350F]/30 border border-[#FDE68A] dark:border-[#B45309] text-[10px] font-mono-data font-bold text-[#B45309] dark:text-[#FDE68A] self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse"></span>
            <span>Simulasi Lokal (Demo)</span>
          </div>
        )}
      </div>

      {/* STEP 1: ISSUE & REAL PHOTOS */}
      {step === 1 && (
        <div className="space-y-6">
          
          {/* Quick Presets / 1-Tap Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#111827] dark:text-[#F9FAFB] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Pilih Cepat Masalah Umum:</span>
              </span>
              <span className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">1-Tap Isi Otomatis</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_ISSUE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTitle(preset.titleSuggestion);
                    setCategory(preset.category);
                    setSeverity(preset.severity);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#243042] bg-[#F8F9FA] dark:bg-[#101622] hover:border-[#111827] dark:hover:border-[#0D9488] text-xs font-semibold text-[#111827] dark:text-[#F9FAFB] transition-all hover:scale-[1.02] active:scale-95"
                >
                  {preset.chipText}
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB]">
                Judul Laporan Singkat & Jelas *
              </label>
              <span className={`font-mono-data text-[10px] ${title.length >= 5 ? 'text-[#0D9488] font-bold' : 'text-[#6B7280] dark:text-[#94A3B8]'}`}>
                {title.length}/200 {title.length < 5 && '(Min. 5 karakter)'}
              </span>
            </div>
            <input
              type="text"
              maxLength={200}
              placeholder="Contoh: Tanggul Drainase Jebol 4 Meter dekat SDN Menteng"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs sm:text-sm font-medium bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-xl p-3.5 text-[#111827] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#111827] dark:focus:border-[#0D9488] transition-colors"
            />
          </div>

          {/* VISUAL CATEGORY CARDS (Option A1) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB]">
                Kategori Sektor Layanan *
              </label>
              <span className="text-[11px] font-mono-data font-bold text-[#0D9488]">
                {category}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SECTOR_VISUAL_CARDS.map((card) => {
                const IconComponent = card.icon;
                const isSelected = category === card.sector;

                return (
                  <button
                    key={card.sector}
                    type="button"
                    onClick={() => setCategory(card.sector)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2.5 relative group ${
                      isSelected
                        ? 'border-[#111827] dark:border-[#0D9488] bg-white dark:bg-[#1C2638] shadow-md ring-2 ring-[#111827]/10 dark:ring-[#0D9488]/30 scale-[1.02]'
                        : 'border-[#E5E7EB] dark:border-[#243042] bg-[#F8F9FA]/70 dark:bg-[#101622]/60 hover:bg-white dark:hover:bg-[#151D2A] hover:border-[#CBD5E1] dark:hover:border-[#334155]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.iconBg} transition-transform group-hover:scale-110`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-[#111827] dark:bg-[#0D9488] text-white flex items-center justify-center text-[10px]">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="font-extrabold text-xs text-[#111827] dark:text-[#F9FAFB] leading-snug">
                        {card.label}
                      </div>
                      <div className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] font-mono-data mt-0.5">
                        {card.badge}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TACTILE SEVERITY CARDS */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB]">
              Tingkat Dampak Lapangan *
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SEVERITY_CONFIG.map((lvl) => {
                const isSelected = severity === lvl.level;

                return (
                  <button
                    key={lvl.level}
                    type="button"
                    onClick={() => setSeverity(lvl.level)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? `${lvl.borderColor} bg-white dark:bg-[#1C2638] ring-2 ring-current/20 shadow-xs scale-[1.01]`
                        : 'border-[#E5E7EB] dark:border-[#243042] bg-[#F8F9FA]/70 dark:bg-[#101622]/60 hover:bg-white dark:hover:bg-[#151D2A]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-mono-data font-extrabold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? lvl.activeBg
                          : 'bg-[#E5E7EB]/70 dark:bg-[#243042] text-[#4B5563] dark:text-[#94A3B8]'
                      }`}>
                        {lvl.level}
                      </span>
                      <span className="text-[11px] font-bold text-[#6B7280] dark:text-[#94A3B8]">
                        {lvl.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#4B5563] dark:text-[#94A3B8] leading-tight mt-1">
                      {lvl.detail}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB]">
                Deskripsi Kerusakan Fisik *
              </label>
              <span className={`font-mono-data text-[10px] ${description.length >= 10 ? 'text-[#0D9488] font-bold' : 'text-[#6B7280] dark:text-[#94A3B8]'}`}>
                {description.length} karakter {description.length < 10 && '(Min. 10)'}
              </span>
            </div>
            <textarea
              rows={compactMode ? 3 : 3}
              placeholder="Jelaskan kondisi fisik yang terlihat, sejak kapan terjadi, dan bagaimana menghambat akses warga..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs sm:text-sm font-medium bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-xl p-3.5 text-[#111827] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#111827] dark:focus:border-[#0D9488] transition-colors leading-relaxed"
            />
          </div>

          {/* 5-SLOT VISUAL PHOTO GRID (Option A2) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#0D9488]" />
                <span className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB]">
                  Foto Bukti Fisik Lapangan
                </span>
                <span className="text-[10px] font-mono-data font-bold bg-[#F3F4F6] dark:bg-[#1E293B] text-[#4B5563] dark:text-[#94A3B8] px-2 py-0.5 rounded-full">
                  {selectedFiles.length} / 5 Terisi
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-[#0D9488] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>EXIF Auto-Cleaned</span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* 5-Slot Grid Container */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {[0, 1, 2, 3, 4].map((slotIdx) => {
                const preview = filePreviews[slotIdx];
                const isPrimary = slotIdx === 0;

                if (preview) {
                  return (
                    <div
                      key={slotIdx}
                      className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-[#111827] dark:border-[#0D9488] bg-[#111827]/5 dark:bg-[#0B0F17] shadow-sm transition-all hover:scale-[1.02]"
                    >
                      <img
                        src={preview}
                        alt={`Bukti ${slotIdx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {isPrimary && (
                        <span className="absolute top-1.5 left-1.5 bg-[#0D9488] text-white text-[8px] font-mono-data font-extrabold px-1.5 py-0.5 rounded shadow-sm">
                          UTAMA
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(slotIdx)}
                          className="p-1.5 bg-[#DC2626] text-white rounded-lg hover:scale-110 transition-transform shadow-md"
                          title="Hapus foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="absolute bottom-1 right-1 text-[9px] font-mono-data bg-black/70 backdrop-blur-xs text-white px-1.5 py-0.2 rounded">
                        #{slotIdx + 1}
                      </span>
                    </div>
                  );
                }

                const isNextSlot = slotIdx === filePreviews.length;

                return (
                  <button
                    key={slotIdx}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 p-2 text-center transition-all ${
                      isNextSlot
                        ? 'border-[#0D9488] bg-[#0D9488]/5 dark:bg-[#0D9488]/10 hover:bg-[#0D9488]/15 cursor-pointer text-[#0D9488] hover:scale-[1.02]'
                        : 'border-[#E5E7EB] dark:border-[#243042] bg-[#F8F9FA]/40 dark:bg-[#101622]/40 text-[#9CA3AF] dark:text-[#64748B] cursor-pointer hover:border-[#9CA3AF]'
                    }`}
                  >
                    {isNextSlot ? (
                      <>
                        <div className="w-7 h-7 rounded-full bg-[#0D9488]/15 flex items-center justify-center text-[#0D9488]">
                          <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold">
                          {isPrimary ? '+ Foto Utama' : '+ Tambah'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 opacity-40" />
                        <span className="text-[9px] font-mono-data opacity-50">
                          Slot #{slotIdx + 1}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {uploadError && (
              <div className="p-2.5 bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#FCA5A5] text-[#DC2626] dark:text-[#F87171] rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#94A3B8] pt-0.5">
              <span>Format: JPG, PNG, WebP • Maks. 10 MB per foto</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[#0D9488] font-bold hover:underline"
              >
                + Buka Kamera / File
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#243042] flex justify-end">
            <button
              type="button"
              disabled={title.trim().length < 5 || description.trim().length < 10}
              onClick={() => setStep(2)}
              className="px-6 py-3 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] disabled:bg-[#E5E7EB] dark:disabled:bg-[#243042] disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-tactile active:scale-95"
            >
              <span>Lanjutkan ke Penentuan Lokasi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: LOCATION ACQUISITION */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB]">Wilayah Kecamatan *</label>
              <select
                value={subdistrict}
                onChange={(e) => {
                  setSubdistrict(e.target.value as SubdistrictType);
                  setFacilityId('');
                }}
                className="w-full text-xs bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-xl p-2.5 text-[#111827] dark:text-[#F9FAFB] focus:outline-none"
              >
                {SUBDISTRICTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB]">Kaitkan Fasilitas Terdata (Opsional)</label>
              <select
                value={facilityId}
                onChange={(e) => {
                  setFacilityId(e.target.value);
                  const fac = facilities.find((f) => f.id === e.target.value);
                  if (fac) {
                    setCoordinates([fac.coordinates[0], fac.coordinates[1]]);
                  }
                }}
                className="w-full text-xs bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-xl p-2.5 text-[#111827] dark:text-[#F9FAFB] focus:outline-none"
              >
                <option value="">-- Bukan di Gedung Fasilitas Terdaftar --</option>
                {facilities
                  .filter((f) => f.subdistrict === subdistrict)
                  .map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.sector})</option>
                  ))}
              </select>
            </div>
          </div>

          {/* GPS Positioning Action Card */}
          <div className="p-4 bg-[#F8F9FA] dark:bg-[#101622] rounded-2xl border border-[#E5E7EB] dark:border-[#243042] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#DC2626]" />
                  <span>Koordinat Geospasial Observasi</span>
                </div>
                <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                  Ambil titik GPS langsung dari perangkat atau masukkan patokan alamat.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRequestGps}
                disabled={isGpsLoading}
                className="px-3.5 py-2 bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] hover:border-[#111827] dark:hover:border-[#0D9488] rounded-xl text-xs font-bold text-[#111827] dark:text-[#F9FAFB] flex items-center gap-1.5 transition-all shadow-2xs self-start sm:self-auto shrink-0"
              >
                {isGpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0D9488]" /> : <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />}
                <span>{isGpsLoading ? 'Membaca GPS...' : 'Gunakan Lokasi GPS Saya'}</span>
              </button>
            </div>

            {gpsError && (
              <div className="p-2.5 bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#FCA5A5] text-[#DC2626] dark:text-[#F87171] rounded-xl text-xs font-medium">
                {gpsError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] text-xs font-mono-data">
                <span className="text-[#6B7280] dark:text-[#94A3B8] block text-[10px]">Koordinat Terpilih:</span>
                <span className="font-bold text-[#111827] dark:text-[#F9FAFB]">
                  {coordinates[0].toFixed(5)}, {coordinates[1].toFixed(5)}
                </span>
                {gpsAccuracy && (
                  <span className="text-[10px] text-[#0D9488] block mt-0.5 font-sans font-semibold">
                    Akurasi GPS: ±{gpsAccuracy}m
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Patokan alamat / RT / RW (opsional)..."
                  value={addressText}
                  onChange={(e) => setAddressText(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-[#151D2A] border border-[#E5E7EB] dark:border-[#243042] rounded-xl p-2.5 text-[#111827] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none"
                />
              </div>
            </div>

            {/* Approximate Coordinate Privacy Toggle */}
            <div className="flex items-center gap-2 pt-1 border-t border-[#E5E7EB] dark:border-[#243042]">
              <input
                type="checkbox"
                id="approxCheck"
                checked={isApproximate}
                onChange={(e) => setIsApproximate(e.target.checked)}
                className="w-4 h-4 rounded text-[#0D9488] focus:ring-0"
              />
              <label htmlFor="approxCheck" className="text-xs text-[#4B5563] dark:text-[#94A3B8] cursor-pointer">
                Lokasi Perkiraan (Samarkan koordinat publik hingga radius ~100m untuk perlindungan privasi).
              </label>
            </div>
          </div>

          {/* DUPLICATE SUGGESTION MODEL (Section 10 of Civic Spec) */}
          {(() => {
            const nearby = reports
              .filter((r) => r.sector === category)
              .filter((r) => {
                const dLat = (r.coordinates[0] - coordinates[0]) * 111000;
                const dLng = (r.coordinates[1] - coordinates[1]) * 111000 * Math.cos(coordinates[0] * (Math.PI / 180));
                return Math.sqrt(dLat * dLat + dLng * dLng) <= 600;
              });

            if (nearby.length === 0) return null;

            return (
              <div className="p-4 bg-[#EFF6FF] dark:bg-[#1E293B] border border-[#BFDBFE] dark:border-[#3B82F6]/30 rounded-2xl space-y-2.5 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#1E40AF] dark:text-[#60A5FA]">
                    <Info className="w-4 h-4 text-[#2563EB]" />
                    <span>{nearby.length} Laporan Serupa Terdeteksi di Sekitar Titik Ini (&lt; 600m)</span>
                  </div>
                  <span className="text-[10px] font-mono-data font-bold text-[#2563EB] dark:text-[#93C5FD] bg-white dark:bg-[#151D2A] px-2 py-0.5 rounded-full border border-[#BFDBFE] dark:border-[#3B82F6]/30">
                    Saran Duplikasi
                  </span>
                </div>

                <p className="text-[11px] text-[#1E3A8A] dark:text-[#94A3B8] leading-relaxed">
                  Masalah serupa dalam kategori <strong>{category}</strong> telah dilaporkan di area ini. Anda dapat tetap melanjutkan jika ini merupakan titik atau kasus yang berbeda, atau beri dukungan suara pada laporan warga yang sudah tercatat:
                </p>

                <div className="space-y-1.5 pt-1">
                  {nearby.slice(0, 2).map((nr) => (
                    <div 
                      key={nr.id} 
                      className="p-3 bg-white dark:bg-[#151D2A] rounded-xl border border-[#DBEAFE] dark:border-[#243042] flex items-center justify-between text-xs hover:border-[#2563EB] transition-colors"
                    >
                      <div className="truncate mr-3 space-y-0.5">
                        <span className="font-mono-data text-[10px] text-[#6B7280] dark:text-[#94A3B8] block">
                          {nr.id} • {nr.priorityVotes} Dukungan Warga
                        </span>
                        <span className="font-bold text-[#111827] dark:text-[#F9FAFB] truncate block">
                          {nr.title}
                        </span>
                      </div>
                      <a
                        href={`/lapor/${nr.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline shrink-0 flex items-center gap-1"
                      >
                        <span>Lihat Kasus</span>
                        <span>&rarr;</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#243042] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-bold text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-5 py-2.5 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all"
            >
              <span>Tinjau Laporan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & DURABLE SUBMISSION */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[#F8F9FA] dark:bg-[#101622] rounded-2xl border border-[#E5E7EB] dark:border-[#243042] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#243042] pb-2 text-xs">
              <span className="font-bold text-[#111827] dark:text-[#F9FAFB] uppercase tracking-wider font-mono-data text-[10px]">
                Ringkasan Pengaduan
              </span>
              <span className="text-[10px] font-mono-data font-bold bg-[#DC2626]/10 text-[#DC2626] px-2 py-0.5 rounded">
                Dampak {severity}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-[#111827] dark:text-[#F9FAFB] leading-snug">
                {title}
              </h3>
              <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] leading-relaxed">
                {description}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
              <div className="p-2 bg-white dark:bg-[#151D2A] rounded-lg border border-[#E5E7EB] dark:border-[#243042]">
                <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] block">Sektor:</span>
                <span className="font-bold text-[#111827] dark:text-[#F9FAFB]">{category}</span>
              </div>
              <div className="p-2 bg-white dark:bg-[#151D2A] rounded-lg border border-[#E5E7EB] dark:border-[#243042]">
                <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] block">Wilayah:</span>
                <span className="font-bold text-[#111827] dark:text-[#F9FAFB]">{subdistrict}</span>
              </div>
              <div className="p-2 bg-white dark:bg-[#151D2A] rounded-lg border border-[#E5E7EB] dark:border-[#243042]">
                <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] block">Bukti Foto:</span>
                <span className="font-bold text-[#0D9488] font-mono-data">{selectedFiles.length} File Terlampir</span>
              </div>
            </div>

            {/* Inferred vs Confirmed Linkage Indicator */}
            <div className="p-3 bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#111827] dark:text-[#F9FAFB] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Korelasi Sarana / Pos APBD</span>
                </span>
                <span className="text-[10px] font-mono-data bg-[#D97706]/10 text-[#D97706] px-1.5 py-0.2 rounded font-semibold">
                  Saran Otomatis (Perlu Kurasi)
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                {selectedFacility 
                  ? `Fasilitas: ${selectedFacility.name} • Pengelola: ${selectedFacility.responsibleAgency}${linkedProject ? ` • Usulan Paket APBD: ${linkedProject.title}` : ''}`
                  : 'Lokasi lingkungan umum, belum tertaut ke gedung fasilitas terdata.'}
              </p>
            </div>

            {/* Privacy Selection */}
            <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#243042] space-y-2">
              <label className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB] block">
                Pilihan Identitas Pelapor
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsAnonymous(true)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isAnonymous
                      ? 'border-[#111827] dark:border-[#0D9488] bg-white dark:bg-[#151D2A] ring-1 ring-[#111827] dark:ring-[#0D9488]'
                      : 'border-[#E5E7EB] dark:border-[#243042] bg-[#F8F9FA] dark:bg-[#101622]'
                  }`}
                >
                  <div className="font-bold text-[#111827] dark:text-[#F9FAFB]">Pelapor Anonim (Disarankan)</div>
                  <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                    Nama akun disamarkan dari publik. Akses pemantauan menggunakan token rahasia peramban.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAnonymous(false)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    !isAnonymous
                      ? 'border-[#111827] dark:border-[#0D9488] bg-white dark:bg-[#151D2A] ring-1 ring-[#111827] dark:ring-[#0D9488]'
                      : 'border-[#E5E7EB] dark:border-[#243042] bg-[#F8F9FA] dark:bg-[#101622]'
                  }`}
                >
                  <div className="font-bold text-[#111827] dark:text-[#F9FAFB]">Tampilkan Nama Akun</div>
                  <input
                    type="text"
                    disabled={isAnonymous}
                    placeholder="@nama_warga"
                    value={reporterHandle}
                    onChange={(e) => setReporterHandle(e.target.value)}
                    className="w-full text-xs mt-1 bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg p-1.5 text-[#111827] dark:text-[#F9FAFB]"
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Submission Progress & Error Feedback */}
          {isSubmitting && (
            <div className="p-3.5 bg-[#F0FDFA] dark:bg-[#134E4A]/20 border border-[#99F6E4] dark:border-[#115E59] rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-data text-[#0D9488] font-bold">
                <span>{submissionProgress.text}</span>
                <span>{submissionProgress.percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#CCFBF1] dark:bg-[#115E59]/40 rounded-full overflow-hidden">
                <div
                  style={{ width: `${submissionProgress.percent}%` }}
                  className="bg-[#0D9488] h-full transition-all duration-300"
                />
              </div>
            </div>
          )}

          {submissionError && (
            <div className="p-3 bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#FCA5A5] text-[#DC2626] dark:text-[#F87171] rounded-xl text-xs font-medium">
              {submissionError}
            </div>
          )}

          <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#243042] flex items-center justify-between">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setStep(2)}
              className="px-4 py-2 text-xs font-bold text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] disabled:bg-[#E5E7EB] dark:disabled:bg-[#243042] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-tactile"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim ke Supabase...</span>
                </>
              ) : (
                <>
                  <span>Kirim Laporan Resmi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

