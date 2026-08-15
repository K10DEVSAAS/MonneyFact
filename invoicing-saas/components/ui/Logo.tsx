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
      {/* Sleek Glowing Squircle SVG Icon */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 rounded-xl shadow-md shadow-orange-500/40 border border-orange-400/50 transition-transform group-hover:scale-105" />
        <div className="absolute inset-[2px] bg-zinc-950 rounded-[10px] flex items-center justify-center p-1.5 overflow-hidden">
          <svg
            viewBox="0 0 512 512"
            fill="none"
            className="w-full h-full text-orange-500"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g fill="none" stroke="#F97316" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 136 352 V 200 L 224 300 L 312 200 V 352" />
              <path d="M 312 200 L 376 136" stroke="#FF6B00" />
              <path d="M 310 136 H 376 V 202" stroke="#FF6B00" strokeWidth="44" />
            </g>
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
