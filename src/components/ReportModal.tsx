import React from 'react';
import { useTitik } from '../context/TitikContext';
import { ReportWorkflowForm } from './reporting/ReportWorkflowForm';
import { X } from 'lucide-react';

export const ReportModal: React.FC = () => {
  const { 
    isReportModalOpen, 
    setIsReportModalOpen, 
    preselectedFacilityForReport,
    setPreselectedFacilityForReport
  } = useTitik();

  if (!isReportModalOpen) return null;

  const handleClose = () => {
    setIsReportModalOpen(false);
    setPreselectedFacilityForReport(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="bg-white dark:bg-[#151D2A] rounded-2xl border border-[#E5E7EB] dark:border-[#243042] shadow-2xl max-w-2xl w-full overflow-hidden transition-all my-8">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] dark:border-[#243042] bg-[#F8F9FA] dark:bg-[#0B0F17] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#111827] dark:bg-[#0D9488] text-white flex items-center justify-center font-bold text-sm">
              +
            </div>
            <div>
              <h3 id="report-modal-title" className="font-extrabold text-base sm:text-lg text-[#111827] dark:text-[#F9FAFB] tracking-tight">
                Tandai Titik Masalah & Kawal Realisasi
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                Unggah bukti riil, tetapkan koordinat presisi, dan pantau jejak audit publik.
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            aria-label="Tutup form pelaporan"
            className="p-1.5 text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB] hover:bg-[#E5E7EB] dark:hover:bg-[#1C2638] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <div className="p-4 sm:p-6 max-h-[82vh] overflow-y-auto">
          <ReportWorkflowForm
            compactMode={true}
            initialFacilityId={preselectedFacilityForReport?.id}
            onCancel={handleClose}
            onSuccess={() => {
              // Submission success is shown inline with the capability token in ReportWorkflowForm
            }}
          />
        </div>
      </div>
    </div>
  );
};
