'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, TrendingUp, Sparkles } from 'lucide-react';
import { formatFCFA } from '@/lib/utils/formatters';

export default function SubscriptionsAdminPage() {
  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au Cockpit</span>
        </Link>
      </div>

      <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-white">Analyse des Abonnements & MRR</h2>
          <p className="text-xs text-slate-400 mt-1">
            Répartition des revenus d&apos;abonnements par formule (Plan Gratuit, Pro 5 000 FCFA, Business 15 000 FCFA)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-400">Plan Gratuit (0 FCFA)</span>
            <h3 className="text-2xl font-extrabold text-white">33 Entreprises</h3>
            <p className="text-xs text-slate-500">25.8% des comptes inscrits</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-indigo-950 to-slate-900 rounded-2xl border border-indigo-500/40 space-y-3">
            <span className="text-xs font-bold text-indigo-300">Plan Pro (5 000 FCFA/m)</span>
            <h3 className="text-2xl font-extrabold text-white font-mono">{formatFCFA(395000)} /m</h3>
            <p className="text-xs text-indigo-400 font-semibold">79 Entreprises abonnées</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-purple-950 to-slate-900 rounded-2xl border border-purple-500/40 space-y-3">
            <span className="text-xs font-bold text-purple-300">Plan Business (15 000 FCFA/m)</span>
            <h3 className="text-2xl font-extrabold text-white font-mono">{formatFCFA(1055000)} /m</h3>
            <p className="text-xs text-purple-400 font-semibold">16 Entreprises abonnées</p>
          </div>
        </div>
      </div>
    </div>
  );
}
