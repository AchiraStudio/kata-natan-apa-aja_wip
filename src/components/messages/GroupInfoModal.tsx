import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Shield, LogOut, Search } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { getGroupMembers, addGroupMembers, searchProfiles } from '../../services/messagesService';
import type { Conversation, ConversationMember, UserProfile } from '../../types/domain';

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  currentUserId: string;
  onLeaveGroup?: () => void;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUserId,
  onLeaveGroup,
}) => {
  const [members, setMembers] = useState<ConversationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [candidateList, setCandidateList] = useState<UserProfile[]>([]);
  const [isSearchingCandidates, setIsSearchingCandidates] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [isSavingNewMembers, setIsSavingNewMembers] = useState(false);

  useEffect(() => {
    if (!isOpen || !conversation.id) return;
    let isCurrent = true;
    setIsLoading(true);

    getGroupMembers(conversation.id)
      .then((data) => {
        if (isCurrent) {
          setMembers(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [isOpen, conversation.id]);

  useEffect(() => {
    const q = addSearchQuery.trim();
    if (q.length < 2) {
      setCandidateList([]);
      setIsSearchingCandidates(false);
      return;
    }
    let isCurrent = true;
    setIsSearchingCandidates(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchProfiles(q, currentUserId);
        if (isCurrent) {
          // Filter out existing members
          const existingIds = new Set(members.map((m) => m.user_id));
          setCandidateList(found.filter((u) => !existingIds.has(u.id)));
          setIsSearchingCandidates(false);
        }
      } catch {
        if (isCurrent) setIsSearchingCandidates(false);
      }
    }, 250);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [addSearchQuery, currentUserId, members]);

  if (!isOpen) return null;

  const currentMember = members.find((m) => m.user_id === currentUserId);
  const canManageMembers = currentMember?.role === 'owner' || currentMember?.role === 'admin' || conversation.created_by === currentUserId;

  const filteredMembers = members.filter((m) => {
    if (!filterQuery.trim()) return true;
    const name = m.profile?.displayName || '';
    const username = m.profile?.username || '';
    return name.toLowerCase().includes(filterQuery.toLowerCase()) || username.toLowerCase().includes(filterQuery.toLowerCase());
  });

  const handleSaveAddMembers = async () => {
    if (!selectedToAdd.length) return;
    setIsSavingNewMembers(true);
    try {
      await addGroupMembers(conversation.id, selectedToAdd, currentUserId);
      const updated = await getGroupMembers(conversation.id);
      setMembers(updated);
      setSelectedToAdd([]);
      setIsAddingMember(false);
      setAddSearchQuery('');
    } catch {
      // ignore
    } finally {
      setIsSavingNewMembers(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-info-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand/15 text-brand flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 id="group-info-title" className="text-base font-bold text-ink leading-tight truncate max-w-[220px]">
                {conversation.title || 'Informasi Komunitas'}
              </h2>
              <p className="text-xs text-ink-3">{members.length} anggota tergabung</p>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Group Profile Header */}
          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-surface-2/30 border border-line/60">
            <div className="w-20 h-20 rounded-2xl bg-surface-2 border border-line flex items-center justify-center overflow-hidden mb-3 shadow-sm">
              {conversation.avatar_url ? (
                <img src={conversation.avatar_url} alt={conversation.title} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-10 h-10 text-brand" />
              )}
            </div>
            <h3 className="text-base font-bold text-ink">{conversation.title || 'Grup Komunitas'}</h3>
            {conversation.description && (
              <p className="text-xs text-ink-2 mt-1 max-w-xs">{conversation.description}</p>
            )}
          </div>

          {/* Action: Add member toggle */}
          {canManageMembers && !isAddingMember && (
            <button
              type="button"
              onClick={() => setIsAddingMember(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-surface-2 hover:bg-line text-ink text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-brand" />
              <span>Tambah Anggota Baru</span>
            </button>
          )}

          {/* Add member subpanel */}
          {isAddingMember && (
            <div className="p-3.5 rounded-2xl bg-surface-2/60 border border-line space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink">Tambah Anggota ke Komunitas</span>
                <button
                  type="button"
                  onClick={() => setIsAddingMember(false)}
                  className="text-xs text-ink-3 hover:text-ink cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-3" />
                <input
                  type="search"
                  value={addSearchQuery}
                  onChange={(e) => setAddSearchQuery(e.target.value)}
                  placeholder="Cari warga untuk ditambahkan..."
                  className="titik-pill-input pl-8 pr-3 text-xs w-full"
                />
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1">
                {isSearchingCandidates ? (
                  <p className="text-center text-xs text-ink-3 py-3">Mencari...</p>
                ) : candidateList.length === 0 ? (
                  <p className="text-center text-xs text-ink-3 py-3">
                    {addSearchQuery.length >= 2 ? 'Tidak ada pengguna yang cocok.' : 'Ketik nama warga...'}
                  </p>
                ) : (
                  candidateList.map((c) => {
                    const isSelected = selectedToAdd.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() =>
                          setSelectedToAdd((prev) =>
                            isSelected ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                          )
                        }
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                          isSelected ? 'bg-brand/15 text-brand' : 'hover:bg-surface'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <UserAvatar src={c.avatarUrl} alt={c.displayName} name={c.displayName} role={c.role} className="w-7 h-7 rounded-full" />
                          <span className="text-xs font-semibold text-ink">{c.displayName}</span>
                        </div>
                        <span className="text-[11px] font-bold">{isSelected ? '✓ Terpilih' : '+ Pilih'}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {selectedToAdd.length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveAddMembers}
                  disabled={isSavingNewMembers}
                  className="w-full py-2 rounded-xl bg-brand text-on-brand text-xs font-bold hover:brightness-110 cursor-pointer disabled:opacity-50"
                >
                  {isSavingNewMembers ? 'Menambahkan...' : `Tambahkan (${selectedToAdd.length}) Anggota`}
                </button>
              )}
            </div>
          )}

          {/* Members List Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-ink">
              <span className="font-bold">Daftar Anggota ({filteredMembers.length})</span>
            </div>

            {/* Filter Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-3" />
              <input
                type="search"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Cari anggota dalam grup..."
                className="titik-pill-input pl-8 pr-3 text-xs w-full"
              />
            </div>

            {/* Members scrollable list */}
            <div className="max-h-60 overflow-y-auto space-y-1 rounded-xl border border-line bg-canvas p-1">
              {isLoading ? (
                <p className="text-center text-xs text-ink-3 py-6">Memuat anggota...</p>
              ) : filteredMembers.length === 0 ? (
                <p className="text-center text-xs text-ink-3 py-6">Tidak ada anggota yang cocok.</p>
              ) : (
                filteredMembers.map((m) => {
                  const isMe = m.user_id === currentUserId;
                  return (
                    <div key={m.user_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-2 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar
                          src={m.profile?.avatarUrl}
                          alt={m.profile?.displayName || 'Pengguna'}
                          name={m.profile?.displayName || 'Pengguna'}
                          role={m.profile?.role}
                          className="w-8 h-8 rounded-full shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink truncate">
                            {m.profile?.displayName || 'Pengguna'}
                            {isMe && <span className="ml-1 text-[10px] text-brand font-bold">(Anda)</span>}
                          </p>
                          <p className="text-[10px] text-ink-3">@{m.profile?.username || m.user_id.slice(0, 8)}</p>
                        </div>
                      </div>

                      {m.role === 'owner' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                          <Shield className="w-3 h-3" />
                          <span>Pembuat</span>
                        </span>
                      ) : m.role === 'admin' ? (
                        <span className="text-[10px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-md">
                          Admin
                        </span>
                      ) : (
                        <span className="text-[10px] text-ink-3">Anggota</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Leave Group Action */}
          {onLeaveGroup && (
            <button
              type="button"
              onClick={onLeaveGroup}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Komunitas</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
