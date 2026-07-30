'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check, CreditCard, ShieldCheck, Smartphone, RefreshCw, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import { paymentProvider, PaymentChannel } from '@/lib/services/paymentService';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { PlanType } from '@/lib/types/invoice';
import { Logo } from '@/components/ui/Logo';

export default function RenewalPage() {
  const router = useRouter();
  const { organization, updateOrganization } = useAppStore();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>(organization.plan || 'Pro');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel>('wave');
  const [phone, setPhone] = useState(organization.phone || '+225 07 00 00 00 00');
  const [processingPayment, setProcessingPayment] = useState(false);

  const price = selectedPlan === 'Pro' ? 5000 : 1000;

  const handleSelectPlan = (plan: PlanType) => {
    setSelectedPlan(plan);
    setPaymentModalOpen(true);
  };

  const handleSimulatePayment = async () => {
    setProcessingPayment(true);
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
        });

        alert(`Paiement simulé réussi ! Votre abonnement ${selectedPlan} a été réactivé jusqu'au ${new Date(newExpiresAt).toLocaleDateString('fr-FR')}.`);
        setPaymentModalOpen(false);
        router.push('/dashboard');
      } else {
        alert('Erreur lors du paiement simulé. Veuillez réessayer.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la simulation de paiement.');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden text-zinc-100">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-zinc-900 rounded-3xl border border-zinc-800 p-8 shadow-2xl space-y-6 relative z-10 animate-fade-in">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo variant="dark" size="lg" href="/" />
          </div>

          <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">Abonnement Arrivé à Expiration</h2>
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-200 font-medium max-w-md mx-auto">
            &ldquo;Votre abonnement est arrivé à expiration. Veuillez le renouveler pour continuer à utiliser MoneyFact.&rdquo;
          </div>
        </div>

        {/* Plan Selection Cards */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-zinc-300">Sélectionnez la formule de renouvellement :</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {[
              { id: 'Basique', label: 'Plan Basique', price: '1 000 FCFA/m', desc: '10 factures/m, clients essentiels' },
              { id: 'Pro', label: 'Plan Pro ⚡', price: '5 000 FCFA/m', desc: 'Factures, devis & clients illimités' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPlan(p.id as PlanType)}
                className={`p-4 rounded-2xl border text-left space-y-2 transition-all ${
                  selectedPlan === p.id
                    ? 'bg-orange-950/60 border-orange-500 text-white ring-2 ring-orange-500/30 shadow-md'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div>
                  <span className="font-extrabold text-white text-xs block">{p.label}</span>
                  <span className="text-orange-400 font-mono font-bold">{p.price}</span>
                </div>
                <p className="text-[10px] text-zinc-400">{p.desc}</p>
                <div className="pt-2 border-t border-zinc-800 text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-400">
                    <span>Choisir</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* SIMULATED PAYMENT MODAL */}
        {paymentModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="max-w-md w-full bg-zinc-900 rounded-3xl border border-zinc-800 p-6 space-y-5 text-zinc-100 shadow-2xl">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white">Renouvellement d&apos;Abonnement</h3>
                <p className="text-xs text-zinc-400">
                  Formule : <strong className="text-white font-bold">{selectedPlan}</strong> — Montant : <strong className="text-orange-400 font-mono font-bold text-sm">{price.toLocaleString()} FCFA/m</strong>
                </p>
              </div>

              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-[11px] text-zinc-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Simulation de transaction prête pour l&apos;intégration Siposive Genius Pay.</span>
              </div>

              {/* Payment Channel Selection */}
              <div className="space-y-2 text-xs">
                <label className="font-bold text-zinc-300">Mode de paiement (Wave, OM, MTN, Moov, Carte) :</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'wave', label: 'Wave 🌊' },
                    { id: 'orange_money', label: 'Orange Money 🟧' },
                    { id: 'mtn_momo', label: 'MTN MoMo 🟨' },
                    { id: 'card', label: 'Carte Bancaire 💳' },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setSelectedChannel(ch.id as PaymentChannel)}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                        selectedChannel === ch.id
                          ? 'bg-orange-600 text-white border-orange-500'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-bold text-zinc-300">Numéro Mobile Money pour la simulation</label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  disabled={processingPayment}
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-bold rounded-xl"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  disabled={processingPayment}
                  onClick={handleSimulatePayment}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/30 flex items-center gap-2"
                >
                  {processingPayment ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Simuler le Règlement ({price.toLocaleString()} FCFA)</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
