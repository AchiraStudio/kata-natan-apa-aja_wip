import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Sparkles, Sliders, RotateCcw, Check, Upload, Palette } from 'lucide-react';
import {
  BackgroundTarget,
  BackgroundConfig,
  PatternType,
  GradientConfig,
  GRADIENT_PRESETS,
  SVG_PATTERNS,
  getBackgroundConfig,
  saveBackgroundConfig,
  resetBackgroundConfig,
  readImageFileAsDataUrl,
} from '../../services/customBackgroundService';

interface CustomBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTarget?: BackgroundTarget;
}

const TARGETS: { id: BackgroundTarget; label: string; description: string }[] = [
  { id: 'global', label: 'Global', description: 'Tampilan latar belakang seluruh aplikasi' },
  { id: 'beranda', label: 'Beranda', description: 'Latar belakang feed beranda warga' },
  { id: 'pesan', label: 'Pesan', description: 'Latar belakang beranda kotak pesan' },
  { id: 'chat', label: 'Chat Thread', description: 'Latar belakang ruang obrolan percakapan' },
];

const PATTERNS: { id: PatternType; label: string }[] = [
  { id: 'none', label: 'Tanpa Pola' },
  { id: 'dots', label: 'Titik Halus' },
  { id: 'grid', label: 'Grid Kotak' },
  { id: 'topography', label: 'Topografi' },
  { id: 'hex', label: 'Heksagonal' },
  { id: 'lines', label: 'Garis Miring' },
  { id: 'waves', label: 'Gelombang' },
];

