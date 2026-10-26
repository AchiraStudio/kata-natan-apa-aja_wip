import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import {
  ArrowLeft,
  MapPin,
  Building,
  TrendingUp,
  Clock,
  Shield,
  Copy,
  Check,
  Share2,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Maximize2,
  X,
  Camera,
  Map as MapIcon,
  Printer,
  ThumbsUp,
  MessageSquare,
  Send,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { dataService } from '../services/dataService';
import { useTitik } from '../context/TitikContext';
import { Report } from '../types/domain';

import { createCivicTileLayer } from '../utils/mapTiles';
import { getReportMediaType } from '../utils/reportEvidence';
import './ReportDetailView.css';

interface Testimony {
  id: string;
  authorName: string;
  avatarUrl: string;
  body: string;
  timeAgo: string;
  likes: number;
  isLiked?: boolean;
}

export const ReportDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleSupport } = useTitik();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'map'>('photos');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Community Testimonies & Eyewitness Comments
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [testimonyText, setTestimonyText] = useState('');
  const [authorNameInput, setAuthorNameInput] = useState('');
  const [isSubmittingTestimony, setIsSubmittingTestimony] = useState(false);

  // Leaflet Map Reference
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (id) {
      dataService
        .getReportByReference(id)
        .then((res) => {
          if (isMounted) {
            setReport(res);
            setSelectedPhotoIndex(0);
            setLoading(false);

            // Load initial community testimonies dynamically from dataService (Supabase/fallback)
            if (res) {
              const matchedPostId = res.id.startsWith('rep-kn-')
                ? res.id.replace('rep-', '')
                : res.id === 'rep-001'
                  ? 'post-001'
                  : res.id === 'rep-002'
                    ? 'post-002'
                    : res.id === 'rep-003'
                      ? 'post-003'
                      : res.id;

              dataService.getComments(matchedPostId).then((comments) => {
                if (isMounted) {
                  setTestimonies(
                    (comments || []).map((c) => ({
                      ...c,
                      isLiked: false,
                    }))
                  );
                }
              });
            }
          }
        })
        .catch(() => {
          if (isMounted) {
            setLoading(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Leaflet Map Initialization & Tab Switching
  useEffect(() => {
    if (activeMediaTab !== 'map' || !report || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [report.location.latitude, report.location.longitude],
        zoom: 15,
        zoomControl: true,
      });

      // High-performance clean civic cartography tiles with automatic fallback
      createCivicTileLayer(L).addTo(map);

      // Custom high-contrast marker pin
      const customPin = L.divIcon({
        className: 'custom-map-pin',
        html: '<div class="report-detail-pin-marker">!</div>',
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      L.marker([report.location.latitude, report.location.longitude], {
        icon: customPin,
      })
        .addTo(map)
        .bindPopup(
          `<div class="leaflet-popup-report"><strong class="leaflet-popup-report__title">${report.title}</strong><br/><span class="leaflet-popup-report__address">${report.location.address}</span></div>`
        )
        .openPopup();

      // 200m Impact Radius Buffer
      L.circle([report.location.latitude, report.location.longitude], {
        radius: 200,
        color: '#DC2626',
        fillColor: '#DC2626',
        fillOpacity: 0.12,
        weight: 1.5,
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([report.location.latitude, report.location.longitude], 15);
      mapInstanceRef.current.invalidateSize();
    }

    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, [activeMediaTab, report]);

  // Clean up map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Keyboard shortcut (ESC) to close Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  const handleCopyRef = () => {
    if (!report) return;
    navigator.clipboard.writeText(report.publicReference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleSupportClick = async () => {
    if (!report) return;
    await toggleSupport(report.id);
    setReport((prev) =>
      prev
        ? {
            ...prev,
            isSupportedByMe: !prev.isSupportedByMe,
            supportCount: prev.isSupportedByMe ? prev.supportCount - 1 : prev.supportCount + 1,
          }
        : null
    );
  };

  const handleTestimonyLike = (testimonyId: string) => {
    setTestimonies((prev) =>
      prev.map((t) => {
        if (t.id === testimonyId) {
          const isLiked = !t.isLiked;
          return {
            ...t,
            isLiked,
            likes: isLiked ? t.likes + 1 : t.likes - 1,
          };
        }
        return t;
      })
    );
  };

  const handleSubmitTestimony = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonyText.trim() || !report) return;

    setIsSubmittingTestimony(true);
    const author = authorNameInput.trim() || 'Warga Sekitar';
    const avatar =
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
    const body = testimonyText.trim();

    const matchedPostId = report.id.startsWith('rep-kn-')
      ? report.id.replace('rep-', '')
      : report.id === 'rep-001'
        ? 'post-001'
        : report.id === 'rep-002'
          ? 'post-002'
          : report.id === 'rep-003'
            ? 'post-003'
            : report.id;

    try {
      const created = await dataService.addComment(matchedPostId, author, avatar, body);
      setTestimonies((prev) => [
        {
          ...(created || {
            id: `testimony-${Date.now()}`,
            authorName: author,
            avatarUrl: avatar,
            body,
            timeAgo: 'Baru saja',
            likes: 0,
          }),
          isLiked: false,
        },
        ...prev,
      ]);
      setTestimonyText('');
      setAuthorNameInput('');
    } finally {
      setIsSubmittingTestimony(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return {
          label: 'Selesai Ditangani',
          class: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-600',
          icon: CheckCircle2,
        };
      case 'forwarded_to_institution':
        return {
          label: 'Diteruskan ke Dinas Terkait',
          class: 'bg-blue-50 text-blue-800 border-blue-300',
          dot: 'bg-blue-600',
          icon: Clock,
        };
      case 'institution_responded':
        return {
          label: 'Respon Dinas Diterima',
          class: 'bg-indigo-50 text-indigo-800 border-indigo-300',
          dot: 'bg-indigo-600',
          icon: Building,
        };
      case 'needs_info':
        return {
          label: 'Menunggu Info Tambahan',
          class: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-600',
          icon: AlertCircle,
        };
      case 'under_review':
      default:
        return {
          label: 'Menunggu Verifikasi Data',
          class: 'bg-amber-50 text-amber-900 border-amber-300',
          dot: 'bg-amber-600',
          icon: Clock,
        };
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#F7F6F1] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#263F35] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-[#686B65] font-medium tracking-wide">
            Memuat berkas dossier investigasi & korelasi APBD...
          </span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="h-screen w-full max-w-[1680px] mx-auto bg-[#F7F6F1] dark:bg-[#0C100E] flex flex-col lg:flex-row overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#20221D]">Berkas Laporan Tidak Ditemukan</h2>
          <p className="text-xs text-[#686B65] max-w-sm leading-relaxed">
            Nomor referensi tiket publik yang Anda tuju tidak terdaftar di sistem atau sedang dalam tahap moderasi awal.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="report-pill-btn px-6 py-2.5 bg-[#263F35] text-white rounded-full text-xs font-semibold hover:bg-[#1d3129] transition-colors cursor-pointer"
          >
            ← Kembali ke Feed Publik
          </button>
        </main>
        <BottomNav />
      </div>
    );
  }

  const budget = report.budgetContext;
  const statusInfo = getStatusBadge(report.status);
  const StatusIcon = statusInfo.icon;
  const currentPhotoUrl = report.mediaUrls[selectedPhotoIndex] || report.mediaUrls[0];
  const currentMediaType = getReportMediaType(currentPhotoUrl);

  // Financial calculations
  const unspentBudget = budget ? budget.paguAllocation - budget.realizedSpending : 0;
  const unspentPercent = budget ? (100 - budget.executionRatePercent).toFixed(1) : '0';

  return (
    <div className="h-screen w-full max-w-[1680px] mx-auto bg-[#F7F6F1] dark:bg-[#0C100E] flex flex-col lg:flex-row overflow-hidden selection:bg-[#263F35] dark:selection:bg-[#10B981] selection:text-white dark:selection:text-[#0A1610]">
      {/* 1. Mobile Header (Hidden in Print) */}
      <header className="lg:hidden h-14 bg-[#F7F6F1] dark:bg-[#131916] border-b border-[#E4E2DA] dark:border-[#26352E] px-4 flex items-center justify-between shrink-0 z-20 print:hidden">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="report-pill-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] text-xs font-semibold text-[#20221D] dark:text-[#F3F6F4] hover:text-[#263F35] dark:hover:text-[#34D399] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
        <span className="font-mono text-xs font-bold text-[#686B65] dark:text-[#9EACA3] px-2.5 py-1 rounded-full bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E]">{report.publicReference}</span>
      </header>

      {/* 2. Global Navigation Sidebar (Hidden in Print) */}
      <Sidebar />

      {/* 3. Main Full-Widescreen Dossier Document Container */}
      <main className="flex-1 h-screen overflow-y-auto no-scrollbar w-full min-w-0 pb-28 lg:pb-16">
        {/* Widescreen Fluid Grid Container: max-w-[1680px] eliminates dead white space on 1440px+ displays */}
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
          {/* Top Breadcrumbs & Utility Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E4E2DA] print:hidden">
            <div className="flex items-center gap-2 text-xs text-[#686B65]">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="hover:text-[#20221D] transition-colors cursor-pointer"
              >
                Feed Publik
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-[#686B65]/60" />
              <button
                type="button"
                onClick={() => navigate('/explore')}
                className="hover:text-[#20221D] transition-colors cursor-pointer"
              >
                {report.category}
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-[#686B65]/60" />
              <span className="font-mono font-bold text-[#20221D]">{report.publicReference}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyShareUrl}
                className="report-pill-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#E4E2DA] rounded-full text-xs font-semibold text-[#20221D] hover:bg-[#F7F6F1] transition-colors cursor-pointer"
              >
                {copiedShare ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
                <span>{copiedShare ? 'Tautan Disalin!' : 'Bagikan'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="report-pill-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#E4E2DA] rounded-full text-xs font-semibold text-[#20221D] hover:bg-[#F7F6F1] transition-colors cursor-pointer"
                title="Cetak Berkas Dossier (PDF)"
              >
                <Printer className="w-3.5 h-3.5 text-[#686B65]" />
                <span className="hidden sm:inline">Cetak PDF</span>
              </button>

              <a
                href={`/track?ref=${encodeURIComponent(report.publicReference)}`}
                className="report-pill-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E7EBDD] border border-[#263F35]/20 rounded-full text-xs font-semibold text-[#263F35] hover:bg-[#d8e0cc] transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Lacak Status Tiket</span>
              </a>
            </div>
          </div>

          {/* Dossier Header Hero Banner with Geometric Ribbons & Angled Slashes (-35deg) in #263F35 */}
          <div className="report-hero-banner relative overflow-hidden rounded-3xl p-6 lg:p-8 border border-[#263F35]/20 shadow-xs">
            {/* Geometric Angled Slashes Container */}
            <div className="report-slashes-container" aria-hidden="true">
              <div className="report-ambient-glow" />
              <div className="report-ribbon report-ribbon-1" />
              <div className="report-ribbon report-ribbon-2" />
              <div className="report-slash-line report-slash-1" />
              <div className="report-slash-line report-slash-2" />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* Copyable Reference ID */}
                <button
                  type="button"
                  onClick={handleCopyRef}
                  title="Klik untuk menyalin nomor referensi"
                  className="report-pill-btn inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-white/30 font-mono text-xs font-bold text-[#20221D] hover:bg-[#F7F6F1] transition-colors cursor-pointer shadow-xs"
                >
                  <span>{report.publicReference}</span>
                  {copiedRef ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#686B65]" />
                  )}
                </button>

                {/* High-Contrast Official Status Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${statusInfo.class}`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`}></span>
                  <StatusIcon className="w-3.5 h-3.5" />
                  <span>{statusInfo.label}</span>
                </div>

                {/* Category */}
                <span className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-[#E7EBDD] text-xs font-semibold border border-white/20">
                  {report.category}
                </span>

                {/* Severity Tag */}
                <span className="px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-100 border border-rose-400/30 text-xs font-medium">
                  Urgensi: {report.severity.toUpperCase()}
                </span>

                {/* Sample Data Disclaimer Tag */}
                {report.isSampleData && (
                  <span className="px-3 py-1 rounded-full text-[11px] font-mono bg-amber-400/20 text-amber-200 border border-amber-300/30 font-semibold">
                    [Data Contoh Simulasi]
                  </span>
                )}
              </div>

              {/* Main Editorial Headline */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {report.title}
              </h1>

              {/* Location & Infrastructure Provenance Strip */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-[#E7EBDD]/90">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-semibold text-white">{report.location.address}</span>
                </div>
                <span className="text-white/30 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#E7EBDD]/70 shrink-0" />
                  <span>Fasilitas: {report.facilityName || 'Infrastruktur Jalan Kota'}</span>
                </div>
                <span className="text-white/30 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-[#E7EBDD]/70 shrink-0" />
                  <span>
                    Dilaporkan: {new Date(report.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <span className="text-white/30 hidden sm:inline">•</span>
                <div className="font-mono text-[#E7EBDD]/80">
                  GPS: {report.location.latitude.toFixed(5)}, {report.location.longitude.toFixed(5)}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Asymmetric 2-Column Responsive Layout (7:5 Ratio on Desktop) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10 pt-2">
            {/* ============================================================== */}
            {/* LEFT COLUMN (7 Cols): Visual Evidence, Story, & Eyewitnesses */}
            {/* ============================================================== */}
            <div className="xl:col-span-7 space-y-7 min-w-0">
              {/* Evidence Showcase Card with Interactive Photo/Map Tabs */}
              <div className="bg-white border border-[#E4E2DA] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E4E2DA]">
                  <div className="flex items-center gap-1 bg-[#F7F6F1] p-1.5 rounded-full border border-[#E4E2DA]">
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab('photos')}
                      className={`report-pill-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        activeMediaTab === 'photos'
                          ? 'bg-white text-[#20221D] shadow-xs'
                          : 'text-[#686B65] hover:text-[#20221D]'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5 text-[#263F35]" />
                      <span>Bukti Foto & Video ({report.mediaUrls.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab('map')}
                      className={`report-pill-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        activeMediaTab === 'map'
                          ? 'bg-white text-[#20221D] shadow-xs'
                          : 'text-[#686B65] hover:text-[#20221D]'
                      }`}
                    >
                      <MapIcon className="w-3.5 h-3.5 text-[#263F35]" />
                      <span>Peta Geospasial Interaktif</span>
                    </button>
                  </div>

                  {activeMediaTab === 'photos' && currentMediaType === 'image' && (
                    <button
                      type="button"
                      onClick={() => setIsLightboxOpen(true)}
                      className="report-pill-btn inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7EBDD] text-xs text-[#263F35] font-semibold hover:bg-[#d8e0cc] transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Perbesar Layar Penuh</span>
                    </button>
                  )}
                </div>

                {/* TAB 1: Photo and video evidence viewer */}
                {activeMediaTab === 'photos' && (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-[#E4E2DA] bg-neutral-900 aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center group shadow-inner">
                      {currentMediaType === 'video' ? (
                        <video
                          src={currentPhotoUrl}
                          controls
                          playsInline
                          className="w-full h-full object-contain"
                          aria-label={`${report.title} - Video Bukti Lapangan`}
                        />
                      ) : (
                        <img
                          src={currentPhotoUrl}
                          alt={`${report.title} - Bukti Lapangan`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01] cursor-zoom-in"
                          onClick={() => setIsLightboxOpen(true)}
                        />
                      )}

                      {/* Evidence badge overlay */}
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-[11px] font-mono flex items-center gap-1.5">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Bukti media laporan warga</span>
                      </div>

                      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-[11px] font-mono">
                        {currentMediaType === 'video' ? 'Video' : 'Foto'} {selectedPhotoIndex + 1} dari {report.mediaUrls.length}
                      </div>
                    </div>

                    {/* Evidence thumbnail strip */}
                    {report.mediaUrls.length > 1 && (
                      <div className="flex gap-2.5 pt-1 overflow-x-auto no-scrollbar">
                        {report.mediaUrls.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedPhotoIndex(idx)}
                            className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                              selectedPhotoIndex === idx
                                ? 'border-[#263F35] ring-2 ring-[#263F35]/20 shadow-xs'
                                : 'border-[#E4E2DA] opacity-70 hover:opacity-100'
                            }`}
                          >
                            {getReportMediaType(url) === 'video' ? (
                              <video src={url} aria-label={`Video bukti ${idx + 1}`} className="w-full h-full object-cover" />
                            ) : (
                              <img src={url} alt={`Foto bukti ${idx + 1}`} className="w-full h-full object-cover" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Interactive Leaflet Geospatial Map */}
                {activeMediaTab === 'map' && (
                  <div className="space-y-3">
                    <div
                      ref={mapContainerRef}
                      className="w-full h-[400px] sm:h-[460px] rounded-2xl overflow-hidden border border-[#E4E2DA] relative z-10"
                    />

                    {/* Geospatial Controls & External Navigation */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-[#F7F6F1] p-3.5 rounded-2xl border border-[#E4E2DA]">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-600" />
                        <span className="font-mono text-[#20221D] font-medium">
                          {report.location.latitude.toFixed(6)}, {report.location.longitude.toFixed(6)}
                        </span>
                        <span className="text-[11px] text-[#686B65]">
                          (Radius dampak: 200m)
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${report.location.latitude},${report.location.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#263F35] font-semibold hover:underline"
                        >
                          <span>Buka Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="text-[#E4E2DA]">|</span>
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${report.location.latitude}&mlon=${report.location.longitude}#map=16/${report.location.latitude}/${report.location.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#263F35] font-semibold hover:underline"
                        >
                          <span>OpenStreetMap</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Citizen Narrative & Problem Statement */}
              <div className="bg-white border border-[#E4E2DA] rounded-3xl p-6 lg:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DA]">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#263F35]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#686B65]">
                      Kronologi & Dampak Langsung Warga
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#686B65]">
                    Kategori: <strong className="text-[#20221D]">{report.category}</strong>
                  </span>
                </div>

                <div className="prose prose-sm max-w-none text-sm text-[#20221D] leading-relaxed">
                  <p className="whitespace-pre-line text-[15px] font-normal leading-relaxed text-[#20221D]">
                    {report.description}
                  </p>
                </div>

                {/* Reporter Identity Provenance */}
                <div className="pt-4 border-t border-[#E4E2DA] flex flex-wrap items-center justify-between gap-3 text-xs bg-[#F7F6F1] -mx-6 -mb-6 lg:-mx-7 lg:-mb-7 p-4 sm:p-5 rounded-b-3xl">
                  <div className="flex items-center gap-2.5">
                    {report.reporterType === 'anonymous' ? (
                      <div className="w-8 h-8 rounded-full bg-[#263F35]/10 flex items-center justify-center text-[#263F35]">
                        <Shield className="w-4 h-4" />
                      </div>
                    ) : (
                      <img
                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
                        alt={report.reporterDisplayName || 'Pelapor'}
                        className="w-8 h-8 rounded-full object-cover border border-[#E4E2DA]"
                      />
                    )}
                    <div>
                      <div className="font-semibold text-[#20221D]">
                        {report.reporterType === 'anonymous'
                          ? 'Warga Anonim Terenkripsi'
                          : report.reporterDisplayName || 'Warga Terverifikasi'}
                      </div>
                      <div className="text-[11px] text-[#686B65]">
                        {report.reporterType === 'anonymous'
                          ? 'Identitas dilindungi token kriptografis'
                          : 'Terverifikasi Kependudukan Kota Bogor'}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#686B65] font-mono">
                    ID Tiket: {report.publicReference}
                  </div>
                </div>
              </div>

              {/* Citizen Endorsement & Support Banner */}
              <div className="bg-[#E7EBDD]/70 border border-[#263F35]/25 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#20221D]">
                    <ThumbsUp className="w-4 h-4 text-[#263F35]" />
                    <span>{report.supportCount.toLocaleString('id-ID')} Warga Mengonfirmasi Dampak</span>
                  </div>
                  <p className="text-xs text-[#686B65] mt-0.5">
                    Konfirmasi warga meningkatkan indeks urgensi dalam antrean routing dinas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSupportClick}
                  className={`report-pill-btn px-6 py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer ${
                    report.isSupportedByMe
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : 'bg-[#263F35] text-white hover:bg-[#1d3129]'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>
                    {report.isSupportedByMe ? '✓ Anda Telah Mengonfirmasi' : 'Saya Terdampak Juga'}
                  </span>
                </button>
              </div>

              {/* Community Eyewitness Testimonials & Ground Truth */}
              <div className="bg-white border border-[#E4E2DA] rounded-3xl p-6 lg:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DA]">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#263F35]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#686B65]">
                      Kesaksian Lapangan & Tanggapan Warga ({testimonies.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#686B65]">Partisipasi Warga Sekitar</span>
                </div>

                {/* Input Form for New Eyewitness Testimony */}
                <form onSubmit={handleSubmitTestimony} className="space-y-3 bg-[#F7F6F1] p-4 sm:p-5 rounded-2xl border border-[#E4E2DA]">
                  <div className="text-xs font-bold text-[#20221D]">
                    Tambah Kesaksian / Konfirmasi Kondisi Terkini:
                  </div>
                  <textarea
                    rows={2}
                    value={testimonyText}
                    onChange={(e) => setTestimonyText(e.target.value)}
                    placeholder="Contoh: Saya lewat tadi pagi pukul 07.30, air masih tergenang setinggi mata kaki dan motor sulit melintas..."
                    className="w-full text-xs p-3 rounded-2xl border border-[#E4E2DA] bg-white focus:outline-none focus:ring-1 focus:ring-[#263F35] resize-none"
                    required
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <input
                      type="text"
                      value={authorNameInput}
                      onChange={(e) => setAuthorNameInput(e.target.value)}
                      placeholder="Nama Anda (opsional, kosongkan untuk anonim)"
                      className="text-xs px-3.5 py-2 rounded-full border border-[#E4E2DA] bg-white w-56 focus:outline-none focus:ring-1 focus:ring-[#263F35]"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingTestimony || !testimonyText.trim()}
                      className="report-pill-btn inline-flex items-center gap-1.5 px-5 py-2 bg-[#263F35] text-white rounded-full text-xs font-semibold hover:bg-[#1d3129] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingTestimony ? 'Mengirim...' : 'Kirim Kesaksian'}</span>
                    </button>
                  </div>
                </form>

                {/* List of Community Testimonies */}
                <div className="space-y-3.5 pt-2">
                  {testimonies.length === 0 ? (
                    <div className="text-center py-6 text-xs text-[#686B65]">
                      Belum ada kesaksian warga di titik ini. Jadilah yang pertama memberikan konfirmasi lapangan!
                    </div>
                  ) : (
                    testimonies.map((testimony) => (
                      <div
                        key={testimony.id}
                        className="p-4 rounded-2xl border border-[#E4E2DA]/80 bg-white hover:border-[#263F35]/30 transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <img
                              src={testimony.avatarUrl}
                              alt={testimony.authorName}
                              className="w-6 h-6 rounded-full object-cover border border-[#E4E2DA]"
                            />
                            <span className="font-semibold text-[#20221D]">
                              {testimony.authorName}
                            </span>
                            <span className="text-[10px] text-[#686B65]">• {testimony.timeAgo}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleTestimonyLike(testimony.id)}
                            className={`report-pill-btn flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                              testimony.isLiked
                                ? 'bg-[#E7EBDD] text-[#263F35] font-semibold'
                                : 'text-[#686B65] hover:text-[#20221D]'
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{testimony.likes}</span>
                          </button>
                        </div>
                        <p className="text-xs text-[#20221D] leading-relaxed pl-8">
                          {testimony.body}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* RIGHT COLUMN (5 Cols): Investigative APBD Ledger & Audit Trail */}
            {/* ============================================================== */}
            <div className="xl:col-span-5 space-y-6">
              {/* Sticky container on large screens so it remains visible while scrolling left column */}
              <div className="xl:sticky xl:top-6 space-y-6">
                {/* 1. THE APBD 2026 INVESTIGATIVE LEDGER (OGD Backbone) */}
                {budget ? (
                  <div className="bg-white border-2 border-[#263F35]/25 rounded-3xl p-6 shadow-xs space-y-5">
                    {/* Header with SIKD Kemendagri Provenance Pill */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-[#E4E2DA]">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#20221D]">
                        <TrendingUp className="w-4 h-4 text-[#263F35]" />
                        <span>Konteks APBD Kota Bogor TA {budget.fiscalYear}</span>
                      </div>
                      <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-[#E7EBDD] text-[#263F35] font-bold tracking-wider">
                        SIKD KEMENDAGRI
                      </span>
                    </div>

                    {/* Sector & Sub-Program Title */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#686B65]">
                        Sektor Alokasi Anggaran
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-[#20221D] leading-snug">
                        {budget.sectorName}
                      </h4>
                      <div className="text-xs text-[#263F35] font-semibold">
                        {budget.subSectorName}
                      </div>
                    </div>

                    {/* High-Contrast 3-Way Financial Ledger */}
                    <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-[#F7F6F1] rounded-2xl border border-[#E4E2DA]">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-medium text-[#686B65]">Pagu Alokasi</div>
                        <div className="font-mono font-bold text-xs sm:text-sm text-[#20221D]">
                          Rp {(budget.paguAllocation / 1e9).toFixed(1)} M
                        </div>
                        <div className="text-[9px] text-[#686B65]">Tahun 2026</div>
                      </div>

                      <div className="space-y-0.5 border-x border-[#E4E2DA] px-2">
                        <div className="text-[10px] font-medium text-[#686B65]">Realisasi</div>
                        <div className="font-mono font-bold text-xs sm:text-sm text-[#263F35]">
                          Rp {(budget.realizedSpending / 1e9).toFixed(1)} M
                        </div>
                        <div className="text-[9px] font-semibold text-[#263F35]">
                          {budget.executionRatePercent}% Terserap
                        </div>
                      </div>

                      <div className="space-y-0.5 pl-1">
                        <div className="text-[10px] font-medium text-[#686B65]">Sisa Pagu</div>
                        <div className="font-mono font-bold text-xs sm:text-sm text-amber-800">
                          Rp {(unspentBudget / 1e9).toFixed(1)} M
                        </div>
                        <div className="text-[9px] text-amber-800 font-medium">
                          {unspentPercent}% Tersisa
                        </div>
                      </div>
                    </div>

                    {/* Visual Segmented Health Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#686B65]">Penyerapan Realisasi Belanja:</span>
                        <strong className="text-[#20221D] font-mono">
                          {budget.executionRatePercent}%
                        </strong>
                      </div>

                      <div className="w-full h-3 rounded-full bg-[#E4E2DA] overflow-hidden flex border border-[#E4E2DA]">
                        <div
                          ref={(el) => {
                            if (el) el.style.setProperty('--budget-realized-pct', `${budget.executionRatePercent}%`);
                          }}
                          className="budget-bar-realized"
                          title={`Realisasi: ${budget.executionRatePercent}%`}
                        />
                        <div
                          ref={(el) => {
                            if (el) el.style.setProperty('--budget-unspent-pct', `${unspentPercent}%`);
                          }}
                          className="budget-bar-unspent"
                          title={`Sisa Belum Terserap: ${unspentPercent}%`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#686B65]">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#263F35]"></span>
                          <span>Realisasi Belanja Dinas</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          <span>Sisa Anggaran Siap Serap</span>
                        </span>
                      </div>
                    </div>

                    {/* Budget Insight Analysis Callout */}
                    <div className="p-3.5 bg-[#E7EBDD]/60 rounded-2xl border border-[#263F35]/20 text-xs text-[#20221D] leading-relaxed">
                      💡 <strong>Konteks Anggaran:</strong> Sisa alokasi pagu sebesar{' '}
                      <strong>Rp {(unspentBudget / 1e9).toFixed(1)} Miliar</strong> masih tersedia untuk program ini. Dana mencukupi bagi dinas untuk melakukan intervensi fisik pada titik ini sebelum akhir tahun anggaran.
                    </div>

                    {/* Responsible Agency Profile & Responsiveness Metrics */}
                    <div className="pt-3 border-t border-[#E4E2DA] space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Building className="w-4 h-4 text-[#686B65] shrink-0" />
                          <span className="font-semibold text-[#20221D] truncate">
                            {budget.responsibleAgency}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-[#F7F6F1] p-3 rounded-2xl border border-[#E4E2DA]">
                          <div className="text-[10px] text-[#686B65]">Indeks Responsif:</div>
                          <div className="font-bold text-[#263F35] text-sm">
                            {budget.responsivenessScore} / 100
                          </div>
                        </div>
                        <div className="bg-[#F7F6F1] p-3 rounded-2xl border border-[#E4E2DA]">
                          <div className="text-[10px] text-[#686B65]">SLA Penyelesaian:</div>
                          <div className="font-bold text-[#20221D] text-sm">
                            {budget.avgResolutionDays} Hari Kerja
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Legal Provenance Footer */}
                    <div className="text-[10px] text-[#686B65]/80 font-mono leading-relaxed pt-1">
                      {budget.dataSource} • Diperbarui {budget.lastUpdated} [Data Contoh Simulasi]
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-[#E4E2DA] rounded-3xl p-6 text-center text-xs text-[#686B65]">
                    Belum ada data anggaran yang terhubung dengan laporan ini.
                  </div>
                )}

                {/* 2. OFFICIAL AUDIT TRAIL (Immutable State Transition History) */}
                <div className="bg-white border border-[#E4E2DA] rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DA]">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#20221D]">
                      <Clock className="w-4 h-4 text-[#263F35]" />
                      <span>Jejak Audit & Alur Status Resmi</span>
                    </div>
                    <span className="text-[10px] text-[#686B65] font-mono px-2.5 py-0.5 rounded-full bg-[#F7F6F1] border border-[#E4E2DA]">
                      {report.events.length} Perubahan
                    </span>
                  </div>

                  <div className="relative pl-6 space-y-5 border-l-2 border-[#E4E2DA] ml-2 pt-1">
                    {report.events.map((ev) => (
                      <div key={ev.id} className="relative">
                        <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#263F35] ring-4 ring-white"></span>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold text-[#20221D]">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#F7F6F1] border border-[#E4E2DA] font-mono text-[10px]">
                              {ev.eventType}
                            </span>
                            <span className="text-[10px] text-[#686B65] font-normal font-mono">
                              {ev.timestamp}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#263F35] font-semibold">
                            Oleh: {ev.actorName}
                          </div>
                          <p className="text-xs text-[#686B65] leading-relaxed bg-[#F7F6F1] p-3 rounded-2xl border border-[#E4E2DA]/80">
                            {ev.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. CASE DOSSIER QUICK ACTION CARD */}
                <div className="bg-white border border-[#E4E2DA] rounded-3xl p-6 shadow-xs space-y-3">
                  <div className="text-xs font-bold text-[#20221D]">Aksi Berkas Tiket:</div>
                  <div className="grid grid-cols-1 gap-2.5">
                    <button
                      type="button"
                      onClick={handleCopyRef}
                      className="report-pill-btn w-full flex items-center justify-between px-4 py-2.5 rounded-full border border-[#E4E2DA] text-xs font-semibold text-[#20221D] hover:bg-[#F7F6F1] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Copy className="w-3.5 h-3.5 text-[#686B65]" />
                        <span>Salin Nomor Tiket</span>
                      </span>
                      <span className="font-mono text-[#686B65]">{report.publicReference}</span>
                    </button>

                    <a
                      href={`/track?ref=${encodeURIComponent(report.publicReference)}`}
                      className="report-pill-btn w-full flex items-center justify-between px-4 py-2.5 rounded-full bg-[#263F35] text-white text-xs font-semibold hover:bg-[#1d3129] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Lacak Progres dengan Token Rahasia</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 5. Fullscreen Lightbox Modal (For Zooming Photo Evidence) */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fadeIn"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Lightbox Top Control Bar */}
          <div
            className="flex items-center justify-between text-white shrink-0 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-0.5">
              <div className="text-xs font-mono text-neutral-400">
                {report.publicReference} • Bukti {selectedPhotoIndex + 1} dari {report.mediaUrls.length}
              </div>
              <h4 className="text-sm font-bold text-white max-w-md truncate">{report.title}</h4>
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Tutup (ESC)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Center Image Showcase */}
          <div
            className="flex-1 flex items-center justify-center p-2 sm:p-6 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentPhotoUrl}
              alt={report.title}
              className="max-h-[82vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Lightbox Bottom Info Bar */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400 shrink-0 pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>{report.location.address}</span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={currentPhotoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-white hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Buka Berkas Asli</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span>•</span>
              <span className="text-[11px] font-mono">Tekan ESC untuk menutup</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Mobile Bottom Navigation (Hidden in Print) */}
      <div className="print:hidden">
        <BottomNav />
      </div>
    </div>
  );
};
