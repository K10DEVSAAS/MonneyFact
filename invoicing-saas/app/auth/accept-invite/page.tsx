'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Receipt, CheckCircle2, UserCheck, ShieldCheck, ArrowRight, Building } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { useAppStore } from '@/lib/store/appStore';

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';
  const { registerClient } = useAuth();
  const { organization } = useAppStore();

  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setAccepted(true);
    setTimeout(() => {
      registerClient(`${organization.name} Member`, 'collaborateur@entreprise.ci', organization.plan || 'Business');
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="w-full max-w-md bg-zinc-900 rounded-3xl border border-zinc-800 p-8 shadow-2xl space-y-6 relative z-10 animate-fade-in text-zinc-100 text-center">
      <Link href="/" className="inline-flex items-center gap-2 group">
        <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-md shadow-orange-600/30">
          <Receipt className="w-5 h-5" />
        </div>
        <span className="font-extrabold text-2xl text-white tracking-tight">MonneyFact</span>
      </Link>

      {accepted ? (
        <div className="space-y-4 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Invitation Acceptée ! 🎉</h3>
          <p className="text-xs text-zinc-300">
            Vous avez rejoint l&apos;espace entreprise de <strong className="text-white">{organization.name}</strong>. Redirection vers votre tableau de bord...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center mx-auto">
            <UserCheck className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Invitation à Rejoindre l&apos;Équipe</h2>
            <p className="text-xs text-zinc-400">
              Vous avez été invité à rejoindre le compte entreprise de <strong className="text-orange-400">{organization.name}</strong> sur MonneyFact.
            </p>
          </div>

          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-bold">Entreprise :</span>
              <span className="text-white font-extrabold">{organization.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-bold">Formule :</span>
              <span className="text-orange-400 font-mono font-bold">Plan {organization.plan || 'Business'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-bold">Jeton Invitation :</span>
              <span className="text-zinc-500 font-mono text-[11px] truncate max-w-[150px]">{token || 'INV-VALID-48H'}</span>
            </div>
          </div>

          <button
            onClick={handleAccept}
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/30 transition-all flex items-center justify-center gap-2"
          >
            <span>Accepter & Rejoindre l&apos;Entreprise</span>
            <ArrowRight className="w-4 h-4" />
          </button>
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
