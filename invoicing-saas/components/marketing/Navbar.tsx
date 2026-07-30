'use client';

import React from 'react';
import Link from 'next/link';
import { Receipt, ArrowRight, User } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';

export const MarketingNavbar: React.FC = () => {
  const { isAuthenticated, user, role } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-12 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-md shadow-orange-600/20 group-hover:scale-105 transition-transform">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">MonneyFact</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                🇨🇮 Côte d&apos;Ivoire
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Facturation SaaS pour Entrepreneurs</p>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-700">
          <a href="#fonctionnalites" className="hover:text-orange-600 transition-colors">
            Fonctionnalités
          </a>
          <a href="#tarifs" className="hover:text-orange-600 transition-colors">
            Tarifs & Abonnements
          </a>
          <a href="#temoignages" className="hover:text-orange-600 transition-colors">
            Témoignages
          </a>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <Link
              href={role === 'super_admin' ? '/admin' : '/dashboard'}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <User className="w-4 h-4 text-orange-400" />
              <span>Mon Espace ({user.companyName || user.name})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-orange-600 transition-colors"
              >
                Se connecter
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/20 transition-all"
              >
                <span>Accéder à mon Espace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
