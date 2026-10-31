import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const isViewportLocked =
    location.pathname.startsWith('/admin') || location.pathname.startsWith('/pesan');

  return (
    <div
      className={
        isViewportLocked
          ? 'h-[100dvh] max-h-[100dvh] overflow-hidden admin-viewport-locked w-full max-w-[1680px] mx-auto bg-[#F7F5EF] dark:bg-[#0C100E] flex flex-col lg:flex-row selection:bg-[#1B4332] dark:selection:bg-[#10B981] selection:text-white dark:selection:text-[#0A1610]'
          : 'min-h-[100dvh] w-full max-w-[1680px] mx-auto bg-[#F7F5EF] dark:bg-[#0C100E] flex flex-col lg:flex-row selection:bg-[#1B4332] dark:selection:bg-[#10B981] selection:text-white dark:selection:text-[#0A1610]'
      }
    >
      <Sidebar />
      {isViewportLocked ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden min-w-0">
          <Outlet />
        </div>
      ) : (
        <Outlet />
      )}
      <BottomNav />
    </div>
  );
};
