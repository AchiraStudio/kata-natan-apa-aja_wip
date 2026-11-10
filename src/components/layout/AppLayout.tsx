import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MobileTopBar } from './MobileTopBar';
import { UnreadMessagesSync } from './UnreadMessagesSync';
import { useCustomBackground } from '../../hooks/useCustomBackground';
import { CustomBackgroundModal } from '../modals/CustomBackgroundModal';
import type { BackgroundTarget } from '../../services/customBackgroundService';

/**
 * App shell. The sidebar sits flush left at every width; page content fills the rest and
 * each page centers its own reading column (see PageShell). /admin and /pesan are
 * viewport-locked workspaces that manage their own scrolling.
 */
export const AppLayout: React.FC = () => {
  const location = useLocation();
  const isViewportLocked =
    location.pathname.startsWith('/admin') || location.pathname.startsWith('/pesan');
  const { config: globalBg, inlineStyle: globalBgStyle } = useCustomBackground('global');
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const [bgModalTarget, setBgModalTarget] = useState<BackgroundTarget>('global');

  useEffect(() => {
    const handleOpenBg = (e: Event) => {
      const customEvent = e as CustomEvent<{ target?: BackgroundTarget }>;
      if (customEvent.detail?.target) {
        setBgModalTarget(customEvent.detail.target);
      }
      setIsBgModalOpen(true);
    };
    window.addEventListener('titik-open-custom-bg', handleOpenBg);
    return () => window.removeEventListener('titik-open-custom-bg', handleOpenBg);
  }, []);

  return (
    <div
      className={`w-full flex flex-col lg:flex-row text-ink relative ${
        isViewportLocked ? 'h-[100dvh] max-h-[100dvh] overflow-hidden admin-viewport-locked' : 'min-h-[100dvh]'
      }`}
    >
      {/* Global custom background layer if user configured */}
      {globalBg && globalBg.mode !== 'default' && (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-all duration-500"
          style={{
            ...globalBgStyle,
            filter: globalBg.blurAmount > 0 ? `blur(${globalBg.blurAmount}px)` : undefined,
            transform: globalBg.blurAmount > 0 ? 'scale(1.03)' : undefined,
          }}
        >
          {globalBg.overlayDim > 0 && (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: `rgba(0, 0, 0, ${globalBg.overlayDim})` }}
            />
          )}
        </div>
      )}

      <Sidebar />
      {isViewportLocked ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden min-w-0 relative z-10">
          <Outlet />
        </div>
      ) : (
        <div className="flex-1 min-w-0 flex flex-col relative z-10">
          <MobileTopBar />
          <Outlet />
        </div>
      )}
      <BottomNav />
      <UnreadMessagesSync />

      <CustomBackgroundModal
        isOpen={isBgModalOpen}
        onClose={() => setIsBgModalOpen(false)}
        initialTarget={bgModalTarget}
      />
    </div>
  );
};
