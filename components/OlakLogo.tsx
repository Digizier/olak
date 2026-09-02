'use client';

import React from 'react';

interface OlakLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light';
  showText?: boolean;
  textColor?: string;
  innerCircleColor?: string;
}

const SIZE_MAP = {
  sm: {
    heightClass: 'h-6 sm:h-7', // 24px mobile, 28px desktop
    maxHeightPx: 28,
  },
  md: {
    heightClass: 'h-7 sm:h-9', // 28px mobile, 36px desktop
    maxHeightPx: 36,
  },
  lg: {
    heightClass: 'h-8 sm:h-10', // 32px mobile, 40px desktop
    maxHeightPx: 40,
  },
  xl: {
    heightClass: 'h-10 sm:h-12', // 40px mobile, 48px desktop
    maxHeightPx: 48,
  },
};

export const OlakLogo: React.FC<OlakLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'dark',
}) => {
  const config = SIZE_MAP[size] || SIZE_MAP.md;
  const logoSrc = variant === 'light' ? '/assets/olak-logo-white.png' : '/assets/olak-logo.png';

  return (
    <div className={`inline-flex items-center flex-shrink-0 select-none ${className}`}>
      <img
        src={logoSrc}
        alt="OLAK"
        className={`${config.heightClass} w-auto max-w-full object-contain drop-shadow-xs transition-all duration-200`}
        style={{
          maxHeight: `${config.maxHeightPx}px`,
          width: 'auto',
          display: 'block',
        }}
        loading="eager"
      />
    </div>
  );
};
