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
} from 'lucide-react';
import { useTitik } from '../../context/TitikContext';
import { useAuth } from '../../context/AuthContext';
import { NewReportInput, ReportSubmitResult } from '../../services/adapters/types';
import { ReportAttachment } from '../../types/domain';

export const ReportModal: React.FC = () => {
  const { reportModalOpen, closeReportModal, submitReport, facilities } = useTitik();
  const { profile } = useAuth();

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
  const [mediaPreview, setMediaPreview] = useState<string>(
    'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?q=80&w=800&auto=format&fit=crop'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<ReportSubmitResult | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);

  if (!reportModalOpen) return null;

  const categories = ['Infrastruktur', 'Lingkungan', 'Pendidikan', 'Kesehatan', 'Lainnya'];

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
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setStep(3);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const input: NewReportInput = {
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        address: address.trim(),
        latitude,
        longitude,
        facilityName: facilityName.trim() || undefined,
        estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
        supportingDocuments,
        reporterType,
        reporterDisplayName: reporterType === 'verified_citizen' ? reporterDisplayName : undefined,
        mediaUrls: [mediaPreview],
      };

      const result = await submitReport(input);
      setSubmissionResult(result);
      setStep(4);
    } catch (err) {
      console.error('Failed to submit report:', err);
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
    setSubmissionResult(null);
    closeReportModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-[#E4E2DA] rounded-3xl shadow-2xl p-6 overflow-hidden my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={resetForm}
          className="absolute top-5 right-5 p-2 rounded-full text-[#686B65] hover:text-[#20221D] hover:bg-[#F7F6F1] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E7EBDD] text-[#263F35] text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Formulir Laporan Publik</span>
          </div>
          <h3 className="text-xl font-bold text-[#20221D]">
            {step === 4 ? 'Laporan Terkirim!' : 'Laporkan Masalah Infrastruktur'}
          </h3>
          <p className="text-xs text-[#686B65] mt-1">
            {step === 1 && 'Langkah 1/3: Rincian masalah dan bukti visual foto/video.'}
            {step === 2 && 'Langkah 2/3: Titik koordinat dan alamat spesifik.'}
            {step === 3 && 'Langkah 3/3: Tinjau dan konfirmasi pengiriman.'}
            {step === 4 && 'Simpan ID dan token rahasia untuk melacak perkembangan penanganan.'}
          </p>
        </div>

        {/* STEP 1: Details & Evidence */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-4">
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

            {/* Photo Evidence Picker Simulation */}
            <div>
              <label className="block text-xs font-bold text-[#20221D] mb-1">Bukti Foto / Video *</label>
              <div className="flex items-center gap-3">
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="w-20 h-20 rounded-xl object-cover border border-[#E4E2DA] shrink-0"
                />
                <div className="flex-1">
                  <label className="inline-flex items-center gap-2 px-3 py-2 bg-[#F7F6F1] border border-[#E4E2DA] hover:border-[#263F35] rounded-xl text-xs font-medium text-[#20221D] cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#263F35]" />
                    <span>Pilih Foto Bukti</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setMediaPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                  <p className="text-[10px] text-[#686B65] mt-1">
                    Format: JPG, PNG, MP4. Maks 10MB.
                  </p>
                </div>
              </div>
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
                Laporan Anda telah masuk ke antrean validasi publik dan diterbitkan ke feed sosial TITIK.
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
