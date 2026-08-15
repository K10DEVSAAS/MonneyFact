'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, Lock, Building, ArrowRight, Check, CreditCard, ShieldCheck, Smartphone, RefreshCw, ArrowLeft, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { useAppStore } from '@/lib/store/appStore';
import { paymentProvider, PaymentChannel } from '@/lib/services/paymentService';
import { PlanType } from '@/lib/types/invoice';
import { Logo } from '@/components/ui/Logo';

function SignupFormContent() {
  const { registerClient, loginWithGoogle } = useAuth();
  const { initializeZeroAccount, registeredCompanies } = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawPlan = searchParams?.get('plan') || 'Pro';
  const initialPlan: PlanType = rawPlan === 'basique' || rawPlan === 'basic' ? 'Basique' : 'Pro';

  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(initialPlan);
  const [errorMessage, setErrorMessage] = useState('');

  // Simulated Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel>('wave');
  const [phone, setPhone] = useState('+225 07 00 00 00 00');
  const [processingPayment, setProcessingPayment] = useState(false);

  const price = selectedPlan === 'Pro' ? 5000 : 1000;

  // REINFORCED REGISTRATION VALIDATION (POINT 6)
  const validateForm = (): boolean => {
    setErrorMessage('');

    if (!companyName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires.');
      return false;
    }

    // 1. Email Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Veuillez saisir une adresse e-mail valide (ex: contact@entreprise.ci).');
      return false;
    }

    // 2. Duplicate Email Check
    const exists = registeredCompanies.some((c) => c.ownerEmail?.toLowerCase() === email.trim().toLowerCase());
    if (exists) {
      setErrorMessage('Cette adresse e-mail est déjà associée à un compte entreprise. Veuillez vous connecter.');
      return false;
    }

    // 3. Password Length & Complexity Control
    if (password.length < 8) {
      setErrorMessage('Le mot de passe doit contenir au moins 8 caractères.');
      return false;
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);

    if (!hasUpper || !hasLower || !hasDigit) {
      setErrorMessage('Le mot de passe doit inclure au moins une majuscule, une minuscule et un chiffre.');
      return false;
    }

    // 4. Password Confirmation Matching
    if (password !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return false;
    }

    return true;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      initializeZeroAccount(companyName, email, 'Pro');
      await registerClient(companyName, email, 'Pro', password);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Erreur lors de la création du compte. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl bg-zinc-950 rounded-3xl border border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-6 relative z-10 animate-fade-in text-zinc-100">
      {/* Top Bar Navigation: Retour à la Landing Page */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-extrabold text-orange-400 hover:text-orange-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l&apos;accueil / Landing Page</span>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <Logo variant="dark" size="lg" href="/" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Créer votre compte gratuit</h2>
        <p className="text-xs text-zinc-400">
          Facturez vos clients gratuitement en moins de 2 minutes en Côte d&apos;Ivoire.
        </p>
      </div>

      {/* Error Alert Box */}
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
        <span>S&apos;inscrire directement avec Google</span>
      </button>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-zinc-800 w-full" />
        <span className="bg-zinc-950 px-3 text-[10px] uppercase font-bold text-zinc-500 shrink-0">ou avec email</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-bold text-zinc-300">Mot de passe *</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Min. 8 car. (A-z, 0-9)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-white font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-zinc-300">Confirmer le mot de passe *</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Répétez le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-white font-medium"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/30 transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Création du compte en cours...</span>
            </>
          ) : (
            <>
              <span>Créer mon compte gratuit</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
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
