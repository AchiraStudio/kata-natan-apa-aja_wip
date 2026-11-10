import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle2, Copy, Check, ArrowRight, ArrowLeft, ImagePlus, Video, X, Loader2 } from 'lucide-react';
import { useTitik } from '../../context/useTitik';
import { useAuth } from '../../context/AuthContext';
import { NewReportInput, ReportSubmitResult } from '../../services/adapters/types';
import { ReportAttachment } from '../../types/domain';
import { hasExplicitAIGenerationMarker, hasRequiredReportEvidence } from '../../utils/reportEvidence';
import { stripExifAndCleanImage, uploadFileToSupabase } from './useMediaUpload';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { Field, Segmented, FormFooter, PrimaryButton, GhostButton, ErrorNote, INPUT_CLASS } from './ui';

interface SelectedEvidence {
  fileName: string;
  dataUrl: string;
  file?: File;
}

interface ReportFormProps {
  onSuccess: (result: ReportSubmitResult) => void;
  onCancel: () => void;
  /** True while there are entries that closing would lose. */
  onDirtyChange?: (dirty: boolean) => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({ onSuccess, onCancel, onDirtyChange }) => {
  const navigate = useNavigate();
  const { submitReport, facilities: contextFacilities } = useTitik();
  const { profile, isAuthenticated } = useAuth();
  const availableFacilities = contextFacilities || [];

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
  const [selectedFacilityValue, setSelectedFacilityValue] = useState('');
  const [customFacilityName, setCustomFacilityName] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [supportingDocuments, setSupportingDocuments] = useState<ReportAttachment[]>([]);
  const [documentError, setDocumentError] = useState('');
  const [reporterType, setReporterType] = useState<'anonymous' | 'verified_citizen'>(
    isAuthenticated ? 'verified_citizen' : 'anonymous'
  );
  const [reporterDisplayName, setReporterDisplayName] = useState('');
  const [photoEvidence, setPhotoEvidence] = useState<SelectedEvidence | null>(null);
  const [videoEvidence, setVideoEvidence] = useState<SelectedEvidence | null>(null);
  const [evidenceError, setEvidenceError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<ReportSubmitResult | null>(null);
  const [submissionError, setSubmissionError] = useState('');
  const [referenceCopied, setReferenceCopied] = useState(false);
  
  const categories = [
    'Infrastruktur',
    'Drainase & Banjir',
    'Lingkungan',
    'Penerangan Umum',
    'Kesehatan',
    'Pendidikan',
    'Lainnya',
  ];

  // Filter facilities based on selected sector category (Tier 2 Cascading)
  const sectorFacilities = React.useMemo(() => {
    const c = category.toLowerCase();
    return availableFacilities.filter((f) => {
      const fc = f.category.toLowerCase();
      if (c === 'infrastruktur') return fc.includes('infra') || fc.includes('jalan');
      if (c.includes('drainase') || c.includes('banjir')) return fc.includes('drainase') || fc.includes('banjir');
      if (c.includes('lingkungan') || c.includes('taman')) return fc.includes('lingkungan') || fc.includes('taman');
      if (c.includes('penerangan') || c.includes('pju')) return fc.includes('penerangan') || fc.includes('pju');
      if (c.includes('kesehatan')) return fc.includes('kesehatan');
      if (c.includes('pendidikan')) return fc.includes('pendidikan');
      return true;
    });
  }, [availableFacilities, category]);

  // Selected registered facility object (if not 'other')
  const selectedRegisteredFacility = React.useMemo(() => {
    if (!selectedFacilityValue || selectedFacilityValue === '__other__') return null;
    return availableFacilities.find((f) => f.name === selectedFacilityValue) || null;
  }, [selectedFacilityValue, availableFacilities]);

  // Fuzzy matching recommendation to prevent duplicate entries
  const fuzzyMatch = React.useMemo(() => {
    if (selectedFacilityValue !== '__other__' || !customFacilityName.trim() || customFacilityName.trim().length < 3) {
      return null;
    }
    const q = customFacilityName.trim().toLowerCase();
    return (
      availableFacilities.find((f) => {
        const fn = f.name.toLowerCase();
        return fn.includes(q) && fn !== q;
      }) || null
    );
  }, [selectedFacilityValue, customFacilityName, availableFacilities]);

  const handleSelectFacility = (val: string) => {
    setSelectedFacilityValue(val);
    if (val === '__other__') {
      setFacilityName(customFacilityName.trim());
    } else if (val) {
      setFacilityName(val);
      const matched = availableFacilities.find((f) => f.name === val);
      if (matched) {
        if (!address.trim()) {
          setAddress(matched.address);
        }
        if (matched.latitude && matched.longitude) {
          setLatitude(matched.latitude);
          setLongitude(matched.longitude);
        }
      }
    } else {
      setFacilityName('');
    }
  };

  const handleCustomFacilityChange = (text: string) => {
    setCustomFacilityName(text);
    setFacilityName(text.trim());
  };

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

      const evidence: SelectedEvidence = { fileName: file.name, dataUrl, file };
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
      let photoUrl = photoEvidence.dataUrl;
      let videoUrl = videoEvidence.dataUrl;

      // When Supabase storage is configured, upload actual media files directly to the post-media bucket
      if (isSupabaseConfigured) {
        try {
          if (photoEvidence.file) {
            const upPhoto = await uploadFileToSupabase(
              'post-media',
              photoEvidence.file,
              profile?.id,
              photoEvidence.fileName
            );
            if (upPhoto) photoUrl = upPhoto;
          }
          if (videoEvidence.file) {
            const upVideo = await uploadFileToSupabase(
              'post-media',
              videoEvidence.file,
              profile?.id,
              videoEvidence.fileName
            );
            if (upVideo) videoUrl = upVideo;
          }
        } catch (uploadErr) {
          console.warn('Storage upload fallback to dataUrl:', uploadErr);
        }
      }

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
        mediaUrls: [photoUrl, videoUrl],
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

  const handleCopyReference = async () => {
    if (!submissionResult?.publicReference) return;
    try {
      await navigator.clipboard.writeText(submissionResult.publicReference);
      setReferenceCopied(true);
      window.setTimeout(() => setReferenceCopied(false), 2500);
    } catch {
      // clipboard blocked: the number is selectable on screen
    }
  };

  // Only ask before closing when there is something to lose (never on the success screen)
  const isDirty = step < 4 && Boolean(title.trim() || description.trim() || address.trim() || photoEvidence || videoEvidence || supportingDocuments.length > 0);
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const STEPS = ['Masalah', 'Lokasi', 'Konfirmasi'] as const;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {step < 4 && (
        <div className="shrink-0 px-4 sm:px-6 pt-4 pb-3">
          <ol className="flex items-center gap-2" aria-label="Langkah pelaporan">
            {STEPS.map((name, i) => {
              const n = (i + 1) as 1 | 2 | 3;
              const done = step > n;
              const current = step === n;
              return (
                <li key={name} aria-current={current ? 'step' : undefined} className="flex-1 min-w-0">
                  <span className={`block h-1 rounded-full ${done || current ? 'bg-brand' : 'bg-surface-2'}`} aria-hidden="true" />
                  <span className={`mt-1.5 flex items-center gap-1.5 text-xs ${current ? 'font-semibold text-ink' : done ? 'text-ink-2' : 'text-ink-3'}`}>
                    <span className="tabular-nums">{n}</span>
                    <span className="truncate">{name}</span>
                    {done && <Check className="w-3 h-3 text-brand shrink-0" aria-hidden="true" />}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Step 1: the problem and its evidence */}
      {step === 1 && (
        <form onSubmit={handleNextStep1} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
            <Field label="Judul masalah" htmlFor="report-title">
              <input
                id="report-title"
                type="text"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Aspal amblas di depan halte"
                className={INPUT_CLASS}
                maxLength={120}
                required
              />
            </Field>

            <Field label="Kategori" htmlFor="report-category">
              <select id="report-category" value={category} onChange={(e) => setCategory(e.target.value)} className={INPUT_CLASS}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Seberapa parah?">
              <Segmented
                label="Tingkat keparahan"
                variant="cards"
                columns={4}
                value={severity}
                onChange={setSeverity}
                options={[
                  { value: 'low', label: 'Rendah', hint: 'Gangguan kecil' },
                  { value: 'medium', label: 'Sedang', hint: 'Perlu perbaikan' },
                  { value: 'high', label: 'Tinggi', hint: 'Mendesak' },
                  { value: 'critical', label: 'Kritis', hint: 'Membahayakan nyawa' },
                ]}
              />
            </Field>

            <Field label="Yang terjadi di lapangan" htmlFor="report-description" hint="Tulis faktanya: sejak kapan, ukuran kerusakan, siapa yang terdampak.">
              <textarea
                id="report-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="titik-pill-input px-3.5 py-3 text-base sm:text-sm leading-relaxed resize-y min-h-28"
                required
              />
            </Field>

            <Field label="Bukti" hint="Wajib 1 foto dan 1 video asli. Berkas dengan penanda alat AI ditolak.">
              <div className="grid grid-cols-2 gap-3">
                <EvidenceSlot
                  id="report-photo-input"
                  kind="photo"
                  label="Foto"
                  accept="image/jpeg,image/png,image/webp"
                  evidence={photoEvidence}
                  onPick={(f) => handleEvidenceFile('photo', f)}
                  onClear={() => setPhotoEvidence(null)}
                />
                <EvidenceSlot
                  id="report-video-input"
                  kind="video"
                  label="Video"
                  accept="video/mp4,video/webm,video/quicktime"
                  evidence={videoEvidence}
                  onPick={(f) => handleEvidenceFile('video', f)}
                  onClear={() => setVideoEvidence(null)}
                />
              </div>
              {evidenceError && (
                <p role="alert" className="mt-2 text-sm text-st-ditolak">
                  {evidenceError}
                </p>
              )}
            </Field>
          </div>
          <FormFooter start="Langkah 1 dari 3">
            <GhostButton onClick={onCancel}>Batal</GhostButton>
            <PrimaryButton type="submit">
              Lanjut <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </PrimaryButton>
          </FormFooter>
        </form>
      )}

      {/* Step 2: where, and which facility */}
      {step === 2 && (
        <form onSubmit={handleNextStep2} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
            <Field
              label="Alamat atau patokan"
              htmlFor="report-address"
              action={
                <button type="button" onClick={handleUseCurrentLocation} disabled={isLocating} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline underline-offset-2 disabled:opacity-60 cursor-pointer">
                  {isLocating ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" /> : <MapPin className="w-3 h-3" aria-hidden="true" />}
                  {isLocating ? 'Mencari GPS' : 'Pakai lokasi saya'}
                </button>
              }
            >
              <input
                id="report-address"
                type="text"
                autoFocus
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Contoh: Jl. Pajajaran No. 42, depan RS Mulia"
                className={INPUT_CLASS}
                required
              />
              {locationError && (
                <p role="alert" className="mt-1.5 text-sm text-st-ditolak">
                  {locationError}
                </p>
              )}
            </Field>

            <Field label="Fasilitas publik terkait" htmlFor="report-facility" optional hint={`Daftar disaring menurut kategori ${category}.`}>
              <select id="report-facility" value={selectedFacilityValue} onChange={(e) => handleSelectFacility(e.target.value)} className={INPUT_CLASS}>
                <option value="">{sectorFacilities.length > 0 ? `Pilih dari ${sectorFacilities.length} fasilitas terdaftar` : 'Belum ada fasilitas terdaftar di kategori ini'}</option>
                {sectorFacilities.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name} / {f.responsibleAgency}
                  </option>
                ))}
                <option value="__other__">Fasilitas lain yang belum terdaftar</option>
              </select>

              {selectedRegisteredFacility && (
                <p className="mt-2 rounded-lg bg-brand-soft px-3.5 py-2.5 text-sm text-ink">
                  <span className="font-semibold">{selectedRegisteredFacility.name}</span>
                  <span className="block text-xs text-ink-2">Dikelola {selectedRegisteredFacility.responsibleAgency}</span>
                </p>
              )}

              {selectedFacilityValue === '__other__' && (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={customFacilityName}
                    onChange={(e) => handleCustomFacilityChange(e.target.value)}
                    placeholder="Nama fasilitas, mis. Jembatan Gantung RT 03"
                    aria-label="Nama fasilitas baru"
                    className={INPUT_CLASS}
                    required
                  />
                  {fuzzyMatch && (
                    <p className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3.5 py-2.5 text-sm text-ink">
                      <span className="min-w-0 truncate">
                        Maksud Anda <strong>{fuzzyMatch.name}</strong>?
                      </span>
                      <button type="button" onClick={() => handleSelectFacility(fuzzyMatch.name)} className="shrink-0 h-8 px-3 rounded-lg bg-brand text-on-brand text-xs font-semibold hover:bg-brand-hover cursor-pointer">
                        Pilih ini
                      </button>
                    </p>
                  )}
                  <p className="text-xs text-ink-3">Fasilitas baru diperiksa admin sebelum masuk katalog resmi.</p>
                </div>
              )}
            </Field>

            <Field label="Taksiran biaya perbaikan (Rp)" htmlFor="report-cost" optional>
              <input id="report-cost" type="number" inputMode="numeric" min={0} value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} placeholder="25000000" className={INPUT_CLASS} />
            </Field>

            <Field label="Dokumen pendukung" htmlFor="report-docs" optional hint="PDF, JPG, atau PNG, maksimal 5 MB per berkas.">
              <input
                id="report-docs"
                type="file"
                multiple
                accept="application/pdf,image/jpeg,image/png"
                onChange={(e) => handleSupportingDocuments(e.target.files)}
                className="block w-full text-sm text-ink-2 file:mr-3 file:h-9 file:px-3.5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-surface-2 file:text-ink file:cursor-pointer"
              />
              {documentError && (
                <p role="alert" className="mt-1.5 text-sm text-st-ditolak">
                  {documentError}
                </p>
              )}
              {supportingDocuments.length > 0 && <p className="mt-1.5 text-xs font-semibold text-ink-2">{supportingDocuments.length} dokumen dilampirkan.</p>}
            </Field>
          </div>
          <FormFooter start="Langkah 2 dari 3">
            <GhostButton onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Kembali
            </GhostButton>
            <PrimaryButton type="submit">
              Lanjut <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </PrimaryButton>
          </FormFooter>
        </form>
      )}

      {/* Step 3: who is reporting, and a last look */}
      {step === 3 && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
            <Field label="Tampil sebagai">
              <Segmented
                label="Identitas pelapor"
                variant="cards"
                value={reporterType}
                onChange={setReporterType}
                options={[
                  { value: 'anonymous', label: 'Anonim', hint: 'Nama tidak tampil. Laporan hanya tercatat di Laporan Saya pada perangkat ini.' },
                  { value: 'verified_citizen', label: 'Nama saya', hint: 'Tampilkan nama untuk menambah kredibilitas.' },
                ]}
              />
            </Field>

            {reporterType === 'verified_citizen' && (
              <Field label="Nama yang ditampilkan" htmlFor="report-name">
                <input id="report-name" type="text" value={reporterDisplayName || profile.displayName} onChange={(e) => setReporterDisplayName(e.target.value)} className={INPUT_CLASS} />
              </Field>
            )}

            <section aria-label="Ringkasan laporan" className="rounded-xl border border-line-soft p-4">
              <h3 className="font-sans text-sm font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-sm text-ink-2 line-clamp-3">{description}</p>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                <dt className="text-ink-3">Lokasi</dt>
                <dd className="text-ink break-words">{address}</dd>
                <dt className="text-ink-3">Kategori</dt>
                <dd className="text-ink">{category}</dd>
                {facilityName && (
                  <>
                    <dt className="text-ink-3">Fasilitas</dt>
                    <dd className="text-ink">{facilityName}</dd>
                  </>
                )}
                <dt className="text-ink-3">Keparahan</dt>
                <dd className="text-ink">{{ low: 'Rendah', medium: 'Sedang', high: 'Tinggi', critical: 'Kritis' }[severity]}</dd>
              </dl>
            </section>

            {submissionError && <ErrorNote>{submissionError}</ErrorNote>}
          </div>
          <FormFooter start="Langkah 3 dari 3">
            <GhostButton onClick={() => setStep(2)} disabled={isSubmitting}>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Kembali
            </GhostButton>
            <PrimaryButton type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Mengirim
                </>
              ) : (
                'Kirim laporan'
              )}
            </PrimaryButton>
          </FormFooter>
        </div>
      )}

      {/* Step 4: the report number is the one thing to keep */}
      {step === 4 && submissionResult && (
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
              <button type="button" onClick={handleCopyReference} className="mt-3 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-surface text-ink text-sm font-semibold border border-line-soft hover:bg-brand-soft transition-colors cursor-pointer">
                {referenceCopied ? <Check className="w-4 h-4 text-brand" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {referenceCopied ? 'Tersalin' : 'Salin nomor'}
              </button>
            </div>
            <p className="text-xs text-ink-3">Simpan nomor ini. Dengan nomor ini, status laporan bisa dicek di halaman Lacak Laporan tanpa perlu masuk akun.</p>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-center">
              <GhostButton onClick={onCancel} className="sm:min-w-28">
                Selesai
              </GhostButton>
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
      )}
    </div>
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

/** One evidence upload tile: empty (dashed), or a preview with a remove button. */
const EvidenceSlot: React.FC<EvidenceSlotProps> = ({ id, kind, label, accept, evidence, onPick, onClear }) => (
  <div>
    <input
      type="file"
      accept={accept}
      id={id}
      className="sr-only"
      onChange={(e) => {
        onPick(e.target.files?.[0]);
        e.target.value = '';
      }}
    />
    {evidence ? (
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-2">
        {kind === 'photo' ? (
          <img src={evidence.dataUrl} alt="Foto bukti yang dipilih" className="w-full h-full object-cover" />
        ) : (
          <video src={evidence.dataUrl} muted playsInline preload="metadata" aria-label="Video bukti yang dipilih" className="w-full h-full object-cover" />
        )}
        <span className="absolute inset-x-0 bottom-0 px-2.5 py-1.5 text-xs text-white bg-black/60 truncate">{evidence.fileName}</span>
        <button type="button" onClick={onClear} aria-label={`Ganti ${label.toLowerCase()}`} className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-black/65 text-white flex items-center justify-center hover:bg-st-ditolak transition-colors cursor-pointer">
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
