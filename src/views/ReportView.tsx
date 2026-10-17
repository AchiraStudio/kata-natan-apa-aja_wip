import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTitik } from '../context/TitikContext';
import { SectorType, SubdistrictType } from '../types';
import { 
  SECTORS, 
  SUBDISTRICTS, 
  SECTOR_DEFINITIONS,
  formatRupiahShort 
} from '../data/titikRegionalData';
import confetti from 'canvas-confetti';
import { 
  MapPin, 
  Building2, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  ThumbsUp, 
  Camera, 
  FileCheck, 
  Share2, 
  Layers, 
  Info,
  Clock
} from 'lucide-react';

const SAMPLE_PHOTO_PRESETS = [
  {
    label: 'Drainase Tersumbat / Banjir',
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    sector: 'Lingkungan & Drainase' as SectorType
  },
  {
    label: 'Jalan Rusak / Amblas',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    sector: 'Infrastruktur Jalan' as SectorType
  },
  {
    label: 'Atap / Sarana Sekolah Rusak',
    url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    sector: 'Pendidikan' as SectorType
  },
  {
    label: 'PJU Padam / Kabel Bahaya',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    sector: 'Infrastruktur Jalan' as SectorType
  },
  {
    label: 'Penumpukan Sampah Liar',
    url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    sector: 'Pengelolaan Persampahan' as SectorType
  }
];

