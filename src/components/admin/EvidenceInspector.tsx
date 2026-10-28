import React, { useState, useEffect } from 'react';
import { Report } from '../../types/domain';
import { getReportMediaType } from '../../utils/reportEvidence';
import { getPrivateEvidenceUrl } from '../../services/storageService';
import { Building, ZoomIn, ShieldCheck, ShieldAlert, FileText } from 'lucide-react';

interface EvidenceInspectorProps {
  report: Report;
  onOpenZoom: (url: string, type: 'image' | 'video', title: string, address: string) => void;
}

export const EvidenceInspector: React.FC<EvidenceInspectorProps> = ({
  report,
  onOpenZoom,
}) => {
  // Resolved media URLs map: stores signed URLs for private files or public URLs
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function resolveAttachments() {
      if (!report.mediaUrls || report.mediaUrls.length === 0) return;
      setLoadingUrls(true);

      const resolved: Record<string, string> = {};

      for (const urlOrPath of report.mediaUrls) {
        // Check if it is a private bucket path or needs signing
        const isPrivateStoragePath =
          !urlOrPath.startsWith('http://') &&
          !urlOrPath.startsWith('https://') &&
          !urlOrPath.startsWith('data:');

        if (isPrivateStoragePath || urlOrPath.includes('report-evidence-private')) {
          try {
            // Strip any bucket prefix if present
            const cleanPath = urlOrPath.replace(/^report-evidence-private\//, '');
            const signed = await getPrivateEvidenceUrl(cleanPath);
            resolved[urlOrPath] = signed;
          } catch (err) {
            console.warn('Could not resolve signed URL for private evidence:', urlOrPath, err);
            resolved[urlOrPath] = urlOrPath;
          }
        } else {
          resolved[urlOrPath] = urlOrPath;
        }
      }

      if (isMounted) {
        setResolvedUrls(resolved);
        setLoadingUrls(false);
      }
    }

    resolveAttachments();

    return () => {
      isMounted = false;
    };
  }, [report.mediaUrls]);

  const evidenceStatus =
    report.evidenceVerificationStatus || report.evidence_verification_status || 'unverified';

  return (
    <div className="space-y-4">
      {/* Evidence Verification Badge Strip */}
      <div className="flex items-center justify-between text-xs pb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#686B65] dark:text-[#9EACA3]">
          Bukti Fisik & Deskripsi
        </span>
        <div className="flex items-center gap-1.5">
          {evidenceStatus === 'verified' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Bukti Terverifikasi
            </span>
          ) : evidenceStatus === 'rejected' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
              <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
              Bukti Tidak Memenuhi Syarat
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700">
              Menunggu Validasi Bukti
            </span>
          )}
        </div>
      </div>

      {/* Evidence Media Gallery with Zoom Overlay */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {report.mediaUrls && report.mediaUrls.length > 0 && (
          <div className="flex flex-wrap gap-2.5 shrink-0">
            {report.mediaUrls.map((originalUrl, index) => {
              const displayUrl = resolvedUrls[originalUrl] || originalUrl;
              const mediaType = getReportMediaType(displayUrl);

              return (
                <div
                  key={`${report.id}-evidence-${index}`}
                  className="relative group cursor-pointer overflow-hidden rounded-2xl border border-[#E4E2DA] dark:border-[#26352E] shadow-2xs bg-neutral-100 dark:bg-neutral-900"
                >
                  {mediaType === 'video' ? (
                    <div className="w-24 h-24 relative flex items-center justify-center bg-black rounded-2xl">
                      <video
                        src={displayUrl}
                        playsInline
                        className="w-full h-full object-cover rounded-2xl"
                        aria-label={`Video bukti ${index + 1} ${report.title}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onOpenZoom(displayUrl, 'video', report.title, report.location.address)
                        }
                        aria-label={`Buka video bukti ${index + 1}`}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-colors"
                      >
                        <ZoomIn className="w-5 h-5 text-white drop-shadow-md group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 relative">
                      <img
                        src={displayUrl}
                        alt={`Foto bukti ${index + 1} ${report.title}`}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onOpenZoom(displayUrl, 'image', report.title, report.location.address)
                        }
                        aria-label={`Perbesar foto bukti ${index + 1}`}
                        className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors cursor-zoom-in"
                      >
                        <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 drop-shadow-md group-hover:scale-110 transition-all" />
                      </button>
                    </div>
                  )}
                  {loadingUrls && !resolvedUrls[originalUrl] && (
                    <div className="absolute inset-0 bg-neutral-900/60 flex items-center justify-center text-[10px] text-white">
                      Memuat...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Editorial Description & Citizen Author Info */}
        <div className="text-xs space-y-2 flex-1 min-w-0">
          <p className="text-[#20221D] dark:text-[#F3F6F4] leading-relaxed break-words whitespace-pre-line">
            {report.description}
          </p>
          <div className="text-[11px] text-[#686B65] dark:text-[#9EACA3] pt-1">
            Pelapor:{' '}
            <span className="font-semibold text-[#20221D] dark:text-[#F3F6F4]">
              {report.reporterDisplayName || 'Anonim'}
            </span>{' '}
            • Sektor:{' '}
            <span className="font-semibold text-[#20221D] dark:text-[#F3F6F4]">
              {report.category}
            </span>
          </div>
        </div>
      </div>

      {/* 3-Column Consolidated Metadata Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#F7F6F1]/80 dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-2xl text-xs">
        <div>
          <div className="text-[10px] uppercase font-bold text-[#686B65] dark:text-[#9EACA3]">
            Dinas & Pagu
          </div>
          <div className="font-semibold text-[#20221D] dark:text-[#F3F6F4] mt-0.5 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[#263F35] dark:text-[#34D399] shrink-0" />
            <span className="truncate">{report.responsibleAgency}</span>
          </div>
          <div className="text-[11px] font-mono tabular-nums text-[#263F35] dark:text-[#34D399] font-semibold mt-0.5">
            Alokasi: Rp {((report.budgetContext?.paguAllocation || 0) / 1000000000).toFixed(1)} M
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase font-bold text-[#686B65] dark:text-[#9EACA3]">
            Estimasi Biaya
          </div>
          <div className="font-semibold tabular-nums text-[#20221D] dark:text-[#F3F6F4] mt-0.5">
            {report.estimatedCost
              ? `Rp ${report.estimatedCost.toLocaleString('id-ID')}`
              : 'Belum dicantumkan'}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase font-bold text-[#686B65] dark:text-[#9EACA3]">
            Dokumen Pendukung
          </div>
          {report.supportingDocuments && report.supportingDocuments.length > 0 ? (
            <ul className="mt-0.5 space-y-1">
              {report.supportingDocuments.map((document, index) => (
                <li key={`${document.name}-${index}`} className="flex items-center gap-1">
                  <FileText className="w-3 h-3 text-[#263F35] dark:text-[#34D399] shrink-0" />
                  <a
                    href={document.dataUrl}
                    download={document.name}
                    className="text-[#263F35] dark:text-[#34D399] underline underline-offset-2 break-all truncate text-[11px]"
                  >
                    {document.name}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="font-medium text-[#686B65] dark:text-[#9EACA3] mt-0.5">
              Tidak ada lampiran
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
