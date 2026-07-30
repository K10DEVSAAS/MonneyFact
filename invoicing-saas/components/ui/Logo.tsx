'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  variant?: 'default' | 'icon-only' | 'light' | 'dark';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'default',
  className = '',
  size = 'md',
  href = '/',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const LogoContent = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Sleek Minimalist Geometric SVG Icon */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 rounded-xl rotate-3 shadow-md shadow-orange-500/30 transition-transform group-hover:rotate-6" />
        <div className="absolute inset-[1.5px] bg-zinc-950 rounded-[10px] flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-3/5 h-3/5 text-orange-500 transform -rotate-3"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Geometric Financial M + Invoice Document Mark */}
            <path
              d="M4 18V6L10 13L16 6V18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18 10L20.5 7.5M20.5 7.5L18 5M20.5 7.5H15"
              stroke="#F97316"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Brand Typography */}
      {variant !== 'icon-only' && (
        <div className="flex flex-col">
          <div className={`font-black tracking-tight leading-none ${textSizes[size]}`}>
            <span className={variant === 'dark' ? 'text-white' : 'text-slate-900'}>Money</span>
            <span className="text-orange-600">Fact</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500 ml-0.5" />
          </div>
          <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
            SaaS Facturation
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group transition-opacity hover:opacity-95">
        {LogoContent}
      </Link>
    );
  }

  return LogoContent;
};
