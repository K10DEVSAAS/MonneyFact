'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-zinc-950 text-zinc-400 py-12 px-4 lg:px-8 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Logo variant="dark" size="md" href="/" />
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold text-zinc-300">
            <a href="#fonctionnalites" className="hover:text-white transition-colors">
              Fonctionnalités
            </a>
            <a href="#gratuit" className="hover:text-white transition-colors">
              Accès Gratuit V1
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
          <div className="flex items-center gap-1.5 text-zinc-300 font-bold">
            <span>Créé par le développeur K10Dev</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
