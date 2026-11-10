import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Search } from 'lucide-react';
import type { UserProfile } from '../../types/domain';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { dataService } from '../../services/dataService';
import { UserAvatar } from '../../components/common/UserAvatar';
import { EmptyNote, Notice } from '../../components/admin';

interface Props {
  profile: UserProfile;
}

interface UserRow {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  role: 'citizen' | 'admin';
  verifiedAgency?: string;
  district?: string;
  isVerified: boolean;
}

type RoleFilter = 'Semua' | 'citizen' | 'admin';
type VerifyFilter = 'Semua' | 'Terverifikasi' | 'Belum';

const ROLE_LABEL: Record<RoleFilter, string> = { Semua: 'Semua peran', citizen: 'Warga', admin: 'Admin' };

/** Change a role through the server function when it exists, else straight on the tables. */
async function persistRole(userId: string, role: 'citizen' | 'admin'): Promise<void> {
  const rpc = await supabase.rpc('admin_set_user_role', { p_user_id: userId, p_role: role });
  if (!rpc.error) return;

  const missingFunction = rpc.error.code === 'PGRST202' || rpc.error.code === '42883' || /could not find the function/i.test(rpc.error.message ?? '');
  if (!missingFunction) throw new Error(rpc.error.message || 'Peran belum dapat diubah.');

  const { error } = await supabase.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', userId);
  if (error) throw new Error(error.message);
  if (role === 'admin') {
    const { error: roleError } = await supabase.from('user_roles').upsert({ user_id: userId, role: 'admin' });
    if (roleError) throw new Error(roleError.message);
  } else {
    const { error: roleError } = await supabase.from('user_roles').delete().eq('user_id', userId);
    if (roleError) throw new Error(roleError.message);
  }
}

