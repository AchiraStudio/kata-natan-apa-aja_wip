import React, { useState } from 'react';
import {
  X,
  MapPin,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Shield,
  Upload,
  ChevronDown,
  BookOpen,
} from 'lucide-react';
import { useTitik } from '../../context/TitikContext';
import { useAuth } from '../../context/AuthContext';
import { NewReportInput, ReportSubmitResult } from '../../services/adapters/types';
import { ReportAttachment } from '../../types/domain';
import { hasExplicitAIGenerationMarker, hasRequiredReportEvidence } from '../../utils/reportEvidence';

interface SelectedEvidence {
  fileName: string;
  dataUrl: string;
}

export const ReportModal: React.FC = () => {
  const { reportModalOpen, closeReportModal, submitReport, facilities } = useTitik();
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
  const [showReportExample, setShowReportExample] = useState(false);

  if (!reportModalOpen) return null;

  const categories = ['Infrastruktur', 'Lingkungan', 'Pendidikan', 'Kesehatan', 'Lainnya'];

  const handleEvidenceFile = async (kind: 'photo' | 'video', file?: File) => {
    if (!file) return;

    const allowedTypes = kind === 'photo'
      ? ['image/jpeg', 'image/png', 'image/webp']
      : ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      setEvidenceError(kind === 'photo'
        ? 'Foto harus berformat JPG, PNG, atau WebP.'
        : 'Video harus berformat MP4, WebM, atau MOV.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setEvidenceError('Ukuran setiap foto dan video maksimal 10 MB.');
      return;
    }

    try {
      if (hasExplicitAIGenerationMarker(new Uint8Array(await file.arrayBuffer()))) {
        setEvidenceError('Berkas memiliki penanda eksplisit alat generatif AI pada metadata dan tidak dapat digunakan sebagai bukti.');
        return;
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error(`Gagal membaca ${file.name}`));
        reader.readAsDataURL(file);
      });
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
      setLocationError('Perangkat ini tidak mendukung akses lokasi. Isi alamat secara manual.');
      return;
    }

    setIsLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        setIsLocating(false);
      },
      () => {
        setLocationError('Lokasi tidak dapat diakses. Periksa izin lokasi atau isi alamat manual.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSupportingDocuments = async (files: FileList | null) => {
    if (!files) return;
    setDocumentError('');
    const selectedFiles = Array.from(files);
    if (supportingDocuments.length + selectedFiles.length > 5) {
      setDocumentError('Maksimal 5 dokumen pendukung.');
      return;
    }

    const validFiles = selectedFiles.filter((file) => file.size <= 10 * 1024 * 1024);
    if (validFiles.length !== selectedFiles.length) {
      setDocumentError('Ukuran setiap dokumen maksimal 10 MB.');
    }

    const documents = await Promise.all(
      validFiles.map(
        (file) =>
          new Promise<ReportAttachment>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                name: file.name,
                mimeType: file.type || 'application/octet-stream',
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
    if (!photoEvidence || !videoEvidence || !hasRequiredReportEvidence([photoEvidence.dataUrl, videoEvidence.dataUrl])) {
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
        reporterUserId: isAuthenticated ? profile.id : undefined,
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

  const resetForm = () => {
    setStep(1);
    setTitle('');
    setDescription('');
    setAddress('');
    setFacilityName('');
    setEstimatedCost('');
    setSupportingDocuments([]);
    setDocumentError('');
    setLocationError('');
    setPhotoEvidence(null);
    setVideoEvidence(null);
    setEvidenceError('');
    setSubmissionResult(null);
    setShowReportExample(false);
    closeReportModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl shadow-2xl p-6 overflow-hidden my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={resetForm}
          className="absolute top-5 right-5 p-2 rounded-full text-[#686B65] dark:text-[#9EACA3] hover:text-[#20221D] dark:hover:text-[#F3F6F4] hover:bg-[#F7F6F1] dark:hover:bg-[#131916] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E7EBDD] dark:bg-[#1A2E24] text-[#263F35] dark:text-[#34D399] text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Formulir Laporan Publik</span>
          </div>
          <h3 className="text-xl font-bold text-[#20221D] dark:text-[#F3F6F4]">
            {step === 4 ? 'Laporan Terkirim!' : 'Laporkan Masalah Infrastruktur'}
          </h3>
          <p className="text-xs text-[#686B65] dark:text-[#9EACA3] mt-1">
            {step === 1 && 'Langkah 1/3: Rincian masalah dan bukti visual foto/video.'}
            {step === 2 && 'Langkah 2/3: Titik koordinat dan alamat spesifik.'}
            {step === 3 && 'Langkah 3/3: Tinjau dan konfirmasi pengiriman.'}
            {step === 4 && 'Simpan ID dan token rahasia untuk melacak perkembangan penanganan.'}
          </p>
        </div>

        {/* STEP 1: Details & Evidence */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-4">
            <div className="rounded-2xl border border-[#D9DEC9] bg-[#F7F8F2]">
              <button
                type="button"
                aria-expanded={showReportExample}
                aria-controls="report-example"
                onClick={() => setShowReportExample((visible) => !visible)}
                className="flex w-full items-center justify-between gap-3 p-3 text-left"
              >
                <span className="flex items-center gap-2 text-xs font-semibold text-[#263F35]">
                  <BookOpen className="h-4 w-4 shrink-0" />
                  Lihat contoh laporan yang baik (simulasi)
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-[#686B65] transition-transform ${showReportExample ? 'rotate-180' : ''}`}
                />
              </button>
              {showReportExample && (
                <div id="report-example" className="space-y-2 border-t border-[#D9DEC9] px-3 pb-3 pt-2.5 text-[11px] text-[#41443D]">
                  <div>
                    <span className="font-semibold">Judul:</span> Lubang di trotoar dekat Halte Taman Kencana
                  </div>
                  <div>
                    <span className="font-semibold">Kategori & urgensi:</span> Infrastruktur • Tinggi
                  </div>
                  <div>
                    <span className="font-semibold">Lokasi:</span> Jl. Pajajaran, sekitar 20 meter di utara Halte Taman Kencana, Bogor
                  </div>
                  <p>
                    <span className="font-semibold">Deskripsi:</span> Pada Senin, 19 Oktober 2026 sekitar pukul 07.30, terlihat lubang berdiameter kira-kira 30 cm di jalur pejalan kaki. Lubang berada dekat tiang lampu dan sudah ada sejak beberapa hari terakhir. Pejalan kaki harus turun ke badan jalan untuk menghindarinya, terutama saat trotoar ramai. Mohon diperiksa dan diperbaiki agar tidak membahayakan pengguna jalan.
                  </p>
                  <p>
                    <span className="font-semibold">Bukti yang disarankan:</span> Foto asli dari lokasi yang memperlihatkan kondisi sekitar dan detail kerusakan.
                  </p>
                  <p className="font-medium text-amber-800">
                    Semua detail di atas hanya data simulasi. Ganti dengan fakta yang Anda lihat sendiri dan jangan kirim contoh ini sebagai laporan nyata.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#20221D] mb-1">Judul Laporan *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Lubang Besar di Tengah Trotoar Dekat Halte"
                className="w-full px-3.5 py-2.5 bg-[#F7F6F1] border border-[#E4E2DA] rounded-xl text-sm focus:outline-none focus:border-[#263F35]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#20221D] mb-1">Kategori Sektor *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F6F1] border border-[#E4E2DA] rounded-xl text-xs focus:outline-none focus:border-[#263F35]"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#20221D] mb-1">Tingkat Urgensi</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#F7F6F1] border border-[#E4E2DA] rounded-xl text-xs focus:outline-none focus:border-[#263F35]"
                >
                  <option value="low">Rendah (Mengganggu kenyamanan)</option>
                  <option value="medium">Sedang (Hambatan mobilitas)</option>
                  <option value="high">Tinggi (Berbahaya bagi pejalan kaki)</option>
                  <option value="critical">Kritis (Risiko cedera/darurat)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#20221D] mb-1">Estimasi Biaya (Opsional)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-[#686B65]">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="Contoh: 25000000"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#F7F6F1] border border-[#E4E2DA] rounded-xl text-sm focus:outline-none focus:border-[#263F35]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#20221D] mb-1">Deskripsi Lengkap *</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan kondisi kerusakan, dampak ke warga sekitar, dan sudah berapa lama terjadi..."
                className="w-full px-3.5 py-2.5 bg-[#F7F6F1] border border-[#E4E2DA] rounded-xl text-xs focus:outline-none focus:border-[#263F35]"
              ></textarea>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#20221D] mb-1">Foto Bukti Lapangan *</label>
                <div className="flex items-center gap-3">
                  {photoEvidence && (
                    <img
                      src={photoEvidence.dataUrl}
                      alt="Pratinjau foto bukti"
                      className="w-20 h-20 rounded-xl object-cover border border-[#E4E2DA] shrink-0"
                    />
                  )}
                  <label className="inline-flex items-center gap-2 px-3 py-2 bg-[#F7F6F1] border border-[#E4E2DA] hover:border-[#263F35] rounded-xl text-xs font-medium text-[#20221D] cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#263F35]" />
                    <span>{photoEvidence ? 'Ganti Foto' : 'Pilih Foto'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      aria-required="true"
                      onChange={(e) => {
                        void handleEvidenceFile('photo', e.target.files?.[0]);
                        e.currentTarget.value = '';
                      }}
                    />
                  </label>
                  {photoEvidence && <span className="text-[10px] text-[#686B65] truncate">{photoEvidence.fileName}</span>}
                </div>
                <p className="text-[10px] text-[#686B65] mt-1">JPG, PNG, atau WebP. Maksimal 10 MB.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#20221D] mb-1">Video Bukti Lapangan *</label>
                <div className="flex items-center gap-3">
                  {videoEvidence && (
                    <video
                      src={videoEvidence.dataUrl}
                      controls
                      playsInline
                      aria-label="Pratinjau video bukti"
                      className="w-32 h-20 rounded-xl object-cover border border-[#E4E2DA] shrink-0"
                    />
                  )}
                  <label className="inline-flex items-center gap-2 px-3 py-2 bg-[#F7F6F1] border border-[#E4E2DA] hover:border-[#263F35] rounded-xl text-xs font-medium text-[#20221D] cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#263F35]" />
                    <span>{videoEvidence ? 'Ganti Video' : 'Pilih Video'}</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      aria-required="true"
                      onChange={(e) => {
                        void handleEvidenceFile('video', e.target.files?.[0]);
                        e.currentTarget.value = '';
                      }}
                    />
                  </label>
                  {videoEvidence && <span className="text-[10px] text-[#686B65] truncate">{videoEvidence.fileName}</span>}
                </div>
                <p className="text-[10px] text-[#686B65] mt-1">MP4, WebM, atau MOV. Maksimal 10 MB.</p>
              </div>

              <p className="text-[10px] text-[#686B65]">
                Unggah dokumentasi asli yang Anda ambil sendiri. Pemeriksaan otomatis hanya dapat menolak metadata yang secara eksplisit menyebut alat generatif AI; pemeriksaan ini tidak dapat memastikan keaslian berkas.
              </p>
              {evidenceError && <p role="alert" className="text-[11px] text-rose-600">{evidenceError}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#20221D] mb-1">Dokumen Pendukung (Opsional)</label>
              <label className="inline-flex items-center gap-2 px-3 py-2 bg-[#F7F6F1] border border-[#E4E2DA] hover:border-[#263F35] rounded-xl text-xs font-medium text-[#20221D] cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-[#263F35]" />
                <span>Unggah surat RT/RW atau proposal</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    void handleSupportingDocuments(e.target.files);
                    e.currentTarget.value = '';
                  }}
                />
              </label>
              <p className="text-[10px] text-[#686B65] mt-1">PDF, DOC, DOCX, JPG, PNG. Maksimal 5 file, 10 MB per file.</p>
              {documentError && <p className="text-[11px] text-rose-600 mt-1">{documentError}</p>}
              {supportingDocuments.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {supportingDocuments.map((document, index) => (
                    <li key={`${document.name}-${index}`} className="flex items-center justify-between gap-2 text-[11px] text-[#20221D]">
                      <span className="truncate">{document.name}</span>
                      <button
                        type="button"
                        onClick={() => setSupportingDocuments((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                        className="text-rose-600 hover:text-rose-700 shrink-0"
                        aria-label={`Hapus ${document.name}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-3 border-t border-[#E4E2DA] flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-[#263F35] text-white rounded-xl text-xs font-semibold hover:bg-[#1d3129] transition-colors cursor-pointer"
              >
                <span>Lanjut ke Lokasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Location */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#20221D] mb-1.5">Fasilitas Umum Terkait</label>
              <select
                value={facilityName}
                onChange={(e) => {
                  const selected = facilities.find((facility) => facility.name === e.target.value);
                  setFacilityName(e.target.value);
                  if (selected) {
                    setAddress(selected.address);
                    setLatitude(selected.latitude);
                    setLongitude(selected.longitude);
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-[#F7F6F1] border border-[#E4E2DA] rounded-xl text-xs focus:outline-none focus:border-[#263F35]"
              >
                <option value="">Pilih fasilitas atau isi lokasi manual</option>
                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.name}>{facility.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#20221D] mb-1">Alamat atau Patokan Spesifik *</label>
                <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Contoh: Jl. Pajajaran KM 3, Seberang Ruko No. 12"
                className="w-full px-3.5 py-2.5 bg-[#F7F6F1] border border-[#E4E2DA] rounded-xl text-sm focus:outline-none focus:border-[#263F35]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#20221D] mb-1">Nama Fasilitas Terkait (Opsional)</label>
              <input
                type="text"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                placeholder="Contoh: Trotoar Samping SDN 01 Bogor"
                className="w-full px-3.5 py-2.5 bg-[#F7F6F1] border border-[#E4E2DA] rounded-xl text-xs focus:outline-none focus:border-[#263F35]"
              />
            </div>

            {/* Coordinates Selector Card */}
            <div className="p-3.5 bg-[#F7F6F1] border border-[#E4E2DA] rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#20221D]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span>Titik Koordinat GPS</span>
                </div>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="text-[11px] text-[#263F35] font-semibold hover:underline disabled:opacity-60"
                >
                  {isLocating ? 'Mencari GPS...' : 'Gunakan GPS Saya'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-white px-2.5 py-1.5 rounded-lg border border-[#E4E2DA]">
                  Lat: {latitude.toFixed(6)}
                </div>
                <div className="bg-white px-2.5 py-1.5 rounded-lg border border-[#E4E2DA]">
                  Lng: {longitude.toFixed(6)}
                </div>
              </div>
              <p className="text-[10px] text-[#686B65]">
                Koordinat presisi digunakan sistem untuk memetakan dinas penanggung jawab dan alokasi APBD terdekat.
              </p>
              {locationError && <p className="text-[11px] text-rose-600">{locationError}</p>}
            </div>

            <div className="pt-3 border-t border-[#E4E2DA] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#686B65] hover:text-[#20221D]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-[#263F35] text-white rounded-xl text-xs font-semibold hover:bg-[#1d3129] transition-colors cursor-pointer"
              >
                <span>Tinjau Ringkasan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-[#F7F6F1] border border-[#E4E2DA] rounded-2xl space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-[#686B65] uppercase font-bold tracking-wider">Judul & Sektor</span>
                <div className="font-bold text-sm text-[#20221D]">{title}</div>
                <div className="text-[#263F35] font-medium">{category} • Urgensi: {severity.toUpperCase()}</div>
              </div>

              <div>
                <span className="text-[10px] text-[#686B65] uppercase font-bold tracking-wider">Lokasi</span>
                <div className="text-[#20221D]">{address}</div>
                <div className="font-mono text-[10px] text-[#686B65]">({latitude.toFixed(4)}, {longitude.toFixed(4)})</div>
              </div>

              <div>
                <span className="text-[10px] text-[#686B65] uppercase font-bold tracking-wider">Deskripsi</span>
                <p className="text-[#20221D] line-clamp-3">{description}</p>
              </div>

              <div>
                <span className="text-[10px] text-[#686B65] uppercase font-bold tracking-wider">Bukti Lapangan</span>
                <div className="text-[#20221D]">{photoEvidence?.fileName} • {videoEvidence?.fileName}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-[#686B65] uppercase font-bold tracking-wider">Estimasi Biaya</span>
                  <div className="text-[#20221D]">{estimatedCost ? `Rp ${Number(estimatedCost).toLocaleString('id-ID')}` : 'Belum dicantumkan'}</div>
                </div>
                <div>
                  <span className="text-[10px] text-[#686B65] uppercase font-bold tracking-wider">Dokumen Pendukung</span>
                  <div className="text-[#20221D]">{supportingDocuments.length} file</div>
                </div>
              </div>
            </div>

            {/* Reporter Privacy Mode */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#20221D]">Identitas Pelapor</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReporterType('anonymous')}
                  className={`p-3 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                    reporterType === 'anonymous'
                      ? 'bg-[#E7EBDD] border-[#263F35] text-[#263F35] font-semibold'
                      : 'bg-white border-[#E4E2DA] text-[#686B65]'
                  }`}
                >
                  <div className="font-bold">Lapor Anonim</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Identitas dirahasiakan, pantau via token.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setReporterType('verified_citizen')}
                  className={`p-3 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                    reporterType === 'verified_citizen'
                      ? 'bg-[#E7EBDD] border-[#263F35] text-[#263F35] font-semibold'
                      : 'bg-white border-[#E4E2DA] text-[#686B65]'
                  }`}
                >
                  <div className="font-bold">Nama Terbuka</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Tampilkan nama warga di feed publik.</div>
                </button>
              </div>

              {reporterType === 'verified_citizen' && (
                <input
                  type="text"
                  placeholder="Nama Lengkap Anda"
                  value={reporterDisplayName}
                  onChange={(e) => setReporterDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F7F6F1] border border-[#E4E2DA] rounded-xl text-xs focus:outline-none focus:border-[#263F35]"
                />
              )}
            </div>

            <div className="pt-3 border-t border-[#E4E2DA] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#686B65] hover:text-[#20221D]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#263F35] text-white rounded-xl text-xs font-semibold hover:bg-[#1d3129] disabled:opacity-50 transition-colors cursor-pointer shadow-md"
              >
                {isSubmitting ? (
                  <span>Mengirimkan Laporan...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kirim Laporan Resmi</span>
                  </>
                )}
              </button>
            </div>
            {submissionError && <p role="alert" className="text-xs text-rose-600">{submissionError}</p>}
          </div>
        )}

        {/* STEP 4: Confirmation & Secret Token */}
        {step === 4 && submissionResult && (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-base font-bold text-[#20221D]">Laporan Berhasil Dicatat!</h4>
              <p className="text-xs text-[#686B65] mt-1 max-w-sm mx-auto">
                Laporan beserta bukti foto dan video telah tercatat. Penayangan publik mengikuti proses validasi bukti.
              </p>
            </div>

            {/* Reference Box */}
            <div className="p-4 bg-[#F7F6F1] border border-[#E4E2DA] rounded-2xl text-left space-y-3">
              <div>
                <span className="text-[10px] text-[#686B65] uppercase font-bold">ID Referensi Publik:</span>
                <div className="text-lg font-mono font-bold text-[#263F35]">
                  {submissionResult.publicReference}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[#686B65] uppercase font-bold">
                  Token Rahasia Pelacakan Anonim:
                </span>
                <div className="flex items-center justify-between gap-2 mt-1 p-2 bg-white rounded-xl border border-[#E4E2DA]">
                  <span className="font-mono text-xs font-bold text-[#20221D] select-all">
                    {submissionResult.secretFollowUpToken}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#263F35] text-white text-[10px] font-semibold hover:bg-[#1d3129] transition-colors"
                  >
                    {tokenCopied ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Tersalin!</span>
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

              <div className="flex items-start gap-2 pt-1 text-[11px] text-[#92400E]">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Simpan token rahasia ini. Token hanya ditampilkan sekali untuk privasi dan autentikasi tindak lanjut Anda.
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 bg-[#263F35] text-white rounded-xl text-xs font-semibold hover:bg-[#1d3129] transition-colors cursor-pointer"
              >
                Kembali ke Beranda
              </button>
              {profile.role === 'admin' && (
                <a
                  href="/track"
                  className="px-4 py-2.5 bg-white border border-[#E4E2DA] text-[#20221D] rounded-xl text-xs font-semibold hover:bg-[#F7F6F1] transition-colors"
                >
                  Buka Pelacakan
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
