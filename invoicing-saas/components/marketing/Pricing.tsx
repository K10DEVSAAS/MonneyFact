'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

export const Pricing: React.FC = () => {
  const freeV1Features = [
    'Factures & Devis illimités en FCFA',
    'Calcul automatique de la TVA 18% et montants arrondis',
    'Génération & Téléchargement PDF conforme DGI Côte d\'Ivoire',
    'Gestion illimitée du répertoire de clients',
    'Liens publics de paiement Mobile Money (Wave, Orange Money, MTN MoMo, Moov)',
    'Tableau de bord analytique et statistiques financières',
    'Exportation des factures et données d\'encaissement',
    'Multi-établissements et Agences régionales',
  ];

  return (
    <section id="gratuit" className="py-20 px-4 lg:px-8 bg-zinc-950 text-white relative">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Section Title */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 px-3.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Offre MonneyFact V1 — Service Gratuit</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Toutes les fonctionnalités de facturation incluses sans frais.
          </h2>
          <p className="text-zinc-400 text-sm">
            Aucun abonnement payant, aucun frais caché. Créez votre compte et gérez les factures de votre entreprise en toute liberté.
          </p>
        </div>

        {/* Pricing Single Free Card */}
        <div className="max-w-2xl mx-auto bg-gradient-to-b from-zinc-900 via-orange-950/30 to-zinc-950 border-2 border-orange-500/80 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400">Accès Permanent V1</span>
              <h3 className="text-2xl font-black text-white">MonneyFact Gratuit</h3>
              <p className="text-xs text-zinc-400 mt-1">Pour toutes les entreprises et entrepreneurs en Côte d&apos;Ivoire.</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-4xl font-black font-mono text-emerald-400">0 FCFA</span>
              <span className="text-xs text-zinc-400 block font-medium">/ pour toujours</span>
            </div>
          </div>

          {/* Features list */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Inclus gratuitement dans votre compte :</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-200">
              {freeV1Features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Aucune carte bancaire requise — Activation immédiate</span>
            </div>

            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-8 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-orange-600/30 transition-all"
            >
              <span>Créer mon compte gratuitement</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
