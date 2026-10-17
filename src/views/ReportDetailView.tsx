import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTitik } from '../context/TitikContext';
import { BudgetBreakdownCard } from '../components/BudgetBreakdownCard';
import { fetchReportDetail, voteReportPriority, getFollowUpToken } from '../services/reportService';
import { PublicCivicReport } from '../types/database';
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
  Check,
  AlertCircle,
  Clock,
  Key,
  Info,
  ImageIcon,
  Radio
} from 'lucide-react';

export const ReportDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { facilities, budgetProjects, setSelectedFacility } = useTitik();

  const [report, setReport] = useState<PublicCivicReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [voteCount, setVoteCount] = useState<number>(0);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [isReporterTokenOwner, setIsReporterTokenOwner] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchReportDetail(id)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          setError(`Laporan dengan referensi "${id}" tidak ditemukan dalam sistem publik maupun token pelapor.`);
          setReport(null);
        } else {
          setReport(data);
          setVoteCount(data.votesCount);
          setHasVoted(data.hasUserVoted);

          // Check if viewer has the follow-up capability secret
          const tokenInStorage = getFollowUpToken(data.publicReference);
          const tokenInUrl = searchParams.get('token');
          if (tokenInStorage || tokenInUrl) {
            setIsReporterTokenOwner(true);
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Gagal mengambil rincian laporan.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#111827] dark:border-[#0D9488] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Memuat jejak audit laporan #{id}...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#FEF2F2] dark:bg-[#2A1215] text-[#DC2626] flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#111827] dark:text-[#F9FAFB]">Laporan Tidak Ditemukan</h2>
        <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] max-w-md mx-auto">
          {error || `ID Laporan "${id}" tidak terdaftar atau belum diterbitkan ke basis data publik.`}
        </p>
        <button
          onClick={() => navigate('/lapor')}
          className="px-4 py-2 bg-[#111827] dark:bg-[#0D9488] text-white text-xs font-semibold rounded-lg hover:bg-[#1F2937] transition-all"
        >
          Kembali ke Observatorium Laporan
        </button>
      </div>
    );
  }

  // Relations mapping
  const facility = report.facilityId ? facilities.find(f => f.id === report.facilityId) : null;
  const agencyRelation = report.relations?.find(r => r.targetType === 'agency');
  const projectRelation = report.relations?.find(r => r.targetType === 'budget_project');
  const project = projectRelation ? budgetProjects.find(p => p.id === projectRelation.targetId) : null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleVote = async () => {
    if (hasVoted) return;
    try {
      setVoteError(null);
      const res = await voteReportPriority(report.id);
      setVoteCount(res.newCount);
      setHasVoted(true);
    } catch (err: any) {
      setVoteError(err.message || 'Gagal memberikan suara prioritas.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Breadcrumb & Actions */}
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
          <span className="font-mono-data font-semibold text-[#111827] dark:text-[#F9FAFB]">{report.publicReference}</span>
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
            onClick={() => navigate('/peta')}
            className="px-3.5 py-1.5 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <MapPin className="w-3.5 h-3.5 text-[#0D9488] dark:text-white" />
            <span>Lihat di Peta Wilayah</span>
          </button>
        </div>
      </div>

      {/* Reporter Private Capability Token Banner */}
      {isReporterTokenOwner && (
        <div className="p-4 rounded-xl bg-[#F0FDF4] dark:bg-[#062419] border border-[#BBF7D0] dark:border-[#0F5132] flex items-start gap-3 text-xs text-[#166534] dark:text-[#86EFAC]">
          <Key className="w-4 h-4 shrink-0 mt-0.5 text-[#16A34A]" />
          <div className="space-y-1">
            <div className="font-bold">Akses Pelapor Terautentikasi (Token Rahasia Aktif)</div>
            <p className="text-[11px] leading-relaxed text-[#15803D] dark:text-[#BBF7D0]">
              Anda membuka laporan ini dengan hak akses pelapor. Bukti foto Anda dilindungi dalam penyimpanan aman dan tidak menampilkan data identitas pribadi ke publik.
            </p>
          </div>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-6 sm:p-8 space-y-6 transition-colors">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono-data font-bold bg-[#111827] dark:bg-[#0D9488] text-white px-2.5 py-1 rounded">
            {report.publicReference}
          </span>
          <span className="text-xs font-bold bg-[#F8F9FA] dark:bg-[#101622] text-[#111827] dark:text-[#F9FAFB] border border-[#E5E7EB] dark:border-[#243042] px-2.5 py-1 rounded inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></span>
            <span>{report.category}</span>
          </span>
          <span className="text-xs font-bold bg-[#F8F9FA] dark:bg-[#101622] text-[#111827] dark:text-[#F9FAFB] border border-[#E5E7EB] dark:border-[#243042] px-2.5 py-1 rounded inline-flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${
              report.severity === 'Kritis' ? 'bg-[#DC2626]' : report.severity === 'Sedang' ? 'bg-[#D97706]' : 'bg-[#0D9488]'
            }`}></span>
            <span>Keparahan: {report.severity}</span>
          </span>
          <span className="text-xs font-mono-data font-bold bg-[#F8F9FA] dark:bg-[#101622] text-[#4B5563] dark:text-[#94A3B8] border border-[#E5E7EB] dark:border-[#243042] px-2.5 py-1 rounded">
            Status: {report.status === 'published' ? 'Diterbitkan ke Publik' : 'Dalam Tinjauan Moderasi'}
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
              {report.facilityId && <span>({facility?.name || report.facilityId})</span>}
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-[#64748B]" />
              <span>Diobservasi {report.observedAt}</span>
            </div>
            <span>•</span>
            <div>
              Metode Lokasi: <span className="font-semibold text-[#111827] dark:text-[#F9FAFB] uppercase">{report.locationMethod || 'GPS'}</span>
              {report.isApproximateLocation && <span className="text-[#D97706] ml-1">(Perkiraan ~110m)</span>}
            </div>
          </div>
        </div>

        {/* Priority Voting Bar */}
        <div className="p-4 rounded-xl bg-[#F8F9FA] dark:bg-[#101622] border border-[#E5E7EB] dark:border-[#243042] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-sm font-extrabold text-[#111827] dark:text-[#F9FAFB] flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-[#D97706]" />
              <span>{voteCount} Suara Prioritas Warga</span>
            </div>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
              Suara warga meningkatkan urgensi tindak lanjut tanpa memanipulasi catatan audit resmi.
            </p>
            {voteError && (
              <p className="text-xs text-[#DC2626] font-medium pt-1">{voteError}</p>
            )}
          </div>

          <button
            onClick={handleVote}
            disabled={hasVoted}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shrink-0 ${
              hasVoted
                ? 'bg-[#0D9488] text-white cursor-default'
                : 'bg-[#111827] hover:bg-[#1F2937] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{hasVoted ? 'Didukung oleh Anda ✓' : '+ Berikan Suara Prioritas'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols): Evidence Photos & Append-Only Audit Trail */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Photo Evidence Section */}
          <div className="bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-6 space-y-4 transition-colors">
            <h3 className="font-extrabold text-base text-[#111827] dark:text-[#F9FAFB] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0D9488]"></span>
              <span>Bukti Fisik Lapangan Terverifikasi</span>
            </h3>

            {report.approvedMedia && report.approvedMedia.length > 0 ? (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-[#243042] bg-[#F8F9FA] dark:bg-[#101622]">
                  <img 
                    src={report.approvedMedia[0].url} 
                    alt={report.title} 
                    className="w-full h-72 sm:h-96 object-cover" 
                  />
                  <div className="p-3 bg-[#F8F9FA] dark:bg-[#101622] border-t border-[#E5E7EB] dark:border-[#243042] text-[#111827] dark:text-[#F9FAFB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono-data">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
                      <span>Koordinat Publik: {report.coordinates[0].toFixed(4)}, {report.coordinates[1].toFixed(4)}</span>
                    </div>
                    <div className="text-[11px] text-[#0D9488] font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>EXIF Dilindungi (Metadata Lokasi Asli Tersimpan Aman)</span>
                    </div>
                  </div>
                </div>

                {report.approvedMedia.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {report.approvedMedia.slice(1).map((m, idx) => (
                      <img
                        key={m.id || idx}
                        src={m.url}
                        alt={`Bukti tambahan ${idx + 2}`}
                        className="h-24 w-full object-cover rounded-lg border border-[#E5E7EB] dark:border-[#243042]"
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl p-8 border border-dashed border-[#E5E7EB] dark:border-[#243042] bg-[#F8F9FA] dark:bg-[#101622] text-center space-y-2">
                <ImageIcon className="w-8 h-8 text-[#9CA3AF] mx-auto" />
                <div className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB]">
                  Bukti Foto Dalam Antrean Moderasi
                </div>
                <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] max-w-sm mx-auto">
                  Foto yang diunggah oleh pelapor sedang diperiksa untuk memastikan tidak memuat materi privasi atau sensitif sebelum disajikan ke publik.
                </p>
              </div>
            )}

            <div className="space-y-1.5 pt-2">
              <h4 className="text-xs font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider">
                Uraian Kondisi Oleh Warga
              </h4>
              <p className="text-sm text-[#374151] dark:text-[#CBD5E1] leading-relaxed bg-[#F8F9FA] dark:bg-[#101622] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#243042]">
                {report.description}
              </p>
            </div>
          </div>

          {/* Genuine Append-Only Civic Audit Trail */}
          <div className="bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-6 sm:p-8 space-y-6 transition-colors">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#243042] pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-[#111827] dark:text-[#F9FAFB]">
                  Jejak Audit Laporan (Append-Only)
                </h3>
                <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                  Catatan peristiwa nyata yang tidak dapat diubah (immutable). Setiap pembaruan diverifikasi secara transparan.
                </p>
              </div>
              <span className="text-xs font-mono-data font-bold text-[#0D9488] bg-[#ECFDF5] dark:bg-[#064E3B] px-2.5 py-1 rounded border border-[#A7F3D0] dark:border-[#0F5132]">
                {report.events?.length || 1} Peristiwa
              </span>
            </div>

            {report.events && report.events.length > 0 ? (
              <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E7EB] dark:before:bg-[#243042]">
                {report.events.map((evt, idx) => (
                  <div key={evt.id || idx} className="relative group">
                    <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-[#0D9488] border-white dark:border-[#151D2A]" />
                    <div className="space-y-1.5 bg-[#F8F9FA] dark:bg-[#101622] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#243042]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-[#111827] dark:text-[#F9FAFB]">
                          {evt.statusBadge || evt.eventType}
                        </span>
                        <span className="text-[11px] font-mono-data font-semibold text-[#0D9488]">
                          {evt.date}
                        </span>
                      </div>
                      <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] leading-relaxed">
                        {evt.description}
                      </p>
                      <div className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] font-medium pt-1.5 border-t border-[#E5E7EB] dark:border-[#243042]">
                        Pelaksana Tindakan: <strong className="text-[#111827] dark:text-[#F9FAFB] uppercase">{evt.actorType}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#F8F9FA] dark:bg-[#101622] text-xs text-[#6B7280] dark:text-[#94A3B8]">
                Belum ada riwayat tambahan tercatat untuk laporan ini.
              </div>
            )}

            {/* Official Agency Reality Statement */}
            <div className="p-4 rounded-xl bg-[#FFFBEB] dark:bg-[#2A2010] border border-[#FDE68A] dark:border-[#78350F] flex items-start gap-3 text-xs text-[#92400E] dark:text-[#FDE68A]">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
              <div className="space-y-1">
                <div className="font-bold">Status Tindak Lanjut Resmi</div>
                <p className="text-[11px] leading-relaxed">
                  TITIK. tidak pernah mengklaim bahwa instansi telah merespons atau menyelesaikan suatu laporan kecuali ada bukti respon resmi yang tercatat di jejak audit di atas.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (1 Col): Responsible Authority & Budget Linkage */}
        <div className="space-y-6">
          
          {/* Responsible Authority Card */}
          <div className="bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-5 space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Instansi Pengampu</span>
              </div>
              <span className={`font-mono-data text-[10px] font-bold px-2 py-0.5 rounded ${
                agencyRelation?.matchStatus === 'confirmed'
                  ? 'bg-[#ECFDF5] text-[#065F46] dark:bg-[#064E3B] dark:text-[#6EE7B7]'
                  : 'bg-[#FFFBEB] text-[#92400E] dark:bg-[#78350F] dark:text-[#FDE68A]'
              }`}>
                {agencyRelation?.matchStatus === 'confirmed' ? 'TERKONFIRMASI' : 'SARAN SISTEM'}
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-[#111827] dark:text-[#F9FAFB]">
                {agencyRelation?.targetId || facility?.responsibleAgency || 'Dinas Teknis Wilayah Terkait'}
              </h4>
              <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] leading-relaxed">
                {agencyRelation?.rationale || `Instansi yang berwenang menindaklanjuti bidang ${report.category} di ${report.subdistrict}.`}
              </p>
            </div>
          </div>

          {/* Linked APBD Budget Project */}
          {project ? (
            <div className="bg-white dark:bg-[#151D2A] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-5 space-y-4 transition-colors">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-[#0D9488] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Paket APBD Terkait</span>
                </div>
                <span className={`font-mono-data text-[10px] font-bold px-2 py-0.5 rounded ${
                  projectRelation?.matchStatus === 'confirmed'
                    ? 'bg-[#ECFDF5] text-[#065F46] dark:bg-[#064E3B] dark:text-[#6EE7B7]'
                    : 'bg-[#FFFBEB] text-[#92400E] dark:bg-[#78350F] dark:text-[#FDE68A]'
                }`}>
                  {projectRelation?.matchStatus === 'confirmed' ? 'TERKONFIRMASI' : 'SARAN SISTEM'}
                </span>
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
                Laporan ini belum ditautkan ke paket proyek konstruksi spesifik. Perbaikan mengandalkan alokasi <strong>Pemeliharaan Rutin</strong> instansi pengampu.
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

          {/* Data Provenance Box */}
          <div className="bg-[#F8F9FA] dark:bg-[#101622] rounded-xl border border-[#E5E7EB] dark:border-[#243042] p-5 space-y-2 text-xs transition-colors">
            <div className="flex items-center gap-1.5 font-bold text-[#111827] dark:text-[#F9FAFB]">
              <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
              <span>Standar Integritas TITIK.</span>
            </div>
            <p className="text-[#4B5563] dark:text-[#94A3B8] leading-relaxed text-[11px]">
              Setiap catatan laporan memisahkan antara apa yang diamati warga, apa yang disarankan oleh sistem, dan apa yang telah diverifikasi oleh petugas resmi.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
