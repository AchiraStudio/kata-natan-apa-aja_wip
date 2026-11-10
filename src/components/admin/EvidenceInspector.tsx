import React, { useState, useEffect } from 'react';
import { FileText, Maximize2, Play } from 'lucide-react';
import type { Report } from '../../types/domain';
import { getReportMediaType } from '../../utils/reportEvidence';
import { getPrivateEvidenceUrl } from '../../services/storageService';
import { SectionHead, formatRupiah, formatRupiahShort } from './ui';

interface EvidenceInspectorProps {
  report: Report;
  onOpenZoom: (url: string, type: 'image' | 'video', title: string, address: string) => void;
  onVerifyEvidence?: (status: 'verified' | 'rejected') => void;
  onRegisterFacility?: (name: string, category: string, address: string, lat: number, lng: number) => void;
}

const EVIDENCE_LABEL: Record<string, string> = {
  verified: 'Bukti sudah disahkan',
  rejected: 'Bukti ditandai tidak memenuhi syarat',
  unverified: 'Bukti belum diperiksa',
};

/** Photos, the description and the facts a reviewer needs before deciding. */
export const EvidenceInspector: React.FC<EvidenceInspectorProps> = ({ report, onOpenZoom, onVerifyEvidence, onRegisterFacility }) => {
  // Private bucket paths are exchanged for short-lived signed URLs
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState(false);

  useEffect(() => {
    let alive = true;
    async function resolveAttachments() {
      if (!report.mediaUrls || report.mediaUrls.length === 0) {
        setResolvedUrls({});
        return;
      }
      setLoadingUrls(true);
      const resolved: Record<string, string> = {};
      for (const urlOrPath of report.mediaUrls) {
        const isStoragePath = !/^(https?:|data:)/.test(urlOrPath);
        if (isStoragePath || urlOrPath.includes('report-evidence-private')) {
          try {
            resolved[urlOrPath] = await getPrivateEvidenceUrl(urlOrPath.replace(/^report-evidence-private\//, ''));
          } catch {
            resolved[urlOrPath] = urlOrPath;
          }
        } else {
          resolved[urlOrPath] = urlOrPath;
        }
      }
      if (alive) {
        setResolvedUrls(resolved);
        setLoadingUrls(false);
      }
    }
    resolveAttachments();
    return () => {
      alive = false;
    };
  }, [report.mediaUrls]);

  const evidenceStatus = report.evidenceVerificationStatus || report.evidence_verification_status || 'unverified';
  const address = report.location?.address || 'Lokasi tidak dicantumkan';
  const pagu = report.budgetContext?.paguAllocation;

  const facts: Array<[string, React.ReactNode]> = [
    ['Pelapor', report.reporterDisplayName || 'Anonim'],
    ['Kategori', report.category || '-'],
    ['Dinas', report.responsibleAgency || '-'],
    ['Lokasi', address],
    ['Estimasi biaya', report.estimatedCost ? formatRupiah(report.estimatedCost) : 'Belum dicantumkan'],
    ['Pagu sektor', pagu ? formatRupiahShort(pagu) : 'Tidak tercatat'],
    [
      'Fasilitas',
      report.facilityName ? (
        <span className="inline-flex flex-wrap items-baseline gap-x-2">
          {report.facilityName}
          {onRegisterFacility && (
            <button
              type="button"
              onClick={() =>
                onRegisterFacility(
                  report.facilityName!,
                  report.category,
                  report.location?.address || 'Jabodetabek',
                  report.location?.latitude || -6.5971,
                  report.location?.longitude || 106.806
                )
              }
              className="text-xs font-semibold text-brand underline underline-offset-2 cursor-pointer"
            >
              Daftarkan ke katalog
            </button>
          )}
        </span>
      ) : (
        'Tidak disebutkan'
      ),
    ],
  ];

  return (
    <section aria-label="Bukti dan rincian" className="space-y-5">
      <SectionHead
        as="h3"
        title="Bukti dan rincian"
        actions={
          onVerifyEvidence && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onVerifyEvidence('verified')}
                disabled={evidenceStatus === 'verified'}
                className="h-8 px-3 rounded-lg bg-brand text-on-brand text-xs font-semibold hover:bg-brand-hover disabled:opacity-40 disabled:cursor-default transition-colors cursor-pointer"
              >
                Sahkan bukti
              </button>
              <button
                type="button"
                onClick={() => onVerifyEvidence('rejected')}
                disabled={evidenceStatus === 'rejected'}
                className="h-8 px-3 rounded-lg bg-surface-2 text-ink text-xs font-semibold hover:bg-line disabled:opacity-40 disabled:cursor-default transition-colors cursor-pointer"
              >
                Tolak bukti
              </button>
            </div>
          )
        }
      />
      <p className="-mt-3 flex items-center gap-2 text-xs text-ink-2">
        <span
          aria-hidden="true"
          className={`w-2 h-2 rounded-full ${evidenceStatus === 'verified' ? 'bg-st-tuntas' : evidenceStatus === 'rejected' ? 'bg-st-ditolak' : 'bg-st-baru'}`}
        />
        {EVIDENCE_LABEL[evidenceStatus] ?? EVIDENCE_LABEL.unverified}
      </p>

      {report.mediaUrls && report.mediaUrls.length > 0 ? (
        <ul className="flex flex-wrap gap-2.5" aria-label="Lampiran bukti">
          {report.mediaUrls.map((original, index) => {
            const url = resolvedUrls[original] || original;
            const type = getReportMediaType(url) === 'video' ? 'video' : 'image';
            return (
              <li key={`${report.id}-evidence-${index}`} className="relative w-28 h-28 rounded-lg overflow-hidden bg-surface-2">
                {type === 'video' ? (
                  <video src={url} playsInline muted className="w-full h-full object-cover" aria-label={`Video bukti ${index + 1}`} />
                ) : (
                  <img src={url} alt={`Foto bukti ${index + 1}: ${report.title}`} className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => onOpenZoom(url, type, report.title, address)}
                  aria-label={type === 'video' ? `Putar video bukti ${index + 1}` : `Perbesar foto bukti ${index + 1}`}
                  className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 text-white opacity-0 hover:opacity-100 focus-visible:opacity-100 transition cursor-pointer"
                >
                  {type === 'video' ? <Play className="w-6 h-6" /> : <Maximize2 className="w-5 h-5" />}
                </button>
                {loadingUrls && !resolvedUrls[original] && (
                  <span className="absolute inset-0 grid place-items-center bg-black/55 text-[11px] text-white">Memuat</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-ink-2">Pelapor tidak melampirkan foto atau video.</p>
      )}

      <p className="text-sm text-ink leading-relaxed whitespace-pre-line break-words">{report.description}</p>

      <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
        {facts.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-ink-3">{label}</dt>
            <dd className="mt-0.5 text-ink break-words">{value}</dd>
          </div>
        ))}
      </dl>

      {report.supportingDocuments && report.supportingDocuments.length > 0 && (
        <div>
          <p className="text-xs text-ink-3">Dokumen pendukung</p>
          <ul className="mt-1 space-y-1">
            {report.supportingDocuments.map((doc, index) => (
              <li key={`${doc.name}-${index}`} className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-ink-3 shrink-0" aria-hidden="true" />
                <a href={doc.dataUrl} download={doc.name} className="text-brand underline underline-offset-2 truncate">
                  {doc.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
