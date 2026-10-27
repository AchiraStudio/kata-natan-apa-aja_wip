import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  RefreshCw,
  User,
  AtSign,
} from 'lucide-react';
import { TitikLogo } from '../components/common/TitikLogo';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../services/supabaseClient';
import './LoginView.css';

const USERNAME_PATTERN = /^[a-z0-9_.]{3,24}$/;

export const RegisterView: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const validate = (): string | null => {
    if (displayName.trim().length < 2 || displayName.trim().length > 40) {
      return 'Nama tampilan wajib diisi (2 sampai 40 karakter).';
    }
    if (!USERNAME_PATTERN.test(username.trim().toLowerCase())) {
      return 'Username hanya boleh 3-24 karakter huruf kecil, angka, garis bawah (_), atau titik (.).';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Masukkan alamat email yang valid.';
    }
    if (password.length < 8) {
      return 'Kata sandi minimal 8 karakter.';
    }
    if (password !== confirmPassword) {
      return 'Konfirmasi kata sandi tidak sama dengan kata sandi.';
    }
    return null;
  };

  const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    const result = await signUp(email, password, displayName, username);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Pendaftaran gagal. Silakan coba kembali.');
      return;
    }

    if (result.needsEmailConfirmation) {
      setNeedsEmailConfirmation(true);
      setSuccessMessage('Pendaftaran berhasil! Periksa email Anda untuk verifikasi akun.');
      return;
    }

    setSuccessMessage('Akun berhasil dibuat! Mengalihkan ke beranda...');
    window.setTimeout(() => navigate('/'), 700);
  };

  return (
    <div className="login-page">
      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle />
      </div>

      <div className="login-card-container">
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
              {isSupabaseConfigured ? 'Supabase Auth' : 'Demo Mode'}
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
              Satu akun untuk melaporkan, mengomentari, dan mengawal fasilitas publik.
            </p>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-form-content">
            <div className="login-form-header">
              <div className="login-form-title-row">
                <div className="flex items-center gap-2.5">
                  <div className="lg:hidden flex items-center justify-center w-8 h-8 rounded-xl bg-[#263F35] shadow-xs shrink-0">
                    <TitikLogo className="w-5 h-5" pinColor="#FFFFFF" innerColor="#263F35" dotColor="#34D399" />
                  </div>
                  <h3 className="login-form-heading">daftar</h3>
                </div>

                <span className="login-mode-track">
                  <Link to="/login" className="login-mode-tab">
                    Masuk
                  </Link>
                  <span className="login-mode-tab login-mode-tab--active">Daftar</span>
                </span>
              </div>

              <p className="login-form-desc">
                Buat akun warga TITIK untuk ikut berdiskusi dan melaporkan kondisi fasilitas publik.
              </p>
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

            {needsEmailConfirmation ? (
              <div className="space-y-4 pt-2">
                <p className="text-xs leading-relaxed text-[#475569] dark:text-[#9EACA3]">
                  Kami mengirim tautan verifikasi ke <strong className="text-[#20221D] dark:text-[#F3F6F4]">{email.trim()}</strong>.
                  Buka tautan tersebut untuk mengaktifkan akun, lalu masuk dengan email dan kata sandi Anda.
                </p>
                <Link to="/login" className="login-submit-button login-submit-button--link">
                  <span>Sudah verifikasi? Masuk</span>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="login-form">
                <div className="login-input-group">
                  <div className="login-input-icon"><User className="w-4 h-4" /></div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Nama tampilan (mis. Rina Wijaya)"
                    className="login-input-field"
                    autoComplete="name"
                    maxLength={40}
                    required
                  />
                </div>

                <div className="login-input-group">
                  <div className="login-input-icon"><AtSign className="w-4 h-4" /></div>
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value.toLowerCase())}
                    placeholder="Username (mis. rinawijaya)"
                    className="login-input-field"
                    autoComplete="username"
                    maxLength={24}
                    required
                  />
                </div>

                <div className="login-input-group">
                  <div className="login-input-icon"><Mail className="w-4 h-4" /></div>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email aktif"
                    className="login-input-field"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="login-input-group">
                  <div className="login-input-icon"><Lock className="w-4 h-4" /></div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Kata sandi (minimal 8 karakter)"
                    className="login-input-field login-input-field--password"
                    autoComplete="new-password"
                    minLength={8}
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

                <div className="login-input-group">
                  <div className="login-input-icon"><Lock className="w-4 h-4" /></div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Ulangi kata sandi"
                    className="login-input-field"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>

                <button type="submit" disabled={isSubmitting} className="login-submit-button">
                  {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{isSubmitting ? 'Mendaftarkan...' : 'Buat Akun'}</span>
                </button>
              </form>
            )}

            <div className="mt-5 border-t border-[#E4E2DA] dark:border-[#26352E] pt-4 text-center text-[11px] text-[#686B65] dark:text-[#9EACA3]">
              <p>
                Sudah punya akun?{' '}
                <Link to="/login" className="font-bold text-[#263F35] dark:text-[#34D399] hover:underline">
                  Masuk di sini
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
