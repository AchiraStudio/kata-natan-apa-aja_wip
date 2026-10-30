import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { TitikLogo } from '../components/common/TitikLogo';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { UserAvatar } from '../components/common/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import './LoginView.css';

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
    id: 'citizen',
    email: 'warga@titik.id',
    password: 'titik2026',
    name: 'Budi Santoso',
    badge: 'Warga',
    badgeType: 'citizen',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    description: 'Akses penuh pelaporan warga, dukungan, dan komentar.',
    username: 'budi.santoso',
  },
  {
    id: 'admin',
    email: 'admin@titik.id',
    password: 'admin2026',
    name: 'Admin Dinas PUPR',
    badge: 'Admin',
    badgeType: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    description: 'Verifikasi laporan, disposisi OPD, dan pembaruan APBD.',
    username: 'admin.pupr',
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
        badge: isCitizen ? 'Warga' : 'Admin',
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
          ? await (query as any).or('email.eq.warga@titik.id,email.eq.admin@titik.id,username.eq.budi.santoso,username.eq.admin.pupr')
          : await query;

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
    <div className="login-page">
      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle />
      </div>

      <div className="login-card-container">
        {/* Left Hero Panel */}
        <div className="login-hero">
          <div className="login-hero-slashes" aria-hidden="true">
            <div className="login-glow-top" />
            <div className="login-glow-bottom" />
            <div className="login-ribbon-1" />
            <div className="login-ribbon-2" />
            <div className="login-ribbon-3" />
            <div className="login-ribbon-4" />
            <div className="login-slash-1" />
            <div className="login-slash-2" />
            <div className="login-slash-3" />
          </div>

          <div className="login-hero-header">
            <div className="flex items-center gap-2">
              <TitikLogo className="w-5 h-5 shrink-0" pinColor="#FFFFFF" innerColor="#263F35" dotColor="#34D399" />
              <span className="login-brand-tag">Civic Social Platform</span>
            </div>
            <span className="login-env-tag">
              {isSupabaseConfigured ? 'Supabase Live' : 'Demo Mode'}
            </span>
          </div>

          <div className="login-hero-body">
            <div className="login-brand-logo-frame group">
              <div className="login-brand-logo-badge">
                <TitikLogo className="w-full h-full" pinColor="#263F35" innerColor="#FFFFFF" dotColor="#34D399" />
              </div>
            </div>
            <div>
              <h2 className="login-brand-title">
                <span>TITIK</span>
                <span className="login-brand-dot" />
              </h2>
              <p className="login-brand-tagline">
                See the issue. Trace the budget. Track the impact.
              </p>
            </div>
          </div>

          <div className="login-hero-footer">
            <p className="login-hero-subtext">
              Ruang publik independen untuk suara warga dan transparansi infrastruktur.
            </p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="login-form-panel">
          <div className="login-form-content">
            <div className="login-form-header">
              <div className="login-form-title-row">
                <div className="flex items-center gap-2.5">
                  <div className="lg:hidden flex items-center justify-center w-8 h-8 rounded-xl bg-[#263F35] shadow-xs shrink-0">
                    <TitikLogo className="w-5 h-5" pinColor="#FFFFFF" innerColor="#263F35" dotColor="#34D399" />
                  </div>
                  <h3 className="login-form-heading">Selamat Datang</h3>
                </div>

                <span className="login-mode-track">
                  <span className="login-mode-tab login-mode-tab--active">Masuk</span>
                  <Link to="/daftar" className="login-mode-tab">
                    Daftar
                  </Link>
                </span>
              </div>

              <p className="login-form-desc">
                {isLiveMode
                  ? 'Masuk ke portal TITIK untuk memantau laporan sipil dan mengawal transparansi fasilitas.'
                  : 'Masuk dengan akun TITIK untuk membuka linimasa partisipasi warga.'}
              </p>
            </div>

            {/* Quick 1-Click Account Switcher */}
            <div className="login-quick-section">
              <div className="login-quick-header">
                <span className="login-quick-title">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Pilih Akun Uji Coba Cepat (1-Klik)
                </span>
                <span className="login-quick-caption">
                  Klik untuk mengisi form otomatis
                </span>
              </div>

              <div className="login-quick-grid">
                {quickAccounts.map((acc) => {
                  const isSelected = selectedQuickId === acc.id || email === acc.email;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleSelectQuickAccount(acc)}
                      className={`login-quick-card ${isSelected ? 'login-quick-card--selected' : ''}`}
                    >
                      <UserAvatar
                        src={acc.avatar}
                        alt={acc.name}
                        name={acc.name}
                        role={acc.badgeType}
                        className="login-quick-avatar"
                      />
                      <div className="login-quick-info">
                        <div className="login-quick-name-row">
                          <span className="login-quick-name">{acc.name}</span>
                          <span className={`login-quick-badge login-quick-badge--${acc.badgeType}`}>
                            {acc.badge}
                          </span>
                        </div>
                        <div className="login-quick-email">{acc.email}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMessage && (
              <div className="login-alert-error" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="login-alert-success" role="status">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="login-form">
              <div className="login-input-group">
                <div className="login-input-icon"><Mail className="w-4 h-4" /></div>
                <input
                  type="text"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setSelectedQuickId('');
                  }}
                  placeholder="Email atau username (misal: admin.pupr atau warga@titik.id)"
                  className="login-input-field"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="login-input-group">
                <div className="login-input-icon"><Lock className="w-4 h-4" /></div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Kata sandi"
                  className="login-input-field login-input-field--password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="login-password-toggle"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button type="submit" disabled={isSubmitting} className="login-submit-button">
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Sesi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke TITIK</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="login-security-notice">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Autentikasi terenkripsi & Row Level Security aktif.</span>
            </div>

            <div className="mt-4 border-t border-[#E4E2DA] dark:border-[#26352E] pt-3 text-center text-[11px] text-[#686B65] dark:text-[#9EACA3]">
              <p>
                Belum memiliki akun warga?{' '}
                <Link to="/daftar" className="font-bold text-[#263F35] dark:text-[#34D399] hover:underline">
                  Daftar di sini
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
