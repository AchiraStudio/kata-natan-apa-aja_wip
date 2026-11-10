import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  LoaderCircle,
  MapPin,
  Printer,
  Send,
  Share2,
  Shield,
  ThumbsUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { dataService } from '../services/dataService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { useTitik } from '../context/TitikContext';
import { useAuth } from '../context/AuthContext';
import { sortCommentsForUser, isCommentAuthoredByUser } from '../utils/commentSorting';
import { getStatusMeta, STATUS_DOT_CLASS } from '../utils/reportStatus';
import type { Report } from '../types/domain';
import { PageShell } from '../components/layout/PageShell';
import { UserAvatar } from '../components/common/UserAvatar';
import { formatRupiah } from '../components/admin/ui';
import { SaveReportButton } from '../components/reporting/SaveReportButton';
import { MessageReporterButton } from '../components/reporting/MessageReporterButton';
import { ProgressTracker } from '../components/report-detail/ProgressTracker';
import { EvidencePanel } from '../components/report-detail/EvidencePanel';
import { PublicHistory } from '../components/report-detail/PublicHistory';
import { BudgetPanel } from '../components/report-detail/BudgetPanel';
import { TestimonyPanel, type Testimony } from '../components/report-detail/TestimonyPanel';
import { SEVERITY_LABEL, formatWhen, getOfficialResponse } from '../components/report-detail/format';
import './ReportDetailView.css';

const matchesReference = (report: Report | undefined, id: string) =>
  Boolean(report) && (report!.id === id || report!.publicReference?.toUpperCase() === id.toUpperCase());

