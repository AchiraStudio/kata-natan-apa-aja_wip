import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Shield,
  Search,
  MessageSquare,
  CheckCircle2,
  XCircle,
  RotateCcw,
  UserCheck,
  UserX,
  MapPin,
  Mail,
} from 'lucide-react';
import { UserProfile } from '../../types/domain';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { dataService } from '../../services/dataService';
import { UserAvatar } from '../../components/common/UserAvatar';

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
  bio?: string;
  createdAt?: string;
}

const SEEDED_PROFILES: UserRow[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    username: 'admin.pupr',
    displayName: 'admin Dinas PUPR',
    email: 'admin@titik.id',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    role: 'admin',
    verifiedAgency: 'Dinas PUPR',
    district: 'Bogor Tengah',
    isVerified: true,
    bio: 'Akun resmi verifikasi dan tindak lanjut laporan infrastruktur dinas PUPR Kota Bogor.',
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    username: 'budi.santoso',
    displayName: 'Budi Santoso',
    email: 'warga@titik.id',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role: 'citizen',
    district: 'Bogor Selatan',
    isVerified: true,
    bio: 'Warga Bogor Selatan pemerhati fasilitas jalan, drainase, dan keterbukaan APBD.',
    createdAt: '2026-10-02T09:00:00.000Z',
  },
  {
    id: 'usr-kn-001',
    username: 'mamatojol_bks',
    displayName: 'Mamat Saputra',
    email: 'mamat@demo.titik.id',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role: 'citizen',
    district: 'Bekasi Barat',
    isVerified: true,
    bio: 'Ojol Bekasi pejuang aspal pantura & Ahmad Yani.',
    createdAt: '2026-10-05T10:00:00.000Z',
  },
  {
    id: 'usr-kn-002',
    username: 'dian.margonda',
    displayName: 'Dian Prameswari',
    email: 'dian@demo.titik.id',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'citizen',
    district: 'Pancoran Mas',
    isVerified: true,
    bio: 'Warga Margonda, pejalan kaki harian kawasan kampus UI.',
    createdAt: '2026-10-06T11:00:00.000Z',
  },
  {
    id: 'usr-kn-003',
    username: 'wardi_pajajaran',
    displayName: 'Wardi Gunawan',
    email: 'wardi@demo.titik.id',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'citizen',
    district: 'Bogor Utara',
    isVerified: true,
    bio: 'Warga Bogor Utara, rutin melintas koridor Pajajaran.',
    createdAt: '2026-10-08T14:00:00.000Z',
  },
  {
    id: 'usr-kn-004',
    username: 'najla.kemang',
    displayName: 'Najla Savitri',
    email: 'najla@demo.titik.id',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    role: 'citizen',
    district: 'Bogor Timur',
    isVerified: false,
    bio: 'Warga aktif Kota Bogor.',
    createdAt: '2026-10-10T16:00:00.000Z',
  },
  {
    id: 'usr-kn-005',
    username: 'ahmadfauzi',
    displayName: 'Ahmad Fauzi',
    email: 'ahmad@demo.titik.id',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: 'citizen',
    district: 'Bogor Tengah',
    isVerified: false,
    bio: 'Warga Pasar Anyar pemerhati kebersihan lingkungan.',
    createdAt: '2026-10-12T18:00:00.000Z',
  },
  {
    id: 'usr-kn-006',
    username: 'dikasetia',
    displayName: 'Dika Setiawan',
    email: 'dika@demo.titik.id',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    role: 'citizen',
    district: 'Bogor Selatan',
    isVerified: true,
    bio: 'Teknisi kelistrikan & pemerhati penerangan jalan umum.',
    createdAt: '2026-10-15T20:00:00.000Z',
  },
];

