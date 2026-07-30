'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, Search } from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import { dbService } from '@/lib/services/dbService';
import { formatFCFA } from '@/lib/utils/formatters';

export default function CompaniesAdminPage() {
  const { registeredCompanies } = useAppStore();
  const [liveCompanies, setLiveCompanies] = useState<any[]>([]);

  useEffect(() => {
    const fetchCompanies = async () => {
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
      }
    };

    fetchCompanies();
  }, [registeredCompanies]);

  const displayList = liveCompanies.length > 0 ? liveCompanies : registeredCompanies;

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
          <h2 className="text-xl font-extrabold text-white">
            Répertoire des Entreprises Clientes ({displayList.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visualisez et gérez toutes les entreprises enregistrées sur la plateforme MonneyFact.
          </p>
        </div>

        {displayList.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Building2 className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-sm font-bold text-zinc-300">Aucune entreprise enregistrée</p>
            <p className="text-xs text-zinc-500">
              Dès qu&apos;une entreprise s&apos;inscrira via l&apos;application ou Google, elle apparaîtra immédiatement ici.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayList.map((comp) => (
              <div
                key={comp.id}
                className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center">
                    {comp.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300">
                    {comp.plan || 'Pro'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white truncate">{comp.name}</h3>
                  <p className="text-xs text-slate-400">{comp.ownerName}</p>
                  <p className="text-[11px] text-slate-500">{comp.city}, Côte d&apos;Ivoire</p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-[10px] text-slate-500">Volume Facturé</span>
                  <span className="font-bold text-white">{formatFCFA(comp.totalInvoiced || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
