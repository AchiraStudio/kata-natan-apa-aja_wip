import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { TitikLogo } from '../components/common/TitikLogo';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../services/supabaseClient';
import './LoginView.css';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
      setErrorMessage(result.error || 'Gagal masuk. Periksa kembali username dan kata sandi.');
    }
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
              Ruang publik, suara bersama warga Jabodetabek.
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
                  <h3 className="login-form-heading">hello!</h3>
                </div>

                <span className="login-mode-track login-mode-tab login-mode-tab--active">Masuk</span>
              </div>

              <p className="login-form-desc">
                Masuk dengan akun demo TITIK untuk membuka portal laporan dan anggaran.
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

            <form onSubmit={handleAuthSubmit} className="login-form">
              <div className="login-input-group">
                <div className="login-input-icon"><Mail className="w-4 h-4" /></div>
                <input
                  type="text"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Username atau email demo"
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
                  placeholder="Password"
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
                {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{isSubmitting ? 'Memproses...' : 'Masuk'}</span>
              </button>
            </form>

            <div className="mt-5 space-y-1 border-t border-[#E4E2DA] pt-4 text-center text-[10px] text-[#686B65]" aria-label="Akun demo TITIK">
              <p className="mb-2 text-xs font-bold text-[#263F35]">Gunakan akun demo yang tersedia</p>
              <p>Warga: <strong>sahabatbogor</strong> / <strong>titik2026</strong></p>
              <p>Admin: <strong>admin.pupr</strong> / <strong>adminpupr2026</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
