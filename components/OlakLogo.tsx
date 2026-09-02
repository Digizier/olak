'use client';

import React from 'react';
import Image from 'next/image';

interface OlakLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light';
  showText?: boolean;
  textColor?: string;
  innerCircleColor?: string;
}

export const OlakLogo: React.FC<OlakLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'dark',
}) => {
  const getDimensions = () => {
    switch (size) {
      case 'sm': return { height: 26, width: 85 };
      case 'lg': return { height: 40, width: 130 };
      case 'xl': return { height: 50, width: 163 };
      default: return { height: 32, width: 104 };
    }
  };

  const dim = getDimensions();
  const logoSrc = variant === 'light' ? '/assets/olak-logo-white.png' : '/assets/olak-logo.png';

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <Image
        src={logoSrc}
        alt="OLAK"
        width={dim.width}
        height={dim.height}
        className="h-auto w-auto object-contain drop-shadow-xs"
        priority
        unoptimized
      />
    </div>
  );
};
