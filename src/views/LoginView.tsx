import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthShell, AuthField, AuthAlert } from '../components/auth/AuthShell';
import { UserAvatar } from '../components/common/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface QuickAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  badge: string;
  badgeType: 'citizen' | 'admin';
  avatar: string;
  description: string;
  username: string;
  verifiedAgency?: string;
}

const DEFAULT_QUICK_ACCOUNTS: QuickAccount[] = [
  {
    id: 'admin',
    email: 'admin@titik.com',
    password: 'AdminTitik',
    name: 'Administrator TITIK',
    badge: 'Admin',
    badgeType: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    description: 'Akses penuh verifikasi laporan, disposisi OPD, data analitik, dan moderasi publik.',
    username: 'admin',
    verifiedAgency: 'Pemerintah Kota Bogor',
  },
];

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, isLiveMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedQuickId, setSelectedQuickId] = useState<string>('');
  const [quickAccounts, setQuickAccounts] = useState<QuickAccount[]>(DEFAULT_QUICK_ACCOUNTS);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    let isMounted = true;

    const updateAccountFromProfile = (acc: QuickAccount, p: any): QuickAccount => {
      const isCitizen = (p.role || acc.badgeType) === 'citizen';
      return {
        ...acc,
        name: p.display_name || acc.name,
        badge: isCitizen ? 'Warga' : 'admin',
        badgeType: isCitizen ? 'citizen' : 'admin',
        avatar: p.avatar_url ?? acc.avatar,
        verifiedAgency: p.verified_agency || acc.verifiedAgency,
      };
    };

    const fetchProfiles = async () => {
      try {
        const query = supabase
          .from('profiles')
          .select('id, username, display_name, email, avatar_url, role, verified_agency');

        const response = typeof (query as any)?.or === 'function'
          ? await (query as any).or('email.eq.admin@titik.com,username.eq.admin')
          : await query.eq('email', 'admin@titik.com');

        const { data, error } = response || {};
        if (error) {
          console.warn('Failed to fetch quick accounts from Supabase:', error);
          return;
        }

        if (data && Array.isArray(data) && data.length > 0 && isMounted) {
          setQuickAccounts((prev) =>
            prev.map((acc) => {
              const matched = data.find(
                (p: any) =>
                  (p.email && p.email.toLowerCase() === acc.email.toLowerCase()) ||
                  (p.username && p.username.toLowerCase() === acc.username.toLowerCase())
              );
              if (!matched) return acc;
              return updateAccountFromProfile(acc, matched);
            })
          );
        }
      } catch (err) {
        console.warn('Error fetching quick accounts:', err);
      }
    };

    fetchProfiles();

    let channel: any = null;
    try {
      if (typeof supabase.channel === 'function') {
        channel = supabase
          .channel('public:profiles:quick_login')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'profiles' },
            (payload: any) => {
              if (!isMounted || !payload?.new) return;
              const updatedProfile = payload.new;
              setQuickAccounts((prev) =>
                prev.map((acc) => {
                  const isMatch =
                    (updatedProfile.email && updatedProfile.email.toLowerCase() === acc.email.toLowerCase()) ||
                    (updatedProfile.username && updatedProfile.username.toLowerCase() === acc.username.toLowerCase());
                  if (!isMatch) return acc;
                  return updateAccountFromProfile(acc, updatedProfile);
                })
              );
            }
          )
          .subscribe();
      }
    } catch (err) {
      console.warn('Could not establish profiles realtime channel:', err);
    }

    return () => {
      isMounted = false;
      if (channel && typeof supabase.removeChannel === 'function') {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleSelectQuickAccount = (acc: QuickAccount) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setSelectedQuickId(acc.id);
    setErrorMessage('');
  };

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    const result = await signIn(email, password);
    setIsSubmitting(false);
    if (result.success) {
      setSuccessMessage('Berhasil masuk! Mengalihkan ke beranda...');
      window.setTimeout(() => navigate(result.role === 'admin' ? '/admin' : '/'), 700);
    } else {
      setErrorMessage(result.error || 'Gagal masuk. Periksa kembali username atau password.');
    }
  };

  return (
    <AuthShell
      mode="login"
      title="Selamat datang kembali"
      description={
        isLiveMode
          ? 'Masuk untuk memantau laporan Anda dan mengawal penanganan fasilitas publik.'
          : 'Masuk dengan akun TITIK untuk membuka linimasa partisipasi warga.'
      }
    >
      {errorMessage && <AuthAlert kind="error">{errorMessage}</AuthAlert>}
      {successMessage && <AuthAlert kind="success">{successMessage}</AuthAlert>}

      <form onSubmit={handleAuthSubmit} className="space-y-4">
        <AuthField
          label="Email atau username"
          type="text"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setSelectedQuickId('');
          }}
          autoComplete="username"
          required
        />
        <AuthField
          label="Kata sandi"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          reveal={{ visible: showPassword, onToggle: () => setShowPassword((visible) => !visible) }}
          required
        />
        <button type="submit" disabled={isSubmitting} className="titik-pill-btn titik-pill-btn-primary w-full min-h-11 text-sm">
          {isSubmitting ? 'Memverifikasi sesi...' : 'Masuk ke TITIK'}
        </button>
      </form>

      <section aria-label="Akses Cepat Administrator" className="mt-8 pt-6 border-t border-line-soft">
        <h2 className="text-sm font-semibold text-ink">Akses Cepat Administrator</h2>
        <p className="mt-1 text-xs text-ink-3">Pilih untuk mengisi kredensial administrator secara otomatis.</p>
        <div className="mt-3 grid gap-2">
          {quickAccounts.map((acc) => {
            const isSelected = selectedQuickId === acc.id || email === acc.email;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleSelectQuickAccount(acc)}
                aria-pressed={isSelected}
                className={`flex items-center gap-3 p-3 rounded-lg text-left border transition-colors cursor-pointer ${
                  isSelected ? 'border-brand bg-brand-soft' : 'border-line-soft bg-surface hover:bg-surface-2'
                }`}
              >
                <UserAvatar src={acc.avatar} alt={acc.name} name={acc.name} role={acc.badgeType} className="w-9 h-9 rounded-full object-cover shrink-0" />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-ink">{acc.name}</span>
                    <span className="text-[11px] font-semibold text-ink-3">{acc.badge}</span>
                  </span>
                  <span className="block truncate text-xs text-ink-3">{acc.email}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {!isSupabaseConfigured && <p className="mt-6 text-xs text-ink-3">Mode demo: Supabase belum dikonfigurasi.</p>}
    </AuthShell>
  );
};
