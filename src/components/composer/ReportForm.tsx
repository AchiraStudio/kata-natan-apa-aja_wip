import React, { useState } from 'react';
import {
  MapPin,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Shield,
  Upload,
  
  Loader2,
} from 'lucide-react';
import { useTitik } from '../../context/useTitik';
import { useAuth } from '../../context/AuthContext';
import { NewReportInput, ReportSubmitResult } from '../../services/adapters/types';
import { ReportAttachment } from '../../types/domain';
import { hasExplicitAIGenerationMarker, hasRequiredReportEvidence } from '../../utils/reportEvidence';
import { stripExifAndCleanImage } from './useMediaUpload';

interface SelectedEvidence {
  fileName: string;
  dataUrl: string;
}

interface ReportFormProps {
  onSuccess: (result: ReportSubmitResult) => void;
  onCancel: () => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({ onSuccess, onCancel }) => {
  const { submitReport } = useTitik();
  const { profile, isAuthenticated } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Infrastruktur');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(-6.595038);
  const [longitude, setLongitude] = useState(106.790422);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [supportingDocuments, setSupportingDocuments] = useState<ReportAttachment[]>([]);
  const [documentError, setDocumentError] = useState('');
  const [reporterType, setReporterType] = useState<'anonymous' | 'verified_citizen'>('anonymous');
  const [reporterDisplayName, setReporterDisplayName] = useState('');
  const [photoEvidence, setPhotoEvidence] = useState<SelectedEvidence | null>(null);
  const [videoEvidence, setVideoEvidence] = useState<SelectedEvidence | null>(null);
  const [evidenceError, setEvidenceError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<ReportSubmitResult | null>(null);
  const [submissionError, setSubmissionError] = useState('');
  const [tokenCopied, setTokenCopied] = useState(false);
  
  const categories = ['Infrastruktur', 'Lingkungan', 'Pendidikan', 'Kesehatan', 'Lainnya'];

  const handleEvidenceFile = async (kind: 'photo' | 'video', file?: File) => {
    if (!file) return;

    const allowedTypes =
      kind === 'photo'
        ? ['image/jpeg', 'image/png', 'image/webp']
        : ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      setEvidenceError(
        kind === 'photo'
          ? 'Foto harus berformat JPG, PNG, atau WebP.'
          : 'Video harus berformat MP4, WebM, atau MOV.'
      );
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setEvidenceError('Ukuran setiap foto dan video maksimal 10 MB.');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      if (hasExplicitAIGenerationMarker(new Uint8Array(buffer))) {
        setEvidenceError(
          'Berkas memiliki penanda eksplisit alat generatif AI pada metadata dan tidak dapat digunakan sebagai bukti.'
        );
        return;
      }

      let dataUrl = '';
      if (kind === 'photo') {
        const cleaned = await stripExifAndCleanImage(file);
        dataUrl = cleaned.dataUrl;
      } else {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error(`Gagal membaca ${file.name}`));
          reader.readAsDataURL(file);
        });
      }

