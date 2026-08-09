'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, CreditCard, Smartphone, Check, RefreshCw, ArrowLeft, LogOut, Lock, Calendar, Crown, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { useAppStore } from '@/lib/store/appStore';
import { paymentProvider, PaymentChannel } from '@/lib/services/paymentService';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { PlanType } from '@/lib/types/invoice';
import { Logo } from '@/components/ui/Logo';

export default function RenewalPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { organization, updateOrganization } = useAppStore();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>(organization.plan || 'Pro');
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel>('wave');
  const [phone, setPhone] = useState(organization.phone || '+225 07 00 00 00 00');
  const [isProcessing, setIsProcessing] = useState(false);

  const price = selectedPlan === 'Pro' ? 5000 : 1000;

  const handleSimulateRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const result = await paymentProvider.initiatePayment({
        amount: price,
        currency: 'FCFA',
        customerEmail: organization.email || 'contact@entreprise.ci',
        customerPhone: phone,
        planName: selectedPlan,
        channel: selectedChannel,
      });

      if (result.success) {
        const newExpiresAt = subscriptionService.calculateExpirationDate('monthly');
        updateOrganization({
          plan: selectedPlan,
          status: 'active',
          expiresAt: newExpiresAt,
          activatedAt: new Date().toISOString(),
        });

        alert(`Renouvellement réussi ! Votre abonnement ${selectedPlan} (${price.toLocaleString()} FCFA) a été prolongé de 30 jours.`);
        router.push('/dashboard');
      } else {
        alert('Erreur lors du règlement. Veuillez réessayer.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau lors du renouvellement.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden text-zinc-100 font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-zinc-900 rounded-3xl border border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-6 relative z-10 animate-fade-in">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-orange-400 hover:text-orange-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au site principal</span>
          </Link>

          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Se déconnecter</span>
          </button>
        </div>

        {/* Branding & Expiration Banner */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo variant="dark" size="lg" href="/" />
          </div>

          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-black text-white tracking-tight">
            Abonnement de 30 Jours Expiré
          </h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            L&apos;accès à votre espace d&apos;entreprise <strong className="text-white font-bold">{organization.name}</strong> ({organization.email}) a été suspendu suite à l&apos;expiration de vos 30 jours d&apos;abonnement.
          </p>
        </div>

        {/* Status Notice Box */}
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 space-y-2">
          <div className="flex items-center gap-2 font-black text-rose-400 uppercase tracking-wide">
            <ShieldAlert className="w-4 h-4" />
            <span>Vos données restent 100% conservées et sécurisées</span>
          </div>
          <p className="text-[11px] text-zinc-300">
            Toutes vos factures, clients, notifications et paramètres sont intégralement conservés en base de données. Effectuez le renouvellement ci-dessous pour débloquer votre accès immédiatement.
          </p>
        </div>

        {/* Plan Choice (Basique 1 000 FCFA vs Pro 5 000 FCFA) */}
        <div className="space-y-2 text-xs">
          <label className="block font-bold text-zinc-300">Choisissez la formule à renouveler / surclasser :</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'Basique', label: 'Plan Basique', price: '1 000 FCFA/30j', desc: 'Factures simples' },
              { id: 'Pro', label: 'Plan Pro ⚡', price: '5 000 FCFA/30j', desc: 'Illimité + Filiales & Équipe', badge: 'Recommandé' },
            ].map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id as PlanType)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  selectedPlan === plan.id
                    ? 'bg-orange-950/60 border-orange-500 text-white ring-2 ring-orange-500/30 shadow-md'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-white">{plan.label}</span>
                    {plan.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-mono font-black text-orange-400 block mt-1">{plan.price}</span>
                  <span className="text-[10px] text-zinc-500 mt-1 block">{plan.desc}</span>
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

        {/* Payment Channels Selection */}
        <form onSubmit={handleSimulateRenewal} className="space-y-4 text-xs">
          <div className="space-y-2">
            <label className="font-bold text-zinc-300">Mode de Règlement (Côte d&apos;Ivoire) :</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'wave', label: 'Wave 🌊' },
                { id: 'orange_money', label: 'Orange 🟧' },
                { id: 'mtn_momo', label: 'MTN 🟨' },
                { id: 'card', label: 'Carte 💳' },
              ].map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedChannel(ch.id as PaymentChannel)}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                    selectedChannel === ch.id
                      ? 'bg-orange-600 text-white border-orange-500 shadow-md'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-zinc-300">Numéro Mobile Money pour la validation</label>
            <div className="relative">
              <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Renouveler mon Abonnement ({price.toLocaleString()} FCFA / 30 Jours)</span>
                <Check className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
