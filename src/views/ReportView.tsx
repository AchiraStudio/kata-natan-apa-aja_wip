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
  Clock,
  Sparkles
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
  const [reporterHandle, setReporterHandle] = useState('warga_bogor_peduli');
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
      ? 'Dinas Pendidikan Kota Bogor'
      : sector === 'Kesehatan'
        ? 'Dinas Kesehatan Kota Bogor'
        : sector === 'Lingkungan & Drainase'
          ? 'Dinas Pekerjaan Umum & Penataan Ruang (PUPR) - SDA'
          : sector === 'Infrastruktur Jalan'
            ? 'Dinas Pekerjaan Umum & Penataan Ruang (PUPR) - Bina Marga'
            : sector === 'Ruang Terbuka Hijau'
              ? 'Dinas Perumahan dan Permukiman (Disperumkim)'
              : sector === 'Pengelolaan Persampahan'
                ? 'Dinas Lingkungan Hidup (DLH) Kota Bogor'
                : sector === 'Transportasi Publik'
                  ? 'Dinas Perhubungan Kota Bogor'
                  : sector === 'Pasar Tradisional'
                    ? 'Perumda Pasar Pakuan Jaya / Disperindag'
                    : 'Bagian Umum Setda Kota Bogor';

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
      : [-6.5971 + (Math.random() - 0.5) * 0.02, 106.8060 + (Math.random() - 0.5) * 0.02];

    const finalHandle = isAnonymous ? 'warga_anonim' : reporterHandle.replace('@', '').trim() || 'warga_bogor';

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
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-tactile space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#DC2626]">
              <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
              <span>Partisipasi & Pengawasan Warga • SIKD Kota Bogor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              Tandai Titik Masalah & Kawal Realisasi
            </h1>
          </div>

          {/* Toggle Tab */}
          <div className="inline-flex rounded-xl bg-[#F8F9FA] p-1 border border-[#E5E7EB] self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('NEW_REPORT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'NEW_REPORT'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              + Buat Laporan Baru
            </button>
            <button
              onClick={() => setActiveTab('ALL_REPORTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'ALL_REPORTS'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <span>Daftar Kasus Warga</span>
              <span className="px-1.5 py-0.2 bg-[#F3F4F6] text-[#4B5563] rounded text-[10px] font-mono-data">
                {reports.length}
              </span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed max-w-3xl">
          Setiap masalah infrastruktur di lingkungan Anda dapat ditautkan langsung dengan pos anggaran APBD yang bertanggung jawab. Laporkan dengan bukti geotag presisi agar dapat dikawal bersama komunitas hingga tuntas.
        </p>
      </div>

      {/* ============================================================== */}
      {/* MODE 1: ALL REPORTS LISTING VIEW */}
      {/* ============================================================== */}
      {activeTab === 'ALL_REPORTS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-tactile">
            <div className="text-xs text-[#6B7280]">
              Menampilkan <strong>{reports.length}</strong> kasus warga Kota Bogor yang terdaftar dalam observatorium.
            </div>
            <button
              onClick={() => setActiveTab('NEW_REPORT')}
              className="px-4 py-2 bg-[#111827] text-white text-xs font-bold rounded-lg hover:bg-[#1F2937] transition-all"
            >
              + Lapor Titik Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reports.map(report => (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] hover:border-[#111827] p-5 shadow-tactile shadow-tactile-hover transition-all flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-3">
                  <div 
                    onClick={() => navigate(`/lapor/${report.id}`)}
                    className="relative h-44 rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6] cursor-pointer"
                  >
                    <img 
                      src={report.photoUrl} 
                      alt={report.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-mono-data font-bold bg-[#111827]/80 backdrop-blur-xs text-white px-2 py-0.5 rounded">
                        {report.id}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold bg-white/90 backdrop-blur-xs text-[#111827] px-2 py-0.5 rounded border border-[#E5E7EB]">
                        {report.sector}
                      </span>
                      <span className="text-[10px] font-bold bg-[#111827] text-white px-2 py-0.5 rounded font-mono-data">
                        Langkah {report.currentStep}/6
                      </span>
                    </div>
                  </div>

                  <div 
                    onClick={() => navigate(`/lapor/${report.id}`)}
                    className="cursor-pointer space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                      <MapPin className="w-3 h-3 text-[#9CA3AF]" />
                      <span>{report.subdistrict}</span>
                      <span>•</span>
                      <span>@{report.reporterHandle}</span>
                    </div>

                    <h3 className="font-extrabold text-sm text-[#111827] group-hover:text-[#2563EB] transition-colors line-clamp-2 leading-snug">
                      {report.title}
                    </h3>

                    <p className="text-xs text-[#4B5563] line-clamp-2 leading-relaxed">
                      {report.description}
                    </p>
                  </div>

                  <div className="text-[11px] text-[#4B5563] bg-[#F8F9FA] p-2.5 rounded-lg border border-[#E5E7EB] space-y-1">
                    <div className="text-[10px] text-[#6B7280] font-semibold">Tautan Pos APBD:</div>
                    <div className="font-medium truncate text-[#0D9488]">
                      {report.isBudgetLinkConfirmed ? report.linkedProjectTitle : 'Belum Ditautkan ke Proyek Aktif'}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F3F4F6] flex items-center justify-between">
                  <button
                    onClick={() => votePriority(report.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all transform active:scale-95 ${
                      report.userHasVoted
                        ? 'bg-[#0D9488] text-white shadow-xs'
                        : 'bg-[#F8F9FA] text-[#111827] hover:bg-[#E5E7EB] border border-[#E5E7EB]'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{report.priorityVotes} Suara</span>
                  </button>

                  <button
                    onClick={() => navigate(`/lapor/${report.id}`)}
                    className="text-xs font-bold text-[#111827] hover:text-[#2563EB] transition-colors flex items-center gap-1"
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
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-tactile overflow-hidden">
          
          {/* Stepper Progress Bar */}
          <div className="border-b border-[#E5E7EB] bg-[#F8F9FA] px-4 sm:px-8 py-4">
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
                            ? 'bg-[#111827] text-white ring-4 ring-[#E5E7EB]' 
                            : 'bg-white border border-[#D1D5DB] text-[#9CA3AF]'
                      }`}
                    >
                      {isPassed ? '✓' : st.s}
                    </div>
                    <span className={`text-[11px] font-semibold hidden md:inline ${
                      isActive ? 'text-[#111827]' : isPassed ? 'text-[#0D9488]' : 'text-[#9CA3AF]'
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
                <div className="border-b border-[#E5E7EB] pb-3">
                  <h3 className="font-extrabold text-lg text-[#111827]">
                    Langkah 1: Tentukan Wilayah & Objek Masalah
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Pilih wilayah kecamatan dan sektor pelayanan publik yang berkaitan dengan masalah ini.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kecamatan */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111827]">Kecamatan (Kota Bogor)</label>
                    <select
                      value={subdistrict}
                      onChange={e => {
                        setSubdistrict(e.target.value as SubdistrictType);
                        setFacilityId('');
                      }}
                      className="w-full text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg p-2.5 font-medium text-[#111827] focus:outline-none focus:border-[#111827]"
                    >
                      {SUBDISTRICTS.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sektor */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111827]">Sektor Pelayanan</label>
                    <select
                      value={sector}
                      onChange={e => {
                        setSector(e.target.value as SectorType);
                        setFacilityId('');
                      }}
                      className="w-full text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg p-2.5 font-medium text-[#111827] focus:outline-none focus:border-[#111827]"
                    >
                      {SECTORS.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sektor Brief Info */}
                <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] text-xs space-y-1">
                  <div className="font-bold text-[#111827] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Fokus Pengawasan Sektor: {sector}</span>
                  </div>
                  <p className="text-[#6B7280]">
                    {SECTOR_DEFINITIONS.find(s => s.id === sector)?.description || 'Pelayanan publik standar daerah.'}
                  </p>
                </div>

                {/* Facility Choice */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-[#111827] block">
                    Jenis Objek Masalah
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsFacilityLinked(true)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isFacilityLinked
                          ? 'border-[#111827] bg-[#F8F9FA] ring-2 ring-[#111827]'
                          : 'border-[#E5E7EB] hover:bg-[#F9FAFB]'
                      }`}
                    >
                      <div className="font-bold text-xs text-[#111827] flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-[#2563EB]" />
                        <span>Fasilitas Publik Terdaftar</span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-1">
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
                          ? 'border-[#111827] bg-[#F8F9FA] ring-2 ring-[#111827]'
                          : 'border-[#E5E7EB] hover:bg-[#F9FAFB]'
                      }`}
                    >
                      <div className="font-bold text-xs text-[#111827] flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#DC2626]" />
                        <span>Titik Jalan / Lingkungan Umum</span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-1">
                        Saluran drainase perkampungan, jalan lingkungan, trotoar bebas.
                      </p>
                    </button>
                  </div>

                  {isFacilityLinked && (
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-semibold text-[#4B5563]">
                        Pilih Fasilitas Terdaftar di {subdistrict}:
                      </label>
                      <select
                        value={facilityId}
                        onChange={e => setFacilityId(e.target.value)}
                        className="w-full text-xs bg-white border border-[#E5E7EB] rounded-lg p-2.5 font-medium text-[#111827] focus:outline-none focus:border-[#111827]"
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

                <div className="pt-4 border-t border-[#E5E7EB] flex justify-end">
                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all"
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
                <div className="border-b border-[#E5E7EB] pb-3">
                  <h3 className="font-extrabold text-lg text-[#111827]">
                    Langkah 2: Rincian Masalah & Tingkat Keparahan
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Tuliskan judul spesifik dan deskripsi objektif mengenai kerusakan fisik yang terjadi.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111827]">
                      Judul Laporan Singkat & Jelas *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Tanggul Drainase Jebol 4 Meter di Samping SDN Menteng"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg p-2.5 text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111827]">
                      Deskripsi Kronologis / Dampak Lapangan *
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Jelaskan sejak kapan kerusakan terjadi, apakah menghambat akses warga/pasien, dan apakah sudah pernah dilaporkan ke RT/RW setempat..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg p-2.5 text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>

                  {/* Tingkat Keparahan */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-[#111827]">
                      Tingkat Keparahan Dampak (Severity Level)
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          lvl: 'Rendah' as const,
                          color: 'border-[#10B981] text-[#065F46] bg-[#ECFDF5]',
                          desc: 'Kerusakan minor estetika, tidak memutus mobilitas warga.'
                        },
                        {
                          lvl: 'Sedang' as const,
                          color: 'border-[#F59E0B] text-[#92400E] bg-[#FFFBEB]',
                          desc: 'Hambatan fungsi reguler, memerlukan perbaikan terencana.'
                        },
                        {
                          lvl: 'Kritis' as const,
                          color: 'border-[#EF4444] text-[#991B1B] bg-[#FEF2F2]',
                          desc: 'Ancaman keselamatan jiwa, banjir meluas, atau amblas parah.'
                        }
                      ].map(item => (
                        <button
                          key={item.lvl}
                          type="button"
                          onClick={() => setSeverity(item.lvl)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            severity === item.lvl
                              ? `${item.color} ring-2 ring-current`
                              : 'border-[#E5E7EB] hover:bg-[#F9FAFB]'
                          }`}
                        >
                          <div className="font-bold text-xs flex items-center justify-between">
                            <span>{item.lvl}</span>
                            {severity === item.lvl && <span>●</span>}
                          </div>
                          <p className="text-[10px] text-[#4B5563] mt-1 leading-relaxed">
                            {item.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 text-xs font-semibold text-[#6B7280] hover:text-[#111827] flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={!title.trim() || !description.trim()}
                    className="px-5 py-2.5 bg-[#111827] hover:bg-[#1F2937] disabled:bg-[#D1D5DB] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all"
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
                <div className="border-b border-[#E5E7EB] pb-3">
                  <h3 className="font-extrabold text-lg text-[#111827]">
                    Langkah 3: Bukti Visual & Geotag Presisi
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Pilih foto kondisi fisik lapangan dan atur identitas pelapor.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Photo Preset Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-[#2563EB]" />
                      <span>Pilih Foto Bukti Kondisi Lapangan (Simulasi WIA)</span>
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {SAMPLE_PHOTO_PRESETS.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() => setPhotoUrl(p.url)}
                          className={`relative h-20 rounded-lg overflow-hidden border cursor-pointer group ${
                            photoUrl === p.url ? 'ring-2 ring-[#111827] border-transparent' : 'border-[#E5E7EB]'
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
                  <div className="rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F8F9FA]">
                    <div className="h-52 sm:h-64 relative">
                      <img src={photoUrl} alt="Preview Bukti" className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 left-2 right-2 p-2 bg-[#111827]/85 backdrop-blur-xs text-white rounded-lg flex items-center justify-between text-xs font-mono-data">
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
                      <label className="text-xs font-bold text-[#111827]">Handle Pelapor (Civic Username)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">@</span>
                        <input
                          type="text"
                          disabled={isAnonymous}
                          value={reporterHandle}
                          onChange={e => setReporterHandle(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg text-[#111827] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="anonCheck"
                        checked={isAnonymous}
                        onChange={e => setIsAnonymous(e.target.checked)}
                        className="w-4 h-4 rounded text-[#111827] focus:ring-0"
                      />
                      <label htmlFor="anonCheck" className="text-xs font-medium text-[#4B5563] cursor-pointer">
                        Laporkan sebagai Anonim Terverifikasi SIKD
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 text-xs font-semibold text-[#6B7280] hover:text-[#111827] flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>

                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all"
                  >
                    <span>Lanjutkan ke Konteks APBD</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: KONTEKS OTOMATIS & PENCEGAHAN DUPLIKASI */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="border-b border-[#E5E7EB] pb-3">
                  <h3 className="font-extrabold text-lg text-[#111827]">
                    Langkah 4: Konteks Otomatis & Konsolidasi Kasus
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Sistem mendeteksi dinas terkait, tautan pos anggaran APBD, dan potensi duplikasi laporan serupa.
                  </p>
                </div>

                {/* Auto Detection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] space-y-1.5">
                    <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                      Instansi Penanggung Jawab Terdeteksi
                    </div>
                    <div className="text-sm font-extrabold text-[#111827]">
                      {detectedAgency}
                    </div>
                    <p className="text-[11px] text-[#4B5563]">
                      Laporan akan dikirimkan langsung ke dashboard pengawasan instansi ini.
                    </p>
                  </div>

                  <div className="p-4 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] space-y-1.5">
                    <div className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider">
                      Tautan Pos Anggaran APBD
                    </div>
                    <div className="text-sm font-extrabold text-[#111827]">
                      {linkedProject ? linkedProject.title : 'Pos Belanja Pemeliharaan Berkala'}
                    </div>
                    <p className="text-[11px] text-[#4B5563]">
                      {linkedProject 
                        ? `Pagu ${formatRupiahShort(linkedProject.budget.paguAnggaran)} • Vendor: ${linkedProject.contractorName}` 
                        : 'Menunggu identifikasi paket kontraktual lanjutan SIKD.'}
                    </p>
                  </div>
                </div>

                {/* Duplicate Warning / Prioritization Section */}
                {potentialDuplicates.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-extrabold text-xs text-[#92400E]">
                          Pencegahan Fragmentasi: Ditemukan {potentialDuplicates.length} Kasus Serupa di Wilayah Ini
                        </h4>
                        <p className="text-[11px] text-[#78350F] mt-0.5 leading-relaxed">
                          Jika masalah yang ingin Anda laporkan sama dengan kasus di bawah, disarankan memberikan <strong>Suara Prioritas</strong> daripada membuat laporan baru, agar perhatian dinas terkonsentrasi.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      {potentialDuplicates.slice(0, 2).map(dup => (
                        <div 
                          key={dup.id}
                          className="bg-white p-3 rounded-lg border border-[#FDE68A] flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-[#111827] truncate">{dup.title}</div>
                            <div className="text-[10px] text-[#6B7280]">
                              {dup.subdistrict} • Langkah {dup.currentStep}/6 • {dup.priorityVotes} Suara
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => votePriority(dup.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 transition-all ${
                              dup.userHasVoted
                                ? 'bg-[#0D9488] text-white'
                                : 'bg-[#111827] text-white hover:bg-[#1F2937]'
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{dup.userHasVoted ? 'Didukung' : 'Dukung Ini'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 text-xs font-semibold text-[#6B7280] hover:text-[#111827] flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>

                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all"
                  >
                    <span>Lanjutkan ke Tinjau & Publikasi</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: TINJAU & TERBITKAN */}
            {step === 5 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b border-[#E5E7EB] pb-3">
                  <h3 className="font-extrabold text-lg text-[#111827]">
                    Langkah 5: Tinjau & Terbitkan Bukti Publik
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Periksa kembali ringkasan laporan sebelum dicatat ke dalam audit trail publik TITIK.
                  </p>
                </div>

                {/* Final Summary Card */}
                <div className="bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <img 
                      src={photoUrl} 
                      alt="Review" 
                      className="w-full sm:w-40 h-32 object-cover rounded-lg border border-[#E5E7EB]" 
                    />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-[#111827] text-white px-2 py-0.5 rounded">
                          {sector}
                        </span>
                        <span className="text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] px-2 py-0.5 rounded">
                          Tingkat {severity}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-base text-[#111827] leading-snug">
                        {title}
                      </h4>
                      <p className="text-xs text-[#4B5563] line-clamp-3">
                        {description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#6B7280]">Lokasi / Fasilitas:</span>
                      <div className="font-bold text-[#111827]">
                        {selectedFacilityObj ? selectedFacilityObj.name : `Titik Umum (${subdistrict})`}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Instansi Penanggung Jawab:</span>
                      <div className="font-bold text-[#111827]">{detectedAgency}</div>
                    </div>
                  </div>
                </div>

                {/* Open Civic Data Disclaimer */}
                <div className="p-3.5 bg-white rounded-xl border border-[#E5E7EB] text-[11px] text-[#4B5563] space-y-1">
                  <div className="font-bold text-[#111827] flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-[#0D9488]" />
                    <span>Integritas Data Publik Terbuka</span>
                  </div>
                  <p>
                    Laporan ini akan diterbitkan secara transparan untuk kepentingan pengawasan publik WIA 2026. Data koordinat dan foto bersifat terbuka dan dapat diakses oleh instansi pemerintah terkait.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 text-xs font-semibold text-[#6B7280] hover:text-[#111827] flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#111827] hover:bg-[#1F2937] text-white text-xs sm:text-sm font-bold rounded-xl shadow-tactile flex items-center gap-2 transition-all transform active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-[#0D9488]" />
                    <span>Terbitkan Laporan & Mulai Kawal</span>
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
        <div className="bg-white rounded-2xl border border-[#0D9488]/30 p-8 sm:p-10 shadow-tactile text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#ECFDF5] text-[#0D9488] flex items-center justify-center mx-auto border-2 border-[#A7F3D0]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              Laporan Berhasil Dicatat & Geotag Terverifikasi
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              Kasus Warga Terdaftar di Observatorium
            </h2>
            <div className="inline-block px-3 py-1 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg text-sm font-mono-data font-bold text-[#111827]">
              Kode Kasus: {createdReportId}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#4B5563] max-w-md mx-auto leading-relaxed">
            Laporan Anda telah masuk ke Tahap 2 (Verifikasi Bukti Visual & Geotag). Tautan APBD dan instansi penanggung jawab telah disinkronkan ke radar pengawasan.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => navigate(`/lapor/${createdReportId}`)}
              className="w-full sm:w-auto px-6 py-3 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-bold rounded-xl shadow-tactile flex items-center justify-center gap-2 transition-all"
            >
              <span>Buka Halaman Audit Publik Kasus Ini</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/peta')}
              className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-[#F3F4F6] text-[#111827] border border-[#E5E7EB] text-xs font-bold rounded-xl transition-colors"
            >
              Lihat di Peta Wilayah
            </button>
          </div>

          <div className="pt-4 border-t border-[#E5E7EB]">
            <button
              onClick={handleResetForm}
              className="text-xs text-[#6B7280] hover:text-[#111827] font-semibold underline underline-offset-4"
            >
              + Tandai Titik Masalah Lainnya
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
