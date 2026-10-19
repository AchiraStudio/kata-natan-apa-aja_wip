import React from 'react';

interface TitikLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
  dotColor?: string;
  pinColor?: string;
  innerColor?: string;
}

export const TitikLogo: React.FC<TitikLogoProps> = ({
  className = 'w-8 h-8',
  size,
  showText = false,
  textClassName = 'text-xl font-black tracking-tight text-[#20221D]',
  dotColor = '#34D399',
  pinColor = '#263F35',
  innerColor = '#FFFFFF',
}) => {
  const svgSize = size ? { width: size, height: size } : {};

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full shrink-0"
        {...svgSize}
        aria-label="TITIK Logo"
      >
        {/* Outer Dark Green Speech Bubble & Pin Body */}
        <path
          d="M50 12C29.013 12 12 29.013 12 50C12 62.43 17.96 73.47 27.23 80.37L48.24 93.68C49.32 94.36 50.68 94.36 51.76 93.68C53.5 92.58 65.5 84.8 69 82.5L88 85.5L84.2 69.2C86.6 63.3 88 56.8 88 50C88 29.013 70.987 12 50 12Z"
          fill={pinColor}
        />

        {/* Inner Map Pin Negative Space (White Teardrop) */}
        <path
          d="M50 24C38.402 24 29 33.402 29 45C29 55.2 41.2 68.4 48.8 75.8C49.46 76.44 50.54 76.44 51.2 75.8C58.8 68.4 71 55.2 71 45C71 33.402 61.598 24 50 24Z"
          fill={innerColor}
        />

        {/* Center Focal Dot (Emerald/Mint "TITIK") */}
        <circle cx="50" cy="46" r="10.5" fill={dotColor} />
      </svg>

      {showText && (
        <span className={textClassName}>
          TITIK<span className="text-[#34D399]">.</span>
        </span>
      )}
    </div>
  );
};