export const CustomBackgroundModal: React.FC<CustomBackgroundModalProps> = ({
  isOpen,
  onClose,
  initialTarget = 'chat',
}) => {
  const [activeTarget, setActiveTarget] = useState<BackgroundTarget>(initialTarget);
  const [mode, setMode] = useState<'default' | 'image' | 'gradient'>('default');
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [gradient, setGradient] = useState<GradientConfig>(GRADIENT_PRESETS[0].gradient);
  const [pattern, setPattern] = useState<PatternType>('none');
  const [patternOpacity, setPatternOpacity] = useState<number>(0.15);
  const [overlayDim, setOverlayDim] = useState<number>(0.2);
  const [blurAmount, setBlurAmount] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync target change and load saved configuration
  useEffect(() => {
    if (!isOpen) return;
    let isCurrent = true;

    (async () => {
      try {
        const saved = await getBackgroundConfig(activeTarget);
        if (!isCurrent) return;
        if (saved) {
          setMode(saved.mode === 'pattern' ? 'gradient' : saved.mode);
          setImageDataUrl(saved.imageDataUrl || '');
          if (saved.gradient) setGradient(saved.gradient);
          setPattern(saved.pattern || 'none');
          setPatternOpacity(saved.patternOpacity ?? 0.15);
          setOverlayDim(saved.overlayDim ?? 0.2);
          setBlurAmount(saved.blurAmount ?? 0);
        } else {
          setMode('default');
          setImageDataUrl('');
          setGradient(GRADIENT_PRESETS[0].gradient);
          setPattern('none');
          setPatternOpacity(0.15);
          setOverlayDim(0.2);
          setBlurAmount(0);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      isCurrent = false;
    };
  }, [isOpen, activeTarget]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setImageDataUrl(dataUrl);
      setMode('image');
      setNotice(null);
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : 'Gagal memuat gambar.');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (mode === 'default') {
        await resetBackgroundConfig(activeTarget);
      } else {
        const config: BackgroundConfig = {
          target: activeTarget,
          mode,
          imageDataUrl: mode === 'image' ? imageDataUrl : undefined,
          gradient: mode === 'gradient' ? gradient : undefined,
          pattern,
          patternOpacity,
          overlayDim,
          blurAmount,
          updatedAt: Date.now(),
        };
        await saveBackgroundConfig(config);
      }
      setNotice('Pengaturan latar belakang tersimpan!');
      setTimeout(() => {
        setNotice(null);
        onClose();
      }, 700);
    } catch {
      setNotice('Gagal menyimpan latar belakang.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      await resetBackgroundConfig(activeTarget);
      setMode('default');
      setImageDataUrl('');
      setGradient(GRADIENT_PRESETS[0].gradient);
      setPattern('none');
      setOverlayDim(0.2);
      setBlurAmount(0);
      setNotice('Latar belakang dikembalikan ke default.');
      setTimeout(() => setNotice(null), 1500);
    } catch {
      setNotice('Gagal mereset latar belakang.');
    } finally {
      setIsSaving(false);
    }
  };

  // Build live preview background style
  let previewBgStyle: React.CSSProperties = {};
  if (mode === 'image' && imageDataUrl) {
    previewBgStyle = {
      backgroundImage: `url("${imageDataUrl}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  } else if (mode === 'gradient') {
    let grad = `linear-gradient(${gradient.angle ?? 135}deg, ${gradient.from}, ${gradient.to})`;
    if (gradient.type === 'radial') {
      grad = `radial-gradient(circle at center, ${gradient.from}, ${gradient.to})`;
    } else if (gradient.via) {
      grad = `linear-gradient(${gradient.angle ?? 135}deg, ${gradient.from}, ${gradient.via}, ${gradient.to})`;
    }
    if (pattern !== 'none' && SVG_PATTERNS[pattern]) {
      previewBgStyle = {
        backgroundImage: `${SVG_PATTERNS[pattern]}, ${grad}`,
        backgroundSize: 'auto, cover',
      };
    } else {
      previewBgStyle = { backgroundImage: grad };
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-bg-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand/15 text-brand flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 id="custom-bg-title" className="text-base font-bold text-ink leading-tight">
                Kustomisasi Latar Belakang
              </h2>
              <p className="text-xs text-ink-3">Ubah tampilan sesuai preferensi kenyamanan visual Anda</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Tabs */}
        <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 border-b border-line/60 bg-surface-2/30 overflow-x-auto no-scrollbar">
          {TARGETS.map((t) => {
            const isActive = activeTarget === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTarget(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand text-on-brand shadow-sm'
                    : 'text-ink-2 hover:text-ink hover:bg-surface-2'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Target Description */}
          <div className="text-xs text-ink-2 bg-surface-2/40 px-3.5 py-2 rounded-xl border border-line/50">
            Mengatur latar: <strong className="text-ink">{TARGETS.find((t) => t.id === activeTarget)?.label}</strong> —{' '}
            {TARGETS.find((t) => t.id === activeTarget)?.description}
          </div>

          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-ink uppercase tracking-wider">Jenis Tampilan</label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setMode('default')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  mode === 'default'
                    ? 'border-brand bg-brand/10 text-brand ring-2 ring-brand/20'
                    : 'border-line bg-surface-2/50 text-ink-2 hover:border-line-soft'
                }`}
              >
                <RotateCcw className="w-5 h-5" />
                <span className="text-xs font-bold">Default Tema</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('gradient')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  mode === 'gradient'
                    ? 'border-brand bg-brand/10 text-brand ring-2 ring-brand/20'
                    : 'border-line bg-surface-2/50 text-ink-2 hover:border-line-soft'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-xs font-bold">Warna & Gradien</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('image');
                  if (!imageDataUrl && fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  mode === 'image'
                    ? 'border-brand bg-brand/10 text-brand ring-2 ring-brand/20'
                    : 'border-line bg-surface-2/50 text-ink-2 hover:border-line-soft'
                }`}
              >
                <ImageIcon className="w-5 h-5" />
                <span className="text-xs font-bold">Upload Foto</span>
              </button>
            </div>
          </div>

          {/* Mode: Image Upload */}
          {mode === 'image' && (
            <div className="space-y-3 p-4 rounded-2xl bg-surface-2/30 border border-line">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink">Foto Latar Pengguna</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 text-ink text-xs font-semibold hover:bg-line transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{imageDataUrl ? 'Ganti Foto' : 'Pilih Foto'}</span>
                </button>
              </div>

              {imageDataUrl ? (
                <div className="relative w-full h-36 rounded-xl overflow-hidden border border-line">
                  <img src={imageDataUrl} alt="Pratinjau Latar" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageDataUrl('')}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[10px] font-bold hover:bg-rose-600 transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-line flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand/50 transition-colors"
                >
                  <Upload className="w-6 h-6 text-ink-3" />
                  <p className="text-xs text-ink-3 font-medium">Klik untuk mengunggah gambar dari perangkat</p>
                  <span className="text-[10px] text-ink-3">JPG, PNG, WebP (Tersimpan aman di penyimpanan lokal)</span>
                </div>
              )}
            </div>
          )}

          {/* Mode: Gradient & Presets */}
          {mode === 'gradient' && (
            <div className="space-y-4 p-4 rounded-2xl bg-surface-2/30 border border-line">
              <div className="space-y-2">
                <span className="text-xs font-bold text-ink">Preset Gradien Estetik</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GRADIENT_PRESETS.map((preset) => {
                    const isSelected =
                      gradient.from === preset.gradient.from && gradient.to === preset.gradient.to;
                    const bgStr =
                      preset.gradient.type === 'radial'
                        ? `radial-gradient(circle, ${preset.gradient.from}, ${preset.gradient.to})`
                        : `linear-gradient(135deg, ${preset.gradient.from}, ${preset.gradient.to})`;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setGradient(preset.gradient)}
                        className={`h-11 rounded-xl px-2.5 flex items-center justify-between text-left text-xs font-semibold text-white transition-all cursor-pointer border ${
                          isSelected ? 'border-lime ring-2 ring-lime/40 shadow-sm' : 'border-white/10 hover:opacity-90'
                        }`}
                        style={{ background: bgStr }}
                      >
                        <span className="truncate drop-shadow">{preset.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-lime shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-line/40">
                <div>
                  <label className="text-[11px] text-ink-3 font-medium block mb-1">Warna Awal</label>
                  <div className="flex items-center gap-2 bg-surface px-2.5 py-1.5 rounded-xl border border-line">
                    <input
                      type="color"
                      value={gradient.from}
                      onChange={(e) => setGradient((prev) => ({ ...prev, from: e.target.value }))}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono text-ink uppercase">{gradient.from}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-ink-3 font-medium block mb-1">Warna Akhir</label>
                  <div className="flex items-center gap-2 bg-surface px-2.5 py-1.5 rounded-xl border border-line">
                    <input
                      type="color"
                      value={gradient.to}
                      onChange={(e) => setGradient((prev) => ({ ...prev, to: e.target.value }))}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono text-ink uppercase">{gradient.to}</span>
                  </div>
                </div>
              </div>

              {/* SVG Pattern Selector */}
              <div className="space-y-2 pt-2 border-t border-line/40">
                <span className="text-xs font-bold text-ink">Lapisan Pola Geometris (Pattern)</span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {PATTERNS.map((p) => {
                    const isSelected = pattern === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPattern(p.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium text-center transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-brand text-on-brand border-brand'
                            : 'bg-surface-2 text-ink-2 border-line hover:text-ink'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Adjustments: Dim & Blur (Active for both Image & Gradient) */}
          {mode !== 'default' && (
            <div className="space-y-3 p-4 rounded-2xl bg-surface-2/30 border border-line">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <Sliders className="w-4 h-4 text-brand" />
                <span>Peredam & Kenyamanan Teks</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-ink-2">
                  <span>Peredam Gelap (Overlay Dim)</span>
                  <span className="font-mono">{Math.round(overlayDim * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={overlayDim}
                  onChange={(e) => setOverlayDim(parseFloat(e.target.value))}
                  className="w-full accent-brand cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-ink-2">
                  <span>Tingkat Blur (Kelembutan Latar)</span>
                  <span className="font-mono">{blurAmount}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="16"
                  step="1"
                  value={blurAmount}
                  onChange={(e) => setBlurAmount(parseInt(e.target.value, 10))}
                  className="w-full accent-brand cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Live Preview Box */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-ink uppercase tracking-wider">Pratinjau Langsung (Live Preview)</span>
            <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-line p-3 flex flex-col justify-between">
              {/* Background layer */}
              <div
                className="absolute inset-0 transition-all duration-300"
                style={{
                  ...previewBgStyle,
                  filter: blurAmount > 0 ? `blur(${blurAmount}px)` : undefined,
                  transform: blurAmount > 0 ? 'scale(1.05)' : undefined,
                }}
              />
              {/* Dim layer */}
              {overlayDim > 0 && (
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-200"
                  style={{ backgroundColor: `rgba(0, 0, 0, ${overlayDim})` }}
                />
              )}

              {/* Sample card to test glass readability */}
              <div className="relative z-10 glass px-3.5 py-2 rounded-xl border border-line/60 self-start shadow-sm">
                <span className="text-xs font-bold text-ink">Gelembung Pesan Uji</span>
                <p className="text-[11px] text-ink-2">Teks tetap mudah dibaca berkat peredam kontras otomatis.</p>
              </div>

              <div className="relative z-10 glass-strong px-3 py-1.5 rounded-lg border border-line/40 self-end shadow-sm">
                <span className="text-[10px] font-bold text-on-lime bg-lime px-1.5 py-0.5 rounded mr-1.5">
                  Balasan
                </span>
                <span className="text-[11px] text-ink">Latar terlihat estetik dan nyaman.</span>
              </div>
            </div>
          </div>

          {notice && (
            <div className="p-3 rounded-xl bg-brand/10 border border-brand/20 text-brand text-xs font-medium text-center animate-fade-in">
              {notice}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-line bg-surface/90 backdrop-blur-md">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Terapkan Latar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
