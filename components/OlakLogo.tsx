'use client';

import React from 'react';

interface OlakLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
}

export const OlakLogo: React.FC<OlakLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textColor = 'text-white',
}) => {
  const getDimensions = () => {
    switch (size) {
      case 'sm': return { width: 90, height: 28, iconSize: 26, fontSize: '18px' };
      case 'lg': return { width: 150, height: 46, iconSize: 42, fontSize: '30px' };
      case 'xl': return { width: 190, height: 58, iconSize: 52, fontSize: '38px' };
      default: return { width: 120, height: 36, iconSize: 32, fontSize: '24px' };
    }
  };

  const dim = getDimensions();

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Brand Icon SVG (Split Emerald & Teal Ring) */}
      <svg
        width={dim.iconSize}
        height={dim.iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Left Emerald Arc */}
        <path
          d="M 50 10 A 40 40 0 0 0 50 90 L 50 65 A 15 15 0 0 1 50 35 Z"
          fill="#00D084"
        />
        {/* Right Darker Teal Arc */}
        <path
          d="M 50 10 A 40 40 0 0 1 50 90 L 50 65 A 15 15 0 0 0 50 35 Z"
          fill="#0A3C32"
        />
        {/* Inner Emerald Glow Accent */}
        <circle cx="50" cy="50" r="16" fill="#061325" />
      </svg>

      {/* Brand Name Typography */}
      {showText && (
        <span
          className={`font-black tracking-wider uppercase font-sans ${textColor}`}
          style={{ fontSize: dim.fontSize, letterSpacing: '0.04em' }}
        >
          <span className="text-olak-teal">O</span>LAK
        </span>
      )}
    </div>
  );
};
