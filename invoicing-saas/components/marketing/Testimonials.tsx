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
      comment: 'La création de factures et l\'envoi des liens de paiement Mobile Money se font en quelques secondes. C\'est un gain de temps précieux pour nos opérations au quotidien.',
      rating: 5,
    },
  ];

  return (
    <section id="temoignages" className="py-24 px-4 lg:px-8 bg-gradient-to-b from-white via-slate-50/50 to-white border-t border-slate-100 relative overflow-hidden">
      {/* Background Motion Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-14 relative z-10">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-600 px-3.5 py-1.5 bg-orange-50 border border-orange-200/80 rounded-full inline-flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Témoignages Clients
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Adopté par les entrepreneurs qui réussissent en Côte d&apos;Ivoire 🇨🇮
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Découvrez pourquoi les PME et indépendants font confiance à MonneyFact pour leur facturation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="p-7 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1.5 hover:border-orange-300/80 transition-all duration-300 space-y-5 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic font-medium">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{rev.name}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{rev.role}</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200/60">
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
