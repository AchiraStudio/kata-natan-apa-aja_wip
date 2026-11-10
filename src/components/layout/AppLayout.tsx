import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MobileTopBar } from './MobileTopBar';
import { UnreadMessagesSync } from './UnreadMessagesSync';

/**
 * App shell. The sidebar sits flush left at every width; page content fills the rest and
 * each page centers its own reading column (see PageShell). /admin and /pesan are
 * viewport-locked workspaces that manage their own scrolling.
 */
export const AppLayout: React.FC = () => {
  const location = useLocation();
  const isViewportLocked =
    location.pathname.startsWith('/admin') || location.pathname.startsWith('/pesan');

  return (
    <div
      className={`w-full flex flex-col lg:flex-row text-ink ${
        isViewportLocked ? 'h-[100dvh] max-h-[100dvh] overflow-hidden admin-viewport-locked' : 'min-h-[100dvh]'
      }`}
    >
      <Sidebar />
      {isViewportLocked ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden min-w-0">
          <Outlet />
        </div>
      ) : (
        <div className="flex-1 min-w-0 flex flex-col">
          <MobileTopBar />
          <Outlet />
        </div>
      )}
      <BottomNav />
      <UnreadMessagesSync />
    </div>
  );
};