export const AdminPengguna: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>(SEEDED_PROFILES);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'Semua' | 'citizen' | 'admin'>('Semua');
  const [verificationFilter, setVerificationFilter] = useState<'Semua' | 'Terverifikasi' | 'Belum'>('Semua');
  const [actionMessage, setActionMessage] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured) {
      setUsers(SEEDED_PROFILES);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setUsers(SEEDED_PROFILES);
      } else {
        const mappedUsers: UserRow[] = data.map((row: any) => ({
          id: row.id,
          username: row.username || 'user',
          displayName: row.display_name || row.username || 'Warga',
          email: row.email,
          avatarUrl: row.avatar_url,
          role: row.role === 'admin' ? 'admin' : 'citizen',
          verifiedAgency: row.verified_agency,
          district: row.district || 'Kota Bogor',
          isVerified: Boolean(row.is_verified),
          bio: row.bio,
          createdAt: row.created_at,
        }));
        setUsers(mappedUsers);
      }
    } catch {
      setUsers(SEEDED_PROFILES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleRole = async (targetUser: UserRow) => {
    const nextRole: 'citizen' | 'admin' = targetUser.role === 'admin' ? 'citizen' : 'admin';

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === targetUser.id ? { ...u, role: nextRole } : u))
    );

    setActionMessage(`Peran ${targetUser.displayName} diubah menjadi ${nextRole}`);
    setTimeout(() => setActionMessage(''), 3000);

    if (!isSupabaseConfigured) return;

    try {
      // 1. Update profiles table
      await supabase
        .from('profiles')
        .update({ role: nextRole, updated_at: new Date().toISOString() })
        .eq('id', targetUser.id);

      // 2. Update user_roles table
      if (nextRole === 'admin') {
        await supabase
          .from('user_roles')
          .upsert({ user_id: targetUser.id, role: 'admin' });
      } else {
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', targetUser.id);
      }
    } catch (err) {
      console.warn('Gagal sinkronisasi peran ke Supabase:', err);
    }
  };

  const handleToggleVerification = async (targetUser: UserRow) => {
    const nextStatus = !targetUser.isVerified;

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === targetUser.id ? { ...u, isVerified: nextStatus } : u))
    );

    setActionMessage(
      `Status verifikasi ${targetUser.displayName} diubah menjadi ${
        nextStatus ? 'Terverifikasi' : 'Belum Terverifikasi'
      }`
    );
    setTimeout(() => setActionMessage(''), 3000);

    try {
      await dataService.setCitizenVerification(targetUser.id, nextStatus);
    } catch {
      if (isSupabaseConfigured) {
        await supabase
          .from('profiles')
          .update({ is_verified: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', targetUser.id);
      }
    }
  };

  const handleQuickMessage = (userId: string) => {
    navigate(`/pesan?user_id=${userId}`);
  };

  // Metrics summary
  const totalUsersCount = users.length;
  const verifiedUsersCount = users.filter((u) => u.isVerified).length;
  const adminUsersCount = users.filter((u) => u.role === 'admin').length;

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'Semua' && u.role !== roleFilter) {
        return false;
      }

      // Verification filter
      if (verificationFilter === 'Terverifikasi' && !u.isVerified) {
        return false;
      }
      if (verificationFilter === 'Belum' && u.isVerified) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = u.displayName.toLowerCase().includes(q);
        const matchUser = u.username.toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchDistrict = (u.district || '').toLowerCase().includes(q);
        if (!matchName && !matchUser && !matchEmail && !matchDistrict) {
          return false;
        }
      }

      return true;
    });
  }, [users, roleFilter, verificationFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E3E0D6] dark:border-[#26352E]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                Direktori Warga &amp; Identitas
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#101913] dark:text-[#F3F6F4] mt-0.5">
              Manajemen Pengguna &amp; Hak Akses
            </h2>
            <p className="text-xs text-[#4F5A52] dark:text-[#9EACA3] mt-1">
              Verifikasi akun warga, mutasi peran admin dinas, dan komunikasi langsung warga.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#1B4332] dark:text-[#34D399] px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              Supabase profiles &middot; Live
            </span>
            <button
              type="button"
              onClick={fetchUsers}
              disabled={isLoading}
              className="p-2 rounded-xl border border-[#E3E0D6] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#1B4332] dark:hover:text-[#34D399] transition-colors cursor-pointer"
              title="Segarkan Data Pengguna"
              aria-label="Segarkan"
            >
              <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3 Telemetry Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-[#F7F5EF]/60 dark:bg-[#131916] border border-[#E3E0D6] dark:border-[#26352E] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#4F5A52] dark:text-[#9EACA3]">
                Total Pengguna Terdaftar
              </span>
              <div className="text-xl font-black text-[#101913] dark:text-[#F3F6F4] font-mono tabular-nums mt-1">
                {totalUsersCount} Akun
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#1B4332]/10 text-[#1B4332] dark:text-[#34D399] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                Warga Terverifikasi
              </span>
              <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono tabular-nums mt-1">
                {verifiedUsersCount} Akun
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                Akun admin Berwenang
              </span>
              <div className="text-xl font-black text-amber-700 dark:text-amber-400 font-mono tabular-nums mt-1">
                {adminUsersCount} Akun
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
          </div>
        </div>

        {actionMessage && (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
        )}
      </div>

      {/* User Directory Table Card */}
      <div className="bg-white dark:bg-[#1A221E] border border-[#E3E0D6] dark:border-[#26352E] rounded-3xl p-6 shadow-xs space-y-4">
        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4F5A52] dark:text-[#9EACA3]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, @username, email, atau kecamatan..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-[#F7F5EF] dark:bg-[#131916] border border-[#E3E0D6] dark:border-[#26352E] text-[#101913] dark:text-[#F3F6F4] placeholder-[#4F5A52] dark:placeholder-[#9EACA3] focus:outline-hidden focus:border-[#1B4332] dark:focus:border-[#34D399]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Role Filter Chips */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F7F5EF] dark:bg-[#131916] border border-[#E3E0D6] dark:border-[#26352E]">
              {(['Semua', 'citizen', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    roleFilter === r
                      ? 'bg-[#1B4332] text-white shadow-xs'
                      : 'text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Verification Filter Chips */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F7F5EF] dark:bg-[#131916] border border-[#E3E0D6] dark:border-[#26352E]">
              {(['Semua', 'Terverifikasi', 'Belum'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVerificationFilter(v)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    verificationFilter === v
                      ? 'bg-[#1B4332] text-white shadow-xs'
                      : 'text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Management Table */}
        <div className="overflow-x-auto rounded-2xl border border-[#E3E0D6] dark:border-[#26352E]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F5EF] dark:bg-[#131916] text-[#4F5A52] dark:text-[#9EACA3] font-bold border-b border-[#E3E0D6] dark:border-[#26352E]">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Kecamatan</th>
                <th className="py-3 px-4">Peran Akun</th>
                <th className="py-3 px-4">Status Verifikasi</th>
                <th className="py-3 px-4 text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E0D6] dark:divide-[#26352E]">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isAdminRole = u.role === 'admin';
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[#F7F5EF]/60 dark:hover:bg-[#131916]/60 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={u.avatarUrl}
                            alt={u.displayName}
                            name={u.displayName}
                            role={u.role}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                          <div>
                            <div className="font-bold text-[#101913] dark:text-[#F3F6F4]">
                              {u.displayName}
                            </div>
                            <div className="text-[11px] font-mono text-[#4F5A52] dark:text-[#9EACA3]">
                              @{u.username}
                              {u.email && <span> &middot; {u.email}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#4F5A52] dark:text-[#9EACA3]">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-[#9EACA3]" />
                          <span>{u.district || 'Kota Bogor'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              isAdminRole
                                ? 'bg-[#92400E]/10 text-[#92400E] dark:text-[#FDE68A] border-[#92400E]/30'
                                : 'bg-[#1B4332]/10 text-[#1B4332] dark:text-[#34D399] border-[#1B4332]/30'
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {u.isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Terverifikasi</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 dark:bg-[#26352E] text-[#4F5A52] dark:text-[#9EACA3] border border-stone-300 dark:border-stone-700">
                            <XCircle className="w-3 h-3" />
                            <span>Belum Verifikasi</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Message Button */}
                          <button
                            type="button"
                            onClick={() => handleQuickMessage(u.id)}
                            className="inline-flex items-center gap-1 py-1.5 px-2.5 rounded-xl border border-[#E3E0D6] dark:border-[#26352E] bg-white dark:bg-[#1A221E] text-[#101913] dark:text-[#F3F6F4] text-[11px] font-semibold hover:border-[#1B4332] dark:hover:border-[#34D399] transition-colors cursor-pointer"
                            title="Kirim pesan langsung ke pengguna"
                          >
                            <MessageSquare className="w-3 h-3 text-[#1B4332] dark:text-[#34D399]" />
                            <span>Pesan</span>
                          </button>

                          {/* Role Toggle Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleRole(u)}
                            className={`py-1.5 px-2.5 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer ${
                              isAdminRole
                                ? 'border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-[#26352E] text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                                : 'border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
                            }`}
                            title={isAdminRole ? 'Ubah menjadi citizen' : 'Jadikan akun admin'}
                          >
                            {isAdminRole ? 'Jadikan citizen' : 'Jadikan admin'}
                          </button>

                          {/* Verification Toggle Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleVerification(u)}
                            className={`inline-flex items-center gap-1 py-1.5 px-2.5 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer ${
                              u.isVerified
                                ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                                : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                            }`}
                            title={u.isVerified ? 'Batalkan status verifikasi' : 'Verifikasi identitas warga'}
                          >
                            {u.isVerified ? (
                              <>
                                <UserX className="w-3 h-3" />
                                <span>Batal Verif</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3" />
                                <span>Verifikasi</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#4F5A52] dark:text-[#9EACA3]">
                    Tidak ada pengguna yang cocok dengan kriteria filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
