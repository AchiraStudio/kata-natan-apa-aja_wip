import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import {
  BadgeCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Map as MapIcon,
  MapPin,
  Maximize2,
  Play,
  X,
} from 'lucide-react';
import type { Report } from '../../types/domain';
import { useTheme } from '../../context/ThemeContext';
import { createCivicTileLayer } from '../../utils/mapTiles';
import { getReportMediaType } from '../../utils/reportEvidence';
import { getEvidenceNote } from './format';

type Tab = 'media' | 'map';

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** Photos, video, supporting files and the map. Remount it (key) when the report changes. */
export const EvidencePanel: React.FC<{ report: Report }> = ({ report }) => {
  const { theme } = useTheme();
  const [tab, setTab] = useState<Tab>('media');
  const [index, setIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const mapElement = useRef<HTMLDivElement | null>(null);

  const urls = report.mediaUrls.filter(Boolean);
  const images = urls.filter((url) => getReportMediaType(url) === 'image');
  const current = urls[Math.min(index, Math.max(urls.length - 1, 0))];
  const isVideo = current ? getReportMediaType(current) === 'video' : false;
  const note = getEvidenceNote(report);
  const documents = report.supportingDocuments ?? [];
  const { latitude, longitude, address, isApproximate } = report.location;

  // The map is built when its tab opens and torn down when it closes. Leaflet binds to one
  // DOM node, and React removes that node when the tab changes, so reusing an instance breaks it.
  useEffect(() => {
    if (tab !== 'map' || !mapElement.current) return;

    const map = L.map(mapElement.current, { center: [latitude, longitude], zoom: 15, scrollWheelZoom: false });
    createCivicTileLayer(L, { theme }).addTo(map);

    // Built from nodes, not an HTML string: the title and address are written by citizens
    const popup = document.createElement('div');
    popup.className = 'leaflet-popup-report';
    const title = document.createElement('strong');
    title.className = 'leaflet-popup-report__title';
    title.textContent = report.title;
    const place = document.createElement('span');
    place.className = 'leaflet-popup-report__address';
    place.textContent = address;
    popup.append(title, document.createElement('br'), place);

    L.marker([latitude, longitude], {
      icon: L.divIcon({
        className: 'report-pin',
        html: '<span class="report-pin__dot"></span>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    })
      .addTo(map)
      .bindPopup(popup);
    L.circle([latitude, longitude], { radius: 200, weight: 1.5, fillOpacity: 0.12, className: 'report-radius' }).addTo(map);

    const timer = window.setTimeout(() => map.invalidateSize(), 250);
    return () => {
      window.clearTimeout(timer);
      map.remove();
    };
  }, [tab, theme, latitude, longitude, address, report.title]);

  const openLightbox = () => {
    if (!current || isVideo) return;
    setLightboxIndex(Math.max(images.indexOf(current), 0));
  };

  return (
    <section aria-labelledby="evidence-heading" className="panel p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="evidence-heading" className="font-sans text-base font-semibold text-ink">
          Bukti dan lokasi
        </h2>
        <div role="group" aria-label="Tampilan bukti" className="titik-pill-track">
          <button
            type="button"
            aria-pressed={tab === 'media'}
            onClick={() => setTab('media')}
            className={`titik-pill-tab inline-flex items-center gap-1.5 ${tab === 'media' ? 'active' : ''}`}
          >
            <Camera className="w-4 h-4" aria-hidden="true" />
            Foto dan video
            <span className="tabular-nums">({urls.length})</span>
          </button>
          <button
            type="button"
            aria-pressed={tab === 'map'}
            onClick={() => setTab('map')}
            className={`titik-pill-tab inline-flex items-center gap-1.5 ${tab === 'map' ? 'active' : ''}`}
          >
            <MapIcon className="w-4 h-4" aria-hidden="true" />
            Peta
          </button>
        </div>
      </div>

      {tab === 'media' && (
        <div className="mt-4">
          {urls.length === 0 ? (
            <p className="rounded-2xl bg-canvas px-4 py-10 text-center text-sm text-ink-2">
              Pelapor tidak melampirkan foto atau video.
            </p>
          ) : (
            <>
              <div className="relative aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden bg-canvas">
                {isVideo ? (
                  <video
                    key={current}
                    src={current}
                    controls
                    playsInline
                    aria-label={`${report.title}, video bukti`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={openLightbox}
                    aria-label="Perbesar foto"
                    className="block w-full h-full cursor-zoom-in"
                  >
                    <img src={current} alt={`${report.title}, foto bukti`} className="w-full h-full object-contain" />
                  </button>
                )}

                <span className="glass-media absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium">
                  {note.verified && <BadgeCheck className="w-4 h-4 text-lime" aria-hidden="true" />}
                  {note.label}
                </span>
                {urls.length > 1 && (
                  <span className="glass-media absolute top-3 right-3 rounded-lg px-2.5 py-1 text-xs font-medium tabular-nums">
                    {Math.min(index, urls.length - 1) + 1} / {urls.length}
                  </span>
                )}
                {!isVideo && (
                  <button
                    type="button"
                    onClick={openLightbox}
                    className="glass-media absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg h-9 px-3 text-xs font-semibold cursor-pointer hover:bg-black/60"
                  >
                    <Maximize2 className="w-4 h-4" aria-hidden="true" />
                    Perbesar
                  </button>
                )}
              </div>

              {urls.length > 1 && (
                <ul className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1" aria-label="Semua bukti">
                  {urls.map((url, i) => {
                    const active = i === Math.min(index, urls.length - 1);
                    return (
                      <li key={`${url}-${i}`} className="shrink-0">
                        <button
                          type="button"
                          onClick={() => setIndex(i)}
                          aria-label={`Bukti ${i + 1}`}
                          aria-current={active ? 'true' : undefined}
                          className={`relative block w-20 h-14 rounded-lg overflow-hidden cursor-pointer bg-surface-2 ${
                            active ? 'outline-2 outline-brand outline-offset-2' : 'opacity-65 hover:opacity-100'
                          }`}
                        >
                          {getReportMediaType(url) === 'video' ? (
                            <>
                              <video src={url} className="w-full h-full object-cover" aria-hidden="true" />
                              <Play className="absolute inset-0 m-auto w-5 h-5 text-ink" aria-hidden="true" />
                            </>
                          ) : (
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {documents.length > 0 && (
            <div className="mt-5 pt-5 border-t border-line-soft">
              <h3 className="font-sans text-sm font-semibold text-ink">Dokumen pendukung</h3>
              <ul className="mt-2 space-y-1">
                {documents.map((doc, i) => (
                  <li key={`${doc.name}-${i}`}>
                    <a
                      href={doc.dataUrl}
                      download={doc.name}
                      className="inline-flex items-center gap-2 text-sm text-ink hover:text-brand"
                    >
                      <FileText className="w-4 h-4 shrink-0 text-ink-3" aria-hidden="true" />
                      <span className="truncate">{doc.name}</span>
                      <span className="text-xs text-ink-3 tabular-nums">{formatSize(doc.sizeBytes)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === 'map' && (
        <div className="mt-4">
          <div
            ref={mapElement}
            role="region"
            aria-label={`Peta lokasi ${report.title}`}
            className="report-map h-[320px] sm:h-[420px] rounded-2xl overflow-hidden border border-line-soft"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
            <p className="flex items-center gap-1.5 text-ink-2">
              <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="titik-id text-ink">
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </span>
              <span className="text-ink-3">{isApproximate ? 'Lokasi perkiraan' : 'Lingkaran 200 m'}</span>
            </p>
            <p className="flex items-center gap-4 font-semibold">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand underline-offset-2 hover:underline"
              >
                Google Maps <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
              <a
                href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand underline-offset-2 hover:underline"
              >
                OpenStreetMap <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Portal: a panel's backdrop-filter would otherwise become the containing block of this fixed layer */}
      {lightboxIndex !== null &&
        createPortal(
          <Lightbox
            report={report}
            images={images}
            index={lightboxIndex}
            onIndexChange={setLightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />,
          document.body,
        )}
    </section>
  );
};

interface LightboxProps {
  report: Report;
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/** Full-screen photo viewer: Escape closes, arrows move, focus returns to where it came from. */
const Lightbox: React.FC<LightboxProps> = ({ report, images, index, onIndexChange, onClose }) => {
  const closeButton = useRef<HTMLButtonElement | null>(null);
  const count = images.length;
  const url = images[index];

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowRight' && count > 1) onIndexChange((index + 1) % count);
      else if (event.key === 'ArrowLeft' && count > 1) onIndexChange((index - 1 + count) % count);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, count, onClose, onIndexChange]);

  if (!url) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto bukti ${report.publicReference}`}
      className="fixed inset-0 z-50 flex flex-col gap-3 bg-black/90 backdrop-blur-md p-4 sm:p-6 overscroll-contain"
      onClick={onClose}
    >
      <div className="flex items-start justify-between gap-4 text-white" onClick={(e) => e.stopPropagation()}>
        <div className="min-w-0">
          <p className="titik-id text-xs text-white/70">
            {report.publicReference} · Bukti {index + 1} dari {count}
          </p>
          <p className="text-sm font-semibold truncate">{report.title}</p>
        </div>
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="shrink-0 w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <img src={url} alt={`${report.title}, foto bukti ${index + 1}`} className="max-h-full max-w-full object-contain rounded-lg" />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => onIndexChange((index - 1 + count) % count)}
              aria-label="Foto sebelumnya"
              className="absolute left-0 sm:left-2 w-11 h-11 rounded-lg bg-black/50 hover:bg-black/70 text-white flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => onIndexChange((index + 1) % count)}
              aria-label="Foto berikutnya"
              className="absolute right-0 sm:right-2 w-11 h-11 rounded-lg bg-black/50 hover:bg-black/70 text-white flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-white/70"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="inline-flex items-center gap-1.5 min-w-0">
          <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{report.location.address}</span>
        </span>
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-white hover:underline">
          Buka berkas asli <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
};
