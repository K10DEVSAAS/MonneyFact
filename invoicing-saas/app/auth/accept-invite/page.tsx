'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, UserCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { useAppStore } from '@/lib/store/appStore';
import { Logo } from '@/components/ui/Logo';

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';
  const expectedNameParam = searchParams?.get('name') || searchParams?.get('nom') || '';
  const expectedEmailParam = searchParams?.get('email') || '';
  const expectedMinsParam = Number(searchParams?.get('duration') || searchParams?.get('time') || 15);

  const { loginAsCollaborator } = useAuth();
  const { organization } = useAppStore();

  const [fullName, setFullName] = useState(expectedNameParam);
  const [email, setEmail] = useState(expectedEmailParam);
  const [timeMinutes, setTimeMinutes] = useState(expectedMinsParam || 15);
  const [accepted, setAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isBasique = organization.plan === 'Basique';

  const handleAccept = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isBasique) {
      setErrorMessage("Cette invitation est suspendue : l'entreprise hôte est actuellement sous la Formule Basique (1 000 FCFA). La fonction collaborateur requiert le Plan Pro (5 000 FCFA/mois).");
      return;
    }

    if (!fullName.trim() || !email.trim()) {
      setErrorMessage('Veuillez renseigner votre nom complet et votre adresse e-mail.');
      return;
    }

    // Matching validation if parameters were specified in invite link
    if (expectedNameParam && fullName.trim().toLowerCase() !== expectedNameParam.trim().toLowerCase()) {
      setErrorMessage(`Le nom saisi ("${fullName}") ne correspond pas exactement au nom figurant sur l'invitation émise par l'entreprise ("${expectedNameParam}").`);
      return;
    }

    if (expectedEmailParam && email.trim().toLowerCase() !== expectedEmailParam.trim().toLowerCase()) {
      setErrorMessage(`L'email saisi ("${email}") ne correspond pas à l'adresse autorisée ("${expectedEmailParam}").`);
      return;
    }

    setAccepted(true);
    setTimeout(() => {
      loginAsCollaborator(fullName.trim(), email.trim(), organization.name, organization.plan || 'Pro', timeMinutes);
    }, 1200);
  };

  return (
    <div className="w-full max-w-md bg-zinc-900 rounded-3xl border border-zinc-800 p-8 shadow-2xl space-y-6 relative z-10 animate-fade-in text-zinc-100 text-center">
      <div className="flex justify-center">
        <Logo variant="dark" size="lg" href="/" />
      </div>

      {accepted ? (
        <div className="space-y-4 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Session Collaborateur Activée ! 🎉</h3>
          <p className="text-xs text-zinc-300">
            Bienvenue <strong className="text-white">{fullName}</strong> ! Vous êtes connecté sous l&apos;entreprise <strong className="text-orange-400">{organization.name}</strong> pour une durée de <strong className="text-emerald-400">{timeMinutes} minutes</strong>. Redirection...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center mx-auto">
            <UserCheck className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Accès Collaborateur Temporaire</h2>
            <p className="text-xs text-zinc-400">
              Invitation émise par l&apos;entreprise <strong className="text-orange-400">{organization.name}</strong>.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleAccept} className="space-y-4 text-xs text-left">
            <div className="space-y-1">
              <label className="font-bold text-zinc-300">Votre Nom Complet *</label>
              <input
                type="text"
                required
                placeholder="ex: Yao Kouassi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-medium focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-zinc-300">Votre Adresse Email Professionnelle *</label>
              <input
                type="email"
                required
                placeholder="collaborateur@entreprise.ci"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-medium focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-zinc-300">Temps Imparti pour la Session</label>
              <select
                value={timeMinutes}
                onChange={(e) => setTimeMinutes(Number(e.target.value))}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold focus:outline-none focus:border-orange-500"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes (Standard)</option>
                <option value={60}>1 Heure</option>
                <option value={120}>2 Heures</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/30 transition-all flex items-center justify-center gap-2 mt-4"
            >
              <span>Valider Mes Informations & Ouvrir la Session</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <Suspense fallback={<div className="text-white text-xs">Chargement...</div>}>
        <AcceptInviteContent />
      </Suspense>
    </div>
  );
}
