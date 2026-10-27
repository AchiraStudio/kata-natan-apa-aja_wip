import React from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { FeedContainer } from '../components/feed/FeedContainer';
import { RightContextualPanel } from '../components/feed/RightContextualPanel';
import './HomeView.css';

export const HomeView: React.FC = () => {
  return (
    <div className="home-portal-root h-[100dvh] lg:h-screen w-full max-w-[1680px] mx-auto bg-[#F7F6F1] dark:bg-[#0C100E] flex flex-col lg:flex-row overflow-hidden selection:bg-[#263F35] dark:selection:bg-[#10B981] selection:text-white dark:selection:text-[#0A1610]">
      {/* 1. Left Persistent Navigation Hub with Integrated Search & Citizen Profile */}
      <Sidebar currentPath="/" />

      {/* 2. Center Media Feed Column (Pure Feed - Zero Banners on Mobile & Desktop) */}
      <main className="flex-1 h-[100dvh] lg:h-screen overflow-hidden flex flex-col items-center p-0 min-w-0 w-full">
        {/* Incident Feed Stream (Clean Viewport Media Stream) */}
        <div className="home-mobile-sheet rounded-t-[36px] lg:rounded-none w-full h-full flex-1 flex flex-col items-center p-0 m-0 overflow-hidden">
          <FeedContainer />
        </div>
      </main>

      {/* 3. Right Contextual Report & Expanded Comments Panel (Desktop) */}
      <RightContextualPanel />

      {/* 4. Mobile Floating & Dynamic Auto-Hiding Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
