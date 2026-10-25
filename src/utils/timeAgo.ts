/**
 * Utility to format ISO timestamps or Date objects into authentic Indonesian relative time strings.
 * Examples: 'Baru saja', '5 menit yang lalu', '2 jam yang lalu', '1 hari yang lalu'.
 */
export function formatIndonesianTimeAgo(isoOrDate: string | Date | undefined | null): string {
  if (!isoOrDate) {
    return 'Baru saja';
  }

  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(date.getTime())) {
    return 'Baru saja';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // If timestamp is slightly in the future (clock drift) or within 45 seconds
  if (diffMs < 45 * 1000) {
    return 'Baru saja';
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffMin < 60) {
    return `${Math.max(1, diffMin)} menit yang lalu`;
  }
  if (diffHour < 24) {
    return `${diffHour} jam yang lalu`;
  }
  if (diffDay < 7) {
    return `${diffDay} hari yang lalu`;
  }
  if (diffWeek < 4) {
    return `${diffWeek} minggu yang lalu`;
  }
  return `${Math.max(1, diffMonth)} bulan yang lalu`;
}

/**
 * Generates an ISO timestamp string offset backwards from now by given minutes and seconds,
 * useful for calculating realistic timestamps when seeding comments to Supabase.
 */
export function generatePastTimestamp(minutesAgo: number, jitterSeconds = 0): string {
  const targetMs = Date.now() - (minutesAgo * 60 + jitterSeconds) * 1000;
  return new Date(targetMs).toISOString();
}

