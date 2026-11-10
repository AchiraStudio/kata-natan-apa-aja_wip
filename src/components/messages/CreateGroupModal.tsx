import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Users, Check, Upload, Sparkles } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { searchProfiles, createGroupConversation } from '../../services/messagesService';
import type { Conversation, UserProfile } from '../../types/domain';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onGroupCreated: (group: Conversation) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  onGroupCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setAvatarUrl('');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
      setErrorMsg(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    let active = true;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchProfiles(q, currentUserId);
        if (active) {
          setSearchResults(found);
          setIsSearching(false);
        }
      } catch {
        if (active) setIsSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, currentUserId]);

  if (!isOpen) return null;

  const toggleSelectUser = (u: UserProfile) => {
    setSelectedUsers((prev) =>
      prev.some((item) => item.id === u.id) ? prev.filter((item) => item.id !== u.id) : [...prev, u]
    );
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Nama komunitas / grup wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const memberIds = selectedUsers.map((u) => u.id);
      const newGroup = await createGroupConversation(
        title.trim(),
        currentUserId,
        memberIds,
        description.trim() || undefined,
        avatarUrl || undefined
      );

      onGroupCreated(newGroup);
      onClose();
    } catch {
      setErrorMsg('Gagal membuat grup. Coba beberapa saat lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-group-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand/15 text-brand flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 id="create-group-title" className="text-base font-bold text-ink leading-tight">
                Buat Komunitas / Grup
              </h2>
              <p className="text-xs text-ink-3">Hubungkan warga & anggota dalam satu wadah percakapan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Group Avatar & Name */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-16 h-16 rounded-2xl bg-surface-2 border border-line flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand/60 transition-colors group shrink-0"
              title="Unggah Foto Grup"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar Grup" className="w-full h-full object-cover" />
              ) : (
                <Users className="w-7 h-7 text-ink-3 group-hover:text-brand transition-colors" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Upload className="w-4 h-4 text-white" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFile}
              className="hidden"
            />

            <div className="flex-1 min-w-0">
              <label className="text-xs font-bold text-ink block mb-1">Nama Grup / Komunitas *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="cth. Warga Peduli Kebersihan"
                className="titik-pill-input w-full"
                maxLength={60}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-ink block mb-1">Deskripsi (Opsional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan tujuan atau topik utama komunitas ini..."
              className="w-full px-3.5 py-2 rounded-xl bg-canvas border border-line text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand resize-none"
              maxLength={200}
            />
          </div>

          {/* Member Selection Section */}
          <div className="space-y-2 pt-2 border-t border-line/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink">
                Pilih Anggota ({selectedUsers.length} dipilih)
              </label>
              <span className="text-[11px] text-ink-3">Mendukung 100+ anggota</span>
            </div>

            {/* Selected Members Chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-surface-2/40 border border-line/50 max-h-24 overflow-y-auto">
                {selectedUsers.map((u) => (
                  <span
                    key={u.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-line text-xs font-medium text-ink shadow-xs"
                  >
                    <span className="truncate max-w-[100px]">{u.displayName}</span>
                    <button
                      type="button"
                      onClick={() => toggleSelectUser(u)}
                      className="text-ink-3 hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pengguna berdasarkan nama atau username..."
                className="titik-pill-input pl-9 pr-3 w-full"
              />
            </div>

            {/* Search Results / Member Candidate List */}
            <div className="max-h-48 min-h-[5rem] overflow-y-auto rounded-xl border border-line bg-canvas p-1 space-y-1">
              {searchQuery.trim().length < 2 ? (
                <div className="py-6 text-center text-xs text-ink-3">
                  Ketik minimal 2 huruf untuk mencari warga atau pengguna.
                </div>
              ) : isSearching ? (
                <div className="py-6 text-center text-xs text-ink-3 animate-pulse">
                  Mencari pengguna...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-6 text-center text-xs text-ink-3">
                  Tidak ada pengguna ditemukan.
                </div>
              ) : (
                searchResults.map((u) => {
                  const isChecked = selectedUsers.some((item) => item.id === u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleSelectUser(u)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        isChecked ? 'bg-brand/10 border border-brand/30' : 'hover:bg-surface-2'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar
                          src={u.avatarUrl}
                          alt={u.displayName}
                          name={u.displayName}
                          role={u.role}
                          className="w-8 h-8 rounded-full shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink truncate">{u.displayName}</p>
                          <p className="text-[11px] text-ink-3 truncate">@{u.username}</p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isChecked
                            ? 'bg-brand border-brand text-on-brand'
                            : 'border-line bg-surface'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Membuat Komunitas...' : 'Buat Komunitas'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
