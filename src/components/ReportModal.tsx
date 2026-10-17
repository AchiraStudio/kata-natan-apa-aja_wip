import React, { useState, useEffect } from 'react';
import { useTitik } from '../context/TitikContext';
import { SectorType, SubdistrictType, CitizenReport } from '../types';
import { SECTORS, SUBDISTRICTS } from '../data/titikRegionalData';
import confetti from 'canvas-confetti';
import { 
  X, 
  MapPin, 
  Building2, 
  UploadCloud, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  ThumbsUp,
  Link as LinkIcon
} from 'lucide-react';

export const ReportModal: React.FC = () => {
  const { 
    isReportModalOpen, 
    setIsReportModalOpen, 
    preselectedFacilityForReport,
    facilities,
    budgetProjects,
    reports,
    addCitizenReport,
    setSelectedReport,
    votePriority
  } = useTitik();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sector, setSector] = useState<SectorType>('Lingkungan & Drainase');
  const [subdistrict, setSubdistrict] = useState<SubdistrictType>('Bogor Tengah');
  const [facilityId, setFacilityId] = useState<string>('');
  const [severity, setSeverity] = useState<'Rendah' | 'Sedang' | 'Kritis'>('Sedang');
  const [photoPreview, setPhotoPreview] = useState<string>('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80');
  const [reporterHandle, setReporterHandle] = useState('warga_peduli_bgr');

  // Prepopulate if facility was preselected
  useEffect(() => {
    if (preselectedFacilityForReport) {
      setFacilityId(preselectedFacilityForReport.id);
      setSector(preselectedFacilityForReport.sector);
      setSubdistrict(preselectedFacilityForReport.subdistrict);
    }
  }, [preselectedFacilityForReport]);

  if (!isReportModalOpen) return null;

  // Selected Facility Object
  const selectedFacilityObj = facilities.find(f => f.id === facilityId);

  // Automated Context: Responsible Authority
  const detectedAgency = selectedFacilityObj 
    ? selectedFacilityObj.responsibleAgency
    : sector === 'Pendidikan'
      ? 'Dinas Pendidikan Pemda (Disdik)'
      : sector === 'Kesehatan'
        ? 'Dinas Kesehatan Pemda (Dinkes)'
        : sector === 'Lingkungan & Drainase'
          ? 'Dinas Sumber Daya Air / PUPR'
          : 'Dinas Bina Marga / PUPR';

  // Automated Context: Budget Linkage
  const linkedProject = selectedFacilityObj && selectedFacilityObj.linkedProjectIds.length > 0
    ? budgetProjects.find(p => p.id === selectedFacilityObj.linkedProjectIds[0])
    : undefined;

  // Duplicate Consolidation: Find existing reports at this facility / subdistrict
  const duplicateReports = reports.filter(r => {
    if (facilityId && r.facilityId === facilityId) return true;
    if (r.subdistrict === subdistrict && r.sector === sector) return true;
    return false;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    // Use facility coordinates or approximate subdistrict center
    const coords: [number, number] = selectedFacilityObj 
      ? [selectedFacilityObj.coordinates[0] + (Math.random() - 0.5) * 0.002, selectedFacilityObj.coordinates[1] + (Math.random() - 0.5) * 0.002]
      : [-6.5971 + (Math.random() - 0.5) * 0.03, 106.8060 + (Math.random() - 0.5) * 0.03];

    const createdReport = addCitizenReport({
      title: title.trim(),
      description: description.trim(),
      sector,
      subdistrict,
      facilityId: selectedFacilityObj?.id,
      facilityName: selectedFacilityObj?.name,
      coordinates: coords,
      responsibleAgency: detectedAgency,
      linkedProjectId: linkedProject?.id,
      linkedProjectTitle: linkedProject?.title,
      isBudgetLinkConfirmed: Boolean(linkedProject),
      reporterHandle: reporterHandle.replace('@', ''),
      photoUrl: photoPreview,
      severity
    });

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // fallback
    }

    // Reset and close
    setTitle('');
    setDescription('');
    setIsReportModalOpen(false);
    setSelectedReport(createdReport);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#151D2A] rounded-2xl border border-[#E5E7EB] dark:border-[#243042] shadow-2xl max-w-2xl w-full overflow-hidden transition-all my-8">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] dark:border-[#243042] bg-[#F8F9FA] dark:bg-[#0B0F17] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#111827] dark:bg-[#1C2638] text-white flex items-center justify-center font-bold text-sm">
              +
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#111827] dark:text-[#F9FAFB] tracking-tight">
                Tandai Titik Masalah & Kawal Anggaran
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                Sampaikan bukti visual presisi. Setiap laporan otomatis ditautkan ke Dinas dan pos APBD terkait.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsReportModalOpen(false)}
            className="p-1.5 text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] hover:bg-[#E5E7EB] dark:hover:bg-[#1C2638] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Duplicate Consolidation Alert ("Suara Prioritas") */}
          {duplicateReports.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[#FFFBEB] dark:bg-[#2A2010] border border-[#FDE68A] dark:border-[#78350F] space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <div className="text-xs text-[#92400E] dark:text-[#FDE68A] flex-1">
                  <span className="font-bold">
                    Terdapat {duplicateReports.length} laporan serupa di wilayah/fasilitas ini.
                  </span>{' '}
                  Untuk mempercepat eskalasi audit daripada membuat duplikasi, Anda dapat memberikan <strong>Suara Prioritas</strong> pada laporan warga yang sudah diverifikasi:
                </div>
              </div>

              <div className="bg-white/80 dark:bg-[#151D2A]/80 p-2.5 rounded-lg border border-[#FDE68A] dark:border-[#78350F] flex items-center justify-between text-xs">
                <span className="font-medium text-[#111827] dark:text-[#F9FAFB] truncate max-w-[280px]">
                  "{duplicateReports[0].title}"
                </span>
                <button
                  type="button"
                  onClick={() => votePriority(duplicateReports[0].id)}
                  className="px-2.5 py-1 bg-[#D97706] hover:bg-[#B45309] text-white rounded font-bold text-[11px] flex items-center gap-1 shrink-0"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>Dukung ({duplicateReports[0].priorityVotes})</span>
                </button>
              </div>
            </div>
          )}

          {/* Location & Facility Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] dark:text-[#CBD5E1] mb-1">
                Kecamatan
              </label>
              <select
                value={subdistrict}
                onChange={e => setSubdistrict(e.target.value as SubdistrictType)}
                className="w-full text-xs font-medium bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg px-3 py-2 text-[#111827] dark:text-[#F9FAFB] focus:outline-none focus:border-[#111827] dark:focus:border-[#0D9488]"
              >
                {SUBDISTRICTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] dark:text-[#CBD5E1] mb-1">
                Sektor Pelayanan
              </label>
              <select
                value={sector}
                onChange={e => setSector(e.target.value as SectorType)}
                className="w-full text-xs font-medium bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg px-3 py-2 text-[#111827] dark:text-[#F9FAFB] focus:outline-none focus:border-[#111827] dark:focus:border-[#0D9488]"
              >
                {SECTORS.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Facility Match (Optional but high precision) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] dark:text-[#CBD5E1] mb-1">
              Fasilitas Publik Terkait (Opsional)
            </label>
            <select
              value={facilityId}
              onChange={e => {
                const val = e.target.value;
                setFacilityId(val);
                const fac = facilities.find(f => f.id === val);
                if (fac) {
                  setSector(fac.sector);
                  setSubdistrict(fac.subdistrict);
                }
              }}
              className="w-full text-xs font-medium bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg px-3 py-2 text-[#111827] dark:text-[#F9FAFB] focus:outline-none focus:border-[#111827] dark:focus:border-[#0D9488]"
            >
              <option value="">-- Bukan Fasilitas Khusus / Di Ruas Jalan Umum --</option>
              {facilities.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.subdistrict})</option>
              ))}
            </select>
          </div>

          {/* Title & Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] dark:text-[#CBD5E1] mb-1">
              Judul Masalah / Kejadian
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Drainase mampet memicu genangan 40cm saat hujan deras"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-xs font-medium bg-white dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg px-3 py-2 text-[#111827] dark:text-[#F9FAFB] focus:outline-none focus:border-[#111827] dark:focus:border-[#0D9488]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] dark:text-[#CBD5E1] mb-1">
              Uraian Kondisi Fakta Lapangan
            </label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan dampak terhadap warga sekitar, durasi kerusakan, dan indikasi pekerjaan yang tidak tuntas..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full text-xs font-medium bg-white dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg px-3 py-2 text-[#111827] dark:text-[#F9FAFB] focus:outline-none focus:border-[#111827] dark:focus:border-[#0D9488]"
            />
          </div>

          {/* Photo Evidence & Reporter Handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] dark:text-[#CBD5E1] mb-1">
                Bukti Foto / Geotag
              </label>
              <div className="p-3 bg-[#F8F9FA] dark:bg-[#101622] rounded-lg border border-dashed border-[#D1D5DB] dark:border-[#334155] flex items-center gap-3">
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  className="w-12 h-12 rounded object-cover border border-[#E5E7EB] dark:border-[#243042]" 
                />
                <div className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                  <span className="font-semibold text-[#111827] dark:text-[#F9FAFB]">Foto Bukti Terlampir</span>
                  <div className="text-[10px] text-[#0D9488] dark:text-[#2DD4BF]">GPS Koordinat Tersemat ✓</div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] dark:text-[#CBD5E1] mb-1">
                Nama / Handle Warga Pelapor
              </label>
              <input
                type="text"
                value={reporterHandle}
                onChange={e => setReporterHandle(e.target.value)}
                placeholder="warga_peduli_bgr"
                className="w-full text-xs font-medium bg-white dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] rounded-lg px-3 py-2 text-[#111827] dark:text-[#F9FAFB] focus:outline-none focus:border-[#111827] dark:focus:border-[#0D9488]"
              />
              <span className="text-[10px] text-[#9CA3AF] dark:text-[#64748B] mt-0.5 block">Identitas terlindungi demi transparansi publik.</span>
            </div>
          </div>

          {/* AUTOMATED CONTEXT & LINKAGE PANEL */}
          <div className="p-4 rounded-xl bg-[#F0FDF4] dark:bg-[#062419] border border-[#BBF7D0] dark:border-[#0F5132] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#166534] dark:text-[#4ADE80]">
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Deteksi Otomatis Sistem SIKD TITIK.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-white dark:bg-[#0B1E17] p-2.5 rounded-lg border border-[#BBF7D0] dark:border-[#0F5132]">
                <div className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] font-semibold uppercase">Instansi Yang Wajib Menjawab</div>
                <div className="font-bold text-[#111827] dark:text-[#F9FAFB] mt-0.5">{detectedAgency}</div>
              </div>

              <div className="bg-white dark:bg-[#0B1E17] p-2.5 rounded-lg border border-[#BBF7D0] dark:border-[#0F5132]">
                <div className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] font-semibold uppercase">Tautan Anggaran APBD</div>
                <div className="font-bold text-[#0D9488] dark:text-[#2DD4BF] mt-0.5">
                  {linkedProject ? linkedProject.title : 'Sedang diverifikasi dengan SIKD'}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB] dark:border-[#243042]">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#111827] dark:bg-[#0D9488] hover:bg-[#1F2937] dark:hover:bg-[#0F766E] text-white text-xs font-bold rounded-lg shadow-sm transition-all transform active:scale-95"
            >
              Kirim & Mulai Kawal Laporan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


