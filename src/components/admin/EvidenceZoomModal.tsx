import React, { useState, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, MapPin } from 'lucide-react';
import { ZoomMedia } from './types';

interface EvidenceZoomModalProps {
  media: ZoomMedia | null;
  onClose: () => void;
}

const ZOOM_LEVELS = [
  { scale: 1, label: '100%', className: 'scale-100' },
  { scale: 1.25, label: '125%', className: 'scale-125' },
  { scale: 1.5, label: '150%', className: 'scale-150' },
  { scale: 2, label: '200%', className: 'scale-[2.0]' },
  { scale: 2.5, label: '250%', className: 'scale-[2.5]' },
  { scale: 3, label: '300%', className: 'scale-[3.0]' },
];

export const EvidenceZoomModal: React.FC<EvidenceZoomModalProps> = ({ media, onClose }) => {
  const [zoomIndex, setZoomIndex] = useState(0);
  const [prevMediaUrl, setPrevMediaUrl] = useState<string | null>(media?.url ?? null);

  // Reset zoom on opening new media without cascading useEffect render
  if (media && media.url !== prevMediaUrl) {
    setPrevMediaUrl(media.url);
    setZoomIndex(0);
  }

  // Handle ESC key to dismiss modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!media) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [media, handleKeyDown]);

  if (!media) return null;

  const currentZoom = ZOOM_LEVELS[zoomIndex] || ZOOM_LEVELS[0];

  const handleZoomIn = () => {
    setZoomIndex((prev) => Math.min(prev + 1, ZOOM_LEVELS.length - 1));
  };

  const handleZoomOut = () => {
    setZoomIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleResetZoom = () => {
    setZoomIndex(0);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pratinjau Bukti Resolusi Tinggi"
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Modal Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/80 border-b border-neutral-800 text-white shrink-0">
        <div className="flex items-center gap-2 min-w-0 pr-4">
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-neutral-100 truncate">{media.title}</h3>
            {media.address && (
              <div className="flex items-center gap-1 text-[11px] text-neutral-400 truncate mt-0.5">
                <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                <span className="truncate">{media.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls & Close Button */}
        <div className="flex items-center gap-2 shrink-0">
          {media.type === 'image' && (
            <div className="flex items-center bg-neutral-800 rounded-full p-1 border border-neutral-700">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomIndex === 0}
                aria-label="Perkecil"
                className="p-1.5 rounded-full hover:bg-neutral-700 disabled:opacity-40 transition-colors text-neutral-200"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono px-2 text-neutral-300 select-none">
                {currentZoom.label}
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomIndex === ZOOM_LEVELS.length - 1}
                aria-label="Perbesar"
                className="p-1.5 rounded-full hover:bg-neutral-700 disabled:opacity-40 transition-colors text-neutral-200"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                disabled={zoomIndex === 0}
                aria-label="Reset zoom"
                title="Reset zoom ke 100%"
                className="p-1.5 ml-1 rounded-full hover:bg-neutral-700 disabled:opacity-40 transition-colors text-neutral-300"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Pratinjau Bukti"
            className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Inspection Canvas */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        className="flex-1 overflow-auto p-4 flex items-center justify-center cursor-zoom-out select-none"
      >
        <div className="transition-transform duration-200 ease-out origin-center inline-block cursor-default">
          {media.type === 'video' ? (
            <video
              src={media.url}
              controls
              autoPlay
              playsInline
              className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl bg-black"
            />
          ) : (
            <img
              src={media.url}
              alt={media.title}
              className={`max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl transition-transform duration-200 ${currentZoom.className}`}
            />
          )}
        </div>
      </div>

      {/* Bottom Information Tip */}
      <div className="py-2 text-center text-[11px] text-neutral-400 bg-neutral-900/60 border-t border-neutral-800/80 shrink-0">
        {media.type === 'image'
          ? 'Gunakan tombol kontrol zoom atau ketuk area kosong untuk kembali. Tekan ESC untuk menutup.'
          : 'Gunakan kontrol video untuk memutar bukti rekaman warga. Tekan ESC untuk menutup.'}
      </div>
    </div>
  );
};
