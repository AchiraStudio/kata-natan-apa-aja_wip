import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createConversation } from '../../services/messagesService';
import type { Report } from '../../types/domain';

/** Verifier-only shortcut: opens (or creates) the private thread with whoever filed this report. */
export const MessageReporterButton: React.FC<{ report: Report; className?: string }> = ({ report, className = '' }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isOpening, setIsOpening] = useState(false);

  if (profile?.role !== 'admin') return null;

  const open = async () => {
    setIsOpening(true);
    try {
      if (report.reporterUserId && profile.id) {
        const conv = await createConversation(report.id, profile.id, report.reporterUserId);
        navigate(`/pesan?conversation_id=${conv.id}`);
      } else {
        navigate(`/pesan?report_id=${report.id}`);
      }
    } catch {
      navigate(`/pesan?report_id=${report.id}`);
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={open}
      disabled={isOpening}
      className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-surface-2 text-ink text-sm font-semibold hover:bg-line transition-colors disabled:opacity-50 ${className}`}
    >
      <MessageSquare className="w-4 h-4" />
      <span>{isOpening ? 'Membuka...' : 'Kirim Pesan ke Pelapor'}</span>
    </button>
  );
};
