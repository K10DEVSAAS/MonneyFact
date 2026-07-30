'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Sparkles, Zap } from 'lucide-react';
import { formatFCFA } from '@/lib/utils/formatters';

export const Pricing: React.FC = () => {
  const plans = [
    {
      id: 'basique',
      name: 'Plan Basique',
      price: 1000,
      period: 'FCFA / mois',
      description: 'Parfait pour les petits entrepreneurs qui débutent la facturation simple.',
      features: [
        'Jusqu\'à 10 factures par mois',
        'Calcul automatique TVA 18%',
        'Montants en FCFA',
        'Gestion jusqu\'à 10 clients',
        'Génération de facture PDF simple',
        'Consultation des factures créées',
      ],
      ctaText: 'Choisir le Plan Basique (1 000 FCFA)',
      highlight: false,
    },
    {
      id: 'pro',
      name: 'Plan Pro ⚡',
      price: 5000,
      period: 'FCFA / mois',
      description: 'L\'arsenal complet pour les PME et entreprises qui veulent facturer sans limites.',
      features: [
        'Factures & Devis illimités',
        'Conversion Devis ➔ Facture',
        'Modèles professionnels & PDF haute résolution',
        'Gestion illimitée de clients & fiches détaillées',
        'Suivi des paiements (Wave, Orange, MTN, Espèces, Virement)',
        'Tableau de bord analytique & graphiques dynamiques',
        'Exportation comptable automatisée Excel (.xlsx / .csv)',
        'Support client prioritaire 7j/7',
      ],
      ctaText: 'Rejoindre le Plan Pro (5 000 FCFA)',
      highlight: true,
      badge: 'Formule Recommandée 🚀',
    },
  ];

  return (
    <section id="tarifs" className="py-20 px-4 lg:px-8 bg-zinc-950 text-white relative">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Section Title */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-400 px-3.5 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Tarifs Simples & Transparents</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Deux formules taillées pour la réussite de votre entreprise.
          </h2>
          <p className="text-zinc-400 text-sm">
            Réglez facilement en FCFA via Mobile Money (Wave, Orange Money, MTN MoMo) ou carte bancaire.
          </p>
        </div>

        {/* Pricing Cards Grid (2 Plans) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all ${
                plan.highlight
                  ? 'bg-gradient-to-b from-zinc-900 via-orange-950/40 to-zinc-950 border-2 border-orange-500 shadow-2xl shadow-orange-500/20 scale-105 z-10'
                  : 'bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-600 text-white text-xs font-extrabold rounded-full shadow-md flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>{plan.badge}</span>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{plan.description}</p>
                </div>

                {/* Price Display */}
                <div className="border-y border-zinc-800 py-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold font-mono text-orange-400">
                      {formatFCFA(plan.price)}
                    </span>
                    <span className="text-xs text-zinc-400">/ mois</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 font-medium">{plan.period}</p>
                </div>

                {/* Features list */}
                <ul className="space-y-3 text-xs text-zinc-300">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className={plan.highlight && idx < 3 ? 'font-bold text-white' : ''}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href={`/signup?plan=${plan.id}`}
                  className={`w-full inline-flex items-center justify-center py-3.5 px-6 rounded-2xl text-xs font-extrabold transition-all ${
                    plan.highlight
                      ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/30'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  {plan.ctaText}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
