import React from 'react';
import type { ProfileController } from './useProfileController';

interface ProfileTabsProps {
  ctrl: ProfileController;
}

type TabKey = 'posts' | 'reports' | 'saved' | 'settings';

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ ctrl }) => {
  const { posts, reports, savedPosts, savedReports, activeTab, setActiveTab, isOwnProfile } = ctrl;

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'posts', label: `Postingan ${posts.length}` },
    { key: 'reports', label: `Laporan ${reports.length}` },
    ...(isOwnProfile
      ? ([
          { key: 'saved', label: `Disimpan ${savedPosts.length + savedReports.length}` },
          { key: 'settings', label: 'Akun' },
        ] as Array<{ key: TabKey; label: string }>)
      : []),
  ];

  return (
    <div role="tablist" aria-label="Isi profil" className="flex gap-1 overflow-x-auto no-scrollbar border-b border-line-soft">
      {tabs.map((tab) => {
        const selected = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => setActiveTab(tab.key)}
            className={`relative shrink-0 h-11 px-4 text-sm font-semibold transition-colors cursor-pointer ${
              selected ? 'text-ink' : 'text-ink-3 hover:text-ink'
            }`}
          >
            {tab.label}
            {selected && <span className="absolute left-3 right-3 -bottom-px h-0.5 rounded-full bg-brand" />}
          </button>
        );
      })}
    </div>
  );
};
