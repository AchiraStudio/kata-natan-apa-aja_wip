import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CheckCircle2, Copy, ImagePlus, Loader2, MapPin, Video, X } from 'lucide-react';
import { useTitik } from '../../context/useTitik';
import { useAuth } from '../../context/AuthContext';
import type { NewReportInput, ReportSubmitResult } from '../../services/adapters/types';
import type { ReportAttachment } from '../../types/domain';
import { hasExplicitAIGenerationMarker, hasRequiredReportEvidence } from '../../utils/reportEvidence';
import { stripExifAndCleanImage, uploadFileToSupabase } from './useMediaUpload';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { ErrorNote, Field, GhostButton, INPUT_CLASS, PrimaryButton, Segmented } from './ui';

interface SelectedEvidence {
  fileName: string;
  dataUrl: string;
  file: File;
  uploadFile: Blob;
}

interface ReportFormProps {
  onSuccess: (result: ReportSubmitResult) => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

const categories = [
  'Infrastruktur',
  'Drainase & Banjir',
  'Lingkungan',
  'Penerangan Umum',
  'Kesehatan',
  'Pendidikan',
  'Lainnya',
];

export const ReportForm: React.FC<ReportFormProps> = ({ onSuccess, onCancel, onDirtyChange }) => {
  const navigate = useNavigate();
  const { submitReport, facilities } = useTitik();
  const { profile, isAuthenticated } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Infrastruktur');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(-6.595038);
  const [longitude, setLongitude] = useState(106.790422);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [selectedFacilityValue, setSelectedFacilityValue] = useState('');
  const [customFacilityName, setCustomFacilityName] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [supportingDocuments, setSupportingDocuments] = useState<ReportAttachment[]>([]);
  const [documentError, setDocumentError] = useState('');
  const [reporterType, setReporterType] = useState<'anonymous' | 'verified_citizen'>(
    isAuthenticated ? 'verified_citizen' : 'anonymous'
  );
  const [reporterDisplayName, setReporterDisplayName] = useState(profile.displayName);
  const [photoEvidence, setPhotoEvidence] = useState<SelectedEvidence | null>(null);
  const [videoEvidence, setVideoEvidence] = useState<SelectedEvidence | null>(null);
  const [evidenceError, setEvidenceError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<ReportSubmitResult | null>(null);
  const [submissionError, setSubmissionError] = useState('');
  const [referenceCopied, setReferenceCopied] = useState(false);

  const sectorFacilities = useMemo(() => {
    const selectedCategory = category.toLowerCase();
    return facilities.filter((facility) => {
      const facilityCategory = facility.category.toLowerCase();
      if (selectedCategory === 'infrastruktur') {
        return facilityCategory.includes('infra') || facilityCategory.includes('jalan');
      }
      if (selectedCategory.includes('drainase') || selectedCategory.includes('banjir')) {
        return facilityCategory.includes('drainase') || facilityCategory.includes('banjir');
      }
      if (selectedCategory.includes('lingkungan')) {
        return facilityCategory.includes('lingkungan') || facilityCategory.includes('taman');
      }
      if (selectedCategory.includes('penerangan')) {
        return facilityCategory.includes('penerangan') || facilityCategory.includes('pju');
      }
      if (selectedCategory.includes('kesehatan')) return facilityCategory.includes('kesehatan');
      if (selectedCategory.includes('pendidikan')) return facilityCategory.includes('pendidikan');
      return true;
    });
  }, [facilities, category]);

  const selectedFacility =
    facilities.find((facility) => facility.name === selectedFacilityValue) ?? null;
  const facilityName =
    selectedFacilityValue === '__other__'
      ? customFacilityName.trim()
      : selectedFacility?.name ?? '';
  const fuzzyMatch =
    selectedFacilityValue === '__other__' && customFacilityName.trim().length >= 3
      ? facilities.find((facility) => {
          const query = customFacilityName.trim().toLowerCase();
          return facility.name.toLowerCase().includes(query) && facility.name.toLowerCase() !== query;
        }) ?? null
      : null;

  const handleSelectFacility = (value: string) => {
    setSelectedFacilityValue(value);
    if (value === '__other__') return;

    setCustomFacilityName('');
    const facility = facilities.find((item) => item.name === value);
    if (!facility) return;

    if (!address.trim()) setAddress(facility.address);
    setLatitude(facility.latitude);
    setLongitude(facility.longitude);
  };

  const isDirty = Boolean(
    title.trim() ||
      description.trim() ||
      address.trim() ||
      photoEvidence ||
      videoEvidence ||
      supportingDocuments.length
  );

  useEffect(() => {
    onDirtyChange?.(isDirty && !submissionResult);
  }, [isDirty, onDirtyChange, submissionResult]);

  const handleEvidenceFile = async (kind: 'photo' | 'video', file?: File) => {
    if (!file) return;

    const allowedTypes =
      kind === 'photo'
        ? ['image/jpeg', 'image/png', 'image/webp']
        : ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      setEvidenceError(kind === 'photo' ? 'Foto harus JPG, PNG, atau WebP.' : 'Video harus MP4, WebM, atau MOV.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setEvidenceError('Ukuran setiap foto dan video maksimal 10 MB.');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      if (hasExplicitAIGenerationMarker(new Uint8Array(buffer))) {
        setEvidenceError('Berkas memiliki penanda eksplisit alat generatif AI dan tidak dapat digunakan sebagai bukti.');
        return;
      }

      let uploadFile: Blob = file;
      let fileName = file.name;
      const dataUrl =
        kind === 'photo'
          ? await stripExifAndCleanImage(file).then((cleaned) => {
              uploadFile = cleaned.blob;
              fileName = file.name.replace(/\.[^.]+$/, '.jpg');
              return cleaned.dataUrl;
            })
          : await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = () => reject(new Error(`Gagal membaca ${file.name}`));
              reader.readAsDataURL(file);
            });
      const evidence = { fileName, dataUrl, file, uploadFile };
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
      setLocationError('Perangkat tidak mendukung akses lokasi. Silakan isi alamat secara manual.');
      return;
    }

    setIsLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        if (!address.trim()) {
          setAddress(`Sekitar koordinat ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
        }
        setIsLocating(false);
      },
      (error) => {
        setLocationError(`Lokasi tidak dapat diakses: ${error.message}. Isi alamat secara manual.`);
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  };

  const handleSupportingDocuments = async (files: FileList | null) => {
    if (!files?.length) return;
    setDocumentError('');

    const chosenFiles = Array.from(files);
    if (supportingDocuments.length + chosenFiles.length > 5) {
      setDocumentError('Maksimal 5 dokumen pendukung.');
      return;
    }
    if (chosenFiles.some((file) => !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type))) {
      setDocumentError('Dokumen pendukung harus berupa PDF, JPG, atau PNG.');
      return;
    }
    if (chosenFiles.some((file) => file.size > 5 * 1024 * 1024)) {
      setDocumentError('Ukuran setiap dokumen maksimal 5 MB.');
      return;
    }

    try {
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
    } catch (error) {
      console.error('Failed to read supporting documents:', error);
      setDocumentError(error instanceof Error ? error.message : 'Gagal membaca dokumen pendukung.');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionError('');

    const photo = photoEvidence;
    const video = videoEvidence;
    if (!photo || !video || !hasRequiredReportEvidence([photo.dataUrl, video.dataUrl])) {
      setEvidenceError('Foto dan video bukti wajib diunggah sebelum mengirim laporan.');
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrl = photo.dataUrl;
      let videoUrl = video.dataUrl;
      if (isSupabaseConfigured) {
        photoUrl = await uploadFileToSupabase(
          'post-media',
          photo.uploadFile,
          profile.id,
          photo.fileName
        );
        videoUrl = await uploadFileToSupabase(
          'post-media',
          video.file,
          profile.id,
          video.fileName
        );
      }

      const input: NewReportInput = {
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        address: address.trim(),
        latitude,
        longitude,
        reporterUserId: reporterType === 'verified_citizen' && isAuthenticated ? profile.id : undefined,
        facilityName: facilityName || undefined,
        estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
        supportingDocuments,
        reporterType,
        reporterDisplayName: reporterType === 'verified_citizen' ? reporterDisplayName.trim() : undefined,
        mediaUrls: [photoUrl, videoUrl],
      };

      const result = await submitReport(input);
      setSubmissionResult(result);
      onSuccess(result);
    } catch (error) {
      console.error('Failed to submit report:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      setSubmissionError(
        errorMessage.includes('supporting_documents') && errorMessage.includes('report_private_data')
          ? 'Struktur database belum diperbarui. Jalankan migrasi 20261110000003_add_report_private_supporting_documents.sql di Supabase, lalu coba lagi.'
          : errorMessage
            ? `Laporan belum berhasil disimpan: ${errorMessage}`
            : 'Laporan belum berhasil disimpan. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReference = async () => {
    if (!submissionResult?.publicReference) return;
    try {
      await navigator.clipboard.writeText(submissionResult.publicReference);
      setReferenceCopied(true);
      window.setTimeout(() => setReferenceCopied(false), 2500);
    } catch {
      setSubmissionError('Nomor tidak dapat disalin otomatis. Silakan salin nomor yang tampil.');
    }
  };

  if (submissionResult) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-brand-soft text-brand flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-display text-2xl font-bold text-ink">Laporan terkirim</h3>
            <p className="mt-1 text-sm text-ink-2">Petugas akan memeriksa bukti Anda. Statusnya bisa dipantau kapan saja.</p>
          </div>
          <div className="rounded-xl bg-surface-2 p-4">
            <p className="text-xs text-ink-3">Nomor laporan</p>
            <p className="mt-1 titik-id text-2xl font-semibold text-ink select-all break-all">{submissionResult.publicReference}</p>
            <button
              type="button"
              onClick={handleCopyReference}
              className="mt-3 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-surface text-ink text-sm font-semibold border border-line-soft hover:bg-brand-soft transition-colors cursor-pointer"
            >
              {referenceCopied ? <Check className="w-4 h-4 text-brand" /> : <Copy className="w-4 h-4" />}
              {referenceCopied ? 'Tersalin' : 'Salin nomor'}
            </button>
          </div>
          <p className="text-xs text-ink-3">Simpan nomor ini untuk memantau status laporan tanpa perlu masuk akun.</p>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-center">
            <GhostButton onClick={onCancel} className="sm:min-w-28">Selesai</GhostButton>
            <PrimaryButton
              onClick={() => {
                onCancel();
                navigate(`/track?ref=${encodeURIComponent(submissionResult.publicReference)}`);
              }}
            >
              Lihat status laporan
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5 space-y-6">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-ink">Informasi masalah</h3>
          <Field label="Judul masalah" htmlFor="report-title">
            <input
              id="report-title"
              type="text"
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Contoh: Aspal amblas di depan halte"
              className={INPUT_CLASS}
              maxLength={120}
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kategori" htmlFor="report-category">
              <select id="report-category" value={category} onChange={(event) => setCategory(event.target.value)} className={INPUT_CLASS}>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Tingkat keparahan" htmlFor="report-severity">
              <select
                id="report-severity"
                value={severity}
                onChange={(event) => setSeverity(event.target.value as typeof severity)}
                className={INPUT_CLASS}
              >
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
                <option value="critical">Kritis</option>
              </select>
            </Field>
          </div>
          <Field label="Deskripsi" htmlFor="report-description" hint="Jelaskan kondisi, dampak, dan sejak kapan masalah terjadi.">
            <textarea
              id="report-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="titik-pill-input px-3.5 py-3 text-base sm:text-sm leading-relaxed resize-y min-h-28"
              required
            />
          </Field>
        </section>

        <section className="space-y-4 border-t border-line-soft pt-5">
          <h3 className="text-sm font-semibold text-ink">Lokasi</h3>
          <Field
            label="Alamat atau patokan"
            htmlFor="report-address"
            action={
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline disabled:opacity-60 cursor-pointer"
              >
                {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                {isLocating ? 'Mencari GPS' : 'Pakai lokasi saya'}
              </button>
            }
          >
            <input
              id="report-address"
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Contoh: Jl. Pajajaran No. 42, depan RS"
              className={INPUT_CLASS}
              required
            />
            {locationError && <p role="alert" className="mt-1.5 text-sm text-st-ditolak">{locationError}</p>}
            <p className="mt-1.5 text-xs text-ink-3">Koordinat: {latitude.toFixed(5)}, {longitude.toFixed(5)}</p>
          </Field>
          <Field label="Fasilitas publik terkait" htmlFor="report-facility" optional>
            <select
              id="report-facility"
              value={selectedFacilityValue}
              onChange={(event) => handleSelectFacility(event.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Pilih fasilitas (opsional)</option>
              {sectorFacilities.map((facility) => <option key={facility.id} value={facility.name}>{facility.name}</option>)}
              <option value="__other__">Fasilitas lain</option>
            </select>
            {selectedFacility && (
              <p className="mt-2 text-xs text-ink-2">Dikelola {selectedFacility.responsibleAgency}</p>
            )}
            {selectedFacilityValue === '__other__' && (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={customFacilityName}
                  onChange={(event) => setCustomFacilityName(event.target.value)}
                  placeholder="Nama fasilitas"
                  aria-label="Nama fasilitas"
                  className={INPUT_CLASS}
                  required
                />
                {fuzzyMatch && (
                  <button
                    type="button"
                    onClick={() => handleSelectFacility(fuzzyMatch.name)}
                    className="text-xs text-brand hover:underline"
                  >
                    Pilih fasilitas terdaftar: {fuzzyMatch.name}
                  </button>
                )}
              </div>
            )}
          </Field>
          <Field label="Taksiran biaya perbaikan (Rp)" htmlFor="report-cost" optional>
            <input
              id="report-cost"
              type="number"
              inputMode="numeric"
              min={0}
              value={estimatedCost}
              onChange={(event) => setEstimatedCost(event.target.value)}
              placeholder="Contoh: 25000000"
              className={INPUT_CLASS}
            />
          </Field>
        </section>

        <section className="space-y-4 border-t border-line-soft pt-5">
          <h3 className="text-sm font-semibold text-ink">Bukti dan pelapor</h3>
          <Field label="Bukti foto dan video" hint="Wajib satu foto dan satu video, masing-masing maksimal 10 MB.">
            <div className="grid grid-cols-2 gap-3">
              <EvidenceSlot
                id="report-photo-input"
                kind="photo"
                label="Foto"
                accept="image/jpeg,image/png,image/webp"
                evidence={photoEvidence}
                onPick={(file) => void handleEvidenceFile('photo', file)}
                onClear={() => setPhotoEvidence(null)}
              />
              <EvidenceSlot
                id="report-video-input"
                kind="video"
                label="Video"
                accept="video/mp4,video/webm,video/quicktime"
                evidence={videoEvidence}
                onPick={(file) => void handleEvidenceFile('video', file)}
                onClear={() => setVideoEvidence(null)}
              />
            </div>
            {evidenceError && <p role="alert" className="mt-2 text-sm text-st-ditolak">{evidenceError}</p>}
            <p className="mt-2 text-xs text-ink-3">Gunakan dokumentasi asli dari lokasi. Metadata yang menyebut alat generatif AI akan ditolak.</p>
          </Field>
          <Field label="Dokumen pendukung" htmlFor="report-docs" optional hint="PDF, JPG, atau PNG; maksimal 5 berkas, 5 MB per berkas.">
            <input
              id="report-docs"
              type="file"
              multiple
              accept="application/pdf,image/jpeg,image/png"
              onChange={(event) => {
                void handleSupportingDocuments(event.target.files);
                event.currentTarget.value = '';
              }}
              className="block w-full text-sm text-ink-2 file:mr-3 file:h-9 file:px-3.5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-surface-2 file:text-ink file:cursor-pointer"
            />
            {documentError && <p role="alert" className="mt-1.5 text-sm text-st-ditolak">{documentError}</p>}
            {supportingDocuments.length > 0 && (
              <ul className="mt-2 space-y-1">
                {supportingDocuments.map((document, index) => (
                  <li key={`${document.name}-${index}`} className="flex items-center justify-between gap-2 text-xs text-ink">
                    <span className="truncate">{document.name}</span>
                    <button
                      type="button"
                      onClick={() => setSupportingDocuments((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      aria-label={`Hapus ${document.name}`}
                      className="text-st-ditolak"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Field>
          <Field label="Tampil sebagai">
            <Segmented
              label="Identitas pelapor"
              variant="track"
              value={reporterType}
              onChange={setReporterType}
              options={[
                { value: 'anonymous', label: 'Anonim' },
                { value: 'verified_citizen', label: 'Nama saya' },
              ]}
            />
            <p className="mt-1.5 text-xs text-ink-3">
              {reporterType === 'anonymous'
                ? 'Identitas akun tidak ditautkan. Laporan anonim hanya tampil di Laporan Saya pada perangkat ini, bukan di profil.'
                : 'Nama ditampilkan bersama laporan dan laporan masuk ke profil Anda.'}
            </p>
          </Field>
          {reporterType === 'verified_citizen' && (
            <Field label="Nama yang ditampilkan" htmlFor="report-name">
              <input
                id="report-name"
                type="text"
                value={reporterDisplayName}
                onChange={(event) => setReporterDisplayName(event.target.value)}
                className={INPUT_CLASS}
                required
              />
            </Field>
          )}
        </section>

        {submissionError && <ErrorNote>{submissionError}</ErrorNote>}
      </div>

      <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-line-soft bg-surface">
        <GhostButton type="button" onClick={onCancel} disabled={isSubmitting}>Batal</GhostButton>
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Mengirim laporan
            </>
          ) : (
            'Kirim laporan'
          )}
        </PrimaryButton>
      </div>
    </form>
  );
};

interface EvidenceSlotProps {
  id: string;
  kind: 'photo' | 'video';
  label: string;
  accept: string;
  evidence: SelectedEvidence | null;
  onPick: (file?: File) => void;
  onClear: () => void;
}

const EvidenceSlot: React.FC<EvidenceSlotProps> = ({ id, kind, label, accept, evidence, onPick, onClear }) => (
  <div>
    <input
      type="file"
      accept={accept}
      id={id}
      className="sr-only"
      onChange={(event) => {
        onPick(event.target.files?.[0]);
        event.currentTarget.value = '';
      }}
    />
    {evidence ? (
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-2">
        {kind === 'photo' ? (
          <img src={evidence.dataUrl} alt="Pratinjau foto bukti" className="w-full h-full object-cover" />
        ) : (
          <video src={evidence.dataUrl} muted playsInline preload="metadata" aria-label="Pratinjau video bukti" className="w-full h-full object-cover" />
        )}
        <span className="absolute inset-x-0 bottom-0 px-2.5 py-1.5 text-xs text-white bg-black/60 truncate">{evidence.fileName}</span>
        <button
          type="button"
          onClick={onClear}
          aria-label={`Hapus ${label.toLowerCase()}`}
          className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-black/65 text-white flex items-center justify-center hover:bg-st-ditolak cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ) : (
      <label htmlFor={id} className="aspect-[4/3] rounded-xl border border-dashed border-line flex flex-col items-center justify-center gap-1.5 text-ink-2 hover:border-brand hover:text-brand transition-colors cursor-pointer focus-within:outline-2">
        {kind === 'photo' ? <ImagePlus className="w-6 h-6" aria-hidden="true" /> : <Video className="w-6 h-6" aria-hidden="true" />}
        <span className="text-sm font-semibold">Pilih {label.toLowerCase()}</span>
      </label>
    )}
  </div>
);
