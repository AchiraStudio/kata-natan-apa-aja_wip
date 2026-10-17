import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTitik } from '../context/TitikContext';
import { BudgetBreakdownCard } from './BudgetBreakdownCard';
import { 
  X, 
  MapPin, 
  ThumbsUp, 
  Plus,
  ChevronRight
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
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Click-outside Backdrop */}
      <div 
        onClick={handleClose}
        className="fixed inset-0 bg-[#111827]/25 transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-Over Sidebar Panel */}
      <aside className="relative z-10 w-full sm:max-w-xl bg-white border-l border-[#E5E7EB] flex flex-col h-full shadow-xl">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] bg-[#F8F9FA]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4B5563]">
            {selectedFacility && (
              <>
                <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                <span>Profil Fasilitas Publik • {selectedFacility.id}</span>
              </>
            )}
            {selectedReport && (
              <>
                <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
                <span>Laporan Warga • {selectedReport.id}</span>
              </>
            )}
            {selectedProject && (
              <>
                <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
                <span>Proyek APBD • {selectedProject.code}</span>
              </>
            )}
          </div>

          <button 
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB]/60 transition-colors"
            title="Tutup panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* CASE 1: PUBLIC FACILITY PROFILE */}
          {selectedFacility && (
            <div className="space-y-6">
              <div className="relative h-48 rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6]">
                <img 
                  src={selectedFacility.photoUrl} 
                  alt={selectedFacility.name}
                  className="w-full h-full object-cover" 
                />
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 p-3 rounded-lg border border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold text-[#6B7280]">
                      {selectedFacility.sector} • {selectedFacility.subdistrict}
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#111827] leading-snug">
                      {selectedFacility.name}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-semibold text-[#111827] flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        selectedFacility.condition === 'Baik' ? 'bg-[#0D9488]' : selectedFacility.condition === 'Perlu Intervensi Kritis' ? 'bg-[#DC2626]' : 'bg-[#D97706]'
                      }`}></span>
                      <span>{selectedFacility.condition}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Structured Metadata Ledger */}
              <div className="bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] divide-y divide-[#E5E7EB] text-xs">
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
                  <span className="text-[#6B7280]">Koordinat Peta</span>
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
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                  <h4 className="font-bold text-sm text-[#111827]">
                    Laporan Warga di Lokasi Ini ({reports.filter(r => r.facilityId === selectedFacility.id).length})
                  </h4>
                  <button
                    onClick={handleReportForThisFacility}
                    className="text-xs font-semibold text-[#111827] hover:text-[#2563EB] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
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
                    className="p-3.5 rounded-xl border border-[#E5E7EB] hover:border-[#111827] transition-colors cursor-pointer bg-white space-y-1.5"
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

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <button
                  onClick={() => {
                    handleClose();
                    navigate(`/fasilitas/${selectedFacility.id}`);
                  }}
                  className="py-2.5 px-4 bg-white hover:bg-[#F3F4F6] text-[#111827] border border-[#E5E7EB] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Buka Halaman Fasilitas</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleReportForThisFacility}
                  className="py-2.5 px-4 bg-[#111827] hover:bg-[#1F2937] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>Laporkan Kerusakan</span>
                </button>
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
              <div className="rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F8F9FA]">
                <img 
                  src={selectedReport.photoUrl} 
                  alt={selectedReport.title}
                  className="w-full h-52 object-cover" 
                />
                <div className="p-3 bg-[#F8F9FA] border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                  <span className="text-[#4B5563] font-mono-data flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span>{selectedReport.coordinates[0].toFixed(4)}, {selectedReport.coordinates[1].toFixed(4)} ({selectedReport.subdistrict})</span>
                  </span>
                  <span className="text-xs font-semibold text-[#111827] flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      selectedReport.severity === 'Kritis' ? 'bg-[#DC2626]' : selectedReport.severity === 'Sedang' ? 'bg-[#D97706]' : 'bg-[#0D9488]'
                    }`}></span>
                    <span>Tingkat {selectedReport.severity}</span>
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#6B7280]">Keterangan Laporan</div>
                <p className="text-sm text-[#111827] leading-relaxed bg-[#F8F9FA] p-3.5 rounded-xl border border-[#E5E7EB]">
                  {selectedReport.description}
                </p>
              </div>

              {/* Priority Support Row */}
              <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-sm text-[#111827] font-mono-data">
                    {selectedReport.priorityVotes} Dukungan Warga
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    Tambahkan dukungan jika Anda mengalami dampak di lokasi yang sama.
                  </p>
                </div>

                <button
                  onClick={() => votePriority(selectedReport.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
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
              <div className="bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] divide-y divide-[#E5E7EB] text-xs">
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
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                  <h4 className="font-bold text-sm text-[#111827]">
                    Riwayat Penanganan (6 Tahap)
                  </h4>
                  <span className="text-xs font-mono-data font-semibold text-[#4B5563]">
                    Tahap {selectedReport.currentStep}/6
                  </span>
                </div>

                <div className="relative pl-5 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-[#E5E7EB]">
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

              <button
                onClick={() => {
                  handleClose();
                  navigate(`/lapor/${selectedReport.id}`);
                }}
                className="w-full py-2.5 px-4 bg-[#111827] hover:bg-[#1F2937] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Buka Halaman Penuh Kasus ({selectedReport.id})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
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

              <div className="bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] divide-y divide-[#E5E7EB] text-xs">
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

        </div>
      </aside>
    </div>
  );
};
