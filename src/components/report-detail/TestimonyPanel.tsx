import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCw, Send, ThumbsUp } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

export interface Testimony {
  id: string;
  authorName: string;
  authorId?: string;
  avatarUrl: string;
  body: string;
  timeAgo: string;
  likes: number;
  isLiked?: boolean;
}

interface TestimonyPanelProps {
  testimonies: Testimony[];
  isRefreshing: boolean;
  isMine: (testimony: Testimony) => boolean;
  onRefresh: () => void;
  onLike: (id: string) => void;
  /** Resolves to an error message, or null when the testimony was saved. */
  onSubmit: (body: string, authorName: string) => Promise<string | null>;
}

const profilePath = (testimony: Testimony) => {
  const handle = testimony.authorId
    ? testimony.authorId.replace(/^@+/, '').trim()
    : testimony.authorName.replace(/^@+/, '').trim().toLowerCase().replace(/[^a-z0-9_.]/g, '_');
  return `/u/${handle}`;
};

/** What neighbours saw on the ground. Public, newest and own testimonies first (the parent sorts). */
export const TestimonyPanel: React.FC<TestimonyPanelProps> = ({ testimonies, isRefreshing, isMine, onRefresh, onLike, onSubmit }) => {
  const [body, setBody] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    setError('');
    const failure = await onSubmit(body.trim(), name.trim());
    setSending(false);
    if (failure) {
      setError(failure);
      return;
    }
    setBody('');
    setName('');
  };

  return (
    <section aria-labelledby="testimony-heading" className="panel p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 id="testimony-heading" className="font-sans text-base font-semibold text-ink">
          Kesaksian warga <span className="font-normal text-ink-3 tabular-nums">({testimonies.length})</span>
        </h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Segarkan kesaksian warga"
          className="titik-pill-btn titik-pill-btn-subtle print:hidden"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          Segarkan
        </button>
      </div>

      <div className="mt-5 grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <form onSubmit={submit} className="space-y-3 print:hidden">
          <div>
            <label htmlFor="testimony-body" className="block text-sm font-medium text-ink mb-1.5">
              Apa yang Anda lihat di lokasi?
            </label>
            <textarea
              id="testimony-body"
              rows={3}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Contoh: pagi ini pukul 07.30 air masih setinggi mata kaki dan motor sulit lewat."
              className="titik-pill-input px-3.5 py-2.5 resize-none"
            />
          </div>
          <div>
            <label htmlFor="testimony-name" className="block text-sm font-medium text-ink mb-1.5">
              Nama <span className="font-normal text-ink-3">(opsional)</span>
            </label>
            <input
              id="testimony-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kosongkan untuk tampil sebagai Warga Sekitar"
              className="titik-pill-input px-3.5"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-st-ditolak">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="titik-pill-btn titik-pill-btn-primary w-full sm:w-auto"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            {sending ? 'Mengirim...' : 'Kirim kesaksian'}
          </button>
        </form>

        {testimonies.length === 0 ? (
          <p className="text-sm text-ink-2 leading-relaxed xl:pt-7">
            Belum ada kesaksian di titik ini. Jika Anda melihat kondisinya langsung, tulis di sini agar petugas dan warga lain tahu.
          </p>
        ) : (
          <ul className="divide-y divide-line-soft">
            {testimonies.map((testimony) => (
              <li key={testimony.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <Link to={profilePath(testimony)} className="shrink-0" aria-label={`Lihat profil ${testimony.authorName}`}>
                    <UserAvatar
                      src={testimony.avatarUrl}
                      alt=""
                      name={testimony.authorName}
                      role="citizen"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <Link to={profilePath(testimony)} className="text-sm font-semibold text-ink hover:text-brand">
                        {testimony.authorName}
                      </Link>
                      {isMine(testimony) && (
                        <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-xs font-medium text-ink">Anda</span>
                      )}
                      <span className="text-xs text-ink-3">{testimony.timeAgo}</span>
                    </div>
                    <p className="mt-1 text-sm text-ink leading-relaxed whitespace-pre-line">{testimony.body}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onLike(testimony.id)}
                    aria-pressed={Boolean(testimony.isLiked)}
                    aria-label={`Setuju dengan kesaksian ${testimony.authorName}`}
                    className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs tabular-nums cursor-pointer ${
                      testimony.isLiked ? 'bg-brand-soft text-ink font-semibold' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" />
                    {testimony.likes}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
