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
  RotateCw,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { useTitik } from '../context/TitikContext';
import { useAuth } from '../context/AuthContext';
import { sortCommentsForUser, isCommentAuthoredByUser } from '../utils/commentSorting';
import { Report } from '../types/domain';

import { createCivicTileLayer } from '../utils/mapTiles';
import { getReportMediaType } from '../utils/reportEvidence';
import { UserAvatar } from '../components/common/UserAvatar';
import { SaveReportButton } from '../components/reporting/SaveReportButton';
import confetti from 'canvas-confetti';
import './ReportDetailView.css';

const formatAbsoluteTimestamp = (dateString?: string): string => {
  if (!dateString) return 'Waktu tidak tersedia';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
};

const CIVIC_STAGES = [
  { step: 1, key: 'baru', label: '1. Tercatat', sub: 'Laporan Warga Masuk' },
  { step: 2, key: 'verifikasi', label: '2. Diverifikasi', sub: 'Bukti Valid & Terperiksa' },
  { step: 3, key: 'ditindak', label: '3. Ditindak', sub: 'Routing Disposisi Dinas' },
  { step: 4, key: 'tuntas', label: '4. Tuntas', sub: 'Pekerjaan Fisik Selesai' },
];

const getActiveStageNumber = (status: string) => {
  switch (status) {
    case 'resolved':
      return 4;
    case 'forwarded_to_institution':
    case 'institution_responded':
      return 3;
    case 'under_review':
      return 2;
    case 'submitted':
    case 'needs_info':
    default:
      return 1;
  }
};

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
  const { toggleSupport, currentUserId } = useTitik();
  const { profile } = useAuth();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'map'>('photos');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Community Testimonies & Eyewitness Comments
  const [linkedPostId, setLinkedPostId] = useState<string | null>(null);
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [testimonyText, setTestimonyText] = useState('');
  const [authorNameInput, setAuthorNameInput] = useState('');
  const [isSubmittingTestimony, setIsSubmittingTestimony] = useState(false);
  const [isRefreshingTestimonies, setIsRefreshingTestimonies] = useState(false);
  const [detailClarificationText, setDetailClarificationText] = useState('');
  const [isSubmittingClarification, setIsSubmittingClarification] = useState(false);
  const [detailClarificationSuccess, setDetailClarificationSuccess] = useState('');
  const [detailClarificationError, setDetailClarificationError] = useState('');

  const handleDetailClarificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || !detailClarificationText.trim() || isSubmittingClarification) return;

    setIsSubmittingClarification(true);
    setDetailClarificationError('');
    setDetailClarificationSuccess('');

    try {
      const updated = await dataService.submitAdditionalInfo(
        report.id,
        profile.id || currentUserId || 'usr-citizen',
        detailClarificationText.trim()
      );
      setReport(updated);
      setDetailClarificationText('');
      setDetailClarificationSuccess('Informasi tambahan berhasil dikirim ke admin! Status laporan dikembalikan ke tahap verifikasi.');
    } catch (err) {
      console.error('Failed to submit clarification:', err);
      setDetailClarificationError(err instanceof Error ? err.message : 'Gagal mengirim informasi tambahan.');
    } finally {
      setIsSubmittingClarification(false);
    }
  };

  const sortedTestimonies = React.useMemo(() => {
    return sortCommentsForUser(testimonies, profile);
  }, [testimonies, profile]);

  // Leaflet Map Reference
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const refreshTestimoniesOnly = async () => {
    if (!report || isRefreshingTestimonies) return;
    setIsRefreshingTestimonies(true);
    try {
      let postId = linkedPostId;
      if (!postId) {
        const post = await dataService.getPostByReportId(report.id);
        postId = post?.id || null;
        setLinkedPostId(postId);
      }
      if (postId) {
        const comments = await dataService.getComments(postId);
        setTestimonies(
          (comments || []).map((c) => ({
            ...c,
            isLiked: false,
          }))
        );
      } else {
        setTestimonies([]);
      }
    } catch (err) {
      console.error('Failed to refresh testimonies:', err);
    } finally {
      setIsRefreshingTestimonies(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (id) {
      dataService
        .getReportByReference(id, currentUserId)
        .then((res) => {
          if (isMounted) {
            setReport(res);
            setSelectedPhotoIndex(0);
            setLoading(false);

            if (res) {
              dataService.getPostByReportId(res.id).then((post) => {
                if (isMounted) {
                  if (post) {
                    setLinkedPostId(post.id);
                    dataService.getComments(post.id).then((comments) => {
                      if (isMounted) {
                        setTestimonies(
                          (comments || []).map((c) => ({
                            ...c,
                            isLiked: false,
                          }))
                        );
                      }
                    });
                  } else {
                    setLinkedPostId(null);
                    setTestimonies([]);
                  }
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
  }, [id, currentUserId]);

  // Realtime subscription for live report status, official response, and citizen testimonies
  useEffect(() => {
    if (!id || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`detail-report-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reports' },
        (payload) => {
          const updatedRow: any = payload.new;
          if (updatedRow && (updatedRow.id === id || updatedRow.public_reference === id)) {
            dataService
              .getReportByReference(id, currentUserId)
              .then((res) => {
                if (res) setReport(res);
              })
              .catch(() => {});
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        (payload) => {
          const newComment: any = payload.new;
          if (
            (linkedPostId && newComment?.post_id === linkedPostId) ||
            (report && newComment?.post_id === report.id)
          ) {
            refreshTestimoniesOnly();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, report?.id, currentUserId]);

  // Celebrate resolved/tuntas civic report with gentle radial confetti
  useEffect(() => {
    if (report?.status === 'resolved') {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        try {
          confetti({
            particleCount: 50,
            spread: 65,
            origin: { y: 0.65 },
            colors: ['#1B4332', '#2D6A4F', '#34D399', '#D97706'],
          });
        } catch {
          // ignore if canvas is unavailable
        }
      }
    }
  }, [report?.status]);

  // Leaflet Map Initialization & Tab Switching
  useEffect(() => {
    if (activeMediaTab !== 'map' || !report || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [report.location.latitude, report.location.longitude],
        zoom: 15,
        zoomControl: true,
      });

      createCivicTileLayer(L).addTo(map);

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

    let targetPostId = linkedPostId;
    if (!targetPostId) {
      const post = await dataService.getPostByReportId(report.id);
      targetPostId = post?.id || null;
      setLinkedPostId(targetPostId);
    }

    if (!targetPostId) {
      alert('Kesaksian warga publik tidak tersedia untuk laporan privat ini.');
      setIsSubmittingTestimony(false);
      return;
    }

    try {
      const created = await dataService.addComment(targetPostId, author, avatar, body);
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
          class:
            'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/80',
          dot: 'bg-emerald-600 dark:bg-emerald-400',
          icon: CheckCircle2,
        };
      case 'forwarded_to_institution':
        return {
          label: 'Diteruskan ke Dinas Terkait',
          class:
            'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800/80',
          dot: 'bg-blue-600 dark:bg-blue-400',
          icon: Clock,
        };
      case 'institution_responded':
        return {
          label: 'Respon Dinas Diterima',
          class:
            'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800/80',
          dot: 'bg-indigo-600 dark:bg-indigo-400',
          icon: Building,
        };
      case 'needs_info':
        return {
          label: 'Menunggu Info Tambahan',
          class:
            'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800/80',
          dot: 'bg-rose-600 dark:bg-rose-400',
          icon: AlertCircle,
        };
      case 'under_review':
      default:
        return {
          label: 'Menunggu Verifikasi Data',
          class:
            'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800/80',
          dot: 'bg-amber-600 dark:bg-amber-400',
          icon: Clock,
        };
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#F7F5EF] dark:bg-[#0C100E] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#1B4332] dark:border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-[#4F5A52] dark:text-[#9EACA3] font-medium tracking-wide">
            Memuat berkas dossier investigasi & korelasi APBD...
          </span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <>
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#101913] dark:text-[#F3F6F4]">Berkas Laporan Tidak Ditemukan</h2>
          <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3] max-w-sm leading-relaxed">
            Nomor referensi tiket publik yang Anda tuju tidak terdaftar di sistem atau sedang dalam tahap moderasi awal.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="report-pill-btn px-6 py-2.5 bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-full text-xs font-semibold hover:bg-[#14352A] dark:hover:bg-[#34D399] transition-colors cursor-pointer"
          >
            ← Kembali ke Feed Publik
          </button>
        </main>
      </>
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
    <>
      {/* 1. Mobile Header (Hidden in Print) */}
      <header className="lg:hidden h-14 bg-[#F7F5EF] dark:bg-[#131916] border-b border-[#E3E0D6] dark:border-[#26352E] px-4 flex items-center justify-between shrink-0 z-20 print:hidden">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="report-pill-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] text-xs font-semibold text-[#101913] dark:text-[#F3F6F4] hover:text-[#1B4332] dark:hover:text-[#34D399] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
        <span className="font-mono text-xs font-bold text-[#4F5A52] dark:text-[#9EACA3] px-2.5 py-1 rounded-full bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E]">{report.publicReference}</span>
      </header>


      {/* 3. Main Full-Widescreen Dossier Document Container */}
      <main className="flex-1 h-screen overflow-y-auto no-scrollbar w-full min-w-0 pb-28 lg:pb-16">
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
          {/* Top Breadcrumbs & Utility Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E3E0D6] dark:border-[#26352E] print:hidden">
            <div className="flex items-center gap-2 text-xs text-[#4F5A52] dark:text-[#9EACA3]">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="hover:text-[#101913] dark:hover:text-[#F3F6F4] transition-colors cursor-pointer"
              >
                Feed Publik
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-[#4F5A52]/60 dark:text-[#9EACA3]/60" />
              <button
                type="button"
                onClick={() => navigate('/explore')}
                className="hover:text-[#101913] dark:hover:text-[#F3F6F4] transition-colors cursor-pointer"
              >
                {report.category}
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-[#4F5A52]/60 dark:text-[#9EACA3]/60" />
              <span className="font-mono font-bold text-[#101913] dark:text-[#F3F6F4]">{report.publicReference}</span>
            </div>

            <div className="flex items-center gap-2">
              <SaveReportButton
                reportId={report.id}
                isSavedByMe={report.isSavedByMe}
                onSavedChange={(isSaved) =>
                  setReport((current) => current ? { ...current, isSavedByMe: isSaved } : current)
                }
              />
              <button
                type="button"
                onClick={handleCopyShareUrl}
                className="report-pill-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-full text-xs font-semibold text-[#101913] dark:text-[#F3F6F4] hover:bg-[#F7F5EF] dark:hover:bg-[#131916] transition-colors cursor-pointer"
              >
                {copiedShare ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
                <span>{copiedShare ? 'Tautan Disalin!' : 'Bagikan'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="report-pill-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-full text-xs font-semibold text-[#101913] dark:text-[#F3F6F4] hover:bg-[#F7F5EF] dark:hover:bg-[#131916] transition-colors cursor-pointer"
                title="Cetak Berkas Dossier (PDF)"
              >
                <Printer className="w-3.5 h-3.5 text-[#4F5A52] dark:text-[#9EACA3]" />
                <span className="hidden sm:inline">Cetak PDF</span>
              </button>

              <a
                href={`/track?ref=${encodeURIComponent(report.publicReference)}`}
                className="report-pill-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E7EBDD] dark:bg-[#1A2E24] border border-[#1B4332]/20 dark:border-[#10B981]/30 rounded-full text-xs font-semibold text-[#1B4332] dark:text-[#34D399] hover:bg-[#d8e0cc] dark:hover:bg-[#243f31] transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Lacak Status Tiket</span>
              </a>
            </div>
          </div>

          {/* Dossier Header Hero Banner with Geometric Ribbons & Angled Slashes (-35deg) in #1B4332 */}
          <div className="report-hero-banner relative overflow-hidden rounded-3xl p-6 lg:p-8 border border-[#1B4332]/20 shadow-xs">
            {/* Geometric Angled Slashes Container */}
            <div className="report-slashes-container report-detail-slashes-container" aria-hidden="true">
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
                  className="titik-id report-pill-btn inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1A221E] border border-white/30 dark:border-[#26352E] font-mono text-xs font-bold text-[#101913] dark:text-[#F3F6F4] hover:bg-[#F7F5EF] dark:hover:bg-[#131916] transition-colors cursor-pointer shadow-xs"
                >
                  <span>{report.publicReference}</span>
                  {copiedRef ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#4F5A52] dark:text-[#9EACA3]" />
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
                    Dilaporkan: {formatAbsoluteTimestamp(report.createdAt)}
                  </span>
                </div>
                <span className="text-white/30 hidden sm:inline">•</span>
                <div className="font-mono tabular-nums text-[#E7EBDD]/80">
                  GPS: {report.location.latitude.toFixed(5)}, {report.location.longitude.toFixed(5)}
                </div>
              </div>
            </div>
          </div>

          {/* 4-Stage Civic Tracking Pipeline ("Setiap masalah adalah titik: muncul, bergerak, tuntas") */}
          {(() => {
            const activeStage = getActiveStageNumber(report.status);
            return (
              <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E3E0D6] dark:border-[#26352E]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1B4332] dark:bg-[#10B981] titik-live" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#101913] dark:text-[#F3F6F4]">
                      Alur Progres Titik · Sistem Akuntabilitas Pemkot Bogor
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[#1B4332] dark:text-[#34D399] bg-[#EBF2EE] dark:bg-[#1E2E25] px-3 py-1 rounded-full">
                    Tahap {activeStage} dari 4: {CIVIC_STAGES[activeStage - 1].label}
                  </span>
                </div>

                <div className="relative pt-3 pb-2 px-2 sm:px-6">
                  {/* Background Track Line */}
                  <div className="absolute top-7 left-8 right-8 h-1 bg-[#E3E0D6] dark:border-[#26352E] rounded-full -translate-y-1/2 z-0" />

                  {/* Active Colored Fill Line */}
                  <div
                    ref={(el) => {
                      if (el) {
                        el.style.width = `${((activeStage - 1) / (CIVIC_STAGES.length - 1)) * 100}%`;
                        el.style.maxWidth = 'calc(100% - 4rem)';
                      }
                    }}
                    className="absolute top-7 left-8 h-1 bg-[#1B4332] dark:bg-[#10B981] rounded-full -translate-y-1/2 transition-all duration-500 z-0"
                  />

                  {/* Stage Nodes Grid */}
                  <div className="grid grid-cols-4 gap-2 relative z-10">
                    {CIVIC_STAGES.map((st) => {
                      const isDone = st.step < activeStage || (activeStage === 4 && st.step === 4);
                      const isCurrent = st.step === activeStage && activeStage !== 4;

                      return (
                        <div key={st.key} className="flex flex-col items-center text-center">
                          <div
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                              isDone
                                ? 'bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] shadow-sm'
                                : isCurrent
                                ? 'bg-[#1B4332] dark:bg-[#10B981] text-white ring-4 ring-[#EBF2EE] dark:ring-[#1E2E25] shadow-md'
                                : 'bg-white dark:bg-[#131916] border-2 border-[#E3E0D6] dark:border-[#26352E] text-[#4F5A52] dark:text-[#9EACA3]'
                            }`}
                          >
                            {isDone ? (
                              <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                            ) : isCurrent ? (
                              <span className="w-3 h-3 rounded-full bg-white dark:bg-[#0A1610] titik-live" />
                            ) : (
                              <span className="text-xs font-mono font-bold">{st.step}</span>
                            )}
                          </div>

                          <div className="mt-2.5 space-y-0.5 max-w-[120px]">
                            <div
                              className={`text-xs font-black leading-tight ${
                                isCurrent
                                  ? 'text-[#1B4332] dark:text-[#34D399]'
                                  : isDone
                                  ? 'text-[#101913] dark:text-[#F3F6F4]'
                                  : 'text-[#4F5A52]/70 dark:text-[#9EACA3]/70'
                              }`}
                            >
                              {st.label}
                            </div>
                            <div className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3] hidden sm:block truncate">
                              {st.sub}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Action Required: Verification Needs Citizen Additional Info */}
          {report.status === 'needs_info' && (
            <div className="bg-rose-50/90 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-rose-900 dark:text-rose-100">
                    Laporan Membutuhkan Informasi Tambahan dari Pelapor
                  </h3>
                  <p className="text-xs text-rose-800/80 dark:text-rose-300/80 mt-0.5">
                    Verifikator menangguhkan peninjauan sementara sampai Anda melengkapi klarifikasi atau bukti tambahan di bawah.
                  </p>
                </div>
              </div>

              {report.officialResponse && (
                <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#131916]/90 border border-rose-200 dark:border-rose-900/60 text-xs text-[#101913] dark:text-[#F3F6F4] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                    Permintaan Resmi Verifikator:
                  </span>
                  <p className="italic leading-relaxed font-medium">&ldquo;{report.officialResponse}&rdquo;</p>
                </div>
              )}

              {/* Citizen Response Form */}
              <form onSubmit={handleDetailClarificationSubmit} className="space-y-3 pt-1">
                <label className="block text-xs font-bold text-[#101913] dark:text-[#F3F6F4]">
                  Tuliskan Tanggapan / Keterangan Tambahan Anda:
                </label>
                <textarea
                  rows={3}
                  required
                  value={detailClarificationText}
                  onChange={(e) => setDetailClarificationText(e.target.value)}
                  placeholder="Jelaskan patokan lokasi, nomor RT/RW, nomor tiang, atau detail fisik lainnya yang diminta verifikator..."
                  className="w-full px-4 py-3 text-xs rounded-2xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-[#131916] text-[#101913] dark:text-[#F3F6F4] placeholder-[#4F5A52] focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs resize-none"
                />

                {detailClarificationError && (
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                    {detailClarificationError}
                  </p>
                )}

                {detailClarificationSuccess && (
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{detailClarificationSuccess}</span>
                  </p>
                )}

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingClarification || !detailClarificationText.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-700 dark:bg-rose-600 hover:bg-rose-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingClarification ? 'Mengirim...' : 'Kirim Tanggapan ke admin'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Public Official Response Banner */}
          {report.officialResponse && report.status !== 'needs_info' && (
            <div className="bg-[#F7F5EF] dark:bg-[#1A221E] border-2 border-[#1B4332]/30 dark:border-[#10B981]/40 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E3E0D6] dark:border-[#26352E]">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#1B4332] dark:text-[#34D399]" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#101913] dark:text-[#F3F6F4]">
                    Tanggapan Resmi {report.responsibleAgency || 'Pemerintah Kota Bogor'}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#1B4332]/10 dark:bg-[#10B981]/20 text-[#1B4332] dark:text-[#34D399] font-bold">
                  Verifikasi Sah
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#101913] dark:text-[#F3F6F4] leading-relaxed">
                {report.officialResponse}
              </p>
            </div>
          )}

          {/* Prominent APBD Context Banner */}
          {budget && (
            <div className="bg-[#EBF2EE]/90 dark:bg-[#16231C]/90 border border-[#C5D9CE] dark:border-[#2D4537] rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <TrendingUp className="w-5 h-5 text-[#34D399]" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="inline-flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#1B4332] text-[#34D399]">
                      APBD {budget.fiscalYear} KOTA BOGOR
                    </span>
                    <span className="text-xs text-[#4F5A52] dark:text-[#9EACA3] truncate">
                      {budget.responsibleAgency}
                    </span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-[#101913] dark:text-[#F3F6F4] truncate">
                    Dialokasikan Rp {(budget.paguAllocation / 1e9).toFixed(1)} Miliar · {budget.sectorName}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 bg-white/70 dark:bg-[#131916]/70 px-4 py-2.5 rounded-2xl border border-[#C5D9CE] dark:border-[#2D4537]">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3] uppercase tracking-wider font-semibold">
                    Status Serapan Belanja
                  </div>
                  <div className="text-xs font-mono font-black text-[#1B4332] dark:text-[#34D399] tabular-nums">
                    {budget.executionRatePercent}% (Rp {(budget.realizedSpending / 1e9).toFixed(1)} M)
                  </div>
                </div>
                <div className="w-20 sm:w-28 h-2.5 rounded-full bg-[#E3E0D6] dark:bg-[#26352E] overflow-hidden border border-black/5">
                  <div
                    ref={(el) => {
                      if (el) el.style.width = `${Math.min(100, budget.executionRatePercent)}%`;
                    }}
                    className="h-full bg-[#1B4332] dark:bg-[#10B981] rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Asymmetric 2-Column Responsive Layout (7:5 Ratio on Desktop) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10 pt-2">
            {/* ============================================================== */}
            {/* LEFT COLUMN (7 Cols): Visual Evidence, Story, & Eyewitnesses */}
            {/* ============================================================== */}
            <div className="xl:col-span-7 space-y-7 min-w-0">
              {/* Evidence Showcase Card with Interactive Photo/Map Tabs */}
              <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E3E0D6] dark:border-[#26352E]">
                  <div className="flex items-center gap-1 bg-[#F7F5EF] dark:bg-[#131916] p-1.5 rounded-full border border-[#E3E0D6] dark:border-[#26352E]">
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab('photos')}
                      className={`report-pill-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        activeMediaTab === 'photos'
                          ? 'bg-white dark:bg-[#26352E] text-[#101913] dark:text-[#F3F6F4] shadow-xs'
                          : 'text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#34D399]" />
                      <span>Bukti Foto & Video ({report.mediaUrls.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab('map')}
                      className={`report-pill-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        activeMediaTab === 'map'
                          ? 'bg-white dark:bg-[#26352E] text-[#101913] dark:text-[#F3F6F4] shadow-xs'
                          : 'text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
                      }`}
                    >
                      <MapIcon className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#34D399]" />
                      <span>Peta Geospasial Interaktif</span>
                    </button>
                  </div>

                  {activeMediaTab === 'photos' && currentMediaType === 'image' && (
                    <button
                      type="button"
                      onClick={() => setIsLightboxOpen(true)}
                      className="report-pill-btn inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7EBDD] dark:bg-[#1A2E24] text-xs text-[#1B4332] dark:text-[#34D399] font-semibold hover:bg-[#d8e0cc] dark:hover:bg-[#243f31] transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Perbesar Layar Penuh</span>
                    </button>
                  )}
                </div>

                {/* TAB 1: Photo and video evidence viewer */}
                {activeMediaTab === 'photos' && (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-[#E3E0D6] dark:border-[#26352E] bg-neutral-900 aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center group shadow-inner">
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
                        {(report.evidence_verification_status === 'verified' || report.evidenceVerificationStatus === 'verified') && (
                          <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>
                          {(report.evidence_verification_status === 'verified' || report.evidenceVerificationStatus === 'verified')
                            ? 'Bukti fisik terverifikasi'
                            : 'Bukti media laporan warga'}
                        </span>
                      </div>

                      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-[11px] font-mono tabular-nums">
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
                                ? 'border-[#1B4332] dark:border-[#10B981] ring-2 ring-[#1B4332]/20 dark:ring-[#10B981]/20 shadow-xs'
                                : 'border-[#E3E0D6] dark:border-[#26352E] opacity-70 hover:opacity-100'
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
                      className="w-full h-[400px] sm:h-[460px] rounded-2xl overflow-hidden border border-[#E3E0D6] dark:border-[#26352E] relative z-10"
                    />

                    {/* Geospatial Controls & External Navigation */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-[#F7F5EF] dark:bg-[#131916] p-3.5 rounded-2xl border border-[#E3E0D6] dark:border-[#26352E]">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span className="font-mono tabular-nums text-[#101913] dark:text-[#F3F6F4] font-medium">
                          {report.location.latitude.toFixed(6)}, {report.location.longitude.toFixed(6)}
                        </span>
                        <span className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">
                          (Radius dampak: 200m)
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${report.location.latitude},${report.location.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#1B4332] dark:text-[#34D399] font-semibold hover:underline"
                        >
                          <span>Buka Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="text-[#E3E0D6] dark:text-[#26352E]">|</span>
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${report.location.latitude}&mlon=${report.location.longitude}#map=16/${report.location.latitude}/${report.location.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#1B4332] dark:text-[#34D399] font-semibold hover:underline"
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
              <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 lg:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E3E0D6] dark:border-[#26352E]">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#1B4332] dark:text-[#34D399]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#4F5A52] dark:text-[#9EACA3]">
                      Kronologi & Dampak Langsung Warga
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">
                    Kategori: <strong className="text-[#101913] dark:text-[#F3F6F4]">{report.category}</strong>
                  </span>
                </div>

                <div className="prose prose-sm max-w-none text-sm text-[#101913] dark:text-[#F3F6F4] leading-relaxed">
                  <p className="whitespace-pre-line text-[15px] font-normal leading-relaxed text-[#101913] dark:text-[#F3F6F4]">
                    {report.description}
                  </p>
                </div>

                {/* Reporter Identity Provenance */}
                {(() => {
                  const reporterTarget = report.reporterUserId
                    ? report.reporterUserId.replace(/^@+/, '').trim()
                    : (report.reporterDisplayName || 'warga').replace(/^@+/, '').trim().toLowerCase().replace(/[^a-z0-9_.]/g, '_');

                  return (
                    <div className="pt-4 border-t border-[#E3E0D6] dark:border-[#26352E] flex flex-wrap items-center justify-between gap-3 text-xs bg-[#F7F5EF] dark:bg-[#131916] -mx-6 -mb-6 lg:-mx-7 lg:-mb-7 p-4 sm:p-5 rounded-b-3xl">
                      <div className="flex items-center gap-2.5">
                        {report.reporterType === 'anonymous' ? (
                          <div className="w-8 h-8 rounded-full bg-[#1B4332]/10 dark:bg-[#10B981]/15 flex items-center justify-center text-[#1B4332] dark:text-[#34D399]">
                            <Shield className="w-4 h-4" />
                          </div>
                        ) : (
                          <a
                            href={`/u/${reporterTarget}`}
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/u/${reporterTarget}`);
                            }}
                            className="block shrink-0 group cursor-pointer"
                            title={`Lihat profil ${report.reporterDisplayName || 'Pelapor'}`}
                          >
                            <UserAvatar
                              alt={report.reporterDisplayName || 'Pelapor'}
                              name={report.reporterDisplayName || 'Pelapor'}
                              role="citizen"
                              className="w-8 h-8 rounded-full object-cover border border-[#E3E0D6] dark:border-[#26352E] group-hover:scale-105 transition-transform"
                            />
                          </a>
                        )}
                        <div>
                          <div className="font-semibold text-[#101913] dark:text-[#F3F6F4]">
                            {report.reporterType === 'anonymous' ? (
                              'Warga Anonim Terenkripsi'
                            ) : (
                              <a
                                href={`/u/${reporterTarget}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(`/u/${reporterTarget}`);
                                }}
                                className="hover:underline hover:text-[#1B4332] dark:hover:text-[#34D399] transition-colors cursor-pointer"
                                title={`Lihat profil ${report.reporterDisplayName || 'Pelapor'}`}
                              >
                                {report.reporterDisplayName || (report.reporterType === 'verified_citizen' ? 'Warga Terverifikasi' : 'Warga Terdaftar')}
                              </a>
                            )}
                          </div>
                          <div className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">
                            {report.reporterType === 'anonymous'
                              ? 'Identitas dilindungi token kriptografis'
                              : report.reporterType === 'verified_citizen'
                              ? 'Warga Terverifikasi'
                              : 'Warga Terdaftar'}
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#4F5A52] dark:text-[#9EACA3] font-mono">
                        ID Tiket: {report.publicReference}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Citizen Endorsement & Support Banner */}
              <div className="bg-[#E7EBDD]/70 dark:bg-[#1A2E24]/70 border border-[#1B4332]/25 dark:border-[#10B981]/30 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#101913] dark:text-[#F3F6F4]">
                    <ThumbsUp className="w-4 h-4 text-[#1B4332] dark:text-[#34D399]" />
                    <span className="tabular-nums">{report.supportCount.toLocaleString('id-ID')} Warga Mengonfirmasi Dampak</span>
                  </div>
                  <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3] mt-0.5">
                    Konfirmasi warga meningkatkan indeks urgensi dalam antrean routing dinas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSupportClick}
                  className={`report-pill-btn px-6 py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer ${
                    report.isSupportedByMe
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : 'bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] hover:bg-[#14352A] dark:hover:bg-[#34D399]'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>
                    {report.isSupportedByMe ? '✓ Anda Telah Mengonfirmasi' : 'Saya Terdampak Juga'}
                  </span>
                </button>
              </div>

              {/* Community Eyewitness Testimonials & Ground Truth */}
              <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 lg:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#E3E0D6] dark:border-[#26352E]">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#1B4332] dark:text-[#34D399]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#4F5A52] dark:text-[#9EACA3]">
                      Kesaksian Lapangan & Tanggapan Warga ({testimonies.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={refreshTestimoniesOnly}
                    disabled={isRefreshingTestimonies}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4] hover:bg-[#F7F5EF] dark:hover:bg-[#131916] transition-all cursor-pointer disabled:opacity-40"
                    title="Segarkan kesaksian warga"
                    aria-label="Segarkan kesaksian warga"
                  >
                    <RotateCw className={`w-3 h-3 ${isRefreshingTestimonies ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
                    <span>Segarkan</span>
                  </button>
                </div>

                {/* Input Form for New Eyewitness Testimony */}
                <form onSubmit={handleSubmitTestimony} className="space-y-3 bg-[#F7F5EF] dark:bg-[#131916] p-4 sm:p-5 rounded-2xl border border-[#E3E0D6] dark:border-[#26352E]">
                  <div className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4]">
                    Tambah Kesaksian / Konfirmasi Kondisi Terkini:
                  </div>
                  <textarea
                    rows={2}
                    value={testimonyText}
                    onChange={(e) => setTestimonyText(e.target.value)}
                    placeholder="Contoh: Saya lewat tadi pagi pukul 07.30, air masih tergenang setinggi mata kaki dan motor sulit melintas..."
                    className="w-full text-xs p-3 rounded-2xl border border-[#E3E0D6] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-[#101913] dark:text-[#F3F6F4] placeholder-[#4F5A52] dark:placeholder-[#6C7D73] focus:outline-none focus:ring-1 focus:ring-[#1B4332] dark:focus:ring-[#10B981] resize-none"
                    required
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <input
                      type="text"
                      value={authorNameInput}
                      onChange={(e) => setAuthorNameInput(e.target.value)}
                      placeholder="Nama Anda (opsional, kosongkan untuk anonim)"
                      className="text-xs px-3.5 py-2 rounded-full border border-[#E3E0D6] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-[#101913] dark:text-[#F3F6F4] placeholder-[#4F5A52] dark:placeholder-[#6C7D73] w-56 focus:outline-none focus:ring-1 focus:ring-[#1B4332] dark:focus:ring-[#10B981]"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingTestimony || !testimonyText.trim()}
                      className="report-pill-btn inline-flex items-center gap-1.5 px-5 py-2 bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-full text-xs font-semibold hover:bg-[#14352A] dark:hover:bg-[#34D399] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingTestimony ? 'Mengirim...' : 'Kirim Kesaksian'}</span>
                    </button>
                  </div>
                </form>

                {/* Un-boxed Editorial List of Community Testimonies */}
                <div className="divide-y divide-[#E3E0D6]/60 dark:divide-[#26352E]">
                  {testimonies.length === 0 ? (
                    <div className="text-center py-6 text-xs text-[#4F5A52] dark:text-[#9EACA3]">
                      Belum ada kesaksian warga di titik ini. Jadilah yang pertama memberikan konfirmasi lapangan!
                    </div>
                  ) : (
                    sortedTestimonies.map((testimony) => {
                      const isMyTestimony = isCommentAuthoredByUser(testimony, profile);
                      const testimonyTarget = (testimony as any).authorId
                        ? (testimony as any).authorId.replace(/^@+/, '').trim()
                        : testimony.authorName.replace(/^@+/, '').trim().toLowerCase().replace(/[^a-z0-9_.]/g, '_');

                      return (
                        <div
                          key={testimony.id}
                          className="py-3.5 first:pt-1 last:pb-1 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <a
                                href={`/u/${testimonyTarget}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(`/u/${testimonyTarget}`);
                                }}
                                className="shrink-0 block cursor-pointer"
                                title={`Lihat profil ${testimony.authorName}`}
                              >
                                <UserAvatar
                                  src={testimony.avatarUrl}
                                  alt={testimony.authorName}
                                  name={testimony.authorName}
                                  role="citizen"
                                  className="w-6 h-6 rounded-full object-cover border border-[#E3E0D6] dark:border-[#26352E] hover:scale-105 transition-transform"
                                />
                              </a>
                              <a
                                href={`/u/${testimonyTarget}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(`/u/${testimonyTarget}`);
                                }}
                                className="font-semibold text-[#101913] dark:text-[#F3F6F4] hover:underline hover:text-[#1B4332] dark:hover:text-[#34D399] transition-colors cursor-pointer"
                                title={`Lihat profil ${testimony.authorName}`}
                              >
                                {testimony.authorName}
                              </a>
                              {isMyTestimony && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 shrink-0">
                                  Anda
                                </span>
                              )}
                              <span className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3]">• {testimony.timeAgo}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleTestimonyLike(testimony.id)}
                              className={`report-pill-btn flex items-center gap-1 text-[11px] tabular-nums px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                                testimony.isLiked
                                  ? 'bg-[#E7EBDD] dark:bg-[#1A2E24] text-[#1B4332] dark:text-[#34D399] font-semibold'
                                  : 'text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>{testimony.likes}</span>
                            </button>
                          </div>
                          <p className="text-xs text-[#101913] dark:text-[#F3F6F4] leading-relaxed pl-8">
                            {testimony.body}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* RIGHT COLUMN (5 Cols): Investigative APBD Ledger & Audit Trail */}
            {/* ============================================================== */}
            <div className="xl:col-span-5 space-y-6">
              <div className="xl:sticky xl:top-6 space-y-6">
                {/* 1. THE APBD 2026 INVESTIGATIVE LEDGER (OGD Backbone) */}
                {budget ? (
                  <div className="bg-white dark:bg-[#1A221E] border-2 border-[#1B4332]/25 dark:border-[#10B981]/30 rounded-3xl p-6 shadow-xs space-y-5">
                    <div className="flex items-center justify-between pb-3.5 border-b border-[#E3E0D6] dark:border-[#26352E]">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#101913] dark:text-[#F3F6F4]">
                        <TrendingUp className="w-4 h-4 text-[#1B4332] dark:text-[#34D399]" />
                        <span>Konteks APBD Kota Bogor TA {budget.fiscalYear}</span>
                      </div>
                      <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-[#E7EBDD] dark:bg-[#1A2E24] text-[#1B4332] dark:text-[#34D399] font-bold tracking-wider">
                        SIKD KEMENDAGRI
                      </span>
                    </div>

                    {/* Sector & Sub-Program Title */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#4F5A52] dark:text-[#9EACA3]">
                        Sektor Alokasi Anggaran
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-[#101913] dark:text-[#F3F6F4] leading-snug">
                        {budget.sectorName}
                      </h4>
                      <div className="text-xs text-[#1B4332] dark:text-[#34D399] font-semibold">
                        {budget.subSectorName}
                      </div>
                    </div>

                    {/* High-Contrast 3-Way Financial Ledger */}
                    <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-[#F7F5EF] dark:bg-[#131916] rounded-2xl border border-[#E3E0D6] dark:border-[#26352E]">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-medium text-[#4F5A52] dark:text-[#9EACA3]">Pagu Alokasi</div>
                        <div className="font-mono tabular-nums font-bold text-xs sm:text-sm text-[#101913] dark:text-[#F3F6F4]">
                          Rp {(budget.paguAllocation / 1e9).toFixed(1)} M
                        </div>
                        <div className="text-[9px] text-[#4F5A52] dark:text-[#9EACA3]">Tahun 2026</div>
                      </div>

                      <div className="space-y-0.5 border-x border-[#E3E0D6] dark:border-[#26352E] px-2">
                        <div className="text-[10px] font-medium text-[#4F5A52] dark:text-[#9EACA3]">Realisasi</div>
                        <div className="font-mono tabular-nums font-bold text-xs sm:text-sm text-[#1B4332] dark:text-[#34D399]">
                          Rp {(budget.realizedSpending / 1e9).toFixed(1)} M
                        </div>
                        <div className="text-[9px] tabular-nums font-semibold text-[#1B4332] dark:text-[#34D399]">
                          {budget.executionRatePercent}% Terserap
                        </div>
                      </div>

                      <div className="space-y-0.5 pl-1">
                        <div className="text-[10px] font-medium text-[#4F5A52] dark:text-[#9EACA3]">Sisa Pagu</div>
                        <div className="font-mono tabular-nums font-bold text-xs sm:text-sm text-amber-800 dark:text-amber-400">
                          Rp {(unspentBudget / 1e9).toFixed(1)} M
                        </div>
                        <div className="text-[9px] tabular-nums text-amber-800 dark:text-amber-400 font-medium">
                          {unspentPercent}% Tersisa
                        </div>
                      </div>
                    </div>

                    {/* Visual Segmented Health Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#4F5A52] dark:text-[#9EACA3]">Penyerapan Realisasi Belanja:</span>
                        <strong className="text-[#101913] dark:text-[#F3F6F4] font-mono tabular-nums">
                          {budget.executionRatePercent}%
                        </strong>
                      </div>

                      <div className="w-full h-3 rounded-full bg-[#E3E0D6] dark:bg-[#26352E] overflow-hidden flex border border-[#E3E0D6] dark:border-[#26352E]">
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

                      <div className="flex items-center justify-between text-[11px] text-[#4F5A52] dark:text-[#9EACA3]">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#1B4332] dark:bg-[#10B981]"></span>
                          <span>Realisasi Belanja Dinas</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          <span>Sisa Anggaran Siap Serap</span>
                        </span>
                      </div>
                    </div>

                    {/* Budget Insight Analysis Callout */}
                    <div className="p-3.5 bg-[#E7EBDD]/60 dark:bg-[#1A2E24]/60 rounded-2xl border border-[#1B4332]/20 dark:border-[#10B981]/30 text-xs text-[#101913] dark:text-[#F3F6F4] leading-relaxed">
                      <strong>Konteks Anggaran:</strong> Sisa alokasi pagu sebesar{' '}
                      <strong className="tabular-nums">Rp {(unspentBudget / 1e9).toFixed(1)} Miliar</strong> masih tersedia untuk program ini. Dana mencukupi bagi dinas untuk melakukan intervensi fisik pada titik ini sebelum akhir tahun anggaran.
                    </div>

                    {/* Responsible Agency Profile & Responsiveness Metrics */}
                    <div className="pt-3 border-t border-[#E3E0D6] dark:border-[#26352E] space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Building className="w-4 h-4 text-[#4F5A52] dark:text-[#9EACA3] shrink-0" />
                          <span className="font-semibold text-[#101913] dark:text-[#F3F6F4] truncate">
                            {budget.responsibleAgency}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-[#F7F5EF] dark:bg-[#131916] p-3 rounded-2xl border border-[#E3E0D6] dark:border-[#26352E]">
                          <div className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3]">Indeks Responsif:</div>
                          <div className="font-bold tabular-nums text-[#1B4332] dark:text-[#34D399] text-sm">
                            {budget.responsivenessScore} / 100
                          </div>
                        </div>
                        <div className="bg-[#F7F5EF] dark:bg-[#131916] p-3 rounded-2xl border border-[#E3E0D6] dark:border-[#26352E]">
                          <div className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3]">SLA Penyelesaian:</div>
                          <div className="font-bold tabular-nums text-[#101913] dark:text-[#F3F6F4] text-sm">
                            {budget.avgResolutionDays} Hari Kerja
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Legal Provenance Footer */}
                    <div className="text-[10px] text-[#4F5A52]/80 dark:text-[#9EACA3]/80 font-mono leading-relaxed pt-1">
                      {budget.dataSource} • Diperbarui {budget.lastUpdated} [Data Contoh Simulasi]
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 text-center text-xs text-[#4F5A52] dark:text-[#9EACA3]">
                    Belum ada data anggaran yang terhubung dengan laporan ini.
                  </div>
                )}

                {/* 2. OFFICIAL AUDIT TRAIL (Un-boxed Immutable State Transition History) */}
                <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E3E0D6] dark:border-[#26352E]">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#101913] dark:text-[#F3F6F4]">
                      <Clock className="w-4 h-4 text-[#1B4332] dark:text-[#34D399]" />
                      <span>Jejak Audit & Alur Status Resmi</span>
                    </div>
                    <span className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3] font-mono tabular-nums px-2.5 py-0.5 rounded-full bg-[#F7F5EF] dark:bg-[#131916] border border-[#E3E0D6] dark:border-[#26352E]">
                      {report.events.length} Perubahan
                    </span>
                  </div>

                  <div className="relative pl-6 space-y-5 border-l-2 border-[#E3E0D6] dark:border-[#26352E] ml-2 pt-1">
                    {report.events.map((ev) => (
                      <div key={ev.id} className="relative">
                        <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#1B4332] dark:bg-[#10B981] ring-4 ring-white dark:ring-[#1A221E]"></span>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold text-[#101913] dark:text-[#F3F6F4]">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#F7F5EF] dark:bg-[#131916] border border-[#E3E0D6] dark:border-[#26352E] font-mono text-[10px]">
                              {ev.eventType}
                            </span>
                            <span className="text-[10px] text-[#4F5A52] dark:text-[#9EACA3] font-normal font-mono">
                              {formatAbsoluteTimestamp(ev.timestamp)}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#1B4332] dark:text-[#34D399] font-semibold">
                            Oleh: {ev.actorName}
                          </div>
                          <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3] leading-relaxed">
                            {ev.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. CASE DOSSIER QUICK ACTION CARD */}
                <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 shadow-xs space-y-3">
                  <div className="text-xs font-bold text-[#101913] dark:text-[#F3F6F4]">Aksi Berkas Tiket:</div>
                  <div className="grid grid-cols-1 gap-2.5">
                    <button
                      type="button"
                      onClick={handleCopyRef}
                      className="report-pill-btn w-full flex items-center justify-between px-4 py-2.5 rounded-full border border-[#E3E0D6] dark:border-[#26352E] text-xs font-semibold text-[#101913] dark:text-[#F3F6F4] hover:bg-[#F7F5EF] dark:hover:bg-[#131916] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Copy className="w-3.5 h-3.5 text-[#4F5A52] dark:text-[#9EACA3]" />
                        <span>Salin Nomor Tiket</span>
                      </span>
                      <span className="font-mono text-[#4F5A52] dark:text-[#9EACA3]">{report.publicReference}</span>
                    </button>

                    <a
                      href={`/track?ref=${encodeURIComponent(report.publicReference)}`}
                      className="report-pill-btn w-full flex items-center justify-between px-4 py-2.5 rounded-full bg-[#1B4332] dark:bg-[#10B981] text-white dark:text-[#0A1610] text-xs font-semibold hover:bg-[#14352A] dark:hover:bg-[#34D399] transition-colors"
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
      </div>
    </>
  );
};
