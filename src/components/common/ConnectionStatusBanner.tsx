import React, { useState } from 'react';
import { AlertTriangle, Database, RefreshCw, X, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { getConnectionStatus, ConnectionStatusInfo } from '../../services/dataService';

export interface ConnectionStatusBannerProps {
  runtimeError?: string | null;
  onRetry?: () => void;
  className?: string;
}

export const ConnectionStatusBanner: React.FC<ConnectionStatusBannerProps> = ({
  runtimeError,
  onRetry,
  className = '',
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const statusInfo: ConnectionStatusInfo = getConnectionStatus();

  // If connected and no runtime error, do not render banner
  if (!runtimeError && statusInfo.status === 'connected') {
    return null;
  }

  // If dismissed by user in this session, hide
  if (isDismissed) {
    return null;
  }

  const isUnconfigured = statusInfo.status === 'unconfigured';
  const isDemo = statusInfo.status === 'demo';

  return (
    <aside
      aria-label="Status Koneksi Basis Data"
      role="status"
      aria-live="polite"
      className={`w-full z-40 transition-all duration-200 border-b ${
        runtimeError || isUnconfigured
          ? 'bg-amber-50 dark:bg-[#1E180A] border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
          : 'bg-[#EBF2EE] dark:bg-[#0E1A14] border-[#C8DCD1] dark:border-[#1F3E2F] text-[#1E3A2B] dark:text-[#A7D7BC]'
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 shrink-0">
              {runtimeError || isUnconfigured ? (
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Database className="w-4 h-4" aria-hidden="true" />
              )}
            </span>
            <div className="truncate font-semibold">
              {runtimeError ? (
                <span>Gagal Terhubung ke Database: {runtimeError}</span>
              ) : isUnconfigured ? (
                <span>Koneksi Supabase Belum Terkonfigurasi (Mode Live)</span>
              ) : isDemo ? (
                <span>Mode Demonstrasi Aktif (Data Mock Statis)</span>
              ) : (
                <span>Koneksi Basis Data Aktif</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-200/70 dark:bg-amber-800/60 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 font-medium transition cursor-pointer"
                title="Coba hubungkan kembali"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Coba Lagi</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="p-1 rounded hover:bg-amber-200/50 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 cursor-pointer"
              aria-label={isExpanded ? 'Tutup panduan teknis' : 'Buka panduan teknis'}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded hover:bg-amber-200/50 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 cursor-pointer"
              aria-label="Tutup pemberitahuan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="pt-2 pb-1 border-t border-amber-200/60 dark:border-amber-800/40 text-[11px] leading-relaxed space-y-1.5">
            <p>
              {statusInfo.message || 'Layanan data memerlukan konfigurasi kredensial Supabase aktif untuk sinkronisasi live.'}
            </p>
            {statusInfo.actionableHint && (
              <p className="font-mono bg-amber-100/70 dark:bg-amber-950/60 p-2 rounded border border-amber-200/50 dark:border-amber-900/50">
                {statusInfo.actionableHint}
              </p>
            )}
            <div className="text-[10px] text-amber-700 dark:text-amber-400">
              Parameter yang dibutuhkan: <code className="font-bold">VITE_SUPABASE_URL</code> dan{' '}
              <code className="font-bold">VITE_SUPABASE_ANON_KEY</code>.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
