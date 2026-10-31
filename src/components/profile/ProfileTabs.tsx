import React from 'react';
import { FileText, MessageSquare, Bookmark, Settings } from 'lucide-react';
import type { ProfileController } from './useProfileController';

interface ProfileTabsProps {
  ctrl: ProfileController;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ ctrl }) => {
  const { posts, reports, savedPosts, savedReports, activeTab, setActiveTab, isOwnProfile } = ctrl;
  return (
    <>
            <div className="p-1 bg-[#EBE9DF]/70 dark:bg-[#131916] rounded-2xl border border-[#E3E0D6] dark:border-[#26352E] flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className={`flex-1 min-w-fit inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'posts'
                    ? 'bg-white dark:bg-[#1E2E25] text-[#1B4332] dark:text-[#34D399] shadow-xs border border-[#E3E0D6]/80 dark:border-[#2D4537]'
                    : 'text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Postingan ({posts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`flex-1 min-w-fit inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-white dark:bg-[#1E2E25] text-[#1B4332] dark:text-[#34D399] shadow-xs border border-[#E3E0D6]/80 dark:border-[#2D4537]'
                    : 'text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Laporan Warga ({reports.length})</span>
              </button>

              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setActiveTab('saved')}
                  className={`flex-1 min-w-fit inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'saved'
                      ? 'bg-white dark:bg-[#1E2E25] text-[#1B4332] dark:text-[#34D399] shadow-xs border border-[#E3E0D6]/80 dark:border-[#2D4537]'
                      : 'text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Disimpan ({savedPosts.length + savedReports.length})</span>
                </button>
              )}

              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 min-w-fit inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-white dark:bg-[#1E2E25] text-[#1B4332] dark:text-[#34D399] shadow-xs border border-[#E3E0D6]/80 dark:border-[#2D4537]'
                      : 'text-[#4F5A52] dark:text-[#9EACA3] hover:text-[#101913] dark:hover:text-[#F3F6F4]'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Pengaturan & Akun</span>
                </button>
              )}
            </div>
    </>
  );
};
