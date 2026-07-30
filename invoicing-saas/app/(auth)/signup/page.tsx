'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Receipt, Mail, Lock, Building, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { useAppStore } from '@/lib/store/appStore';

function SignupFormContent() {
  const { registerClient, loginWithGoogle } = useAuth();
  const { initializeZeroAccount } = useAppStore();
  const searchParams = useSearchParams();
  const rawPlan = searchParams?.get('plan') || 'Pro';
  const initialPlan = rawPlan === 'free' ? 'Gratuit' : rawPlan === 'business' ? 'Business' : rawPlan === 'pro' ? 'Pro' : (rawPlan as 'Gratuit' | 'Pro' | 'Business');

  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'Gratuit' | 'Pro' | 'Business'>(
    initialPlan === 'Gratuit' ? 'Gratuit' : initialPlan === 'Business' ? 'Business' : 'Pro'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !email.trim()) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    // 1. Initialize brand new account at ZERO & PURGE PREVIOUS NOTIFICATIONS
    initializeZeroAccount(companyName, email);

    // 2. Set authenticated user session and navigate to /dashboard
    registerClient(companyName, email, selectedPlan);
  };

  return (
    <div className="w-full max-w-xl bg-zinc-950 rounded-3xl border border-zinc-800 p-8 shadow-2xl space-y-6 relative z-10 animate-fade-in text-zinc-100">
      {/* Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-md shadow-orange-600/30">
            <Receipt className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl text-white tracking-tight">MonneyFact</span>
        </Link>
        <h2 className="text-xl font-bold text-white tracking-tight">Créer votre compte entreprise</h2>
        <p className="text-xs text-zinc-400">
          Votre compte sera initialisé à zéro. Facturez vos clients en moins de 2 minutes.
        </p>
      </div>

      {/* Official Google OAuth 2.0 Button */}
      <button
        onClick={() => loginWithGoogle()}
        type="button"
        className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-3 transition-all shadow-xs"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
          />
          <path
            fill="#FBBC05"
            d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"
          />
          <path
            fill="#34A853"
            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
          />
        </svg>
        <span>Continuer avec Google</span>
      </button>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-zinc-800 w-full" />
        <span className="bg-zinc-950 px-3 text-[10px] uppercase font-bold text-zinc-500 shrink-0">ou avec email</span>
      </div>

      {/* Plan Selection Cards */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-zinc-300">Choisissez votre formule d&apos;abonnement</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'Gratuit', label: 'Gratuit', price: '0 FCFA' },
            { id: 'Pro', label: 'Plan Pro', price: '5 000 FCFA/m', badge: 'Recommandé' },
            { id: 'Business', label: 'Business', price: '15 000 FCFA/m' },
          ].map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.id as any)}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                selectedPlan === plan.id
                  ? 'bg-orange-950/60 border-orange-500 text-white ring-2 ring-orange-500/30 shadow-md'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div>
                <span className="text-xs font-bold block">{plan.label}</span>
                <span className="text-[11px] font-mono font-semibold text-orange-400">{plan.price}</span>
              </div>
              {selectedPlan === plan.id && (
                <div className="mt-2 text-right">
                  <Check className="w-4 h-4 text-emerald-400 inline-block" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="space-y-1">
          <label className="font-bold text-zinc-300">Nom de votre Entreprise *</label>
          <div className="relative">
            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              required
              placeholder="ex: Chrome Digital SARL"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-white font-medium"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-zinc-300">Email du Responsable *</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="email"
              required
              placeholder="contact@entreprise.ci"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-white font-medium"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-zinc-300">Mot de passe *</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="password"
              required
              placeholder="Au moins 8 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-white font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/30 transition-all flex items-center justify-center gap-2"
        >
          <span>S&apos;inscrire et initialiser mon compte</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center text-xs text-zinc-400">
        <span>Déjà inscrit ? </span>
        <Link href="/login" className="text-orange-400 font-bold hover:underline">
          Se connecter
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <Suspense fallback={<div className="text-white text-xs">Chargement...</div>}>
        <SignupFormContent />
      </Suspense>
    </div>
  );
}
