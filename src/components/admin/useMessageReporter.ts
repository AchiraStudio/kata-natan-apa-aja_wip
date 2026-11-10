import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createConversation } from '../../services/messagesService';
import type { Report } from '../../types/domain';

/**
 * Opens (or creates) the direct thread between the signed-in admin and a report's author,
 * then goes to /pesan with it selected. Anonymous reports have no author to write to.
 */
export function useMessageReporter() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const open = useCallback(
    async (report: Pick<Report, 'id' | 'publicReference' | 'reporterUserId'>) => {
      setError('');
      if (!report.reporterUserId) {
        setError('Laporan ini anonim, jadi tidak ada pelapor yang bisa dikirimi pesan.');
        return;
      }
      if (!profile?.id) {
        setError('Sesi admin tidak ditemukan. Masuk ulang lalu coba lagi.');
        return;
      }
      setBusyId(report.id);
      try {
        const conv = await createConversation(report.id, profile.id, report.reporterUserId, report.publicReference);
        navigate(`/pesan?conversation_id=${encodeURIComponent(conv.id)}`);
      } catch {
        setError('Percakapan belum dapat dibuka. Coba lagi beberapa saat.');
      } finally {
        setBusyId(null);
      }
    },
    [navigate, profile?.id]
  );

  return { open, busyId, error, clearError: () => setError('') };
}
