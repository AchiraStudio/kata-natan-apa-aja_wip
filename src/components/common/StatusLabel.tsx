import React from 'react';
import { getStatusMeta, STATUS_DOT_CLASS } from '../../utils/reportStatus';

/** Status as a dot plus words: color never carries the meaning alone. */
export const StatusLabel: React.FC<{ status: string; className?: string }> = ({ status, className = '' }) => {
  const meta = getStatusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-ink-2 ${className}`}>
      <span aria-hidden="true" className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_CLASS[meta.tone]}`} />
      {meta.label}
    </span>
  );
};
