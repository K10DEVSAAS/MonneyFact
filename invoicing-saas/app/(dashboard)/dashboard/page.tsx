'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, FileText, Sparkles, Building, ArrowRight, ShieldCheck, CheckCircle2, Building2, UserCheck, TrendingUp } from 'lucide-react';
import { StatCards } from '@/components/dashboard/StatCards';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RecentInvoices } from '@/components/dashboard/RecentInvoices';
import { useAppStore } from '@/lib/store/appStore';
import { useAuth } from '@/lib/auth/authContext';
import { Subsidiary } from '@/lib/types/invoice';
import { formatFCFA } from '@/lib/utils/formatters';

export default function DashboardPage() {
  const { organization, stats, invoices, activeSubsidiaryId } = useAppStore();
  const { user } = useAuth();

  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const isBusiness = organization.plan === 'Business';

  useEffect(() => {
    try {
      const saved = localStorage.getItem('monneyfact_subsidiaries_list');
      if (saved) {
        const all: Subsidiary[] = JSON.parse(saved);
        // STRICT DATA ISOLATION FILTER BY ORGANIZATION ID
        const ownSubs = all.filter((s) => s.organizationId === organization.id);
        setSubsidiaries(ownSubs);
      }
    } catch (e) {
      console.error(e);
    }
  }, [organization.id]);

  const activeSub = (isBusiness && activeSubsidiaryId !== 'global')
    ? subsidiaries.find((s) => s.id === activeSubsidiaryId)
    : null;

  const isZeroState = invoices.length === 0;

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Active Context Banner */}
      <div className="p-6 lg:p-8 bg-zinc-950 text-white rounded-3xl border border-zinc-800 shadow-xl relative overflow-hidden">
        {/* Subtle Orange Glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-extrabold border border-orange-500/30 inline-flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                <span>{organization.name}</span>
              </span>

              {isBusiness && activeSub ? (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-extrabold border border-amber-500/30 inline-flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Contexte Filiale : {activeSub.name} ({activeSub.city})</span>
                </span>
              ) : isBusiness && subsidiaries.length > 0 ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold border border-emerald-500/30 inline-flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>📊 Vue Consolidée (Toutes les Agences)</span>
                </span>
              ) : null}
            </div>

            <h2 className="text-2xl lg:text-3xl font-black tracking-tight">
              Bonjour, {user?.name || organization.name} ! 👋
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl">
              {activeSub
                ? `Données de facturation et encaissements filtrés uniquement pour l'établissement "${activeSub.name}".`
                : 'Voici l\'état récapitulatif général de votre activité de facturation et d\'encaissement en FCFA.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 px-5 py-3 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-orange-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une Facture</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Guided Onboarding Box for Zero State */}
      {isZeroState && (
        <div className="p-6 bg-white rounded-2xl border border-orange-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
            <Sparkles className="w-5 h-5" />
            <span>Guide de Démarrage Rapide MonneyFact</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Bienvenue ! Votre tableau de bord est entièrement initialisé à zéro. Suivez ces 3 étapes simples pour émettre vos factures officielles :
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <Link
              href="/invoices/new"
              className="p-4 bg-slate-50 hover:bg-orange-50/50 border border-slate-200 hover:border-orange-300 rounded-xl space-y-2 group transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center">
                1
              </div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                Créer votre 1ère Facture
              </p>
              <p className="text-[11px] text-slate-500">Ajoutez des prestations avec calcul automatique de TVA 18%.</p>
            </Link>

            <Link
              href="/clients"
              className="p-4 bg-slate-50 hover:bg-orange-50/50 border border-slate-200 hover:border-orange-300 rounded-xl space-y-2 group transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white font-extrabold text-xs flex items-center justify-center">
                2
              </div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                Enregistrer un Client
              </p>
              <p className="text-[11px] text-slate-500">Ajoutez le nom, l&apos;adresse et le numéro de vos clients.</p>
            </Link>

            <Link
              href="/settings"
              className="p-4 bg-slate-50 hover:bg-orange-50/50 border border-slate-200 hover:border-orange-300 rounded-xl space-y-2 group transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white font-extrabold text-xs flex items-center justify-center">
                3
              </div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                Configurer les Paramètres
              </p>
              <p className="text-[11px] text-slate-500">Renseignez votre NNE/NCC et ajoutez le logo de votre entreprise.</p>
            </Link>
          </div>
        </div>
      )}

      {/* 4 Financial Stat KPI Cards */}
      <StatCards stats={stats} />

      {/* CONSOLIDATED SUBSIDIARIES BREAKDOWN TABLE (Only for Business Plan with registered sub-companies) */}
      {isBusiness && activeSubsidiaryId === 'global' && subsidiaries.length > 0 && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-600" />
              <span>Répartition des Performances par Sous-Entreprise / Agence</span>
            </h3>
            <Link href="/subsidiaries" className="text-xs font-bold text-orange-600 hover:underline">
              Gérer les agences →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3 px-4 rounded-l-xl">Établissement</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Ville</th>
                  <th className="py-3 px-4 text-right">Factures Émises</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Chiffre d&apos;Affaires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {subsidiaries.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{sub.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 font-semibold text-[10px]">
                        {sub.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{sub.city}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">{sub.invoiceCount}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                      {formatFCFA(sub.totalInvoiced)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revenue Chart Section */}
      <RevenueChart />

      {/* Recent Invoices Table */}
      <RecentInvoices invoices={invoices} />
    </div>
  );
}
