import React from 'react';
import { FeedContainer } from '../components/feed/FeedContainer';
import './HomeView.css';

export const HomeView: React.FC = () => {
  return (
    <>
      <main className="home-portal-root flex-1 min-w-0 w-full lg:h-screen">
        <FeedContainer />
      </main>
    </>
  );
};
