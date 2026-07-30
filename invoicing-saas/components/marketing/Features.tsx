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
    <section id="fonctionnalites" className="py-20 px-4 lg:px-8 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-600 px-3 py-1 bg-orange-50 border border-orange-200 rounded-full">
            Fonctionnalités Clés
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Tout ce dont vous avez besoin pour gérer l&apos;argent de votre entreprise.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
