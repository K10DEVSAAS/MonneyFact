'use client';

import React, { useState, useEffect } from 'react';
import { MarketingNavbar } from '@/components/marketing/Navbar';
import { Hero } from '@/components/marketing/Hero';
import { Features } from '@/components/marketing/Features';
import { Testimonials } from '@/components/marketing/Testimonials';
import { Footer } from '@/components/marketing/Footer';
import { BrandSplashLoader } from '@/components/ui/BrandSplashLoader';

export default function MarketingLandingPage() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Smooth splash transition before revealing landing page
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 850);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      {/* Brand Splash Screen Overlay */}
      {showSplash && (
        <div className="animate-fade-in">
          <BrandSplashLoader
            message="Bienvenue sur MoneyFact"
            submessage="Facturez comme un pro en Côte d'Ivoire 🇨🇮"
            fullScreen={true}
          />
        </div>
      )}

      {/* Main Landing Page */}
      <div className={`flex-1 flex flex-col transition-opacity duration-500 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
        <MarketingNavbar />
        <main className="flex-1">
          <Hero />
          <Features />
          <Testimonials />
        </main>
        <Footer />
      </div>
    </div>
  );
}
