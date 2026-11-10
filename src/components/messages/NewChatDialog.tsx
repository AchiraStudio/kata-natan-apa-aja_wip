import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { searchProfiles } from '../../services/messagesService';
import type { Report, UserProfile } from '../../types/domain';

interface NewChatDialogProps {
  currentUserId?: string;
  /** Verifiers can also open a thread from a report that has a known reporter. */
  reports: Report[];
  onPickUser: (user: UserProfile) => void;
  onPickReport: (report: Report) => void;
  onClose: () => void;
}

export const NewChatDialog: React.FC<NewChatDialogProps> = ({ currentUserId, reports, onPickUser, onPickReport, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    let active = true;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      const found = await searchProfiles(q, currentUserId);
      if (active) {
        setResults(found);
        setIsSearching(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, currentUserId]);

  const reportsWithReporter = reports.filter((r) => r.reporterUserId && r.reporterUserId !== currentUserId).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[var(--scrim)] p-0 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-chat-title"
        onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full sm:max-w-md max-h-[85dvh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 id="new-chat-title" className="text-lg font-bold text-ink">
            Percakapan baru
          </h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-2 hover:bg-surface-2 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pb-3 relative">
          <Search className="absolute left-8 top-1/2 -translate-y-[60%] w-4 h-4 text-ink-3 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama atau username"
            aria-label="Cari pengguna"
            className="titik-pill-input pl-10 pr-3"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-4">
          {query.trim().length >= 2 ? (
            isSearching ? (
              <p role="status" className="px-3 py-6 text-center text-sm text-ink-2">
                Mencari
              </p>
            ) : results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-ink-2">Tidak ada pengguna dengan kata kunci itu.</p>
            ) : (
              <ul>
                {results.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => onPickUser(u)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <UserAvatar src={u.avatarUrl} alt={u.displayName} name={u.displayName} role={u.role} className="w-10 h-10 rounded-full object-cover shrink-0" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">{u.displayName}</span>
                        <span className="block truncate text-xs text-ink-3">
                          @{u.username}
                          {u.role === 'admin' ? ' / petugas' : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <p className="px-3 py-2 text-sm text-ink-2">Ketik minimal 2 huruf untuk mencari warga atau petugas.</p>
          )}

          {reportsWithReporter.length > 0 && query.trim().length < 2 && (
            <div className="mt-3">
              <p className="px-3 py-2 text-xs font-semibold text-ink-3">Dari laporan</p>
              <ul>
                {reportsWithReporter.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onPickReport(r)}
                      className="w-full px-3 py-2.5 rounded-lg text-left hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <span className="titik-id block text-[11px] text-ink-3">{r.publicReference}</span>
                      <span className="block truncate text-sm font-medium text-ink">{r.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
