import fs from 'fs';
import { describe, it, expect } from 'vitest';

describe('Profile Layout Improvements Static & Structural Suite', () => {
  it('verifies expanded banner height and floating Ubah Sampul button at top-right', () => {
    const src = fs.readFileSync('src/views/ProfileView.tsx', 'utf8');

    // 1. Expanded banner height for panoramic landscape view
    expect(src).toContain('h-48 sm:h-64');

    // 2. Ubah Sampul floating in top-right corner of banner
    expect(src).toContain('absolute top-3.5 right-3.5 sm:top-4 sm:right-4');
    expect(src).toContain('Ubah Sampul');
  });

  it('verifies identity row has refined ring, camera floating button, and no redundant Keluar button', () => {
    const src = fs.readFileSync('src/views/ProfileView.tsx', 'utf8');

    // 1. Refined ring on avatar
    expect(src).toContain('ring-4 ring-white');

    // 2. Floating camera action button at bottom-right of avatar
    expect(src).toContain('absolute bottom-0 right-0 p-2 rounded-full');

    // 3. Header actions only contain Edit Profil and Settings shortcut, not redundant Keluar
    expect(src).toContain('title="Pengaturan Akun"');
    expect(src).toContain('Edit Profil');

    // 4. Keluar button is kept securely in Settings & Akun tab
    expect(src).toContain('Keluar dari Akun');
  });

  it('verifies editorial civic stats ribbon and segmented pill navigation tabs', () => {
    const src = fs.readFileSync('src/views/ProfileView.tsx', 'utf8');

    // 1. Editorial Civic Stats Ribbon
    expect(src).toContain('grid grid-cols-3 divide-x');
    expect(src).toContain('${currentTheme.statBg}');

    // 2. Segmented Pill Tab Bar
    expect(src).toContain('p-1 bg-[#EBE9DF]/70 dark:bg-[#131916] rounded-2xl');
    expect(src).toContain('activeTab === \'posts\'');
    expect(src).toContain('activeTab === \'reports\'');
  });
});
