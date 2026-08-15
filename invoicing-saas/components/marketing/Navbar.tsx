'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, User, Menu, X, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { Logo } from '@/components/ui/Logo';

export const MarketingNavbar: React.FC = () => {
  const { isAuthenticated, user, role } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-12 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Modern Minimalist Brand Logo */}
        <Logo variant="default" size="md" href="/" />

        {/* Center Nav Links - Desktop */}
        <nav className="hidden md:flex items-center gap-8 text-xs sm:text-sm font-bold text-slate-700">
          <a href="#fonctionnalites" className="hover:text-orange-600 transition-colors">
            Fonctionnalités
          </a>
          <a href="#gratuit" className="hover:text-orange-600 transition-colors flex items-center gap-1.5 text-emerald-700">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Accès Gratuit V1</span>
          </a>
          <a href="#temoignages" className="hover:text-orange-600 transition-colors">
            Témoignages
          </a>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated && user ? (
            <Link
              href={role === 'super_admin' ? '/admin' : '/dashboard'}
              className="inline-flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              <User className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="max-w-[120px] sm:max-w-none truncate">Mon Espace</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-block px-3 py-2 text-xs font-bold text-slate-700 hover:text-orange-600 transition-colors"
              >
                Se connecter
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/20 transition-all shrink-0"
              >
                <span>Accéder à mon Espace</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-orange-600 rounded-lg focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-4 pb-3 border-t border-slate-100 mt-3 space-y-3 animate-fade-in text-xs font-bold text-slate-800">
          <a
            href="#fonctionnalites"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            Fonctionnalités
          </a>
          <a
            href="#gratuit"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-emerald-700"
          >
            Accès Gratuit V1
          </a>
          <a
            href="#temoignages"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            Témoignages
          </a>
        </div>
      )}
    </header>
  );
};
