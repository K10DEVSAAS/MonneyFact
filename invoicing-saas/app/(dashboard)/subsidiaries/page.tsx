'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, Lock, Crown, CheckCircle2, MapPin } from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';

export default function SubsidiariesPage() {
  const { organization } = useAppStore();
  const isBusinessPlan = organization.plan === 'Business';

  const [subsidiaries, setSubsidiaries] = useState([
    { id: 'sub-1', name: organization.name, city: 'Abidjan (Siège Social)', type: 'Mère', status: 'Principale' },
  ]);

  const [subName, setSubName] = useState('');
  const [subCity, setSubCity] = useState('Yamoussoukro');

  const handleAddSubsidiary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;

    setSubsidiaries([
      ...subsidiaries,
      { id: `sub-${Date.now()}`, name: subName, city: subCity, type: 'Filiale / Agence', status: 'Active' },
    ]);
    setSubName('');
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gestion Multi-Entreprises & Filiales</h2>
        <p className="text-xs text-slate-500 mt-1">
          Pilotez plusieurs entités juridiques, filiales ou agences sous le même compte MonneyFact.
        </p>
      </div>

      {/* LOCK HERO BANNER IF NOT BUSINESS PLAN */}
      {!isBusinessPlan ? (
        <div className="p-8 bg-zinc-950 text-white rounded-3xl border border-zinc-800 shadow-2xl space-y-6 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-orange-600/20 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-orange-500" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold rounded-full">
              👑 Exclusif au Plan Business (15.000 FCFA/mois)
            </span>
            <h3 className="text-2xl font-black text-white">Débloquez la Gestion Multi-Entreprises</h3>
            <p className="text-xs text-zinc-400">
              Votre formule actuelle (<strong className="text-white">{organization.plan || 'Pro'}</strong>) est limitée à une seule entreprise. Passez au Plan Business pour ajouter d&apos;autres filiales ou agences sous le même compte.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-orange-600/30 transition-all"
            >
              <span>Passer au Plan Business (15.000 FCFA/m)</span>
              <Crown className="w-4 h-4 text-amber-300" />
            </Link>
          </div>
        </div>
      ) : (
        /* FULL BUSINESS FEATURE CONTENT */
        <div className="space-y-6">
          {/* Add Subsidiary Form */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Plus className="w-5 h-5 text-orange-600" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider">Ajouter une nouvelle Filiale ou Agence</h3>
            </div>

            <form onSubmit={handleAddSubsidiary} className="flex flex-col sm:flex-row items-end gap-3 text-xs">
              <div className="flex-1 space-y-1 w-full">
                <label className="font-bold text-slate-700">Nom de la Filiale / Société *</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="ex: MonneyFact Agence San-Pedro"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="w-full sm:w-48 space-y-1">
                <label className="font-bold text-slate-700">Ville / Localisation</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={subCity}
                    onChange={(e) => setSubCity(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold rounded-xl shadow-md transition-all shrink-0 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Créer la filiale</span>
              </button>
            </form>
          </div>

          {/* Subsidiaries List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {subsidiaries.map((sub) => (
              <div key={sub.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{sub.name}</h4>
                      <p className="text-[11px] text-slate-500">{sub.city}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
