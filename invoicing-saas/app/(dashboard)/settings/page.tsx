'use client';

import React, { useState, useRef } from 'react';
import { Save, Building, Phone, MapPin, FileCheck, Upload, Image as ImageIcon, CheckCircle2, Trash2, Smartphone, CreditCard, ShieldCheck, Crown, Check, RefreshCw, Zap, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import { CINETPAY_DEFAULT_CONFIG } from '@/lib/services/cinetpayService';
import { paymentProvider, PaymentChannel } from '@/lib/services/paymentService';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { PlanType } from '@/lib/types/invoice';

export default function SettingsPage() {
  const { organization, updateOrganization } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPlan, setCurrentPlan] = useState<PlanType>(organization.plan || 'Pro');
  const [targetPlan, setTargetPlan] = useState<PlanType>('Pro');

  // Simulated Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel>('wave');
  const [phone, setPhone] = useState(organization.phone || '+225 07 00 00 00 00');
  const [processingPayment, setProcessingPayment] = useState(false);

  const targetPrice = targetPlan === 'Pro' ? 5000 : 1000;

  const [org, setOrg] = useState({
    name: organization.name,
    address: organization.address || '',
    phone: organization.phone || '',
    taxId: organization.taxId || '',
    currency: 'FCFA',
    defaultTaxRate: 18,
    mobileMoneyPhone: organization.phone || '+225 07 00 00 00 00',
    cinetpaySiteId: CINETPAY_DEFAULT_CONFIG.siteId,
    cinetpayApiKey: CINETPAY_DEFAULT_CONFIG.apiKey,
  });

  const [saved, setSaved] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('La taille de l\'image ne doit pas dépasser 3 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateOrganization({ logoUrl: base64String });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    updateOrganization({ logoUrl: '' });
  };

  const handleInitiatePlanChange = (newPlan: PlanType) => {
    if (newPlan === currentPlan) return;
    setTargetPlan(newPlan);
    setPaymentModalOpen(true);
  };

  const handleSimulatePayment = async () => {
    setProcessingPayment(true);
    try {
      const result = await paymentProvider.initiatePayment({
        amount: targetPrice,
        currency: 'FCFA',
        customerEmail: organization.email || 'contact@entreprise.ci',
        customerPhone: phone,
        planName: targetPlan,
        channel: selectedChannel,
      });

      if (result.success) {
        const newExpiresAt = subscriptionService.calculateExpirationDate('monthly');
        setCurrentPlan(targetPlan);
        updateOrganization({
          plan: targetPlan,
          status: 'active',
          expiresAt: newExpiresAt,
        });

        alert(`Paiement simulé réussi ! Votre abonnement a été basculé vers la formule ${targetPlan}.`);
        setPaymentModalOpen(false);
      } else {
        alert('Erreur lors de la simulation du règlement. Veuillez réessayer.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau lors de la simulation de paiement.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrganization({
      name: org.name,
      address: org.address,
      phone: org.phone,
      taxId: org.taxId,
      plan: currentPlan,
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in text-slate-900">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Paramètres & Formules d&apos;Abonnement SaaS</h2>
        <p className="text-xs text-slate-500 mt-1">
          Gérez votre formule d&apos;abonnement, comparez les fonctionnalités et modifiez vos informations officielles.
        </p>
      </div>

      {/* SUBSCRIPTION PLAN SELECTION SECTION */}
      <div className="p-6 lg:p-8 bg-zinc-950 text-white rounded-3xl border border-zinc-800 shadow-2xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/20">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400">Formule d&apos;Abonnement Active</span>
              <h3 className="text-xl font-black text-white">{currentPlan}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentPlan === 'Pro' && (
              <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-full flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Plan Pro (5.000 FCFA/m)</span>
              </span>
            )}
            {currentPlan === 'Basique' && (
              <span className="px-3.5 py-1.5 bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-bold rounded-full">
                Plan Basique (1.000 FCFA/m)
              </span>
            )}
          </div>
        </div>

        {/* 2-Plan Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Plan Basique */}
          <div
            onClick={() => handleInitiatePlanChange('Basique')}
            className={`p-6 rounded-3xl border cursor-pointer transition-all space-y-4 relative flex flex-col justify-between ${
              currentPlan === 'Basique'
                ? 'bg-zinc-900 border-orange-500 ring-2 ring-orange-500/30'
                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                Essentiel / Facturation Simplifiée
              </span>
              <h4 className="font-extrabold text-white text-base">Plan Basique</h4>
              <p className="text-2xl font-black font-mono text-orange-400">1 000 FCFA <span className="text-xs text-zinc-500 font-sans font-normal">/ mois</span></p>
              <p className="text-[11px] text-zinc-400">Pour gérer simplement vos premières factures.</p>
            </div>

            <ul className="text-[11px] text-zinc-300 space-y-2 pt-4 border-t border-zinc-800">
              <li className="flex items-center gap-2">✓ Max 10 factures par mois</li>
              <li className="flex items-center gap-2">✓ Max 10 clients dans le répertoire</li>
              <li className="flex items-center gap-2">✓ Calcul automatique TVA 18%</li>
              <li className="flex items-center gap-2">✓ Génération PDF simple</li>
              <li className="flex items-center gap-2">✓ Consultation de l&apos;historique</li>
            </ul>

            <button
              type="button"
              className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                currentPlan === 'Basique'
                  ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white'
              }`}
            >
              {currentPlan === 'Basique' ? '✓ Formule Actuelle' : 'Choisir Plan Basique'}
            </button>
          </div>

          {/* Plan Pro */}
          <div
            onClick={() => handleInitiatePlanChange('Pro')}
            className={`p-6 rounded-3xl border cursor-pointer transition-all space-y-4 relative flex flex-col justify-between ${
              currentPlan === 'Pro'
                ? 'bg-orange-950/60 border-orange-500 ring-2 ring-orange-500/30 shadow-xl'
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-max">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Recommandé - Fonctionnalités Avancées</span>
              </span>
              <h4 className="font-extrabold text-white text-base">Plan Pro ⚡</h4>
              <p className="text-2xl font-black font-mono text-orange-400">5 000 FCFA <span className="text-xs text-zinc-500 font-sans font-normal">/ mois</span></p>
              <p className="text-[11px] text-zinc-400">Tout l&apos;arsenal professionnel pour piloter votre entreprise.</p>
            </div>

            <ul className="text-[11px] text-zinc-300 space-y-2 pt-4 border-t border-zinc-800">
              <li className="flex items-center gap-2 font-semibold text-white">✓ Factures & Devis Illimités</li>
              <li className="flex items-center gap-2 font-semibold text-white">✓ Conversion Devis ➔ Facture</li>
              <li className="flex items-center gap-2 font-semibold text-white">✓ Clients Illimités & Historique Détaillé</li>
              <li className="flex items-center gap-2">✓ Suivi des règlements (Wave, OM, MTN, Espèces, Virement)</li>
              <li className="flex items-center gap-2">✓ Dashboard analytique avec courbes & comparaisons</li>
              <li className="flex items-center gap-2">✓ Modèles professionnels & PDF haute résolution</li>
              <li className="flex items-center gap-2">✓ Exportation comptable Excel (.xlsx / .csv)</li>
            </ul>

            <button
              type="button"
              className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                currentPlan === 'Pro'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-orange-600 hover:bg-orange-500 text-white'
              }`}
            >
              {currentPlan === 'Pro' ? '✓ Formule Actuelle' : 'Basculer vers le Plan Pro'}
            </button>
          </div>
        </div>
      </div>

      {/* SIMULATED PAYMENT MODAL FOR PLAN CHANGE */}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-white">
          <div className="max-w-md w-full bg-zinc-900 rounded-3xl border border-zinc-800 p-6 space-y-5 text-zinc-100 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Changement de Formule d&apos;Abonnement</h3>
              <p className="text-xs text-zinc-400">
                Basculer vers le <strong className="text-white font-bold">{targetPlan}</strong> — Montant : <strong className="text-orange-400 font-mono font-bold text-sm">{targetPrice.toLocaleString()} FCFA/m</strong>
              </p>
            </div>

            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-[11px] text-zinc-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Simulation de transaction prête pour l&apos;intégration Siposive Genius Pay.</span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-zinc-300">Mode de règlement :</label>
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
                    <span>Simuler le Règlement ({targetPrice.toLocaleString()} FCFA)</span>
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GENERAL COMPANY INFORMATION FORM */}
      <div className="p-6 lg:p-8 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-8">
        {saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Paramètres enregistrés avec succès !</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Logo Officiel de l&apos;Entreprise
            </label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative group">
                {organization.logoUrl ? (
                  /* eslint-disable-next-html-element-suppression */
                  <img
                    src={organization.logoUrl}
                    alt="Logo Entreprise"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-orange-600 font-bold text-xs">
                    <ImageIcon className="w-6 h-6 mb-1 text-orange-500" />
                    <span>AUCUN LOGO</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{organization.logoUrl ? 'Changer le logo' : 'Téléverser votre logo'}</span>
                  </button>

                  {organization.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Supprimer le logo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">Formats supportés : PNG, JPG, SVG (max 3 Mo). Sauvegardé automatiquement.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Nom de l&apos;Entreprise / Raison Sociale *
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={org.name}
                  onChange={(e) => setOrg({ ...org, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Numéro Compte Contribuable (NCC)
              </label>
              <div className="relative">
                <FileCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={org.taxId}
                  onChange={(e) => setOrg({ ...org, taxId: e.target.value })}
                  placeholder="ex: NCC 2108945 Z"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 font-mono-numbers"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Téléphone Professionnel
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={org.phone}
                  onChange={(e) => setOrg({ ...org, phone: e.target.value })}
                  placeholder="+225 07 00 00 00 00"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Taux de TVA par Défaut (%)
              </label>
              <input
                type="number"
                value={org.defaultTaxRate}
                onChange={(e) => setOrg({ ...org, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 font-mono-numbers font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Adresse du Siège Social (Côte d&apos;Ivoire)
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <textarea
                rows={2}
                value={org.address}
                onChange={(e) => setOrg({ ...org, address: e.target.value })}
                placeholder="ex: Boulevard Latrille, Cocody, Abidjan"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les modifications</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