export const AdminPengguna: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('Semua');
  const [verifyFilter, setVerifyFilter] = useState<VerifyFilter>('Semua');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    if (!isSupabaseConfigured) {
      setUsers([]);
      setLoadError('Supabase belum dikonfigurasi, jadi daftar pengguna tidak tersedia.');
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(
        (data ?? []).map((row: Record<string, any>) => ({
          id: row.id,
          username: row.username || 'pengguna',
          displayName: row.display_name || row.username || 'Warga',
          email: row.email ?? undefined,
          avatarUrl: row.avatar_url ?? undefined,
          role: row.role === 'admin' ? 'admin' : 'citizen',
          verifiedAgency: row.verified_agency ?? undefined,
          district: row.district || undefined,
          isVerified: Boolean(row.is_verified),
        }))
      );
    } catch {
      setUsers([]);
      setLoadError('Daftar pengguna belum dapat dimuat. Periksa koneksi lalu segarkan.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const patchUser = (id: string, patch: Partial<UserRow>) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  const toggleRole = async (user: UserRow) => {
    if (busyId) return;
    if (user.id === profile.id) {
      setFeedback({ kind: 'error', text: 'Anda tidak bisa mengubah peran akun Anda sendiri.' });
      return;
    }
    const next: 'citizen' | 'admin' = user.role === 'admin' ? 'citizen' : 'admin';
    const ok = window.confirm(next === 'admin' ? `Jadikan ${user.displayName} admin? Akun ini akan bisa mengubah status laporan.` : `Cabut akses admin ${user.displayName}?`);
    if (!ok) return;

    setBusyId(user.id);
    setFeedback(null);
    try {
      await persistRole(user.id, next);
      patchUser(user.id, { role: next });
      setFeedback({ kind: 'success', text: `${user.displayName} sekarang berperan ${next === 'admin' ? 'admin' : 'warga'}.` });
    } catch (err) {
      setFeedback({ kind: 'error', text: err instanceof Error ? err.message : 'Peran belum dapat diubah.' });
    } finally {
      setBusyId(null);
    }
  };

  const toggleVerification = async (user: UserRow) => {
    if (busyId) return;
    const next = !user.isVerified;
    setBusyId(user.id);
    setFeedback(null);
    try {
      await dataService.setCitizenVerification(user.id, next);
      patchUser(user.id, { isVerified: next });
      setFeedback({ kind: 'success', text: `${user.displayName} ${next ? 'ditandai terverifikasi' : 'tidak lagi terverifikasi'}.` });
    } catch (err) {
      setFeedback({ kind: 'error', text: err instanceof Error ? err.message : 'Status verifikasi belum dapat diubah.' });
    } finally {
      setBusyId(null);
    }
  };

  const counts = useMemo(
    () => ({
      total: users.length,
      verified: users.filter((u) => u.isVerified).length,
      admins: users.filter((u) => u.role === 'admin').length,
    }),
    [users]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'Semua' && u.role !== roleFilter) return false;
      if (verifyFilter === 'Terverifikasi' && !u.isVerified) return false;
      if (verifyFilter === 'Belum' && u.isVerified) return false;
      return !q || [u.displayName, u.username, u.email, u.district].some((v) => v?.toLowerCase().includes(q));
    });
  }, [users, roleFilter, verifyFilter, query]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Pengguna</h2>
          <p className="mt-1 text-sm text-ink-2 tabular-nums">
            {counts.total} akun, {counts.verified} terverifikasi, {counts.admins} admin.
          </p>
        </div>
        <button type="button" onClick={fetchUsers} disabled={isLoading} aria-label="Segarkan" className="w-9 h-9 rounded-lg bg-surface-2 text-ink-2 hover:text-ink flex items-center justify-center cursor-pointer disabled:opacity-60">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {loadError && <Notice kind="error">{loadError}</Notice>}
      {feedback && <Notice kind={feedback.kind}>{feedback.text}</Notice>}

      <section aria-label="Daftar pengguna" className="panel overflow-hidden">
        <div className="flex flex-col md:flex-row gap-3 p-4 border-b border-line-soft">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, @username, email, atau kecamatan"
              aria-label="Cari pengguna"
              className="titik-pill-input pl-9 pr-3"
            />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilter)} aria-label="Filter peran" className="titik-pill-input px-3 md:w-40">
            {(Object.keys(ROLE_LABEL) as RoleFilter[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
          <select value={verifyFilter} onChange={(e) => setVerifyFilter(e.target.value as VerifyFilter)} aria-label="Filter verifikasi" className="titik-pill-input px-3 md:w-48">
            <option value="Semua">Semua verifikasi</option>
            <option value="Terverifikasi">Terverifikasi</option>
            <option value="Belum">Belum terverifikasi</option>
          </select>
        </div>

        {isLoading && users.length === 0 ? (
          <p role="status" className="px-5 py-12 text-center text-sm text-ink-2">
            Memuat pengguna
          </p>
        ) : visible.length === 0 ? (
          <EmptyNote title={users.length === 0 ? 'Belum ada pengguna' : 'Tidak ada yang cocok'}>{users.length === 0 ? 'Akun yang mendaftar akan muncul di sini.' : 'Ubah kata kunci atau filter.'}</EmptyNote>
        ) : (
          <ul className="divide-y divide-line-soft">
            {visible.map((u) => {
              const isSelf = u.id === profile.id;
              const busy = busyId === u.id;
              return (
                <li key={u.id} className="px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-3">
                  <UserAvatar src={u.avatarUrl} alt={u.displayName} name={u.displayName} role={u.role} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="text-sm font-semibold text-ink truncate">
                      {u.displayName}
                      {isSelf && <span className="ml-2 text-xs font-normal text-ink-3">(Anda)</span>}
                    </p>
                    <p className="text-xs text-ink-3 truncate">
                      @{u.username}
                      {u.email ? ` / ${u.email}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-ink-2 flex flex-wrap gap-x-3">
                      <span>{u.role === 'admin' ? 'admin' : 'citizen'}</span>
                      <span>{u.isVerified ? 'Terverifikasi' : 'Belum terverifikasi'}</span>
                      {u.district && <span>{u.district}</span>}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => navigate(`/pesan?new_chat=${encodeURIComponent(u.id)}`)}
                      disabled={isSelf}
                      title={isSelf ? 'Ini akun Anda' : `Kirim pesan ke ${u.displayName}`}
                      className="h-9 px-3.5 rounded-lg bg-surface-2 text-ink text-sm font-semibold hover:bg-line disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Pesan
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleVerification(u)}
                      disabled={busy || u.role === 'admin'}
                      title={u.role === 'admin' ? 'Akun admin tidak perlu verifikasi warga' : undefined}
                      className="h-9 px-3.5 rounded-lg bg-surface-2 text-ink text-sm font-semibold hover:bg-line disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {u.isVerified ? 'Batalkan verifikasi' : 'Verifikasi'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleRole(u)}
                      disabled={busy || isSelf}
                      title={isSelf ? 'Anda tidak bisa mengubah peran sendiri' : undefined}
                      className="h-9 px-3.5 rounded-lg bg-surface-2 text-ink text-sm font-semibold hover:bg-line disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {busy ? 'Memproses' : u.role === 'admin' ? 'Jadikan warga' : 'Jadikan admin'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};
