import React from 'react';
import { MarketingNavbar } from '@/components/marketing/Navbar';
import { Hero } from '@/components/marketing/Hero';
import { Features } from '@/components/marketing/Features';
import { Pricing } from '@/components/marketing/Pricing';
import { Testimonials } from '@/components/marketing/Testimonials';
import { Footer } from '@/components/marketing/Footer';

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <MarketingNavbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Pricing />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
