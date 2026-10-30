import React, { useState, useEffect } from 'react';

export interface UserAvatarProps {
  src?: string | null;
  alt: string;
  name?: string;
  role?: 'citizen' | 'admin';
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  title?: string;
  loading?: 'lazy' | 'eager';
}

export function getInitials(nameOrAlt?: string | null): string {
  if (!nameOrAlt) return 'U';
  const clean = nameOrAlt.replace(/^@/, '').trim();
  if (!clean) return 'U';
  const parts = clean.split(/[\s._@-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return clean.slice(0, 1).toUpperCase();
}

function getInitialsFontSize(className?: string): string {
  if (!className) return 'text-sm';
  if (className.includes('text-')) return '';
  if (className.includes('w-24') || className.includes('w-28') || className.includes('w-32')) return 'text-2xl sm:text-3xl';
  if (className.includes('w-16') || className.includes('w-20')) return 'text-lg';
  if (className.includes('w-5') || className.includes('w-6')) return 'text-[9px]';
  if (className.includes('w-7') || className.includes('w-8')) return 'text-xs';
  return 'text-sm';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt,
  name,
  role = 'citizen',
  className = 'w-10 h-10 rounded-full object-cover',
  onClick,
  title,
  loading = 'lazy',
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const hasValidSrc = Boolean(src && typeof src === 'string' && src.trim().length > 0);

  if (!hasValidSrc || imageError) {
    const initials = getInitials(name || alt);
    const fontSizeClass = getInitialsFontSize(className);
    const roleColors =
      role === 'admin'
        ? 'bg-[#92400E] text-[#FDE68A]'
        : 'bg-[#263F35] text-[#34D399]';

    return (
      <div
        role="img"
        aria-label={alt || name || 'User avatar'}
        title={title || alt || name}
        onClick={onClick}
        className={`${className} inline-flex items-center justify-center font-bold select-none uppercase tracking-wider shrink-0 ${fontSizeClass} ${roleColors}`}
      >
        <span>{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={src!}
      alt={alt}
      title={title}
      className={className}
      loading={loading}
      onClick={onClick}
      onError={() => setImageError(true)}
    />
  );
};

export default UserAvatar;
