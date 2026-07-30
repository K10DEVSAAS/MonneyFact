'use client';

import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { formatFCFA } from '@/lib/utils/formatters';

export const Pricing: React.FC = () => {
  const plans = [
    {
      id: 'free',
      name: 'Plan Découverte',
      price: 0,
      period: 'Gratuit à vie',
      description: 'Parfait pour les entrepreneurs individuels et freelances qui débutent.',
      features: [
        'Jusqu\'à 5 factures par mois',
        'Calcul automatique TVA 18%',
        'Montants en FCFA',
        'Gestion jusqu\'à 5 clients',
        'Export PDF simple',
      ],
      ctaText: 'Créer un compte gratuit',
      highlight: false,
    },
    {
      id: 'pro',
      name: 'Plan Pro',
      price: 5000,
      period: 'FCFA / mois',
      description: 'Idéal pour les PME et entreprises en croissance ayant besoin d\'un suivi complet.',
      features: [
        'Factures & Devis illimités',
        'Calcul TVA 18% & Compte Contribuable (NCC)',
        'Gestion illimitée de clients',
        'Suivi des encaissés (Wave, Orange, MTN)',
        'Export PDF officiel haute qualité',
        'Tableau de bord statistique & graphiques',
        'Support client prioritaire 7j/7',
      ],
      ctaText: 'Commencer l\'essai gratuit',
      highlight: true,
      badge: 'Le plus populaire 🚀',
    },
    {
      id: 'business',
      name: 'Plan Business',
      price: 15000,
      period: 'FCFA / mois',
      description: 'Pour les entreprises établies nécessitant du multi-utilisateurs et des fonctionnalités avancées.',
      features: [
        'Tout le contenu du Plan Pro',
        'Accès multi-utilisateurs (Collaborateurs & Comptable)',
        'Gestion de plusieurs entreprises / filiales',
        'Relances automatiques par SMS & Email',
        'Export comptable vers Excel / CSV',
        'Gestionnaire de compte dédié',
      ],
      ctaText: 'Passer au Plan Business',
      highlight: false,
    },
  ];

  return (
    <section id="tarifs" className="py-20 px-4 lg:px-8 bg-zinc-950 text-white relative">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Title */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-400 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
            Tarifs Transparents & Sans Surprise
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Des tarifs adaptés à chaque étape de votre entreprise.
          </h2>
          <p className="text-zinc-400 text-sm">
            Choisissez l&apos;abonnement qui vous convient. Payez en FCFA par Mobile Money (Wave, Orange Money, MTN MoMo) ou carte bancaire.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
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
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-600 text-white text-xs font-extrabold rounded-full shadow-md">
                  {plan.badge}
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
                    <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
                      {plan.price === 0 ? '0 FCFA' : formatFCFA(plan.price)}
                    </span>
                    {plan.price > 0 && <span className="text-xs text-zinc-400">/ mois</span>}
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
                      <span>{feature}</span>
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
