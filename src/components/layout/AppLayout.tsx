import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export const AppLayout: React.FC = () => (
  <div className="min-h-[100dvh] w-full max-w-[1680px] mx-auto bg-[#F7F5EF] dark:bg-[#0C100E] flex flex-col lg:flex-row selection:bg-[#1B4332] dark:selection:bg-[#10B981] selection:text-white dark:selection:text-[#0A1610]">
    <Sidebar />
    <Outlet />
    <BottomNav />
    </div>
);
