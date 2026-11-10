import React, { useEffect, useMemo, useState } from 'react';
import { Select } from '../common/Select';
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

interface EvidenceItem {
  id: string;
  type: 'image' | 'video';
  fileName: string;
  dataUrl: string;
  file: File;
  uploadFile: Blob;
  sizeBytes: number;
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
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
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
      evidenceList.length > 0 ||
      supportingDocuments.length
  );

  useEffect(() => {
    onDirtyChange?.(isDirty && !submissionResult);
  }, [isDirty, onDirtyChange, submissionResult]);

  const handleEvidenceFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setEvidenceError('');

    const newFiles = Array.from(files);
    if (evidenceList.length + newFiles.length > 10) {
      setEvidenceError('Maksimal 10 berkas media bukti per laporan.');
      return;
    }

    const MAX_SIZE = 100 * 1024 * 1024;
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    const added: EvidenceItem[] = [];

    for (const file of newFiles) {
      const isImg = allowedImageTypes.includes(file.type);
      const isVid = allowedVideoTypes.includes(file.type);

      if (!isImg && !isVid) {
        setEvidenceError(`Format "${file.name}" tidak didukung. Gunakan JPG, PNG, WebP, MP4, WebM, atau MOV.`);
        continue;
      }

      if (file.size > MAX_SIZE) {
        setEvidenceError(`Ukuran berkas "${file.name}" melebihi batas 100 MB.`);
        continue;
      }

      try {
        const buffer = await file.arrayBuffer();
        if (hasExplicitAIGenerationMarker(new Uint8Array(buffer))) {
          setEvidenceError(`Berkas "${file.name}" memiliki penanda alat generatif AI dan tidak dapat digunakan.`);
          continue;
        }

        let uploadFile: Blob = file;
        let fileName = file.name;
        const dataUrl = isImg
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

        added.push({
          id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: isImg ? 'image' : 'video',
          fileName,
          dataUrl,
          file,
          uploadFile,
          sizeBytes: file.size,
        });
      } catch (err) {
        console.error('Failed to read report evidence:', err);
        setEvidenceError(`Berkas "${file.name}" tidak dapat diproses.`);
      }
    }

    if (added.length > 0) {
      setEvidenceList((prev) => [...prev, ...added]);
      setEvidenceError('');
    }
  };

  const handleRemoveEvidence = (id: string) => {
    setEvidenceList((prev) => prev.filter((item) => item.id !== id));
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

    if (evidenceList.length === 0) {
      setEvidenceError('Wajib melampirkan minimal 1 bukti foto atau video lapangan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      for (const item of evidenceList) {
        if (isSupabaseConfigured) {
          const url = await uploadFileToSupabase(
            'post-media',
            item.uploadFile,
            profile.id,
            item.fileName
          );
          uploadedUrls.push(url);
        } else {
          uploadedUrls.push(item.dataUrl);
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
        reporterUserId: reporterType === 'verified_citizen' && isAuthenticated ? profile.id : undefined,
        facilityName: facilityName || undefined,
        estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
        supportingDocuments,
        reporterType,
        reporterDisplayName: reporterType === 'verified_citizen' ? reporterDisplayName.trim() : undefined,
        mediaUrls: uploadedUrls,
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
          <div className="flex flex-col-reverse sm:flex-row flex-wrap gap-2 sm:justify-center">
            <GhostButton onClick={onCancel} className="sm:min-w-24">Selesai</GhostButton>
            <button
              type="button"
              onClick={() => {
                const targetRef = submissionResult.publicReference || submissionResult.report.id;
                onCancel();
                navigate(`/laporan/${encodeURIComponent(targetRef)}`);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-surface border border-line text-ink text-sm font-semibold hover:bg-surface-2 transition-colors cursor-pointer"
            >
              Lihat detail laporan
            </button>
            <PrimaryButton
              onClick={() => {
                onCancel();
                navigate(`/track?ref=${encodeURIComponent(submissionResult.publicReference)}`);
              }}
            >
              Pantau status
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
              <Select id="report-category" value={category} onChange={setCategory} className={INPUT_CLASS}>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            </Field>
            <Field label="Tingkat keparahan" htmlFor="report-severity">
              <Select
                id="report-severity"
                value={severity}
                onChange={setSeverity}
                className={INPUT_CLASS}
              >
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
                <option value="critical">Kritis</option>
              </Select>
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
            <Select
              id="report-facility"
              value={selectedFacilityValue}
              onChange={handleSelectFacility}
              className={INPUT_CLASS}
            >
              <option value="">Pilih fasilitas (opsional)</option>
              {sectorFacilities.map((facility) => <option key={facility.id} value={facility.name}>{facility.name}</option>)}
              <option value="__other__">Fasilitas lain</option>
            </Select>
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
          <Field label="Bukti media lapangan" hint="Wajib minimal 1 bukti foto atau video (maksimal 100 MB per berkas).">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-brand text-on-brand hover:bg-brand-hover rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs">
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span>{evidenceList.length > 0 ? '+ Tambah Foto / Video Lain' : 'Pilih Foto / Video (Multi-select)'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      void handleEvidenceFiles(event.target.files);
                      event.currentTarget.value = '';
                    }}
                  />
                </label>
                <span className="text-xs text-ink-3">
                  {evidenceList.length} / 10 media terpilih
                </span>
              </div>

              {evidenceList.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {evidenceList.map((item, index) => (
                    <div
                      key={item.id}
                      className="group relative rounded-xl border border-line bg-canvas overflow-hidden flex flex-col"
                    >
                      <div className="relative aspect-video w-full bg-black/90 flex items-center justify-center overflow-hidden">
                        {item.type === 'image' ? (
                          <img
                            src={item.dataUrl}
                            alt={item.fileName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={item.dataUrl}
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        )}

                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white uppercase tracking-wider">
                            {item.type === 'image' ? 'Foto' : 'Video'}
                          </span>
                          {index === 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-lime-700 text-lime-100 shadow-xs">
                              ⭐ Cover Feed
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveEvidence(item.id)}
                          title="Hapus media ini"
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-2 flex items-center justify-between text-[10px] text-ink-2">
                        <span className="truncate max-w-[110px]" title={item.fileName}>
                          {item.fileName}
                        </span>
                        <span className="tabular-nums shrink-0">
                          {(item.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
