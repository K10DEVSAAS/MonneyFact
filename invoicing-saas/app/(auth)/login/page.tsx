'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { Logo } from '@/components/ui/Logo';

export default function LoginPage() {
  const { loginAsClient, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Veuillez saisir votre adresse email.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Veuillez saisir votre mot de passe.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginAsClient(email, password);
      if (!result.success && result.error) {
        setErrorMessage(result.error);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Une erreur de connexion est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden text-zinc-100">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900 rounded-3xl border border-zinc-800 p-8 shadow-2xl space-y-6 relative z-10 animate-fade-in">
        {/* Top Bar Navigation: Retour à la Landing Page (Point 8) */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-orange-400 hover:text-orange-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l&apos;accueil / Landing Page</span>
          </Link>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo variant="dark" size="lg" href="/" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Connexion à votre espace</h2>
          <p className="text-xs text-zinc-400">
            Accédez à vos factures, clients et bilans en Côte d&apos;Ivoire.
          </p>
        </div>

        {/* DELETED ACCOUNT OR AUTH ERROR BANNER (POINT 5) */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-semibold flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Official Google OAuth 2.0 Button */}
        <button
          onClick={() => loginWithGoogle()}
          type="button"
          className="w-full py-3 px-4 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-3 transition-all shadow-xs"
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
          <span className="bg-zinc-900 px-3 text-[10px] uppercase font-bold text-zinc-500 shrink-0">ou avec email</span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleCredentialsLogin} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-zinc-300">Adresse Email Professionnelle</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                placeholder="contact@votre-entreprise.ci"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-white font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-zinc-300">Mot de passe</label>
              <Link href="/forgot-password" className="text-orange-400 hover:underline text-[11px] font-semibold">
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                placeholder="Saisissez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-white font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/30 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Vérification de la sécurité...</span>
            ) : (
              <>
                <span>Se connecter à mon espace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Signup Link */}
        <div className="text-center text-xs text-zinc-400 pt-2 border-t border-zinc-800">
          <span>Pas encore de compte ? </span>
          <Link href="/signup" className="text-orange-400 font-bold hover:underline">
            S&apos;inscrire
          </Link>
        </div>
      </div>
    </div>
  );
}
