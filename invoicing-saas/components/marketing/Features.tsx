'use client';

import React from 'react';
import { FileText, Percent, Wallet, Users } from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      icon: FileText,
      title: 'Factures Pro en 2 clics',
      description: 'Générez des factures et devis au design irréprochable au format PDF avec numérotation automatique.',
      color: 'bg-orange-50 text-orange-600 border-orange-200',
    },
    {
      icon: Percent,
      title: 'TVA 18% Calculée Auto',
      description: 'Plus d\'erreur dans vos déclarations. La TVA 18% est calculée et arrondie automatiquement selon les règles fiscales en Côte d\'Ivoire.',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      icon: Wallet,
      title: 'Suivi Mobile Money',
      description: 'Suivez le statut des paiements (Payé, En attente, En retard) pour les règlements par Wave, Orange Money ou MTN MoMo.',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      icon: Users,
      title: 'Gestion de Clients Intégrée',
      description: 'Conservez l\'historique de vos clients, leurs adresses, numéros et encours financiers en un seul endroit.',
      color: 'bg-zinc-100 text-zinc-900 border-zinc-200',
    },
  ];

  return (
    <section id="fonctionnalites" className="py-24 px-4 lg:px-8 bg-slate-50 relative overflow-hidden">
      {/* Motion Background Element */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-14 relative z-10">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-600 px-3.5 py-1.5 bg-orange-50 border border-orange-200/80 rounded-full inline-flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Fonctionnalités Clés
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Tout ce dont vous avez besoin pour gérer l&apos;argent de votre entreprise.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Une expérience fluide, sans paramétrage complexe, adaptée au marché ivoirien.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-2 hover:border-orange-300/80 transition-all duration-300 space-y-4 group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform duration-300 shadow-xs`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
