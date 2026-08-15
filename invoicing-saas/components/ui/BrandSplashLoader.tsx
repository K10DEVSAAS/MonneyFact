'use client';

import React from 'react';

interface BrandSplashLoaderProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
}

export const BrandSplashLoader: React.FC<BrandSplashLoaderProps> = ({
  message = 'Chargement en cours...',
  submessage = 'MoneyFact • Solution de Facturation SaaS',
  fullScreen = true,
}) => {
  return (
    <div
      className={`${
        fullScreen ? 'fixed inset-0 z-50 min-h-screen' : 'w-full py-16'
      } bg-[#080C14] flex flex-col items-center justify-center p-6 text-white overflow-hidden select-none font-sans`}
    >
      {/* Background Radial Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center space-y-6 text-center max-w-sm">
        {/* MoneyFact Glowing Squircle Logo Loader */}
        <div className="relative flex items-center justify-center">
          {/* Animated Pulsing Outer Ring */}
          <div className="absolute -inset-3 bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 rounded-3xl opacity-75 blur-md animate-pulse" />

          {/* Squircle Outer Border */}
          <div className="relative w-24 h-24 bg-[#080C14] rounded-3xl border-2 border-orange-500/80 shadow-2xl flex items-center justify-center p-4">
            {/* SVG Logo Icon (M + Upward Arrow) */}
            <svg
              viewBox="0 0 512 512"
              fill="none"
              className="w-full h-full text-orange-500 animate-bounce-subtle"
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
        <div className="space-y-1.5 pt-2">
          <div className="text-2xl font-black tracking-tight leading-none">
            <span className="text-white">Money</span>
            <span className="text-orange-500">Fact</span>
            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 ml-1 animate-ping" />
          </div>
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            SaaS Facturation
          </p>
        </div>

        {/* Loading Progress Spinner & Message */}
        <div className="space-y-2 pt-2 flex flex-col items-center">
          <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
            <div className="w-1/2 h-full bg-gradient-to-r from-orange-600 to-amber-400 rounded-full animate-progress-slide" />
          </div>
          <p className="text-xs font-bold text-slate-300">{message}</p>
          <p className="text-[11px] text-slate-500 font-medium">{submessage}</p>
        </div>
      </div>
    </div>
  );
};
