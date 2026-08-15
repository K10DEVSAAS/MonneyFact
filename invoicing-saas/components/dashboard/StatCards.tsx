'use client';

import React from 'react';
import { FileText, BadgeCheck, Clock4, AlertOctagon, TrendingUp, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { DashboardStats } from '@/lib/types/invoice';
import { formatFCFA } from '@/lib/utils/formatters';

interface StatCardsProps {
  stats: DashboardStats;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  const collectionRate = stats.totalInvoiced > 0 ? Math.round((stats.totalPaid / stats.totalInvoiced) * 100) : 0;
  
  // Circumference calculation for SVG Circular Progress Ring
  const strokeRadius = 24;
  const strokeCircumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = strokeCircumference - (collectionRate / 100) * strokeCircumference;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* CARD 1: Total Facturé */}
      <div className="group relative p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Facturé
          </span>
          <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200/60 text-orange-600 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight group-hover:text-orange-600 transition-colors">
            {formatFCFA(stats.totalInvoiced)}
          </h2>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% ce mois
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({stats.invoiceCounts.total} factures)
            </span>
          </div>
        </div>
      </div>

      {/* CARD 2: Taux de Recouvrement (Radial Progress Circle - Inspired by Screenshot 1) */}
      <div className="group relative p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 flex items-center gap-4">
        {/* Radial Progress Ring */}
        <div className="relative shrink-0 w-20 h-20 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
            {/* Background Circle */}
            <circle
              cx="30"
              cy="30"
              r={strokeRadius}
              className="stroke-slate-100"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Progress Arc */}
            <circle
              cx="30"
              cy="30"
              r={strokeRadius}
              className="stroke-emerald-500 transition-all duration-1000 ease-out"
              strokeWidth="6"
              strokeDasharray={strokeCircumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <span className="absolute font-black text-slate-900 text-sm font-mono">
            {collectionRate}%
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Taux de Recouvrement
          </p>
          <p className="text-xs text-slate-900 font-extrabold leading-snug">
            {collectionRate >= 70 ? 'Excellente santé de trésorerie !' : 'Paiements en cours d\'encaissement'}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            {stats.invoiceCounts.paid} facture(s) soldée(s)
          </p>
        </div>
      </div>

      {/* CARD 3: Encaissé (Wave / MoMo) */}
      <div className="group relative p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Montant Encaissé
          </span>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
            <BadgeCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono tracking-tight">
            {formatFCFA(stats.totalPaid)}
          </h2>

          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 px-2 py-0.5 rounded bg-emerald-100/70">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Confirmé
            </span>
            <span className="text-slate-400 font-medium">
              En attente: {formatFCFA(stats.totalPending)}
            </span>
          </div>
        </div>
      </div>

      {/* CARD 4: Factures en Retard */}
      <div className="group relative p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-rose-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            En Retard de Paiement
          </span>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform ${
            stats.invoiceCounts.overdue > 0 ? 'bg-rose-50 border border-rose-200/60 text-rose-600' : 'bg-slate-50 border border-slate-200/60 text-slate-400'
          }`}>
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
            stats.invoiceCounts.overdue > 0 ? 'text-rose-600' : 'text-slate-900'
          }`}>
            {formatFCFA(stats.totalOverdue)}
          </h2>

          <div className="flex items-center justify-between text-xs">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
              stats.invoiceCounts.overdue > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              {stats.invoiceCounts.overdue > 0 ? `${stats.invoiceCounts.overdue} relance(s) requise(s)` : '0 retard'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
