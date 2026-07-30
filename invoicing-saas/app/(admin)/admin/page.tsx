'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  Search,
  Crown,
  CheckCircle2,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import { dbService } from '@/lib/services/dbService';
import { formatFCFA } from '@/lib/utils/formatters';

export default function AdminCockpitPage() {
  const { registeredCompanies } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [liveCompanies, setLiveCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH LIVE REAL-TIME ORGANIZATIONS FROM SUPABASE DB ON MOUNT
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      try {
        const dbCompanies = await dbService.getAllRegisteredCompanies();
        if (dbCompanies && dbCompanies.length > 0) {
          const formatted = dbCompanies.map((c) => ({
            id: c.id,
            name: c.name,
            ownerName: c.name,
            ownerEmail: c.email,
            city: 'Abidjan',
            plan: 'Pro',
            status: 'active',
            registeredAt: new Date(c.created_at || Date.now()).toISOString().split('T')[0],
            totalInvoiced: 0,
            monthlySubscription: 5000,
          }));
          setLiveCompanies(formatted);
        } else {
          setLiveCompanies(registeredCompanies);
        }
      } catch (e) {
        console.error(e);
        setLiveCompanies(registeredCompanies);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [registeredCompanies]);

  const displayList = liveCompanies.length > 0 ? liveCompanies : registeredCompanies;

  const filteredCompanies = displayList.filter((comp) => {
    return (
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.city.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalInvoicedPlatform = displayList.reduce((sum, c) => sum + (c.totalInvoiced || 0), 0);
  const totalMRR = displayList.reduce((sum, c) => sum + (c.monthlySubscription || 5000), 0);

  return (
    <div className="space-y-6 animate-fade-in text-zinc-100">
      {/* Welcome Banner */}
      <div className="p-6 lg:p-8 bg-gradient-to-r from-zinc-950 via-zinc-900 to-orange-950 rounded-3xl border border-orange-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-extrabold border border-orange-500/30">
              <Crown className="w-3.5 h-3.5 text-orange-400" />
              <span>Super Administrateur • Fondateur MonneyFact</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
              Cockpit Global de Supervision SaaS
            </h2>
            <p className="text-zinc-300 text-sm max-w-xl">
              Supervision en temps réel des inscriptions d&apos;entreprises en Côte d&apos;Ivoire et du MRR.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-4 bg-zinc-900 rounded-2xl border border-orange-500/30 text-center">
              <p className="text-[10px] uppercase font-bold text-orange-400">MRR Mensuel FCFA</p>
              <p className="text-xl font-extrabold font-mono text-white">{formatFCFA(totalMRR)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Super Admin KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Entreprises Inscrites</span>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold font-mono text-white">
            {loading ? <RefreshCw className="w-6 h-6 animate-spin text-orange-500" /> : displayList.length}
          </h3>
          <p className="text-xs text-emerald-400 font-semibold">{displayList.length} entreprise(s) active(s) en BD</p>
        </div>

        <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Revenu Récurrent (MRR)</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold font-mono text-emerald-400">{formatFCFA(totalMRR)}</h3>
          <p className="text-xs text-zinc-400 font-semibold">Cumul des abonnements</p>
        </div>

        <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Volume Facturé Global</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold font-mono text-amber-400">{formatFCFA(totalInvoicedPlatform)}</h3>
          <p className="text-xs text-zinc-400 font-semibold">Généré par les entreprises</p>
        </div>

        <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Taux de Conversion</span>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold font-mono text-orange-400">
            {displayList.length > 0 ? '100%' : '0%'}
          </h3>
          <p className="text-xs text-zinc-400 font-semibold">Abonnés Pro & Business</p>
        </div>
      </div>

      {/* Visual MRR Growth Chart */}
      <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            <h3 className="text-base font-bold text-white">Croissance du MRR MonneyFact (FCFA)</h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">2026</span>
        </div>

        {displayList.length === 0 ? (
          <div className="py-12 text-center space-y-2 border-t border-zinc-800">
            <p className="text-sm font-bold text-zinc-300">Aucune entreprise cliente enregistrée pour le moment</p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Dès qu&apos;une entreprise s&apos;inscrira via l&apos;application ou Google, le compteur s&apos;incrémentera automatiquement ici.
            </p>
          </div>
        ) : (
          <div className="h-40 flex items-end justify-between gap-4 pt-4 border-t border-zinc-800">
            {[
              { month: 'Jan', mrr: totalMRR },
              { month: 'Fév', mrr: totalMRR },
              { month: 'Mar', mrr: totalMRR },
              { month: 'Avr', mrr: totalMRR },
              { month: 'Mai', mrr: totalMRR },
              { month: 'Juin', mrr: totalMRR },
            ].map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full flex justify-center items-end h-32">
                  <div
                    style={{ height: '65%' }}
                    className="w-8 bg-orange-600 group-hover:bg-orange-500 rounded-t-lg transition-all"
                  />
                </div>
                <span className="text-xs font-bold text-zinc-400 group-hover:text-orange-400">{item.month}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registered Companies Table */}
      <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">Entreprises Inscrites sur la Plateforme</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Supervision en temps réel des comptes d&apos;entreprises en Côte d&apos;Ivoire
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une entreprise..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Building2 className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-sm font-bold text-zinc-300">Aucune entreprise enregistrée</p>
            <p className="text-xs text-zinc-500">
              Dès qu&apos;une entreprise s&apos;inscrira via le formulaire d&apos;inscription ou Google, elle apparaîtra immédiatement ici.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 rounded-l-xl">Entreprise</th>
                  <th className="py-3.5 px-4">Gérant & Contact</th>
                  <th className="py-3.5 px-4">Ville</th>
                  <th className="py-3.5 px-4 text-center">Plan Abonnement</th>
                  <th className="py-3.5 px-4 text-right">Volume Facturé</th>
                  <th className="py-3.5 px-4 text-center">Statut Compte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-xs">
                {filteredCompanies.map((comp) => (
                  <tr key={comp.id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="py-4 px-4 font-bold text-white">
                      {comp.name}
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-semibold text-zinc-200">{comp.ownerName}</p>
                      <p className="text-[11px] text-zinc-500">{comp.ownerEmail}</p>
                    </td>

                    <td className="py-4 px-4 text-zinc-300 font-medium">
                      {comp.city}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        {comp.plan || 'Pro'} ({formatFCFA(comp.monthlySubscription || 5000)}/m)
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-bold text-white">
                      {formatFCFA(comp.totalInvoiced || 0)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Actif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
