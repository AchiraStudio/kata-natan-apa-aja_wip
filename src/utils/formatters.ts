/**
 * Format engagement metrics cleanly for compact social action bar display.
 * Supports standard compact ('1.2M', '850K') and Indonesian notation ('1,2 Jt', '850 rb').
 * Adheres to strict length limits to prevent line-wrapping or flex overflow.
 */
export function formatEngagementMetric(
  value: number | undefined | null,
  locale: 'en' | 'id' = 'en'
): string {
  if (value === undefined || value === null || !Number.isFinite(value) || value <= 0) {
    return '0';
  }

  const roundedSmall = Math.round(value);
  if (roundedSmall <= 0) {
    return '0';
  }

  if (value >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return locale === 'id' ? `${formatted.replace('.', ',')} Jt` : `${formatted}M`;
  }

  if (value >= 1_000) {
    const formatted = (value / 1_000).toFixed(1).replace(/\.0$/, '');
    return locale === 'id' ? `${formatted.replace('.', ',')} rb` : `${formatted}K`;
  }

  return roundedSmall.toString();
}

export const formatMetricNumber = formatEngagementMetric;
