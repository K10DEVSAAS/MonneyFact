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
  const { organization, stats, invoices, activeSubsidiaryId, setActiveSubsidiaryId, subsidiaries, mainCompanyDashboard } = useAppStore();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  console.log('[DASHBOARD] PAGE MOUNTED');
  console.log('[DASHBOARD] USER ID:', user?.id);
  console.log('[DASHBOARD] EMAIL:', user?.email);
  console.log('[DASHBOARD] ORGANIZATION ID:', user?.organizationId || organization?.id);
  console.log('[DASHBOARD] ORGANIZATION NAME:', user?.companyName || organization?.name);
  console.log('[FINAL-TEST] AUTH USER ID:', user?.id);
  console.log('[FINAL-TEST] AUTH EMAIL:', user?.email);
  console.log('[FINAL-TEST] PROFILE ID:', user?.id);
  console.log('[FINAL-TEST] PROFILE EMAIL:', user?.email);
  console.log('[FINAL-TEST] ORGANIZATION ID:', user?.organizationId || organization?.id);
  console.log('[FINAL-TEST] ORGANIZATION NAME:', user?.companyName || organization?.name);
  console.log('[FINAL-TEST] DASHBOARD COMPANY:', user?.companyName || organization?.name);

  const isPro = organization.plan === 'Pro';
  const isZeroState = invoices.length === 0;
  const isCollaborator = user?.isCollaborator;
  const canViewAnalytics = hasPermission('view_analytics');
  const canCreateInvoices = hasPermission('create_invoices');

  const activeSub = (subsidiaries || []).find((s) => s.id === activeSubsidiaryId);

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Subsidiary Active Switch Banner */}
      {activeSubsidiaryId !== 'global' && (
        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-between gap-4 text-xs font-bold text-orange-950">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-orange-600 shrink-0" />
            <span>
              📍 Vous consultez l&apos;établissement <strong>{activeSub?.name || 'Sous-Entreprise'}</strong> ({activeSub?.city || 'Agence'}). Les statistiques et factures ci-dessous concernent uniquement cette filiale.
            </span>
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

              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold border border-emerald-500/30 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>MonneyFact V1 (Accès Illimité)</span>
              </span>

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
              {activeSubsidiaryId === 'global'
                ? 'Vue Globale Consolidée : synthèse financière agrégée de l\'ensemble des sous-entreprises et du siège.'
                : `Tableau de bord spécifique à l'établissement ${activeSub?.name || ''}.`}
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

          {/* Consolidated Multi-Branch Breakdown Table (Only visible in Global View) */}
          {activeSubsidiaryId === 'global' && mainCompanyDashboard.companyBreakdown.length > 0 && (
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    📊 Ventilation Consolidée par Établissement ({mainCompanyDashboard.companyBreakdown.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chiffre d&apos;affaires et encaissements agrégés par sous-entreprise et siège social.
                  </p>
                </div>
                <Link
                  href="/subsidiaries"
                  className="px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 text-xs font-extrabold rounded-xl hover:bg-orange-100 transition-colors"
                >
                  Gérer les agences
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/60 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 rounded-l-xl">Établissement</th>
                      <th className="py-3 px-4">Localisation</th>
                      <th className="py-3 px-4 text-right">CA Total (TTC)</th>
                      <th className="py-3 px-4 text-right">Encaissements</th>
                      <th className="py-3 px-4 text-right">Impayés</th>
                      <th className="py-3 px-4 text-center">Factures</th>
                      <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {mainCompanyDashboard.companyBreakdown.map((item) => (
                      <tr key={item.companyId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {item.companyName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {item.city || 'Abidjan'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                          {item.totalRevenue.toLocaleString()} FCFA
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                          {item.totalPaid.toLocaleString()} FCFA
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                          {item.totalUnpaid.toLocaleString()} FCFA
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-orange-600">
                          {item.invoiceCount}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {item.companyId !== 'main-headquarters' ? (
                            <button
                              onClick={() => setActiveSubsidiaryId(item.companyId)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-all"
                            >
                              Filtrer cette agence
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-bold">Siège</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
