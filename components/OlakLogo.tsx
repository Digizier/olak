'use client';

import React from 'react';

interface OlakLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  innerCircleColor?: string;
}

export const OlakLogo: React.FC<OlakLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textColor = 'text-slate-900',
  innerCircleColor = '#ffffff',
}) => {
  const getDimensions = () => {
    switch (size) {
      case 'sm': return { iconSize: 28, fontSize: '19px' };
      case 'lg': return { iconSize: 44, fontSize: '32px' };
      case 'xl': return { iconSize: 54, fontSize: '38px' };
      default: return { iconSize: 34, fontSize: '25px' };
    }
  };

  const dim = getDimensions();

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      {/* 
        Brand Icon SVG: The Split Emerald & Teal Ring.
        This geometric circular ring directly represents the "O" of OLAK!
      */}
      <svg
        width={dim.iconSize}
        height={dim.iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 drop-shadow-sm"
      >
        {/* Left Emerald Arc */}
        <path
          d="M 50 10 A 40 40 0 0 0 50 90 L 50 66 A 16 16 0 0 1 50 34 Z"
          fill="#00D084"
        />
        {/* Right Darker Teal Arc */}
        <path
          d="M 50 10 A 40 40 0 0 1 50 90 L 50 66 A 16 16 0 0 0 50 34 Z"
          fill="#0A3C32"
        />
        {/* Inner Circle (White by default for seamless blend on light background) */}
        <circle cx="50" cy="50" r="16" fill={innerCircleColor} />
      </svg>

      {/* 
        Brand Name Typography: 
        Because the circular split-ring emblem above directly represents the letter 'O',
        the text shows 'LAK' so the entire mark reads seamlessly as 'OLAK' without repeating 'O OLAK'!
      */}
      {showText && (
        <span
          className={`font-black tracking-wider uppercase font-sans ${textColor}`}
          style={{ fontSize: dim.fontSize, letterSpacing: '0.04em' }}
        >
          LAK
        </span>
      )}
    </div>
  );
};
