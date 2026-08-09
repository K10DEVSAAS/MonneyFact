'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Building, Sparkles, Zap, Lock } from 'lucide-react';
import { StatCards } from '@/components/dashboard/StatCards';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RecentInvoices } from '@/components/dashboard/RecentInvoices';
import { useAppStore } from '@/lib/store/appStore';
import { useAuth } from '@/lib/auth/authContext';
import { usePermissions } from '@/lib/hooks/usePermissions';

export default function DashboardPage() {
  const { organization, stats, invoices, activeSubsidiaryId, setActiveSubsidiaryId } = useAppStore();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const isPro = organization.plan === 'Pro';
  const isZeroState = invoices.length === 0;
  const isCollaborator = user?.isCollaborator;
  const canViewAnalytics = hasPermission('view_analytics');
  const canCreateInvoices = hasPermission('create_invoices');

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Subsidiary Active Switch Banner */}
      {activeSubsidiaryId !== 'global' && (
        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-between gap-4 text-xs font-bold text-orange-950">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-orange-600 shrink-0" />
            <span>📍 Vous consultez l&apos;établissement spécifique (les chiffres et factures affichés concernent cette agence).</span>
          </div>
          <button
            onClick={() => setActiveSubsidiaryId('global')}
            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-extrabold shadow-xs transition-all shrink-0"
          >
            Vue Globale Consolidée
          </button>
        </div>
      )}

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

              {isPro ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold border border-emerald-500/30 inline-flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Plan Pro Active (5 000 FCFA/m)</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-700">
                  Plan Basique (1 000 FCFA/m)
                </span>
              )}

              {isCollaborator && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-extrabold border border-amber-500/30">
                  Session Collaborateur ({user.memberRole || 'Membre'})
                </span>
              )}
            </div>

            <h2 className="text-2xl lg:text-3xl font-black tracking-tight">
              Bonjour, {user?.name || organization.name} ! 👋
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl">
              Voici l&apos;état récapitulatif de votre activité de facturation et d&apos;encaissement en FCFA.
            </p>
          </div>

          {/* Action Buttons */}
          {canCreateInvoices && (
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-2 px-5 py-3 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-orange-600/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Créer une Facture</span>
              </Link>
            </div>
          )}
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
              href="/clients"
              className="p-4 bg-slate-50 hover:bg-orange-50/50 border border-slate-200 hover:border-orange-300 rounded-xl space-y-2 group transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                1
              </div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                1. Enregistrer un Client
              </p>
              <p className="text-[11px] text-slate-500">Renseignez le nom, l&apos;e-mail et le téléphone de votre client.</p>
            </Link>

            {canCreateInvoices ? (
              <Link
                href="/invoices/new"
                className="p-4 bg-slate-50 hover:bg-orange-50/50 border border-slate-200 hover:border-orange-300 rounded-xl space-y-2 group transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white font-extrabold text-xs flex items-center justify-center">
                  2
                </div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                  2. Créer une Facture
                </p>
                <p className="text-[11px] text-slate-500">Sélectionnez le client et ajoutez vos prestations avec TVA 18%.</p>
              </Link>
            ) : (
              <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl space-y-2 opacity-60">
                <div className="w-8 h-8 rounded-lg bg-slate-400 text-white font-extrabold text-xs flex items-center justify-center">
                  2
                </div>
                <p className="text-xs font-bold text-slate-700">Créer une Facture (Masqué)</p>
                <p className="text-[11px] text-slate-500">Autorisation manquante</p>
              </div>
            )}

            <Link
              href="/settings"
              className="p-4 bg-slate-50 hover:bg-orange-50/50 border border-slate-200 hover:border-orange-300 rounded-xl space-y-2 group transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white font-extrabold text-xs flex items-center justify-center">
                3
              </div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                3. Configurer les Paramètres
              </p>
              <p className="text-[11px] text-slate-500">Renseignez votre NNE/NCC et téléversez votre logo d&apos;entreprise.</p>
            </Link>
          </div>
        </div>
      )}

      {/* Financial Stats Section - Protected by view_analytics permission */}
      {canViewAnalytics ? (
        <>
          <StatCards stats={stats} />
          <RevenueChart />
        </>
      ) : (
        <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Statistiques & Chiffres d&apos;Affaires Masqués</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Votre compte collaborateur ne dispose pas de la permission &quot;Consulter les Statistiques & CA&quot;. Contactez l&apos;administrateur de l&apos;entreprise pour débloquer cet accès.
            </p>
          </div>
        </div>
      )}

      {/* Recent Invoices Table */}
      <RecentInvoices invoices={invoices} />
    </div>
  );
}
