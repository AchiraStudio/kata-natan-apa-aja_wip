import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTitik } from '../context/TitikContext';
import { Modal } from './Modal';
import { BudgetBreakdownCard } from './BudgetBreakdownCard';
import { 
  Building2, 
  MapPin, 
  ThumbsUp, 
  Plus, 
  ChevronRight, 
  FileText, 
  Coins, 
  AlertCircle 
} from 'lucide-react';

export const DetailDrawer: React.FC = () => {
  const { 
    selectedFacility, 
    setSelectedFacility, 
    selectedReport, 
    setSelectedReport, 
    selectedProject, 
    setSelectedProject,
    setIsReportModalOpen,
    setPreselectedFacilityForReport,
    votePriority,
    reports,
    budgetProjects
  } = useTitik();

  const navigate = useNavigate();
  const isOpen = Boolean(selectedFacility || selectedReport || selectedProject);

  const handleClose = () => {
    setSelectedFacility(null);
    setSelectedReport(null);
    setSelectedProject(null);
  };

  const handleReportForThisFacility = () => {
    if (selectedFacility) {
      setPreselectedFacilityForReport(selectedFacility);
      setIsReportModalOpen(true);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="3xl"
      icon={
        selectedFacility ? (
          <Building2 className="w-5 h-5 text-[#2563EB]" />
        ) : selectedReport ? (
          <AlertCircle className="w-5 h-5 text-[#DC2626]" />
        ) : selectedProject ? (
          <Coins className="w-5 h-5 text-[#D97706]" />
        ) : undefined
      }
      badge={
        selectedFacility ? (
          <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-full bg-[#2563EB]/10 text-[#2563EB] font-bold">
            {selectedFacility.id}
          </span>
        ) : selectedReport ? (
          <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-full bg-[#DC2626]/10 text-[#DC2626] font-bold">
            {selectedReport.id}
          </span>
        ) : selectedProject ? (
          <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-full bg-[#D97706]/10 text-[#D97706] font-bold">
            {selectedProject.code}
          </span>
        ) : undefined
      }
      title={
        selectedFacility 
          ? selectedFacility.name 
          : selectedReport 
            ? selectedReport.title 
            : selectedProject 
              ? selectedProject.title 
              : 'Detail Informasi'
      }
      subtitle={
        selectedFacility 
          ? `${selectedFacility.sector} • Wilayah ${selectedFacility.subdistrict}`
          : selectedReport 
            ? `${selectedReport.sector} • Wilayah ${selectedReport.subdistrict} • @${selectedReport.reporterHandle}`
            : selectedProject 
              ? `Status: ${selectedProject.status} • Sektor ${selectedProject.sector}`
              : undefined
      }
      footer={
        selectedFacility ? (
          <div className="flex flex-wrap items-center justify-between w-full gap-2">
            <button
              type="button"
              onClick={() => {
                handleClose();
                navigate(`/fasilitas/${selectedFacility.id}`);
              }}
              className="text-xs text-[#0D9488] font-bold hover:underline flex items-center gap-1 py-1"
            >
              <span>Buka Profil Lengkap Fasilitas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-2 text-xs font-semibold text-[#4B5563] hover:text-[#111827] bg-white hover:bg-[#F3F4F6] border border-[#E5E4DF] rounded-xl transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleReportForThisFacility}
                className="px-4 py-2 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-tactile active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Laporkan Masalah</span>
              </button>
            </div>
          </div>
        ) : selectedReport ? (
          <div className="flex flex-wrap items-center justify-between w-full gap-2">
            <button
              type="button"
              onClick={() => {
                handleClose();
                navigate(`/lapor/${selectedReport.id}`);
              }}
              className="text-xs text-[#0D9488] font-bold hover:underline flex items-center gap-1 py-1"
            >
              <span>Buka Dokumen Kronologi Kasus</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-2 text-xs font-semibold text-[#4B5563] hover:text-[#111827] bg-white hover:bg-[#F3F4F6] border border-[#E5E4DF] rounded-xl transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => votePriority(selectedReport.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-tactile active:scale-95 ${
                  selectedReport.userHasVoted
                    ? 'bg-[#0D9488] text-white'
                    : 'bg-[#111827] text-white hover:bg-[#1F2937]'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>{selectedReport.userHasVoted ? 'Didukung' : `Dukung Kasus (${selectedReport.priorityVotes})`}</span>
              </button>
            </div>
          </div>
        ) : selectedProject ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-[#6B7280]">
              Paket APBD Terintegrasi SIKD
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-2 text-xs font-semibold text-[#4B5563] hover:text-[#111827] bg-white hover:bg-[#F3F4F6] border border-[#E5E4DF] rounded-xl transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  navigate('/anggaran');
                }}
                className="px-4 py-2 bg-[#111827] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-tactile active:scale-95"
              >
                <span>Lihat di Ringkasan Anggaran</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#0D9488]" />
              </button>
            </div>
          </div>
        ) : undefined
      }
    >
      {/* CASE 1: PUBLIC FACILITY PROFILE */}
      {selectedFacility && (
        <div className="space-y-6">
          <div className="relative h-56 rounded-2xl overflow-hidden border border-[#E5E4DF] bg-[#F3F4F6]">
            <img 
              src={selectedFacility.photoUrl} 
              alt={selectedFacility.name}
              className="w-full h-full object-cover" 
            />
            <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-xs p-3.5 rounded-xl border border-[#E5E4DF] flex items-center justify-between shadow-sm">
              <div>
                <div className="text-[11px] font-semibold text-[#6B7280]">
                  {selectedFacility.sector} • {selectedFacility.subdistrict}
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-[#111827] leading-snug">
                  {selectedFacility.name}
                </h3>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    selectedFacility.condition === 'Baik' ? 'bg-[#0D9488]' : selectedFacility.condition === 'Perlu Intervensi Kritis' ? 'bg-[#DC2626]' : 'bg-[#D97706]'
                  }`}></span>
                  <span>{selectedFacility.condition}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Structured Metadata Ledger */}
          <div className="bg-[#FAF9F6] rounded-xl border border-[#E5E4DF] divide-y divide-[#E5E4DF] text-xs">
            <div className="p-3 flex justify-between gap-4">
              <span className="text-[#6B7280]">Alamat Lokasi</span>
              <span className="font-medium text-[#111827] text-right">{selectedFacility.address}</span>
            </div>
            <div className="p-3 flex justify-between gap-4">
              <span className="text-[#6B7280]">Instansi Penanggung Jawab</span>
              <span className="font-semibold text-[#111827] text-right">{selectedFacility.responsibleAgency}</span>
            </div>
            <div className="p-3 flex justify-between gap-4">
              <span className="text-[#6B7280]">Kapasitas Layanan</span>
              <span className="font-medium text-[#111827] text-right">{selectedFacility.serviceCapacity}</span>
            </div>
            <div className="p-3 flex justify-between gap-4">
              <span className="text-[#6B7280]">Koordinat Geospasial</span>
              <span className="font-mono-data text-[#111827]">
                {selectedFacility.coordinates[0].toFixed(4)}, {selectedFacility.coordinates[1].toFixed(4)}
              </span>
            </div>
          </div>

          {/* 4-Tier Budget Breakdown */}
          <BudgetBreakdownCard 
            budget={selectedFacility.budgetSummary}
            title="Alokasi & Realisasi APBD Fasilitas Ini"
            subtitle="Data anggaran pemeliharaan dan peningkatan sarana tahun berjalan"
          />

          {/* Linked Citizen Reports */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E4DF] pb-2">
              <h4 className="font-bold text-sm text-[#111827]">
                Laporan Warga di Lokasi Ini ({reports.filter(r => r.facilityId === selectedFacility.id).length})
              </h4>
              <button
                type="button"
                onClick={handleReportForThisFacility}
                className="text-xs font-semibold text-[#111827] hover:text-[#0D9488] flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Tambah Laporan</span>
              </button>
            </div>

            {reports.filter(r => r.facilityId === selectedFacility.id).map(rep => (
              <div 
                key={rep.id}
                onClick={() => {
                  setSelectedFacility(null);
                  setSelectedReport(rep);
                }}
                className="p-3.5 rounded-xl border border-[#E5E4DF] hover:border-[#111827] transition-all cursor-pointer bg-white space-y-1.5 shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center justify-between text-[11px] text-[#6B7280] font-mono-data">
                  <span>{rep.id} • Tahap {rep.currentStep}/6</span>
                  <span>{rep.priorityVotes} dukungan</span>
                </div>
                <h5 className="font-bold text-xs sm:text-sm text-[#111827]">
                  {rep.title}
                </h5>
                <p className="text-xs text-[#4B5563] line-clamp-2">
                  {rep.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CASE 2: CITIZEN REPORT PROFILE */}
      {selectedReport && (
        <div className="space-y-6">
          <div>
            <div className="text-xs text-[#6B7280] mb-1">
              Dilaporkan oleh <strong className="text-[#111827]">@{selectedReport.reporterHandle}</strong> • {selectedReport.reportedAt}
            </div>
            <h3 className="font-extrabold text-lg sm:text-xl text-[#111827] leading-snug">
              {selectedReport.title}
            </h3>
          </div>

          {/* Photo Evidence */}
          <div className="rounded-2xl overflow-hidden border border-[#E5E4DF] bg-[#FAF9F6]">
            <img 
              src={selectedReport.photoUrl} 
              alt={selectedReport.title}
              className="w-full h-56 object-cover" 
            />
            <div className="p-3 bg-white border-t border-[#E5E4DF] flex items-center justify-between text-xs">
              <span className="text-[#4B5563] font-mono-data flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>{selectedReport.coordinates[0].toFixed(4)}, {selectedReport.coordinates[1].toFixed(4)} ({selectedReport.subdistrict})</span>
              </span>
              <span className="text-xs font-semibold text-[#111827] flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  selectedReport.severity === 'Kritis' ? 'bg-[#DC2626]' : selectedReport.severity === 'Sedang' ? 'bg-[#D97706]' : 'bg-[#0D9488]'
                }`}></span>
                <span>Tingkat {selectedReport.severity}</span>
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-[#6B7280]">Keterangan Laporan</div>
            <p className="text-sm text-[#111827] leading-relaxed bg-[#FAF9F6] p-4 rounded-xl border border-[#E5E4DF]">
              {selectedReport.description}
            </p>
          </div>

          {/* Priority Support Row */}
          <div className="p-4 rounded-xl bg-white border border-[#E5E4DF] flex items-center justify-between gap-3 shadow-2xs">
            <div className="space-y-0.5">
              <div className="font-bold text-sm text-[#111827] font-mono-data">
                {selectedReport.priorityVotes} Dukungan Warga
              </div>
              <p className="text-xs text-[#6B7280]">
                Dukungan mempercepat verifikasi inspektorat dan jadwal perbaikan dinas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => votePriority(selectedReport.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
                selectedReport.userHasVoted
                  ? 'bg-[#0D9488] text-white'
                  : 'bg-[#111827] text-white hover:bg-[#1F2937]'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{selectedReport.userHasVoted ? 'Didukung' : 'Dukung Kasus'}</span>
            </button>
          </div>

          {/* Agency & Budget Ledger */}
          <div className="bg-[#FAF9F6] rounded-xl border border-[#E5E4DF] divide-y divide-[#E5E4DF] text-xs">
            <div className="p-3 flex justify-between gap-4">
              <span className="text-[#6B7280]">Dinas Tujuan</span>
              <span className="font-semibold text-[#111827] text-right">{selectedReport.responsibleAgency}</span>
            </div>
            <div className="p-3 flex justify-between gap-4">
              <span className="text-[#6B7280]">Tautan Proyek APBD</span>
              <span className="font-medium text-[#111827] text-right">
                {selectedReport.isBudgetLinkConfirmed ? selectedReport.linkedProjectTitle : 'Pos Pemeliharaan Rutin'}
              </span>
            </div>
          </div>

          {/* 6-Step Audit Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E4DF] pb-2">
              <h4 className="font-bold text-sm text-[#111827]">
                Riwayat Penanganan (6 Tahap)
              </h4>
              <span className="text-xs font-mono-data font-semibold text-[#4B5563]">
                Tahap {selectedReport.currentStep}/6
              </span>
            </div>

            <div className="relative pl-5 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-[#E5E4DF]">
              {selectedReport.timeline.map((step) => {
                const isDone = step.status === 'COMPLETED';
                const isCurrent = step.status === 'IN_PROGRESS';

                return (
                  <div key={step.stepNumber} className="relative">
                    <div 
                      className={`absolute -left-5 top-1 w-3 h-3 rounded-full border-2 border-white ${
                        isDone 
                          ? 'bg-[#0D9488]' 
                          : isCurrent 
                            ? 'bg-[#D97706]' 
                            : 'bg-[#D1D5DB]'
                      }`}
                    />

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-bold ${isDone || isCurrent ? 'text-[#111827]' : 'text-[#6B7280]'}`}>
                          {step.stepNumber}. {step.title}
                        </span>
                        <span className="text-[11px] text-[#6B7280] font-mono-data">
                          {step.date}
                        </span>
                      </div>
                      <p className="text-xs text-[#4B5563] leading-relaxed">
                        {step.description}
                      </p>
                      <div className="text-[11px] text-[#6B7280]">
                        Penanggung jawab: {step.actor}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CASE 3: BUDGET PROJECT DETAIL */}
      {selectedProject && (
        <div className="space-y-6">
          <div>
            <div className="text-xs text-[#6B7280] font-mono-data mb-1">
              {selectedProject.code} • Status: {selectedProject.status}
            </div>
            <h3 className="font-extrabold text-lg text-[#111827]">
              {selectedProject.title}
            </h3>
          </div>

          <div className="bg-[#FAF9F6] rounded-xl border border-[#E5E4DF] divide-y divide-[#E5E4DF] text-xs">
            <div className="p-3 flex justify-between gap-4">
              <span className="text-[#6B7280]">Kontraktor Pelaksana</span>
              <span className="font-semibold text-[#111827] text-right">{selectedProject.contractorName}</span>
            </div>
            <div className="p-3 flex justify-between gap-4">
              <span className="text-[#6B7280]">Masa Kontrak</span>
              <span className="font-mono-data text-[#111827]">{selectedProject.startDate} s.d. {selectedProject.targetEndDate}</span>
            </div>
            <div className="p-3 flex justify-between gap-4">
              <span className="text-[#6B7280]">Progres Fisik Tercatat</span>
              <span className="font-mono-data font-bold text-[#111827]">{selectedProject.progressPercent}%</span>
            </div>
          </div>

          <p className="text-xs text-[#4B5563] leading-relaxed">
            {selectedProject.description}
          </p>

          <BudgetBreakdownCard 
            budget={selectedProject.budget}
            title={`Rincian Anggaran Paket: ${selectedProject.code}`}
          />
        </div>
      )}
    </Modal>
  );
};
