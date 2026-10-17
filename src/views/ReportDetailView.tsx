import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTitik } from '../context/TitikContext';
import { BudgetBreakdownCard } from '../components/BudgetBreakdownCard';
import { formatRupiahShort } from '../data/titikRegionalData';
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  ThumbsUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Share2, 
  ShieldCheck, 
  ExternalLink,
  Layers,
  FileText,
  Copy,
  Check
} from 'lucide-react';

export const ReportDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    reports, 
    facilities, 
    budgetProjects, 
    votePriority,
    setSelectedFacility,
    setSelectedReport 
  } = useTitik();

  const [isCopied, setIsCopied] = useState(false);

  const report = reports.find(r => r.id === id);

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#111827]">Kasus Laporan Tidak Ditemukan</h2>
        <p className="text-xs text-[#6B7280]">
          ID Laporan "{id}" tidak ditemukan dalam sistem observatorium TITIK.
        </p>
        <button
          onClick={() => navigate('/lapor')}
          className="px-4 py-2 bg-[#111827] text-white text-xs font-semibold rounded-lg hover:bg-[#1F2937] transition-all"
        >
          Kembali ke Daftar Laporan Warga
        </button>
      </div>
    );
  }

  // Linked facility if any
  const facility = report.facilityId ? facilities.find(f => f.id === report.facilityId) : null;

  // Linked budget project if any
  const project = report.linkedProjectId ? budgetProjects.find(p => p.id === report.linkedProjectId) : null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
          <button
            onClick={() => navigate('/lapor')}
            className="hover:text-[#111827] flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Daftar Kasus Warga</span>
          </button>
          <span>/</span>
          <span className="font-mono-data font-semibold text-[#111827]">{report.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-white hover:bg-[#F3F4F6] text-[#111827] border border-[#E5E7EB] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-[#0D9488]" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Tautan Disalin!' : 'Bagikan Kasus'}</span>
          </button>

          <button
            onClick={() => {
              setSelectedReport(report);
              navigate('/peta');
            }}
            className="px-3.5 py-1.5 bg-[#111827] hover:bg-[#1F2937] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Lihat di Peta Wilayah</span>
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-tactile space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono-data font-bold bg-[#111827] text-white px-2.5 py-1 rounded">
            {report.id}
          </span>
          <span className="text-xs font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] px-2.5 py-1 rounded">
            {report.sector}
          </span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded border ${
            report.severity === 'Kritis' 
              ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]' 
              : report.severity === 'Sedang'
                ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                : 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
          }`}>
            Tingkat Bahaya: {report.severity}
          </span>
          <span className="text-xs font-mono-data font-bold bg-[#F8F9FA] text-[#4B5563] border border-[#E5E7EB] px-2.5 py-1 rounded">
            Tahap Audit {report.currentStep} dari 6
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight leading-snug">
            {report.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B7280]">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
              <span className="font-semibold text-[#111827]">{report.subdistrict}</span>
              {report.facilityName && <span>— {report.facilityName}</span>}
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span>Dilaporkan pada {report.reportedAt}</span>
            </div>
            <span>•</span>
            <div>
              Oleh <span className="font-semibold text-[#111827]">@{report.reporterHandle}</span>
            </div>
          </div>
        </div>

        {/* Priority Voting Bar */}
        <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-[#D97706]" />
              <span>{report.priorityVotes} Warga Mendukung Laporan Ini</span>
            </div>
            <p className="text-xs text-[#6B7280]">
              Semakin banyak warga memberikan suara, semakin tinggi prioritas eskalasi ke Inspektorat dan PPK dinas.
            </p>
          </div>

          <button
            onClick={() => votePriority(report.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all transform active:scale-95 shrink-0 ${
              report.userHasVoted
                ? 'bg-[#0D9488] text-white shadow-xs'
                : 'bg-[#111827] hover:bg-[#1F2937] text-white'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{report.userHasVoted ? 'Didukung oleh Anda ✓' : '+ Berikan Suara Prioritas'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols): Photo Evidence & 6-Step Audit Trail */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Photo Evidence Section */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-tactile space-y-4">
            <h3 className="font-extrabold text-base text-[#111827] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
              <span>Bukti Fisik Lapangan & Geotag</span>
            </h3>

            <div className="rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F8F9FA]">
              <img 
                src={report.photoUrl} 
                alt={report.title} 
                className="w-full h-72 sm:h-96 object-cover" 
              />
              <div className="p-3 bg-[#111827] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono-data">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>Geotag Koordinat: {report.coordinates[0].toFixed(5)}, {report.coordinates[1].toFixed(5)}</span>
                </div>
                <div className="text-[11px] text-[#A7F3D0]">
                  Verifikasi Geotag: SIKD Verified
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <h4 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                Keterangan Pelapor
              </h4>
              <p className="text-sm text-[#374151] leading-relaxed bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB]">
                {report.description}
              </p>
            </div>
          </div>

          {/* 6-Stage Civic Audit Timeline */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-tactile space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-[#111827]">
                  Audit Trail 6 Langkah Akuntabilitas Publik
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Jejak transparansi penanganan kasus dari laporan warga hingga tuntas diverifikasi.
                </p>
              </div>
              <span className="text-xs font-mono-data font-bold text-[#0D9488] bg-[#ECFDF5] px-2.5 py-1 rounded border border-[#A7F3D0]">
                Langkah {report.currentStep} dari 6
              </span>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E7EB]">
              {report.timeline.map((st) => {
                const isDone = st.status === 'COMPLETED';
                const isCurrent = st.status === 'IN_PROGRESS';

                return (
                  <div key={st.stepNumber} className="relative group">
                    <div 
                      className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 transition-all ${
                        isDone 
                          ? 'bg-[#0D9488] border-white shadow-xs' 
                          : isCurrent 
                            ? 'bg-[#D97706] border-white animate-pulse' 
                            : 'bg-white border-[#D1D5DB]'
                      }`}
                    />

                    <div className="space-y-1.5 bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono-data font-extrabold ${isDone ? 'text-[#0D9488]' : isCurrent ? 'text-[#D97706]' : 'text-[#6B7280]'}`}>
                            Langkah {st.stepNumber}
                          </span>
                          <span className="text-xs font-extrabold text-[#111827]">
                            {st.title}
                          </span>
                        </div>

                        <span className={`text-[11px] font-mono-data font-semibold self-start sm:self-auto ${
                          isDone ? 'text-[#0D9488]' : isCurrent ? 'text-[#D97706]' : 'text-[#9CA3AF]'
                        }`}>
                          {st.date}
                        </span>
                      </div>

                      <p className="text-xs text-[#4B5563] leading-relaxed">
                        {st.description}
                      </p>

                      <div className="text-[10px] text-[#6B7280] font-medium pt-1 border-t border-[#E5E7EB]/60 flex items-center justify-between">
                        <span>Aktor / Penanggung Jawab: <strong className="text-[#111827]">{st.actor}</strong></span>
                        <span className={`uppercase font-bold ${
                          isDone ? 'text-[#0D9488]' : isCurrent ? 'text-[#D97706]' : 'text-[#9CA3AF]'
                        }`}>
                          {st.status === 'COMPLETED' ? 'Selesai' : st.status === 'IN_PROGRESS' ? 'Sedang Diproses' : 'Menunggu'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column (1 Col): Responsible Authority & Budget Linkage */}
        <div className="space-y-6">
          
          {/* Responsible Authority Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-tactile space-y-3">
            <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Instansi Penanggung Jawab</span>
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-[#111827]">
                {report.responsibleAgency}
              </h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Organisasi Perangkat Daerah (OPD) yang memiliki tupoksi teknis terhadap penanganan sarana ini di wilayah {report.subdistrict}.
              </p>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB] text-[11px] text-[#6B7280] space-y-1">
              <div>Kanal Layanan Resmi: SiBadra / Pengaduan Pemkot Bogor</div>
              <div>Status Disposisi: Terhubung via SIKD Integration</div>
            </div>
          </div>

          {/* Linked APBD Budget Project */}
          {project ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-tactile space-y-4">
              <div className="text-xs font-bold text-[#0D9488] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Tautan Paket APBD Terkonfirmasi</span>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-mono-data font-bold text-[#6B7280]">
                  Kode: {project.code}
                </div>
                <h4 className="font-extrabold text-sm text-[#111827]">
                  {project.title}
                </h4>
                <p className="text-xs text-[#4B5563]">
                  Vendor: <strong className="text-[#111827]">{project.contractorName}</strong>
                </p>
              </div>

              <BudgetBreakdownCard 
                budget={project.budget}
                title={`Finansial Paket: ${project.code}`}
              />

              <button
                onClick={() => navigate('/anggaran')}
                className="w-full py-2 bg-[#F8F9FA] hover:bg-[#E5E7EB] text-[#111827] border border-[#E5E7EB] rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Lihat di Penelusuran Anggaran</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-tactile space-y-3">
              <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                Tautan Pos Anggaran APBD
              </div>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Kasus ini belum terikat pada kontrak paket proyek konstruksi spesifik. Penanganan diarahkan menggunakan <strong>Pos Pemeliharaan Rutin</strong> instansi terkait.
              </p>
            </div>
          )}

          {/* Linked Facility Card (if applicable) */}
          {facility && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-tactile space-y-3">
              <div className="text-xs font-bold text-[#2563EB] uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Profil Fasilitas Publik Terkait</span>
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-[#111827]">
                  {facility.name}
                </h4>
                <p className="text-xs text-[#6B7280]">
                  {facility.address} ({facility.subdistrict})
                </p>
                <div className="text-xs font-medium text-[#111827] pt-1">
                  Kondisi Tercatat: <strong className="text-[#DC2626]">{facility.condition}</strong>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedFacility(facility);
                  navigate(`/fasilitas/${facility.id}`);
                }}
                className="w-full py-2 bg-[#F8F9FA] hover:bg-[#E5E7EB] text-[#111827] border border-[#E5E7EB] rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Buka Profil Lengkap Fasilitas</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Data Provenance & Integrity Seal */}
          <div className="bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB] p-5 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#0D9488]">
              <ShieldCheck className="w-4 h-4" />
              <span>Integritas Audit Publik TITIK.</span>
            </div>
            <p className="text-[#4B5563] leading-relaxed text-[11px]">
              Kasus ini dicatat secara permanen dengan hash audit kriptografis di jaringan pengawasan warga WIA 2026.
            </p>
            <div className="text-[10px] font-mono-data text-[#9CA3AF] pt-1 border-t border-[#E5E7EB]">
              Hash ID: 0x9f4a...2026 • Status: Open Data SIKD
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

