import React from 'react';
import { FeedContainer } from '../components/feed/FeedContainer';
import { RightContextualPanel } from '../components/feed/RightContextualPanel';
import './HomeView.css';

export const HomeView: React.FC = () => {
  return (
    <>

      {/* 2. Center Media Feed Column (Pure Feed - Zero Banners on Mobile & Desktop) */}
      <main className="home-portal-root flex-1 h-[100dvh] lg:h-screen overflow-hidden flex flex-col items-center p-0 min-w-0 w-full">
        {/* Incident Feed Stream (Clean Viewport Media Stream) */}
        <div className="home-mobile-sheet rounded-t-[36px] lg:rounded-none w-full h-full flex-1 flex flex-col items-center p-0 m-0 overflow-hidden">
          <FeedContainer />
        </div>
      </main>

      {/* 3. Right Contextual Report & Expanded Comments Panel (Desktop) */}
      <RightContextualPanel />

      {/* 4. Mobile Floating & Dynamic Auto-Hiding Bottom Navigation */}
    </>
  );
};
