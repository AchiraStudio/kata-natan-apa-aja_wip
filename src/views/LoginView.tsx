import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Users,
  Shield,
  Building2,
  Download,
  Search,
  X,
} from 'lucide-react';
import { TitikLogo } from '../components/common/TitikLogo';
import { useAuth } from '../context/AuthContext';
import {
  PRESET_PERSONAS,
  generateFakeAccounts,
  getStoredGeneratedAccounts,
  syncAccountsToSupabase,
} from '../services/accountGenerator';
import { UserProfile } from '../types/domain';
import { isSupabaseConfigured } from '../services/supabaseClient';
import './LoginView.css';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signIn, signUp, signInAsPersona, switchProfile } = useAuth();

  // Mode: 'login' | 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Form Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Mass Account Generator Modal / Drawer State
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [generatedAccounts, setGeneratedAccounts] = useState<UserProfile[]>(() => {
    const existing = getStoredGeneratedAccounts();
    if (existing && existing.length > 0) {
      return existing;
    }
    return generateFakeAccounts(25);
  });
  const [searchAccountQuery, setSearchAccountQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Form Submit Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    if (authMode === 'login') {
      const res = await signIn(email, password);
      setIsSubmitting(false);
      if (res.success) {
        setSuccessMessage('Berhasil masuk! Mengalihkan ke beranda...');
        setTimeout(() => navigate('/'), 700);
      } else {
        setErrorMessage(res.error || 'Gagal masuk. Periksa kembali email dan kata sandi.');
      }
    } else {
      if (!agreeTerms) {
        setIsSubmitting(false);
        setErrorMessage('Silakan setujui syarat dan ketentuan partisipasi warga.');
        return;
      }
      const displayName = username.trim() || email.split('@')[0];
      const res = await signUp(email, password, displayName);
      setIsSubmitting(false);
      if (res.success) {
        setSuccessMessage('Pendaftaran berhasil! Akun warga Anda telah aktif.');
        setTimeout(() => navigate('/'), 800);
      } else {
        setErrorMessage(res.error || 'Pendaftaran gagal.');
      }
    }
  };

  // 1-Click Demo Persona Login
  const handleQuickPersonaLogin = (key: 'citizen' | 'admin' | 'moderator' | 'anonymous') => {
    signInAsPersona(key);
    setSuccessMessage(`Berhasil masuk sebagai ${PRESET_PERSONAS[key].displayName}!`);
    setTimeout(() => navigate('/'), 600);
  };

  // Mass Account Generation Trigger
  const handleGenerateBatch = (count: number) => {
    setIsGenerating(true);
    setSyncStatus(null);

    setTimeout(() => {
      const startIndex = generatedAccounts.length + 1;
      const newBatch = generateFakeAccounts(count, startIndex);
      const combined = [...newBatch, ...generatedAccounts];
      setGeneratedAccounts(combined);
      setIsGenerating(false);
      setSuccessMessage(`Berhasil membuat ${count.toLocaleString('id-ID')} akun warga simulasi.`);

      syncAccountsToSupabase(combined).then((res) => {
        setSyncStatus(res.message);
      });
    }, 150);
  };

  const handleSwitchToGeneratedAccount = (acc: UserProfile) => {
    switchProfile(acc);
    setSuccessMessage(`Aktif sebagai ${acc.displayName} (${acc.district || 'Jabodetabek'})`);
    setIsGeneratorModalOpen(false);
    setTimeout(() => navigate('/'), 600);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(generatedAccounts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `titik-warga-simulasi-${generatedAccounts.length}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredAccounts = generatedAccounts.filter((a) => {
    if (!searchAccountQuery) return true;
    const q = searchAccountQuery.toLowerCase();
    return (
      a.displayName.toLowerCase().includes(q) ||
      a.username.toLowerCase().includes(q) ||
      (a.district && a.district.toLowerCase().includes(q)) ||
      (a.email && a.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="login-page">
      {/* Back to Home floating action */}
      <div className="login-back-action">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="login-back-btn"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Beranda Feed</span>
        </button>
      </div>

      {/* Responsive Dual-Screen Wrapper */}
      <div className="login-card-container">
        {/* ============================================================== */}
        {/* PANEL 1 (LEFT / TOP): Vibrant Brand Splash with Geometric Lines */}
        {/* ============================================================== */}
        <div className="login-hero">
          {/* Dynamic Geometric Angled Slashes */}
          <div className="login-hero-slashes">
            {/* Soft Ambient Light Gradient */}
            <div className="login-glow-top" />
            <div className="login-glow-bottom" />

            {/* Geometric Diagonal Ribbons (-35deg) */}
            <div className="login-ribbon-1" />
            <div className="login-ribbon-2" />
            <div className="login-ribbon-3" />
            <div className="login-ribbon-4" />

            {/* Slender Accent Slash Lines (-35deg) */}
            <div className="login-slash-1" />
            <div className="login-slash-2" />
            <div className="login-slash-3" />
          </div>

          {/* Top Brand Monogram Pill */}
          <div className="login-hero-header">
            <div className="flex items-center gap-2">
              <TitikLogo className="w-5 h-5 shrink-0" pinColor="#FFFFFF" innerColor="#263F35" dotColor="#34D399" />
              <span className="login-brand-tag">
                Civic Social Platform
              </span>
            </div>
            <span className="login-env-tag">
              {isSupabaseConfigured ? 'Supabase Auth' : 'Demo Mode'}
            </span>
          </div>

          {/* Center Brand Identity (Official Titik Logo & Logotype) */}
          <div className="login-hero-body">
            {/* Official Titik Brand Logomark */}
            <div className="login-brand-logo-frame group">
              <div className="login-brand-logo-badge">
                <TitikLogo className="w-full h-full" pinColor="#263F35" innerColor="#FFFFFF" dotColor="#34D399" />
              </div>
            </div>

            {/* Brand Title */}
            <div>
              <h2 className="login-brand-title">
                <span>TITIK</span>
                <span className="login-brand-dot"></span>
              </h2>
              <p className="login-brand-tagline">
                See the issue. Trace the budget. Track the impact.
              </p>
            </div>
          </div>

          {/* Bottom Callout & Quick Generator Pill */}
          <div className="login-hero-footer">
            <button
              type="button"
              onClick={() => setIsGeneratorModalOpen(true)}
              className="login-hero-btn-generator"
            >
              <Users className="w-4 h-4 text-[#263F35]" />
              <span>Buka Generator Ribuan Akun Warga ({generatedAccounts.length.toLocaleString('id-ID')})</span>
            </button>

            <p className="login-hero-subtext">
              Ruang publik, suara bersama warga Jabodetabek.
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PANEL 2 (RIGHT / BOTTOM): Elegant White Sheet with Form       */}
        {/* ============================================================== */}
        <div className="login-form-panel">
          <div className="login-form-content">
            {/* Friendly Greeting & Mode Switcher */}
            <div className="login-form-header">
              <div className="login-form-title-row">
                <div className="flex items-center gap-2.5">
                  <div className="lg:hidden flex items-center justify-center w-8 h-8 rounded-xl bg-[#263F35] shadow-xs shrink-0">
                    <TitikLogo className="w-5 h-5" pinColor="#FFFFFF" innerColor="#263F35" dotColor="#34D399" />
                  </div>
                  <h3 className="login-form-heading">
                    hello!
                  </h3>
                </div>

                {/* Pill Mode Switcher (Login vs Sign Up) */}
                <div className="login-mode-track">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className={`login-mode-tab ${
                      authMode === 'login' ? 'login-mode-tab--active' : ''
                    }`}
                  >
                    Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className={`login-mode-tab ${
                      authMode === 'signup' ? 'login-mode-tab--active' : ''
                    }`}
                  >
                    Daftar
                  </button>
                </div>
              </div>

              <p className="login-form-desc">
                {authMode === 'login'
                  ? 'Masuk ke portal TITIK untuk memantau laporan dan anggaran.'
                  : 'Daftarkan diri Anda untuk menjadi warga terverifikasi Jabodetabek.'}
              </p>
            </div>

            {/* Notification Messages */}
            {errorMessage && (
              <div className="login-alert-error">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="login-alert-success">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Interactive Form with Rounded Pill Inputs */}
            <form onSubmit={handleAuthSubmit} className="login-form">
              {/* Username Input (Only on Sign Up) */}
              {authMode === 'signup' && (
                <div className="login-input-group">
                  <div className="login-input-icon">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username / Nama Pengguna"
                    className="login-input-field"
                    required
                  />
                </div>
              )}

              {/* Email Input */}
              <div className="login-input-group">
                <div className="login-input-icon">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="login-input-field"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="login-input-group">
                <div className="login-input-icon">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="login-input-field login-input-field--password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-password-toggle"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Terms Checkbox */}
              <div className="login-terms-row">
                <label className="login-checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="login-checkbox"
                  />
                  <span>
                    {authMode === 'signup'
                      ? 'I agree to the terms and conditions'
                      : 'Ingat saya di perangkat ini'}
                  </span>
                </label>

                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleQuickPersonaLogin('citizen')}
                    className="login-help-link"
                  >
                    Bantuan Akun?
                  </button>
                )}
              </div>

              {/* Pill Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="login-submit-button"
              >
                {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{authMode === 'login' ? 'Sign In' : 'Sign Up'}</span>
              </button>
            </form>

            {/* Divider (or) */}
            <div className="login-divider">
              <div className="login-divider-line" />
              <span className="login-divider-text">
                or
              </span>
            </div>

            {/* 3 Quick Demo Personas */}
            <div className="login-persona-section">
              <div className="login-persona-row">
                {/* Persona 1: Warga */}
                <button
                  type="button"
                  onClick={() => handleQuickPersonaLogin('citizen')}
                  className="login-persona-btn login-persona-btn--citizen group"
                  title="Masuk sebagai Rizky Aprianto (Warga Terverifikasi)"
                >
                  <User className="w-5 h-5" />
                  <span className="login-persona-tooltip">
                    Warga Kota
                  </span>
                </button>

                {/* Persona 2: Admin PUPR */}
                <button
                  type="button"
                  onClick={() => handleQuickPersonaLogin('admin')}
                  className="login-persona-btn login-persona-btn--admin group"
                  title="Masuk sebagai Ir. Hendrawan (Admin Dinas PUPR)"
                >
                  <Building2 className="w-5 h-5" />
                  <span className="login-persona-tooltip">
                    Admin PUPR
                  </span>
                </button>

                {/* Persona 3: Moderator */}
                <button
                  type="button"
                  onClick={() => handleQuickPersonaLogin('moderator')}
                  className="login-persona-btn login-persona-btn--moderator group"
                  title="Masuk sebagai Bambang Surya (Moderator Lapangan)"
                >
                  <Shield className="w-5 h-5" />
                  <span className="login-persona-tooltip">
                    Moderator
                  </span>
                </button>
              </div>

              <p className="login-persona-caption">
                Log in with your demo persona (Juri MIA 2026)
              </p>
            </div>
          </div>

          {/* Bottom Active User Indicator */}
          <div className="login-active-user-bar">
            <div className="login-active-user-info">
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="login-active-avatar"
              />
              <span className="login-active-name">
                Aktif: <strong>{profile.displayName}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsGeneratorModalOpen(true)}
              className="login-active-generator-btn"
            >
              <Sparkles className="w-3 h-3" />
              <span>Daftar Akun</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MASS FAKE ACCOUNTS MODAL / DRAWER                              */}
      {/* ============================================================== */}
      {isGeneratorModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="login-modal-overlay"
          onClick={() => setIsGeneratorModalOpen(false)}
        >
          <div
            className="login-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="login-modal-header">
              <div className="login-modal-title-group">
                <Users className="w-5 h-5 text-[#263F35]" />
                <div>
                  <h3 className="login-modal-title">
                    Generator Ribuan Akun Warga Simulasi
                  </h3>
                  <p className="login-modal-subtitle">
                    Generate profil warga Jabodetabek untuk pengujian feed, komentar, dan pelaporan masal.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsGeneratorModalOpen(false)}
                className="login-modal-close-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body & Controls */}
            <div className="login-modal-body">
              {/* Batch Action Buttons */}
              <div className="login-modal-batch-bar">
                <div className="login-modal-batch-group">
                  <span className="login-modal-batch-label">Generate Baru:</span>
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => handleGenerateBatch(10)}
                    className="login-modal-batch-btn"
                  >
                    +10 Akun
                  </button>
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => handleGenerateBatch(100)}
                    className="login-modal-batch-btn"
                  >
                    +100 Akun
                  </button>
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => handleGenerateBatch(1000)}
                    className="login-modal-batch-btn login-modal-batch-btn--primary"
                  >
                    +1.000 Akun
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="login-modal-export-btn"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor JSON</span>
                </button>
              </div>

              {syncStatus && (
                <div className="login-modal-sync-status">
                  {syncStatus}
                </div>
              )}

              {/* Search Filter */}
              <div className="login-modal-search-group">
                <Search className="login-modal-search-icon w-4 h-4" />
                <input
                  type="text"
                  value={searchAccountQuery}
                  onChange={(e) => setSearchAccountQuery(e.target.value)}
                  placeholder="Cari nama warga, wilayah (Bogor, Depok, Bekasi, Tangerang, Jakarta)..."
                  className="login-modal-search-input"
                />
              </div>

              {/* Data Table */}
              <div className="login-modal-table-wrap">
                <table className="login-modal-table">
                  <thead>
                    <tr>
                      <th className="login-modal-th">Warga / Profil</th>
                      <th className="login-modal-th">Kecamatan</th>
                      <th className="login-modal-th">Peran & NIK</th>
                      <th className="login-modal-th text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.slice(0, 40).map((acc) => (
                      <tr key={acc.id} className="login-modal-tr">
                        <td className="login-modal-td">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={acc.avatarUrl}
                              alt={acc.displayName}
                              className="login-modal-user-avatar"
                            />
                            <div>
                              <div className="font-semibold text-[#20221D]">{acc.displayName}</div>
                              <div className="text-[10px] text-[#686B65]">@{acc.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="login-modal-td font-medium text-[#20221D]">{acc.district}</td>
                        <td className="login-modal-td">
                          <span
                            className={`login-modal-role-badge ${
                              acc.role === 'admin'
                                ? 'login-modal-role-badge--admin'
                                : acc.role === 'moderator'
                                ? 'login-modal-role-badge--moderator'
                                : 'login-modal-role-badge--citizen'
                            }`}
                          >
                            {acc.role}
                          </span>
                        </td>
                        <td className="login-modal-td text-right">
                          <button
                            type="button"
                            onClick={() => handleSwitchToGeneratedAccount(acc)}
                            className="login-modal-use-btn"
                          >
                            Gunakan Akun
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
