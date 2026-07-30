'use client';

import React from 'react';
import { Star } from 'lucide-react';

export const Testimonials: React.FC = () => {
  const reviews = [
    {
      name: 'Koffi Kouadio',
      role: 'Fondateur, Ivoire BTP',
      location: 'Abidjan, Cocody',
      comment: 'MonneyFact nous a permis de diviser par 3 le temps passé sur la facturation. La TVA 18% est calculée sans erreur et nos clients apprécient le format PDF pro.',
      rating: 5,
    },
    {
      name: 'Awa Koné',
      role: 'Directrice, Lagunes Market',
      location: 'Marcory, Abidjan',
      comment: 'Le suivi des factures impayées est génial. En un coup d\'œil, je sais qui m\'a payé par Orange Money ou Wave et qui relancer.',
      rating: 5,
    },
    {
      name: 'Jean-Marc Tanoh',
      role: 'Gérant, San-Pedro Logistics',
      location: 'San-Pedro',
      comment: 'Le Plan Pro à 5 000 FCFA/mois est le meilleur investissement de mon entreprise. Simple, rapide et conforme aux normes ivoiriennes.',
      rating: 5,
    },
  ];

  return (
    <section id="temoignages" className="py-20 px-4 lg:px-8 bg-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-600 px-3 py-1 bg-orange-50 border border-orange-200 rounded-full">
            Témoignages Clients
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Adopté par les entrepreneurs qui réussissent en Côte d&apos;Ivoire 🇨🇮
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{rev.name}</p>
                  <p className="text-[11px] text-slate-500">{rev.role}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                  {rev.location}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