      const evidence = { fileName: file.name, dataUrl };
      if (kind === 'photo') setPhotoEvidence(evidence);
      else setVideoEvidence(evidence);
      setEvidenceError('');
    } catch (error) {
      console.error('Failed to read report evidence:', error);
      setEvidenceError(`Berkas ${file.name} tidak dapat dibaca. Coba pilih berkas lain.`);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Perangkat Anda tidak mendukung deteksi lokasi otomatis.');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        if (!address) {
          setAddress(
            `Sekitar koordinat ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`
          );
        }
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setLocationError(`Gagal membaca GPS: ${err.message}. Silakan isi alamat secara manual.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSupportingDocuments = async (files?: FileList | null) => {
    if (!files || files.length === 0) return;
    setDocumentError('');

    const maxFileSize = 5 * 1024 * 1024;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    const chosenFiles = Array.from(files);
    for (const file of chosenFiles) {
      if (!allowedTypes.includes(file.type)) {
        setDocumentError('Dokumen pendukung harus berupa PDF, JPG, atau PNG.');
        return;
      }
      if (file.size > maxFileSize) {
        setDocumentError(`Dokumen ${file.name} melebihi 5 MB.`);
        return;
      }
    }

    const documents = await Promise.all(
      chosenFiles.map(
        (file) =>
          new Promise<ReportAttachment>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                name: file.name,
                mimeType: file.type,
                sizeBytes: file.size,
                dataUrl: String(reader.result),
              });
            reader.onerror = () => reject(new Error(`Gagal membaca ${file.name}`));
            reader.readAsDataURL(file);
          })
      )
    );
    setSupportingDocuments((current) => [...current, ...documents]);
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    if (!hasRequiredReportEvidence([photoEvidence?.dataUrl ?? '', videoEvidence?.dataUrl ?? ''])) {
      setEvidenceError('Foto dan video bukti wajib diunggah sebelum melanjutkan.');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setStep(3);
  };

  const handleSubmit = async () => {
    if (
      !photoEvidence ||
      !videoEvidence ||
      !hasRequiredReportEvidence([photoEvidence.dataUrl, videoEvidence.dataUrl])
    ) {
      setEvidenceError('Foto dan video bukti wajib diunggah sebelum mengirim laporan.');
      setStep(1);
      return;
    }
    setIsSubmitting(true);
    setSubmissionError('');
    try {
      const input: NewReportInput = {
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        address: address.trim(),
        latitude,
        longitude,
        reporterUserId: reporterType !== 'anonymous' && isAuthenticated ? profile.id : undefined,
        facilityName: facilityName.trim() || undefined,
        estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
        supportingDocuments,
        reporterType,
        reporterDisplayName: reporterType === 'verified_citizen' ? reporterDisplayName : undefined,
        mediaUrls: [photoEvidence.dataUrl, videoEvidence.dataUrl],
      };

      const result = await submitReport(input);
      setSubmissionResult(result);
      setStep(4);
      onSuccess(result);
    } catch (error) {
      console.error('Failed to submit report:', error);
      setSubmissionError(
        error instanceof Error
          ? `Laporan belum berhasil disimpan: ${error.message}`
          : 'Laporan belum berhasil disimpan. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyToken = () => {
    if (submissionResult?.secretFollowUpToken) {
      navigator.clipboard.writeText(submissionResult.secretFollowUpToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {step < 4 && (
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DA] dark:border-[#26352E]">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610]'
                    : step > s
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'bg-[#E4E2DA]/60 dark:bg-[#1A221E] text-[#686B65]'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
            ))}
          </div>
          <span className="text-xs font-semibold text-[#686B65] dark:text-[#9EACA3]">
            Langkah {step} dari 3
          </span>
        </div>
      )}

      {/* Step 1: Basic Info & Mandatory Evidence */}
      {step === 1 && (
        <form onSubmit={handleNextStep1} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] mb-1">
              Judul Masalah
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Aspal Amblas Berbahaya di Depan Halte"
              className="w-full px-3 py-2 bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-xl text-xs text-[#20221D] dark:text-[#F3F6F4] focus:outline-hidden focus:ring-2 focus:ring-[#263F35] dark:focus:ring-[#10B981]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-xl text-xs text-[#20221D] dark:text-[#F3F6F4] focus:outline-hidden"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="dark:bg-[#1A221E]">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] mb-1">
                Tingkat Keparahan
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-3 py-2 bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-xl text-xs text-[#20221D] dark:text-[#F3F6F4] focus:outline-hidden"
              >
                <option value="low">Rendah (Gangguan kecil)</option>
                <option value="medium">Sedang (Perlu perbaikan)</option>
                <option value="high">Tinggi (Mendesak)</option>
                <option value="critical">Kritis (Membahayakan nyawa)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] mb-1">
              Deskripsi Lapangan
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan kondisi secara faktual: kronologi, ukuran kerusakan, dampak terhadap warga sekitar..."
              className="w-full px-3 py-2 bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-xl text-xs text-[#20221D] dark:text-[#F3F6F4] focus:outline-hidden focus:ring-2 focus:ring-[#263F35] dark:focus:ring-[#10B981] resize-none"
              required
            />
          </div>

          {/* Mandatory Photo + Video Evidence */}
          <div className="p-3 bg-[#F7F6F1] dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4]">
                Bukti Wajib: 1 Foto + 1 Video
              </span>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                Bebas AI
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleEvidenceFile('photo', e.target.files?.[0])}
                  className="hidden"
                  id="report-photo-input"
                />
                <label
                  htmlFor="report-photo-input"
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border border-dashed text-center cursor-pointer transition-colors ${
                    photoEvidence
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                      : 'border-[#E4E2DA] dark:border-[#26352E] hover:border-[#263F35] text-[#686B65]'
                  }`}
                >
                  <Upload className="w-4 h-4 mb-1" />
                  <span className="text-[11px] font-bold truncate max-w-[120px]">
                    {photoEvidence ? photoEvidence.fileName : 'Unggah Foto'}
                  </span>
                </label>
              </div>

              <div>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => handleEvidenceFile('video', e.target.files?.[0])}
                  className="hidden"
                  id="report-video-input"
                />
                <label
                  htmlFor="report-video-input"
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border border-dashed text-center cursor-pointer transition-colors ${
                    videoEvidence
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                      : 'border-[#E4E2DA] dark:border-[#26352E] hover:border-[#263F35] text-[#686B65]'
                  }`}
                >
                  <Upload className="w-4 h-4 mb-1" />
                  <span className="text-[11px] font-bold truncate max-w-[120px]">
                    {videoEvidence ? videoEvidence.fileName : 'Unggah Video'}
                  </span>
                </label>
              </div>
            </div>

            {evidenceError && (
              <p className="text-[11px] text-rose-600 font-medium">{evidenceError}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-[#686B65] hover:text-[#20221D] dark:hover:text-[#F3F6F4]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-xl text-xs font-bold hover:bg-[#1d3129]"
            >
              <span>Lanjut</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Location & Context */}
      {step === 2 && (
        <form onSubmit={handleNextStep2} className="space-y-3.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4]">
                Alamat / Patokan Lokasi
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="text-[11px] font-bold text-[#263F35] dark:text-[#34D399] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <MapPin className="w-3 h-3" />
                <span>{isLocating ? 'Mencari GPS...' : 'Gunakan GPS Saya'}</span>
              </button>
            </div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Contoh: Jl. Pajajaran No. 42 depan RS Mulia"
              className="w-full px-3 py-2 bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-xl text-xs text-[#20221D] dark:text-[#F3F6F4] focus:outline-hidden focus:ring-2 focus:ring-[#263F35]"
              required
            />
            {locationError && (
              <p className="text-[11px] text-rose-600 mt-1">{locationError}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] mb-1">
                Fasilitas Terkait
              </label>
              <input
                type="text"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                placeholder="Nama jembatan, jalan, sekolah..."
                className="w-full px-3 py-2 bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-xl text-xs text-[#20221D] dark:text-[#F3F6F4] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] mb-1">
                Taksiran Biaya (Rp)
              </label>
              <input
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="Opsional (contoh: 25000000)"
                className="w-full px-3 py-2 bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-xl text-xs text-[#20221D] dark:text-[#F3F6F4] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Supporting Docs */}
          <div>
            <label className="block text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] mb-1">
              Dokumen Pendukung Tambahan (Opsional)
            </label>
            <input
              type="file"
              multiple
              accept="application/pdf,image/jpeg,image/png"
              onChange={(e) => handleSupportingDocuments(e.target.files)}
              className="text-xs text-[#686B65] file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-[#E4E2DA] file:text-[#20221D]"
            />
            {documentError && (
              <p className="text-[11px] text-rose-600 mt-1">{documentError}</p>
            )}
            {supportingDocuments.length > 0 && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                {supportingDocuments.length} dokumen dilampirkan.
              </p>
            )}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#686B65] hover:text-[#20221D]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-xl text-xs font-bold hover:bg-[#1d3129]"
            >
              <span>Lanjut</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Identity & Confirmation */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] mb-1">
              Opsi Anonimitas Pelapor
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReporterType('anonymous')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  reporterType === 'anonymous'
                    ? 'border-[#263F35] dark:border-[#10B981] bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-[#E4E2DA] dark:border-[#26352E]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-[#263F35] dark:text-[#34D399]" />
                  <span className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4]">
                    Anonim
                  </span>
                </div>
                <p className="text-[11px] text-[#686B65] dark:text-[#9EACA3]">
                  Identitas dirahasiakan 100%. Lacak laporan via token rahasia.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setReporterType('verified_citizen')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  reporterType === 'verified_citizen'
                    ? 'border-[#263F35] dark:border-[#10B981] bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-[#E4E2DA] dark:border-[#26352E]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#263F35] dark:text-[#34D399]" />
                  <span className="text-xs font-bold text-[#20221D] dark:text-[#F3F6F4]">
                    Warga Terdaftar
                  </span>
                </div>
                <p className="text-[11px] text-[#686B65] dark:text-[#9EACA3]">
                  Tampilkan nama terverifikasi Anda untuk kredibilitas laporan.
                </p>
              </button>
            </div>
          </div>

          {reporterType === 'verified_citizen' && (
            <div>
              <label className="block text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] mb-1">
                Nama Tampilan Pelapor
              </label>
              <input
                type="text"
                value={reporterDisplayName || profile.displayName}
                onChange={(e) => setReporterDisplayName(e.target.value)}
                placeholder="Nama Anda"
                className="w-full px-3 py-2 bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-xl text-xs text-[#20221D] dark:text-[#F3F6F4]"
              />
            </div>
          )}

          {/* Summary Box */}
          <div className="p-3 bg-[#F7F6F1] dark:bg-[#131916] border border-[#E4E2DA] dark:border-[#26352E] rounded-xl text-xs space-y-1.5">
            <p className="font-bold text-[#20221D] dark:text-[#F3F6F4] truncate">{title}</p>
            <p className="text-[#686B65] dark:text-[#9EACA3] line-clamp-2">{description}</p>
            <p className="text-[11px] text-[#686B65] dark:text-[#9EACA3]">
              📍 {address} • {category} • Prioritas: {severity}
            </p>
          </div>

          {submissionError && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300">
              {submissionError}
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#686B65] hover:text-[#20221D]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengirim Laporan...</span>
                </>
              ) : (
                <span>Kirim Laporan Resmi</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Submission Success */}
      {step === 4 && submissionResult && (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-[#20221D] dark:text-[#F3F6F4]">
              Laporan Berhasil Diajukan!
            </h3>
            <p className="text-xs text-[#686B65] dark:text-[#9EACA3] mt-1">
              Nomor tiket resmi:{' '}
              <span className="font-mono font-bold text-[#263F35] dark:text-[#34D399]">
                {submissionResult.publicReference}
              </span>
            </p>
          </div>

          {/* Secret Follow-Up Token Box */}
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-left space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Simpan Token Pelacakan Rahasia Anda!</span>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              Token ini hanya ditampilkan satu kali. Anda membutuhkannya untuk melacak status laporan
              secara anonim.
            </p>
            <div className="flex items-center justify-between p-2 bg-white dark:bg-[#1A221E] border border-amber-300 dark:border-amber-700 rounded-lg">
              <span className="font-mono text-xs font-bold text-[#20221D] dark:text-[#F3F6F4] select-all">
                {submissionResult.secretFollowUpToken}
              </span>
              <button
                type="button"
                onClick={handleCopyToken}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#263F35] text-white rounded text-[11px] font-semibold hover:bg-[#1d3129] cursor-pointer"
              >
                {tokenCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-xl text-xs font-bold hover:bg-[#1d3129] cursor-pointer"
          >
            Selesai & Tutup
          </button>
        </div>
      )}
    </div>
  );
};