export const ReportDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleSupport, currentUserId, posts } = useTitik();
  const { profile } = useAuth();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [supportError, setSupportError] = useState('');

  const [linkedPostId, setLinkedPostId] = useState<string | null>(null);
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [isRefreshingTestimonies, setIsRefreshingTestimonies] = useState(false);

  const [clarificationText, setClarificationText] = useState('');
  const [isSubmittingClarification, setIsSubmittingClarification] = useState(false);
  const [clarificationSuccess, setClarificationSuccess] = useState('');
  const [clarificationError, setClarificationError] = useState('');

  const sortedTestimonies = useMemo(() => sortCommentsForUser(testimonies, profile), [testimonies, profile]);

  // A report the feed already holds is a fine fallback when the lookup misses or fails
  const findInFeed = (reference: string): Report | null => {
    const match = (posts ?? []).find(
      (p) => matchesReference(p.relatedReport, reference) || p.relatedReportId === reference,
    );
    return match?.relatedReport ?? null;
  };

  const loadTestimonies = async (postId: string) => {
    const comments = await dataService.getComments(postId);
    setTestimonies((comments || []).map((c) => ({ ...c, isLiked: false })));
  };

  const refreshTestimonies = async () => {
    if (!report || isRefreshingTestimonies) return;
    setIsRefreshingTestimonies(true);
    try {
      let postId = linkedPostId;
      if (!postId) {
        postId = (await dataService.getPostByReportId(report.id))?.id ?? null;
        setLinkedPostId(postId);
      }
      if (postId) await loadTestimonies(postId);
      else setTestimonies([]);
    } catch (err) {
      console.error('Failed to refresh testimonies:', err);
    } finally {
      setIsRefreshingTestimonies(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    dataService
      .getReportByReference(id, currentUserId)
      .then((res) => {
        if (!isMounted) return;
        const resolved = res ?? findInFeed(id);
        setReport(resolved);
        setLoading(false);
        if (!resolved) return;

        dataService.getPostByReportId(resolved.id).then((post) => {
          if (!isMounted) return;
          if (post) {
            setLinkedPostId(post.id);
            dataService.getComments(post.id).then((comments) => {
              if (isMounted) setTestimonies((comments || []).map((c) => ({ ...c, isLiked: false })));
            });
          } else {
            setLinkedPostId(null);
            setTestimonies([]);
          }
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setReport(findInFeed(id));
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // findInFeed only reads `posts`, which is already a dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentUserId, posts]);

  // Live status, official response and testimonies
  useEffect(() => {
    if (!id || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`detail-report-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reports' }, (payload) => {
        const row = payload.new as { id?: string; public_reference?: string } | null;
        if (row && (row.id === id || row.public_reference === id)) {
          dataService
            .getReportByReference(id, currentUserId)
            .then((res) => {
              if (res) setReport(res);
            })
            .catch(() => {});
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, (payload) => {
        const row = payload.new as { post_id?: string } | null;
        if ((linkedPostId && row?.post_id === linkedPostId) || (report && row?.post_id === report.id)) {
          refreshTestimonies();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, report?.id, currentUserId]);

  // A gentle burst when a report is resolved, in the theme's own greens
  useEffect(() => {
    if (report?.status !== 'resolved') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const css = getComputedStyle(document.documentElement);
    const colors = ['--brand', '--lime'].map((name) => css.getPropertyValue(name).trim()).filter(Boolean);
    try {
      confetti({ particleCount: 50, spread: 65, origin: { y: 0.65 }, colors });
    } catch {
      // canvas unavailable: skip the celebration
    }
  }, [report?.status]);

  const flash = (set: (value: boolean) => void) => {
    set(true);
    window.setTimeout(() => set(false), 2000);
  };

  const copy = async (text: string, set: (value: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(set);
    } catch {
      // clipboard blocked: leave the button as it was
    }
  };

  const handleSupport = async () => {
    if (!report) return;
    setSupportError('');
    try {
      await toggleSupport(report.id);
      setReport((prev) =>
        prev
          ? {
              ...prev,
              isSupportedByMe: !prev.isSupportedByMe,
              supportCount: prev.isSupportedByMe ? prev.supportCount - 1 : prev.supportCount + 1,
            }
          : null,
      );
    } catch {
      setSupportError('Dukungan belum tersimpan. Coba lagi.');
    }
  };

  const handleTestimonyLike = (testimonyId: string) => {
    setTestimonies((prev) =>
      prev.map((t) =>
        t.id === testimonyId ? { ...t, isLiked: !t.isLiked, likes: t.isLiked ? t.likes - 1 : t.likes + 1 } : t,
      ),
    );
  };

  const handleSubmitTestimony = async (body: string, authorName: string): Promise<string | null> => {
    if (!report) return 'Laporan belum dimuat.';
    const author = authorName || 'Warga Sekitar';
    try {
      let postId = linkedPostId;
      if (!postId) {
        postId = (await dataService.getPostByReportId(report.id))?.id ?? null;
        setLinkedPostId(postId);
      }
      if (!postId) return 'Kesaksian publik tidak tersedia untuk laporan privat ini.';

      const created = await dataService.addComment(postId, author, '', body);
      setTestimonies((prev) => [
        {
          ...(created || { id: `testimony-${Date.now()}`, authorName: author, avatarUrl: '', body, timeAgo: 'Baru saja', likes: 0 }),
          isLiked: false,
        },
        ...prev,
      ]);
      return null;
    } catch (err) {
      console.error('Failed to submit testimony:', err);
      return 'Kesaksian belum terkirim. Periksa koneksi, lalu coba lagi.';
    }
  };

  const handleClarificationSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!report || !clarificationText.trim() || isSubmittingClarification) return;

    setIsSubmittingClarification(true);
    setClarificationError('');
    setClarificationSuccess('');
    try {
      const updated = await dataService.submitAdditionalInfo(
        report.id,
        profile.id || currentUserId || 'usr-citizen',
        clarificationText.trim(),
      );
      setReport(updated);
      setClarificationText('');
      setClarificationSuccess('Informasi tambahan terkirim. Laporan kembali ke tahap verifikasi.');
    } catch (err) {
      console.error('Failed to submit clarification:', err);
      setClarificationError(err instanceof Error ? err.message : 'Informasi tambahan belum terkirim.');
    } finally {
      setIsSubmittingClarification(false);
    }
  };

  if (loading) {
    return (
      <PageShell width="narrow">
        <div role="status" className="panel p-8 flex items-center justify-center gap-3 text-sm text-ink-2">
          <LoaderCircle className="w-5 h-5 animate-spin" aria-hidden="true" />
          Memuat laporan...
        </div>
      </PageShell>
    );
  }

  if (!report) {
    return (
      <PageShell width="narrow">
        <div className="panel p-8 text-center">
          <h1 className="text-xl font-bold text-ink">Laporan tidak ditemukan</h1>
          <p className="mt-2 text-sm text-ink-2 leading-relaxed max-w-md mx-auto">
            Nomor ini belum terdaftar, atau laporannya masih menunggu pemeriksaan awal sebelum tampil untuk umum.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Link to="/track" className="titik-pill-btn titik-pill-btn-primary">
              Lacak dengan nomor laporan
            </Link>
            <Link to="/" className="titik-pill-btn titik-pill-btn-secondary">
              Kembali ke beranda
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const meta = getStatusMeta(report.status);
  const officialResponse = getOfficialResponse(report);
  const agency = report.responsibleAgency || report.budgetContext?.responsibleAgency || 'Belum ditentukan';
  const reviewedAt = report.lastReviewedAt ?? report.last_reviewed_at;
  const place = [report.location.district, report.location.city].filter(Boolean).join(', ');
  const isAnonymous = report.reporterType === 'anonymous';
  const reporterName =
    report.reporterDisplayName || (report.reporterType === 'verified_citizen' ? 'Warga terverifikasi' : 'Warga terdaftar');
  const reporterHandle = report.reporterUserId
    ? report.reporterUserId.replace(/^@+/, '').trim()
    : reporterName.replace(/^@+/, '').trim().toLowerCase().replace(/[^a-z0-9_.]/g, '_');

  const facts: Array<{ label: string; value: string; wide?: boolean }> = [
    { label: 'Kategori', value: report.category },
    { label: 'Urgensi', value: SEVERITY_LABEL[report.severity] ?? report.severity },
    { label: 'Dilaporkan', value: formatWhen(report.createdAt) },
    ...(report.updatedAt && report.updatedAt !== report.createdAt
      ? [{ label: 'Diperbarui', value: formatWhen(report.updatedAt) }]
      : []),
    { label: 'Dinas penanggung jawab', value: agency, wide: true },
    ...(place ? [{ label: 'Wilayah', value: place }] : []),
    ...(report.facilityName ? [{ label: 'Fasilitas', value: report.facilityName }] : []),
    ...(report.estimatedCost ? [{ label: 'Perkiraan biaya', value: formatRupiah(report.estimatedCost) }] : []),
  ];

  return (
    <PageShell width="wide" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Kembali
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <SaveReportButton
            reportId={report.id}
            isSavedByMe={report.isSavedByMe}
            onSavedChange={(isSaved) => setReport((current) => (current ? { ...current, isSavedByMe: isSaved } : current))}
          />
          <button
            type="button"
            onClick={() => copy(window.location.href, setCopiedShare)}
            className="titik-pill-btn titik-pill-btn-secondary"
          >
            {copiedShare ? <Check className="w-4 h-4" aria-hidden="true" /> : <Share2 className="w-4 h-4" aria-hidden="true" />}
            <span aria-live="polite">{copiedShare ? 'Tautan disalin' : 'Bagikan'}</span>
          </button>
          <button type="button" onClick={() => window.print()} className="titik-pill-btn titik-pill-btn-secondary">
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Cetak</span>
          </button>
        </div>
      </div>

      <header className="panel p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <button
            type="button"
            onClick={() => copy(report.publicReference, setCopiedRef)}
            aria-label={`Salin nomor laporan ${report.publicReference}`}
            className="titik-id inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink cursor-pointer"
          >
            {report.publicReference}
            {copiedRef ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
          </button>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
            <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT_CLASS[meta.tone]}`} />
            {meta.label}
          </span>
          {report.isSampleData && (
            <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-2">Data contoh</span>
          )}
        </div>

        <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-ink leading-tight text-balance">{report.title}</h1>
        <p className="mt-2 flex items-start gap-1.5 text-sm text-ink-2">
          <MapPin className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{report.location.address || 'Alamat tidak dicantumkan'}</span>
        </p>

        <dl className="mt-6 pt-5 border-t border-line-soft grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
          {facts.map((fact) => (
            <div key={fact.label} className={`min-w-0 ${fact.wide ? 'col-span-2' : ''}`}>
              <dt className="text-xs text-ink-3">{fact.label}</dt>
              <dd className="mt-0.5 text-sm text-ink">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <ProgressTracker status={report.status} />

      {report.status === 'needs_info' && (
        <section aria-labelledby="needs-info-heading" className="panel p-5 sm:p-7 print:hidden">
          <h2 id="needs-info-heading" className="flex items-center gap-2 font-sans text-base font-semibold text-ink">
            <AlertCircle className="w-5 h-5 text-st-baru" aria-hidden="true" />
            Petugas meminta informasi tambahan
          </h2>
          <p className="mt-1.5 text-sm text-ink-2">Peninjauan berhenti sementara sampai pelapor melengkapi keterangan di bawah.</p>

          {officialResponse && (
            <blockquote className="mt-4 rounded-xl bg-st-baru/12 border border-st-baru/30 px-4 py-3 text-sm text-ink leading-relaxed">
              <span className="block text-xs font-semibold text-ink-2 mb-1">Permintaan petugas</span>
              {officialResponse}
            </blockquote>
          )}

          <form onSubmit={handleClarificationSubmit} className="mt-4 space-y-3">
            <label htmlFor="clarification" className="block text-sm font-medium text-ink">
              Keterangan tambahan
            </label>
            <textarea
              id="clarification"
              rows={3}
              required
              value={clarificationText}
              onChange={(e) => setClarificationText(e.target.value)}
              placeholder="Patokan lokasi, nomor RT/RW, nomor tiang, atau detail lain yang diminta petugas."
              className="titik-pill-input px-3.5 py-2.5 resize-none"
            />
            {clarificationError && (
              <p role="alert" className="text-sm text-st-ditolak">
                {clarificationError}
              </p>
            )}
            {clarificationSuccess && (
              <p role="status" className="flex items-center gap-1.5 text-sm text-st-tuntas">
                <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                {clarificationSuccess}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmittingClarification || !clarificationText.trim()}
              className="titik-pill-btn titik-pill-btn-primary"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              {isSubmittingClarification ? 'Mengirim...' : 'Kirim keterangan'}
            </button>
          </form>
        </section>
      )}

      {officialResponse && report.status !== 'needs_info' && (
        <section aria-labelledby="response-heading" className="panel p-5 sm:p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="response-heading" className="font-sans text-base font-semibold text-ink">
              Tanggapan resmi
            </h2>
            <p className="text-xs text-ink-3">
              {agency}
              {reviewedAt && (
                <>
                  {' '}
                  · <span className="tabular-nums">{formatWhen(reviewedAt)}</span>
                </>
              )}
            </p>
          </div>
          <p className="mt-3 text-[15px] text-ink leading-relaxed whitespace-pre-line">{officialResponse}</p>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] items-start">
        <div className="space-y-6 min-w-0">
          <EvidencePanel key={report.id} report={report} />

          <section aria-labelledby="story-heading" className="panel p-5 sm:p-7">
            <h2 id="story-heading" className="font-sans text-base font-semibold text-ink">
              Cerita pelapor
            </h2>
            <p className="mt-3 text-[15px] text-ink leading-relaxed whitespace-pre-line">{report.description}</p>

            <div className="mt-6 pt-5 border-t border-line-soft flex items-center gap-3">
              {isAnonymous ? (
                <>
                  <span className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-ink-2 shrink-0">
                    <Shield className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">Pelapor anonim</p>
                    <p className="text-xs text-ink-3">Identitas tidak ditampilkan.</p>
                  </div>
                </>
              ) : (
                <>
                  <Link to={`/u/${reporterHandle}`} className="shrink-0" aria-label={`Lihat profil ${reporterName}`}>
                    <UserAvatar alt="" name={reporterName} role="citizen" className="w-9 h-9 rounded-full object-cover" />
                  </Link>
                  <div className="min-w-0">
                    <Link to={`/u/${reporterHandle}`} className="text-sm font-semibold text-ink hover:text-brand">
                      {reporterName}
                    </Link>
                    <p className="text-xs text-ink-3">
                      {report.reporterType === 'verified_citizen' ? 'Warga terverifikasi' : 'Warga terdaftar'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>

          <section aria-label="Dukungan warga" className="panel p-5 sm:p-6 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-ink-2">
                <span className="font-display text-2xl font-bold text-ink tabular-nums mr-2">
                  {report.supportCount.toLocaleString('id-ID')}
                </span>
                warga menyatakan terdampak juga
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <MessageReporterButton report={report} />
                <button
                  type="button"
                  onClick={handleSupport}
                  aria-pressed={Boolean(report.isSupportedByMe)}
                  className={`titik-pill-btn ${report.isSupportedByMe ? 'titik-pill-btn-secondary' : 'titik-pill-btn-primary'}`}
                >
                  {report.isSupportedByMe ? <Check className="w-4 h-4" aria-hidden="true" /> : <ThumbsUp className="w-4 h-4" aria-hidden="true" />}
                  {report.isSupportedByMe ? 'Anda terdampak juga' : 'Saya terdampak juga'}
                </button>
              </div>
            </div>
            {supportError && (
              <p role="alert" className="mt-3 text-sm text-st-ditolak">
                {supportError}
              </p>
            )}
          </section>
        </div>

        <div className="space-y-6 min-w-0">
          <PublicHistory report={report} />
          <BudgetPanel budget={report.budgetContext} />
        </div>
      </div>

      <TestimonyPanel
        testimonies={sortedTestimonies}
        isRefreshing={isRefreshingTestimonies}
        isMine={(testimony) => isCommentAuthoredByUser(testimony, profile)}
        onRefresh={refreshTestimonies}
        onLike={handleTestimonyLike}
        onSubmit={handleSubmitTestimony}
      />
    </PageShell>
  );
};
