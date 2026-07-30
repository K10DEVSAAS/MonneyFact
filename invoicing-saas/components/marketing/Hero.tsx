'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Play, Sparkles, Star } from 'lucide-react';
import { formatFCFA } from '@/lib/utils/formatters';

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-12 pb-20 px-4 lg:px-8 bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden">
      {/* Background Radial Glow Circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
        {/* Trust Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold shadow-xs">
          <Sparkles className="w-4 h-4 text-orange-600" />
          <span>La solution SaaS n°1 pour entrepreneurs en Côte d&apos;Ivoire 🇨🇮</span>
          <span className="flex items-center gap-0.5 text-amber-500 font-extrabold ml-1">
            <Star className="w-3 h-3 fill-amber-400" /> 4.9/5
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Fini les factures sur Word et Excel. <br />
          <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 bg-clip-text text-transparent">
            Facturez comme un pro.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
          Générez des factures conformes avec <strong>TVA 18% automatique</strong> et Compte Contribuable (NCC). Suivez vos encaissements FCFA et relancez vos clients en 2 clics.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-base font-extrabold rounded-2xl shadow-lg shadow-orange-600/25 transition-all"
          >
            <span>Commencer gratuitement</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 text-base font-bold rounded-2xl shadow-xs transition-all"
          >
            <Play className="w-4 h-4 fill-slate-800" />
            <span>Voir le Dashboard</span>
          </Link>
        </div>

        {/* Highlights bullets */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500 pt-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Plan gratuit 0 FCFA disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Configuration en 2 minutes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Conforme DGI Côte d&apos;Ivoire</span>
          </div>
        </div>

        {/* Dashboard Preview Mockup Card */}
        <div className="pt-8 max-w-5xl mx-auto">
          <div className="p-3 sm:p-5 bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl backdrop-blur-md">
            <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-6 text-left">
              {/* Fake Dashboard Top Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-zinc-400 font-mono ml-2">app.monneyfact.ci/dashboard</span>
                </div>
                <span className="text-xs font-bold text-emerald-400 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  • En direct (Abidjan)
                </span>
              </div>

              {/* Fake Dashboard Preview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                  <p className="text-xs text-zinc-400 font-semibold">Total Facturé Ce Mois</p>
                  <p className="text-xl font-mono text-white font-bold mt-1">{formatFCFA(13100000)}</p>
                </div>
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                  <p className="text-xs text-zinc-400 font-semibold">Encaissé (Wave / Orange)</p>
                  <p className="text-xl font-mono text-emerald-400 font-bold mt-1">{formatFCFA(7950000)}</p>
                </div>
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                  <p className="text-xs text-zinc-400 font-semibold">TVA 18% Déclarée</p>
                  <p className="text-xl font-mono text-orange-400 font-bold mt-1">{formatFCFA(1998305)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
