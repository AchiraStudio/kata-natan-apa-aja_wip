import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTitik } from '../context/TitikContext';
import { BudgetBreakdownCard } from '../components/BudgetBreakdownCard';
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  ThumbsUp, 
  Calendar, 
  Share2, 
  ShieldCheck, 
  ExternalLink,
  FileText,
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
          ID Laporan "{id}" tidak ditemukan dalam basis data TITIK.
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

  const facility = report.facilityId ? facilities.find(f => f.id === report.facilityId) : null;
  const project = report.linkedProjectId ? budgetProjects.find(p => p.id === report.linkedProjectId) : null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#243042] pb-4">
        <div className="flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#94A3B8]">
          <button
            onClick={() => navigate('/lapor')}
            className="hover:text-[#111827] dark:hover:text-[#F9FAFB] flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Daftar Kasus Warga</span>
          </button>
          <span>/</span>
          <span className="font-mono-data font-semibold text-[#111827] dark:text-[#F9FAFB]">{report.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-white dark:bg-[#151D2A] hover:bg-[#F3F4F6] dark:hover:bg-[#1C2638] text-[#111827] dark:text-[#F9FAFB] border border-[#E5E7EB] dark:border-[#243042] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-[#0D9488]" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Tautan Disalin' : 'Bagikan Kasus'}</span>
          </button>

          <button
            onClick={() => {
              setSelectedReport(report);
              navigate('/peta');
            }}
            className="px-3.5 py-1.5 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <MapPin className="w-3.5 h-3.5 text-[#0D9488] dark:text-white" />
            <span>Lihat di Peta Wilayah</span>
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-6 sm:p-8 space-y-6 transition-colors">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono-data font-bold bg-[#111827] dark:bg-[#0D9488] text-white px-2.5 py-1 rounded">
            {report.id}
          </span>
          <span className="text-xs font-bold bg-[#F8F9FA] dark:bg-[#101622] text-[#111827] dark:text-[#F9FAFB] border border-[#E5E7EB] dark:border-[#243042] px-2.5 py-1 rounded inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
            <span>{report.sector}</span>
          </span>
          <span className="text-xs font-bold bg-[#F8F9FA] dark:bg-[#101622] text-[#111827] dark:text-[#F9FAFB] border border-[#E5E7EB] dark:border-[#243042] px-2.5 py-1 rounded inline-flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${
              report.severity === 'Kritis'
                ? 'bg-[#DC2626]'
                : report.severity === 'Sedang'
                  ? 'bg-[#D97706]'
                  : 'bg-[#0D9488]'
            }`}></span>
            <span>Keparahan: {report.severity}</span>
          </span>
          <span className="text-xs font-mono-data font-bold bg-[#F8F9FA] dark:bg-[#101622] text-[#4B5563] dark:text-[#94A3B8] border border-[#E5E7EB] dark:border-[#243042] px-2.5 py-1 rounded">
            Tahap Audit {report.currentStep}/6
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-[#F9FAFB] tracking-tight leading-snug">
            {report.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B7280] dark:text-[#94A3B8]">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
              <span className="font-semibold text-[#111827] dark:text-[#F9FAFB]">{report.subdistrict}</span>
              {report.facilityName && <span>({report.facilityName})</span>}
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-[#64748B]" />
              <span>Dilaporkan {report.reportedAt}</span>
            </div>
            <span>•</span>
            <div>
              Pelapor: <span className="font-semibold text-[#111827] dark:text-[#F9FAFB]">@{report.reporterHandle}</span>
            </div>
          </div>
        </div>

        {/* Priority Voting Bar */}
        <div className="p-4 rounded-xl bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-sm font-extrabold text-[#111827] dark:text-[#F9FAFB] flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-[#D97706]" />
              <span>{report.priorityVotes} Warga Mendukung Laporan Ini</span>
            </div>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
              Dukungan warga menentukan urutan prioritas pemeriksaan lapangan oleh Inspektorat dan dinas teknis.
            </p>
          </div>

          <button
            onClick={() => votePriority(report.id)}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shrink-0 ${
              report.userHasVoted
                ? 'bg-[#0D9488] text-white'
                : 'bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{report.userHasVoted ? 'Didukung oleh Anda ✓' : '+ Dukung Prioritas'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols): Photo Evidence & 6-Step Audit Trail */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Photo Evidence Section */}
          <div className="bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-6 space-y-4 transition-colors">
            <h3 className="font-extrabold text-base text-[#111827] dark:text-[#F9FAFB] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
              <span>Bukti Fisik Lapangan & Geotag</span>
            </h3>

            <div className="rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-[#243042] bg-[#F8F9FA] dark:bg-[#101622]">
              <img 
                src={report.photoUrl} 
                alt={report.title} 
                className="w-full h-72 sm:h-96 object-cover" 
              />
              <div className="p-3 bg-[#F8F9FA] dark:bg-[#101622] border-t border-[#E5E7EB] dark:border-[#243042] text-[#111827] dark:text-[#F9FAFB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono-data">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>Koordinat: {report.coordinates[0].toFixed(5)}, {report.coordinates[1].toFixed(5)}</span>
                </div>
                <div className="text-[11px] text-[#0D9488] font-semibold">
                  Geotag Terverifikasi
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <h4 className="text-xs font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider">
                Keterangan Pelapor
              </h4>
              <p className="text-sm text-[#374151] dark:text-[#94A3B8] leading-relaxed bg-[#F8F9FA] dark:bg-[#101622] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#243042]">
                {report.description}
              </p>
            </div>
          </div>

          {/* 6-Stage Civic Audit Timeline */}
          <div className="bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-6 sm:p-8 space-y-6 transition-colors">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#243042] pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-[#111827] dark:text-[#F9FAFB]">
                  Riwayat Penanganan 6 Tahap
                </h3>
                <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                  Catatan waktu dari pelaporan warga hingga verifikasi hasil perbaikan.
                </p>
              </div>
              <span className="text-xs font-mono-data font-bold text-[#111827] dark:text-[#F9FAFB] bg-[#F8F9FA] dark:bg-[#101622] px-2.5 py-1 rounded border border-[#E5E7EB] dark:border-[#243042]">
                Tahap {report.currentStep}/6
              </span>
            </div>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E7EB] dark:before:bg-[#243042]">
              {report.timeline.map((st) => {
                const isDone = st.status === 'COMPLETED';
                const isCurrent = st.status === 'IN_PROGRESS';

                return (
                  <div key={st.stepNumber} className="relative group">
                    <div 
                      className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                        isDone 
                          ? 'bg-[#0D9488] border-white dark:border-[#151D2A]' 
                          : isCurrent 
                            ? 'bg-[#D97706] border-white dark:border-[#151D2A]' 
                            : 'bg-white dark:bg-[#151D2A] border-[#D1D5DB] dark:border-[#334155]'
                      }`}
                    />

                    <div className="space-y-1.5 bg-[#F8F9FA] dark:bg-[#101622] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#243042]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono-data font-extrabold ${isDone ? 'text-[#0D9488]' : isCurrent ? 'text-[#D97706]' : 'text-[#6B7280] dark:text-[#94A3B8]'}`}>
                            Tahap {st.stepNumber}
                          </span>
                          <span className="text-xs font-extrabold text-[#111827] dark:text-[#F9FAFB]">
                            {st.title}
                          </span>
                        </div>

                        <span className={`text-[11px] font-mono-data font-semibold self-start sm:self-auto ${
                          isDone ? 'text-[#0D9488]' : isCurrent ? 'text-[#D97706]' : 'text-[#6B7280] dark:text-[#94A3B8]'
                        }`}>
                          {st.date}
                        </span>
                      </div>

                      <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] leading-relaxed">
                        {st.description}
                      </p>

                      <div className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] font-medium pt-1.5 border-t border-[#E5E7EB] dark:border-[#243042] flex items-center justify-between">
                        <span>Penanggung Jawab: <strong className="text-[#111827] dark:text-[#F9FAFB]">{st.actor}</strong></span>
                        <span className={`uppercase font-bold ${
                          isDone ? 'text-[#0D9488]' : isCurrent ? 'text-[#D97706]' : 'text-[#6B7280] dark:text-[#94A3B8]'
                        }`}>
                          {st.status === 'COMPLETED' ? 'Selesai' : st.status === 'IN_PROGRESS' ? 'Berjalan' : 'Menunggu'}
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
          <div className="bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-5 space-y-3 transition-colors">
            <div className="text-xs font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
              <span>Instansi Penanggung Jawab</span>
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-[#111827] dark:text-[#F9FAFB]">
                {report.responsibleAgency}
              </h4>
              <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] leading-relaxed">
                Dinas teknis yang berwenang menangani sarana ini di wilayah {report.subdistrict}.
              </p>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#243042] text-[11px] text-[#6B7280] dark:text-[#94A3B8] space-y-1">
              <div>Kanal Pengaduan: Portal Pengaduan Resmi Pemda</div>
              <div>Sumber Data: Simulasi SIKD Jabodetabek</div>
            </div>
          </div>

          {/* Linked APBD Budget Project */}
          {project ? (
            <div className="bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-5 space-y-4 transition-colors">
              <div className="text-xs font-bold text-[#0D9488] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Paket APBD Terkait</span>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-mono-data font-bold text-[#6B7280] dark:text-[#94A3B8]">
                  Kode: {project.code}
                </div>
                <h4 className="font-extrabold text-sm text-[#111827] dark:text-[#F9FAFB]">
                  {project.title}
                </h4>
                <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
                  Pelaksana: <strong className="text-[#111827] dark:text-[#F9FAFB]">{project.contractorName}</strong>
                </p>
              </div>

              <BudgetBreakdownCard 
                budget={project.budget}
                title={`Rincian Paket: ${project.code}`}
              />

              <button
                onClick={() => navigate('/anggaran')}
                className="w-full py-2 bg-[#F8F9FA] dark:bg-[#1C2638] hover:bg-[#E5E7EB] dark:hover:bg-[#243042] text-[#111827] dark:text-[#F9FAFB] border border-[#E5E7EB] dark:border-[#243042] rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Buka Tabel Anggaran</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-5 space-y-3 transition-colors">
              <div className="text-xs font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider">
                Tautan Pos Anggaran APBD
              </div>
              <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] leading-relaxed">
                Laporan ini belum terikat pada kontrak proyek konstruksi tersendiri. Perbaikan menggunakan <strong>Pos Pemeliharaan Rutin</strong> dinas terkait.
              </p>
            </div>
          )}

          {/* Linked Facility Card (if applicable) */}
          {facility && (
            <div className="bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-5 space-y-3 transition-colors">
              <div className="text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Fasilitas Terkait</span>
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-[#111827] dark:text-[#F9FAFB]">
                  {facility.name}
                </h4>
                <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                  {facility.address} ({facility.subdistrict})
                </p>
                <div className="text-xs font-medium text-[#111827] dark:text-[#F9FAFB] pt-1">
                  Kondisi Fisik: <strong className="text-[#DC2626] dark:text-[#F87171]">{facility.condition}</strong>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedFacility(facility);
                  navigate(`/fasilitas/${facility.id}`);
                }}
                className="w-full py-2 bg-[#F8F9FA] dark:bg-[#1C2638] hover:bg-[#E5E7EB] dark:hover:bg-[#243042] text-[#111827] dark:text-[#F9FAFB] border border-[#E5E7EB] dark:border-[#243042] rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Buka Profil Fasilitas</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Data Provenance */}
          <div className="bg-[#F8F9FA] dark:bg-[#101622] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-5 space-y-2 text-xs transition-colors">
            <div className="flex items-center gap-1.5 font-bold text-[#111827] dark:text-[#F9FAFB]">
              <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
              <span>Keterangan Sumber Data</span>
            </div>
            <p className="text-[#4B5563] dark:text-[#94A3B8] leading-relaxed text-[11px]">
              Catatan laporan dan tautan anggaran di halaman ini menggunakan data simulasi SIKD wilayah Jabodetabek untuk kompetisi WIA 2026.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
