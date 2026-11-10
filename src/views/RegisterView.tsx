import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthShell, AuthField, AuthAlert } from '../components/auth/AuthShell';
import { useAuth } from '../context/AuthContext';

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

    setSuccessMessage('Akun berhasil dibuat! Mengalihkan ke beranda...');
    if (result.profile) {
      navigate('/setup-profil');
      return;
    }
    navigate('/');
  };

  return (
    <AuthShell
      mode="register"
      title="Buat akun warga"
      description="Satu akun untuk melaporkan, berkomentar, dan mengawal penanganan fasilitas publik."
    >
      {errorMessage && <AuthAlert kind="error">{errorMessage}</AuthAlert>}
      {successMessage && <AuthAlert kind="success">{successMessage}</AuthAlert>}

      <form onSubmit={handleRegisterSubmit} className="space-y-4">
        <AuthField
          label="Nama tampilan"
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Contoh: Rina Wijaya"
          autoComplete="name"
          maxLength={40}
          required
        />
        <AuthField
          label="Username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value.toLowerCase())}
          hint="3 sampai 24 karakter: huruf kecil, angka, garis bawah, atau titik."
          autoComplete="username"
          maxLength={24}
          required
        />
        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <AuthField
          label="Kata sandi"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint="Minimal 8 karakter."
          autoComplete="new-password"
          minLength={8}
          reveal={{ visible: showPassword, onToggle: () => setShowPassword((visible) => !visible) }}
          required
        />
        <AuthField
          label="Ulangi kata sandi"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <button type="submit" disabled={isSubmitting} className="titik-pill-btn titik-pill-btn-primary w-full min-h-11 text-sm">
          {isSubmitting ? 'Mendaftarkan' : 'Buat akun'}
        </button>
      </form>
    </AuthShell>
  );
};