export const ReportView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledFacilityId = searchParams.get('facilityId');

  const { 
    facilities, 
    budgetProjects, 
    reports, 
    addCitizenReport, 
    votePriority,
    preselectedFacilityForReport,
    setPreselectedFacilityForReport 
  } = useTitik();

  // Active view tab: 'NEW_REPORT' | 'ALL_REPORTS'
  const [activeTab, setActiveTab] = useState<'NEW_REPORT' | 'ALL_REPORTS'>('NEW_REPORT');

  // Step state: 1 to 5
  const [step, setStep] = useState<number>(1);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [createdReportId, setCreatedReportId] = useState<string>('');

  // Form Fields
  const [subdistrict, setSubdistrict] = useState<SubdistrictType>('Bogor Tengah');
  const [sector, setSector] = useState<SectorType>('Lingkungan & Drainase');
  const [isFacilityLinked, setIsFacilityLinked] = useState<boolean>(true);
  const [facilityId, setFacilityId] = useState<string>('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'Rendah' | 'Sedang' | 'Kritis'>('Sedang');

  const [photoUrl, setPhotoUrl] = useState<string>(SAMPLE_PHOTO_PRESETS[0].url);
  const [reporterHandle, setReporterHandle] = useState('warga_peduli');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Initialize from query param or context
  useEffect(() => {
    const targetFacility = preselectedFacilityForReport || facilities.find(f => f.id === prefilledFacilityId);
    if (targetFacility) {
      setFacilityId(targetFacility.id);
      setSubdistrict(targetFacility.subdistrict);
      setSector(targetFacility.sector);
      setIsFacilityLinked(true);
    }
  }, [preselectedFacilityForReport, prefilledFacilityId, facilities]);

  // Available facilities in selected subdistrict & sector
  const availableFacilities = facilities.filter(f => {
    if (f.subdistrict !== subdistrict) return false;
    if (sector && f.sector !== sector) return false;
    return true;
  });

  const selectedFacilityObj = facilities.find(f => f.id === facilityId);

  // Auto-detected agency based on facility / sector
  const detectedAgency = selectedFacilityObj
    ? selectedFacilityObj.responsibleAgency
    : sector === 'Pendidikan'
      ? 'Dinas Pendidikan Pemda (Disdik)'
      : sector === 'Kesehatan'
        ? 'Dinas Kesehatan Pemda (Dinkes)'
        : sector === 'Lingkungan & Drainase'
          ? 'Dinas Sumber Daya Air / PUPR'
          : sector === 'Infrastruktur Jalan'
            ? 'Dinas Bina Marga / PUPR'
            : sector === 'Ruang Terbuka Hijau'
              ? 'Dinas Pertamanan & Hutan Kota / DLH'
              : sector === 'Pengelolaan Persampahan'
                ? 'Dinas Lingkungan Hidup (DLH)'
                : sector === 'Transportasi Publik'
                  ? 'Dinas Perhubungan (Dishub)'
                  : sector === 'Pasar Tradisional'
                    ? 'Perumda Pasar Daerah / Disperindag'
                    : 'DPMPTSP & Bagian Umum Pemda';

  // Auto-detected linked budget project
  const linkedProject = selectedFacilityObj && selectedFacilityObj.linkedProjectIds.length > 0
    ? budgetProjects.find(p => p.id === selectedFacilityObj.linkedProjectIds[0])
    : budgetProjects.find(p => p.sector === sector && p.subdistrict === subdistrict);

  // Potential duplicate detection
  const potentialDuplicates = reports.filter(r => {
    if (facilityId && r.facilityId === facilityId) return true;
    if (r.subdistrict === subdistrict && r.sector === sector) return true;
    return false;
  });

  // Coordinates
  const coordinates: [number, number] = selectedFacilityObj 
    ? [selectedFacilityObj.coordinates[0], selectedFacilityObj.coordinates[1]]
    : [-6.5971, 106.8060];

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!title.trim() || !description.trim()) return;
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    // Slight randomized jitter for standalone coordinates
    const finalCoords: [number, number] = selectedFacilityObj
      ? [selectedFacilityObj.coordinates[0] + (Math.random() - 0.5) * 0.0008, selectedFacilityObj.coordinates[1] + (Math.random() - 0.5) * 0.0008]
      : [-6.2500 + (Math.random() - 0.5) * 0.05, 106.8200 + (Math.random() - 0.5) * 0.05];

    const finalHandle = isAnonymous ? 'warga_anonim' : reporterHandle.replace('@', '').trim() || 'warga_peduli';

    const newReport = addCitizenReport({
      title: title.trim(),
      description: description.trim(),
      sector,
      subdistrict,
      facilityId: isFacilityLinked && selectedFacilityObj ? selectedFacilityObj.id : undefined,
      facilityName: isFacilityLinked && selectedFacilityObj ? selectedFacilityObj.name : undefined,
      coordinates: finalCoords,
      responsibleAgency: detectedAgency,
      linkedProjectId: linkedProject?.id,
      linkedProjectTitle: linkedProject?.title,
      isBudgetLinkConfirmed: Boolean(linkedProject),
      reporterHandle: finalHandle,
      photoUrl,
      severity
    });

    setCreatedReportId(newReport.id);
    setIsSubmitted(true);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Reset form to start a new submission
  const handleResetForm = () => {
    setStep(1);
    setIsSubmitted(false);
    setCreatedReportId('');
    setTitle('');
    setDescription('');
    setFacilityId('');
    setPreselectedFacilityForReport(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-[#151D2A] rounded-2xl border border-[#E5E7EB] dark:border-[#243042] p-6 sm:p-8 shadow-tactile space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#243042] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#DC2626] dark:text-[#F87171]">
              <span className="w-2 h-2 rounded-full bg-[#DC2626] dark:bg-[#F87171]"></span>
              <span>Partisipasi & Pengawasan Warga • Jabodetabek</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-[#F9FAFB] tracking-tight">
              Tandai Titik Masalah & Kawal Realisasi
            </h1>
          </div>

          {/* Toggle Tab */}
          <div className="inline-flex rounded-xl bg-[#F8F9FA] dark:bg-[#101622] p-1 border border-[#E5E7EB] dark:border-[#243042] self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('NEW_REPORT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'NEW_REPORT'
                  ? 'bg-white dark:bg-[#1C2638] text-[#111827] dark:text-[#F9FAFB] shadow-xs'
                  : 'text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB]'
              }`}
            >
              + Buat Laporan Baru
            </button>
            <button
              onClick={() => setActiveTab('ALL_REPORTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'ALL_REPORTS'
                  ? 'bg-white dark:bg-[#1C2638] text-[#111827] dark:text-[#F9FAFB] shadow-xs'
                  : 'text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB]'
              }`}
            >
              <span>Daftar Kasus Warga</span>
              <span className="px-1.5 py-0.2 bg-[#F3F4F6] dark:bg-[#243042] text-[#4B5563] dark:text-[#94A3B8] rounded text-[10px] font-mono-data">
                {reports.length}
              </span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] leading-relaxed max-w-3xl">
          Setiap masalah infrastruktur di lingkungan Anda dapat ditautkan langsung dengan pos anggaran APBD yang bertanggung jawab. Laporkan dengan bukti geotag presisi agar dapat dikawal bersama komunitas hingga tuntas.
        </p>
      </div>

      {/* ============================================================== */}
      {/* MODE 1: ALL REPORTS LISTING VIEW */}
      {/* ============================================================== */}
      {activeTab === 'ALL_REPORTS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-[#151D2A] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#243042] shadow-tactile transition-colors">
            <div className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
              Menampilkan <strong className="text-[#111827] dark:text-[#F9FAFB]">{reports.length}</strong> kasus warga Jabodetabek yang terdaftar dalam observatorium.
            </div>
            <button
              onClick={() => setActiveTab('NEW_REPORT')}
              className="px-4 py-2 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white text-xs font-bold rounded-lg transition-all"
            >
              + Lapor Titik Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reports.map(report => (
              <div
                key={report.id}
                className="bg-white dark:bg-[#151D2A] rounded-2xl border border-[#E5E7EB] dark:border-[#243042] hover:border-[#111827] dark:hover:border-[#0D9488] p-5 shadow-tactile transition-all flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-3">
                  <div 
                    onClick={() => navigate(`/lapor/${report.id}`)}
                    className="relative h-44 rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-[#243042] bg-[#F3F4F6] dark:bg-[#101622] cursor-pointer"
                  >
                    <img 
                      src={report.photoUrl} 
                      alt={report.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-mono-data font-bold bg-[#111827]/80 dark:bg-[#0B0F17]/90 backdrop-blur-xs text-white px-2 py-0.5 rounded">
                        {report.id}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold bg-white/90 dark:bg-[#151D2A]/90 backdrop-blur-xs text-[#111827] dark:text-[#F9FAFB] px-2 py-0.5 rounded border border-[#E5E7EB] dark:border-[#243042]">
                        {report.sector}
                      </span>
                      <span className="text-[10px] font-bold bg-[#111827] dark:bg-[#0D9488] text-white px-2 py-0.5 rounded font-mono-data">
                        Langkah {report.currentStep}/6
                      </span>
                    </div>
                  </div>

                  <div 
                    onClick={() => navigate(`/lapor/${report.id}`)}
                    className="cursor-pointer space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                      <MapPin className="w-3 h-3 text-[#9CA3AF] dark:text-[#64748B]" />
                      <span>{report.subdistrict}</span>
                      <span>•</span>
                      <span>@{report.reporterHandle}</span>
                    </div>

                    <h3 className="font-extrabold text-sm text-[#111827] dark:text-[#F9FAFB] group-hover:text-[#2563EB] dark:group-hover:text-[#38BDF8] transition-colors line-clamp-2 leading-snug">
                      {report.title}
                    </h3>

                    <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] line-clamp-2 leading-relaxed">
                      {report.description}
                    </p>
                  </div>

                  <div className="text-[11px] text-[#4B5563] dark:text-[#94A3B8] bg-[#F8F9FA] dark:bg-[#101622] p-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#243042] space-y-1">
                    <div className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] font-semibold">Tautan Pos APBD:</div>
                    <div className="font-medium truncate text-[#0D9488]">
                      {report.isBudgetLinkConfirmed ? report.linkedProjectTitle : 'Belum Ditautkan ke Proyek Aktif'}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F3F4F6] dark:border-[#243042] flex items-center justify-between">
                  <button
                    onClick={() => votePriority(report.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all transform active:scale-95 ${
                      report.userHasVoted
                        ? 'bg-[#0D9488] text-white shadow-xs'
                        : 'bg-[#F8F9FA] dark:bg-[#1C2638] text-[#111827] dark:text-[#F9FAFB] hover:bg-[#E5E7EB] dark:hover:bg-[#243042] border border-[#E5E7EB] dark:border-[#243042]'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{report.priorityVotes} Suara</span>
                  </button>

                  <button
                    onClick={() => navigate(`/lapor/${report.id}`)}
                    className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB] hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors flex items-center gap-1"
                  >
                    <span>Audit Trail</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 2: 5-STEP GUIDED REPORTING WORKFLOW */}
      {/* ============================================================== */}
      {activeTab === 'NEW_REPORT' && !isSubmitted && (
        <div className="bg-white dark:bg-[#151D2A] rounded-2xl border border-[#E5E7EB] dark:border-[#243042] shadow-tactile overflow-hidden transition-colors">
          
          {/* Stepper Progress Bar */}
          <div className="border-b border-[#E5E7EB] dark:border-[#243042] bg-[#F8F9FA] dark:bg-[#101622] px-4 sm:px-8 py-4">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {[
                { s: 1, label: 'Lokasi & Objek' },
                { s: 2, label: 'Masalah & Keparahan' },
                { s: 3, label: 'Bukti Geotag' },
                { s: 4, label: 'Konteks APBD & Duplikasi' },
                { s: 5, label: 'Tinjau & Publikasi' }
              ].map(st => {
                const isActive = step === st.s;
                const isPassed = step > st.s;

                return (
                  <div key={st.s} className="flex flex-col items-center text-center gap-1 flex-1">
                    <div 
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono-data transition-all ${
                        isPassed 
                          ? 'bg-[#0D9488] text-white' 
                          : isActive 
                            ? 'bg-[#111827] dark:bg-[#0D9488] text-white ring-4 ring-[#E5E7EB] dark:ring-[#243042]' 
                            : 'bg-white dark:bg-[#151D2A] border border-[#D1D5DB] dark:border-[#334155] text-[#9CA3AF] dark:text-[#64748B]'
                      }`}
                    >
                      {isPassed ? '✓' : st.s}
                    </div>
                    <span className={`text-[11px] font-semibold hidden md:inline ${
                      isActive ? 'text-[#111827] dark:text-[#F9FAFB]' : isPassed ? 'text-[#0D9488]' : 'text-[#9CA3AF] dark:text-[#64748B]'
                    }`}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
            
            {/* STEP 1: LOKASI & SEKTOR */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="border-b border-[#E5E7EB] dark:border-[#243042] pb-3">
                  <h3 className="font-extrabold text-lg text-[#111827] dark:text-[#F9FAFB]">
                    Langkah 1: Tentukan Wilayah & Objek Masalah
                  </h3>
                  <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                    Pilih wilayah kecamatan dan sektor pelayanan publik yang berkaitan dengan masalah ini.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kecamatan */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB]">Wilayah / Kota (Jabodetabek)</label>
                    <select
                      value={subdistrict}
                      onChange={e => {
                        setSubdistrict(e.target.value as SubdistrictType);
                        setFacilityId('');
                      }}
                      className="w-full text-xs bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg p-2.5 font-medium text-[#111827] dark:text-[#F9FAFB] focus:outline-none focus:border-[#111827] dark:focus:border-[#0D9488]"
                    >
                      {SUBDISTRICTS.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sektor */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB]">Sektor Pelayanan</label>
                    <select
                      value={sector}
                      onChange={e => {
                        setSector(e.target.value as SectorType);
                        setFacilityId('');
                      }}
                      className="w-full text-xs bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg p-2.5 font-medium text-[#111827] dark:text-[#F9FAFB] focus:outline-none focus:border-[#111827] dark:focus:border-[#0D9488]"
                    >
                      {SECTORS.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sektor Brief Info */}
                <div className="p-3 bg-[#F8F9FA] dark:bg-[#101622] rounded-xl border border-[#E5E7EB] dark:border-[#243042] text-xs space-y-1">
                  <div className="font-bold text-[#111827] dark:text-[#F9FAFB] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                    <span>Fokus Pengawasan Sektor: {sector}</span>
                  </div>
                  <p className="text-[#6B7280] dark:text-[#94A3B8]">
                    {SECTOR_DEFINITIONS.find(s => s.id === sector)?.description || 'Pelayanan publik standar daerah.'}
                  </p>
                </div>

                {/* Facility Choice */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB] block">
                    Jenis Objek Masalah
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsFacilityLinked(true)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isFacilityLinked
                          ? 'border-[#111827] dark:border-[#0D9488] bg-[#F8F9FA] dark:bg-[#1C2638] ring-2 ring-[#111827] dark:ring-[#0D9488]'
                          : 'border-[#E5E7EB] dark:border-[#243042] bg-white dark:bg-[#151D2A] hover:bg-[#F9FAFB] dark:hover:bg-[#1C2638]'
                      }`}
                    >
                      <div className="font-bold text-xs text-[#111827] dark:text-[#F9FAFB] flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
                        <span>Fasilitas Publik Terdaftar</span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] mt-1">
                        Gedung sekolah, puskesmas, taman publik, jembatan terdata SIKD.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsFacilityLinked(false);
                        setFacilityId('');
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        !isFacilityLinked
                          ? 'border-[#111827] dark:border-[#0D9488] bg-[#F8F9FA] dark:bg-[#1C2638] ring-2 ring-[#111827] dark:ring-[#0D9488]'
                          : 'border-[#E5E7EB] dark:border-[#243042] bg-white dark:bg-[#151D2A] hover:bg-[#F9FAFB] dark:hover:bg-[#1C2638]'
                      }`}
                    >
                      <div className="font-bold text-xs text-[#111827] dark:text-[#F9FAFB] flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#DC2626]" />
                        <span>Titik Jalan / Lingkungan Umum</span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] mt-1">
                        Saluran drainase perkampungan, jalan lingkungan, trotoar bebas.
                      </p>
                    </button>
                  </div>

                  {isFacilityLinked && (
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-semibold text-[#4B5563] dark:text-[#94A3B8]">
                        Pilih Fasilitas Terdaftar di {subdistrict}:
                      </label>
                      <select
                        value={facilityId}
                        onChange={e => setFacilityId(e.target.value)}
                        className="w-full text-xs bg-white dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg p-2.5 font-medium text-[#111827] dark:text-[#F9FAFB] focus:outline-none focus:border-[#111827] dark:focus:border-[#0D9488]"
                      >
                        <option value="">-- Pilih Fasilitas Terdata --</option>
                        {availableFacilities.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.address})
                          </option>
                        ))}
                      </select>
                      {availableFacilities.length === 0 && (
                        <p className="text-[11px] text-[#D97706]">
                          Belum ada fasilitas terdaftar pada sektor ini di {subdistrict}. Anda tetap dapat memilih opsi "Titik Jalan / Lingkungan Umum".
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#243042] flex justify-end">
                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all"
                  >
                    <span>Lanjutkan ke Deskripsi Masalah</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DESKRIPSI & TINGKAT KEPARAHAN */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="border-b border-[#E5E7EB] dark:border-[#243042] pb-3">
                  <h3 className="font-extrabold text-lg text-[#111827] dark:text-[#F9FAFB]">
                    Langkah 2: Rincian Masalah & Tingkat Keparahan
                  </h3>
                  <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                    Tuliskan judul spesifik dan deskripsi objektif mengenai kerusakan fisik yang terjadi.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB]">
                      Judul Laporan Singkat & Jelas *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Tanggul Drainase Jebol 4 Meter di Samping SDN Menteng"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full text-xs bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg p-2.5 text-[#111827] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] dark:placeholder:text-[#64748B] focus:outline-none focus:border-[#111827] dark:focus:border-[#0D9488]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB]">
                      Deskripsi Kronologis / Dampak Lapangan *
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Jelaskan sejak kapan kerusakan terjadi, apakah menghambat akses warga/pasien, dan apakah sudah pernah dilaporkan ke RT/RW setempat..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full text-xs bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg p-2.5 text-[#111827] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] dark:placeholder:text-[#64748B] focus:outline-none focus:border-[#111827] dark:focus:border-[#0D9488]"
                    />
                  </div>

                  {/* Tingkat Keparahan */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB]">
                      Tingkat Keparahan Dampak
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          lvl: 'Rendah' as const,
                          dot: 'bg-[#0D9488]',
                          desc: 'Kerusakan ringan, tidak memutus akses warga.'
                        },
                        {
                          lvl: 'Sedang' as const,
                          dot: 'bg-[#D97706]',
                          desc: 'Mengganggu fungsi layanan, perlu perbaikan terjadwal.'
                        },
                        {
                          lvl: 'Kritis' as const,
                          dot: 'bg-[#DC2626]',
                          desc: 'Membahayakan warga, banjir meluas, atau jalan putus.'
                        }
                      ].map(item => (
                        <button
                          key={item.lvl}
                          type="button"
                          onClick={() => setSeverity(item.lvl)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            severity === item.lvl
                              ? 'border-[#111827] dark:border-[#0D9488] bg-[#F8F9FA] dark:bg-[#1C2638] ring-1 ring-[#111827] dark:ring-[#0D9488]'
                              : 'border-[#E5E7EB] dark:border-[#243042] bg-white dark:bg-[#151D2A] hover:bg-[#F8F9FA] dark:hover:bg-[#1C2638]'
                          }`}
                        >
                          <div className="font-bold text-xs text-[#111827] dark:text-[#F9FAFB] flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${item.dot}`}></span>
                              <span>{item.lvl}</span>
                            </span>
                            {severity === item.lvl && <span className="text-[10px] font-mono-data text-[#0D9488]">Dipilih</span>}
                          </div>
                          <p className="text-[11px] text-[#4B5563] dark:text-[#94A3B8] mt-1 leading-relaxed">
                            {item.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#243042] flex items-center justify-between">
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={!title.trim() || !description.trim()}
                    className="px-5 py-2.5 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] disabled:bg-[#D1D5DB] dark:disabled:bg-[#334155] text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all"
                  >
                    <span>Lanjutkan ke Bukti Visual</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: BUKTI VISUAL & GEOTAG */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="border-b border-[#E5E7EB] dark:border-[#243042] pb-3">
                  <h3 className="font-extrabold text-lg text-[#111827] dark:text-[#F9FAFB]">
                    Langkah 3: Foto Kondisi & Koordinat Lokasi
                  </h3>
                  <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                    Pilih foto kondisi fisik lapangan dan atur identitas pelapor.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Photo Preset Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB] flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
                      <span>Pilih Foto Bukti Kondisi Lapangan (Simulasi WIA)</span>
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {SAMPLE_PHOTO_PRESETS.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() => setPhotoUrl(p.url)}
                          className={`relative h-20 rounded-lg overflow-hidden border cursor-pointer group ${
                            photoUrl === p.url ? 'ring-2 ring-[#111827] dark:ring-[#0D9488] border-transparent' : 'border-[#E5E7EB] dark:border-[#243042]'
                          }`}
                        >
                          <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-end p-1 text-[9px] text-white font-medium">
                            {p.label.split('/')[0]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Photo Preview Card */}
                  <div className="rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-[#243042] bg-[#F8F9FA] dark:bg-[#101622]">
                    <div className="h-52 sm:h-64 relative">
                      <img src={photoUrl} alt="Preview Bukti" className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 left-2 right-2 p-2 bg-[#111827]/85 dark:bg-[#0B0F17]/90 backdrop-blur-xs text-white rounded-lg flex items-center justify-between text-xs font-mono-data">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
                          <span>{coordinates[0].toFixed(5)}, {coordinates[1].toFixed(5)}</span>
                        </div>
                        <span className="text-[10px] text-[#A7F3D0]">Akurasi GPS ±3.2m</span>
                      </div>
                    </div>
                  </div>

                  {/* Reporter Handle & Privacy */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB]">Nama Akun Pelapor</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF] dark:text-[#64748B]">@</span>
                        <input
                          type="text"
                          disabled={isAnonymous}
                          value={reporterHandle}
                          onChange={e => setReporterHandle(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 text-xs bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg text-[#111827] dark:text-[#F9FAFB] disabled:bg-[#E5E7EB] dark:disabled:bg-[#1F2937] disabled:text-[#9CA3AF] dark:disabled:text-[#64748B] focus:outline-none focus:border-[#111827] dark:focus:border-[#0D9488]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="anonCheck"
                        checked={isAnonymous}
                        onChange={e => setIsAnonymous(e.target.checked)}
                        className="w-4 h-4 rounded text-[#111827] dark:text-[#0D9488] focus:ring-0"
                      />
                      <label htmlFor="anonCheck" className="text-xs font-medium text-[#4B5563] dark:text-[#94A3B8] cursor-pointer">
                        Sembunyikan nama akun (Pelapor Anonim)
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#243042] flex items-center justify-between">
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>

                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all"
                  >
                    <span>Lanjutkan ke Tautan APBD</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: KONTEKS OTOMATIS & PENCEGAHAN DUPLIKASI */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="border-b border-[#E5E7EB] dark:border-[#243042] pb-3">
                  <h3 className="font-extrabold text-lg text-[#111827] dark:text-[#F9FAFB]">
                    Langkah 4: Tautan APBD & Cek Laporan Serupa
                  </h3>
                  <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                    Periksa dinas penanggung jawab, pos anggaran terkait, dan laporan warga lain di lokasi yang sama.
                  </p>
                </div>

                {/* Auto Detection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F8F9FA] dark:bg-[#101622] rounded-xl border border-[#E5E7EB] dark:border-[#243042] space-y-1.5">
                    <div className="text-[10px] font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider">
                      Instansi Penanggung Jawab
                    </div>
                    <div className="text-sm font-extrabold text-[#111827] dark:text-[#F9FAFB]">
                      {detectedAgency}
                    </div>
                    <p className="text-[11px] text-[#4B5563] dark:text-[#94A3B8]">
                      Dinas teknis yang berwenang menangani sarana ini di Kecamatan {subdistrict}.
                    </p>
                  </div>

                  <div className="p-4 bg-[#F8F9FA] dark:bg-[#101622] rounded-xl border border-[#E5E7EB] dark:border-[#243042] space-y-1.5">
                    <div className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider">
                      Tautan Pos Anggaran APBD
                    </div>
                    <div className="text-sm font-extrabold text-[#111827] dark:text-[#F9FAFB]">
                      {linkedProject ? linkedProject.title : 'Pos Belanja Pemeliharaan Berkala'}
                    </div>
                    <p className="text-[11px] text-[#4B5563] dark:text-[#94A3B8]">
                      {linkedProject 
                        ? `Pagu ${formatRupiahShort(linkedProject.budget.paguAnggaran)} • Pelaksana: ${linkedProject.contractorName}` 
                        : 'Menggunakan dana pemeliharaan rutin dinas terkait.'}
                    </p>
                  </div>
                </div>

                {/* Duplicate Warning / Prioritization Section */}
                {potentialDuplicates.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-extrabold text-xs text-[#111827] dark:text-[#F9FAFB]">
                          Terdapat {potentialDuplicates.length} Laporan Serupa di Lokasi Ini
                        </h4>
                        <p className="text-[11px] text-[#4B5563] dark:text-[#94A3B8] mt-0.5 leading-relaxed">
                          Jika masalah yang Anda temukan sama dengan laporan di bawah, berikan <strong>Suara Prioritas</strong> agar dukungan warga terkumpul pada satu kasus.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      {potentialDuplicates.slice(0, 2).map(dup => (
                        <div 
                          key={dup.id}
                          className="bg-white dark:bg-[#151D2A] p-3 rounded-lg border border-[#E5E7EB] dark:border-[#243042] flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-[#111827] dark:text-[#F9FAFB] truncate">{dup.title}</div>
                            <div className="text-[10px] font-mono-data text-[#6B7280] dark:text-[#94A3B8]">
                              {dup.subdistrict} • Tahap {dup.currentStep}/6 • {dup.priorityVotes} Suara
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => votePriority(dup.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 transition-all ${
                              dup.userHasVoted
                                ? 'bg-[#0D9488] text-white'
                                : 'bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white'
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{dup.userHasVoted ? 'Didukung' : 'Dukung Kasus'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#243042] flex items-center justify-between">
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>

                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all"
                  >
                    <span>Lanjutkan ke Ringkasan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: TINJAU & TERBITKAN */}
            {step === 5 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b border-[#E5E7EB] dark:border-[#243042] pb-3">
                  <h3 className="font-extrabold text-lg text-[#111827] dark:text-[#F9FAFB]">
                    Langkah 5: Periksa & Kirim Laporan
                  </h3>
                  <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                    Pastikan seluruh data lokasi dan deskripsi masalah sudah sesuai sebelum dikirim.
                  </p>
                </div>

                {/* Final Summary Card */}
                <div className="bg-[#F8F9FA] dark:bg-[#101622] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <img 
                      src={photoUrl} 
                      alt="Review" 
                      className="w-full sm:w-40 h-32 object-cover rounded-lg border border-[#E5E7EB] dark:border-[#243042]" 
                    />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-[#111827] dark:bg-[#0D9488] text-white px-2 py-0.5 rounded">
                          {sector}
                        </span>
                        <span className="text-[10px] font-bold bg-white dark:bg-[#151D2A] text-[#111827] dark:text-[#F9FAFB] border border-[#E5E7EB] dark:border-[#243042] px-2 py-0.5 rounded inline-flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            severity === 'Kritis' ? 'bg-[#DC2626]' : severity === 'Sedang' ? 'bg-[#D97706]' : 'bg-[#0D9488]'
                          }`}></span>
                          <span>Keparahan: {severity}</span>
                        </span>
                      </div>
                      <h4 className="font-extrabold text-base text-[#111827] dark:text-[#F9FAFB] leading-snug">
                        {title}
                      </h4>
                      <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] line-clamp-3">
                        {description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#243042] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#6B7280] dark:text-[#94A3B8]">Lokasi / Fasilitas:</span>
                      <div className="font-bold text-[#111827] dark:text-[#F9FAFB]">
                        {selectedFacilityObj ? selectedFacilityObj.name : `Titik Umum (${subdistrict})`}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#6B7280] dark:text-[#94A3B8]">Instansi Penanggung Jawab:</span>
                      <div className="font-bold text-[#111827] dark:text-[#F9FAFB]">{detectedAgency}</div>
                    </div>
                  </div>
                </div>

                {/* Open Civic Data Disclaimer */}
                <div className="p-3.5 bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] text-[11px] text-[#4B5563] dark:text-[#94A3B8] space-y-1">
                  <div className="font-bold text-[#111827] dark:text-[#F9FAFB] flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-[#0D9488]" />
                    <span>Publikasi Data Terbuka</span>
                  </div>
                  <p>
                    Laporan ini akan tampil pada peta dan direktori kasus warga Jabodetabek agar dapat dipantau bersama komunitas dan dinas terkait.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#243042] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white text-xs sm:text-sm font-bold rounded-lg flex items-center gap-2 transition-all"
                  >
                    <span>Kirim Laporan Warga</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUCCESS CONFIRMATION MODAL / SCREEN */}
      {/* ============================================================== */}
      {isSubmitted && (
        <div className="bg-white dark:bg-[#151D2A] rounded-2xl border border-[#0D9488]/30 dark:border-[#0D9488]/40 p-8 sm:p-10 shadow-tactile text-center space-y-6 max-w-2xl mx-auto transition-colors">
          <div className="w-16 h-16 rounded-full bg-[#ECFDF5] dark:bg-[#0D9488]/20 text-[#0D9488] flex items-center justify-center mx-auto border-2 border-[#A7F3D0] dark:border-[#0D9488]/40">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              Laporan Berhasil Dicatat & Geotag Terverifikasi
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-[#F9FAFB] tracking-tight">
              Kasus Warga Terdaftar di Observatorium
            </h2>
            <div className="inline-block px-3 py-1 bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg text-sm font-mono-data font-bold text-[#111827] dark:text-[#F9FAFB]">
              Kode Kasus: {createdReportId}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] max-w-md mx-auto leading-relaxed">
            Laporan Anda telah masuk ke Tahap 2 (Verifikasi Bukti Visual & Geotag). Tautan APBD dan instansi penanggung jawab telah disinkronkan ke radar pengawasan.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => navigate(`/lapor/${createdReportId}`)}
              className="w-full sm:w-auto px-6 py-3 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white text-xs font-bold rounded-xl shadow-tactile flex items-center justify-center gap-2 transition-all"
            >
              <span>Buka Halaman Audit Publik Kasus Ini</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/peta')}
              className="w-full sm:w-auto px-5 py-3 bg-white dark:bg-[#1C2638] hover:bg-[#F3F4F6] dark:hover:bg-[#243042] text-[#111827] dark:text-[#F9FAFB] border border-[#E5E7EB] dark:border-[#243042] text-xs font-bold rounded-xl transition-colors"
            >
              Lihat di Peta Wilayah
            </button>
          </div>

          <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#243042]">
            <button
              onClick={handleResetForm}
              className="text-xs text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] font-semibold underline underline-offset-4"
            >
              + Tandai Titik Masalah Lainnya
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
