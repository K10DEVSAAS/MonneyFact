'use client';

import React from 'react';
import Link from 'next/link';
import { Receipt, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-zinc-950 text-zinc-400 py-12 px-4 lg:px-8 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white">MonneyFact</span>
              <p className="text-xs text-zinc-400">SaaS de Facturation Africaine</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold">
            <a href="#fonctionnalites" className="hover:text-white transition-colors">
              Fonctionnalités
            </a>
            <a href="#tarifs" className="hover:text-white transition-colors">
              Tarifs
            </a>
            <Link href="/login" className="hover:text-white transition-colors">
              Connexion
            </Link>
            <Link href="/signup" className="hover:text-white transition-colors">
              S&apos;inscrire
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© 2026 MonneyFact Inc. Tous droits réservés.</p>
          <div className="flex items-center gap-1 text-zinc-400">
            <span>Fait avec</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>en Côte d&apos;Ivoire 🇨🇮</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
