'use client';

import React, { useState, useRef } from 'react';
import { Save, Building, Phone, MapPin, FileCheck, Upload, Image as ImageIcon, CheckCircle2, Trash2, Smartphone, CreditCard, ShieldCheck, Crown, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import { CINETPAY_DEFAULT_CONFIG } from '@/lib/services/cinetpayService';
import { formatFCFA } from '@/lib/utils/formatters';

export default function SettingsPage() {
  const { organization, updateOrganization } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPlan, setCurrentPlan] = useState<'Gratuit' | 'Pro' | 'Business'>(
    organization.plan || 'Pro'
  );

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

  // REAL LOGO FILE UPLOAD HANDLER
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

  const handlePlanSwitch = (newPlan: 'Gratuit' | 'Pro' | 'Business') => {
    setCurrentPlan(newPlan);
    updateOrganization({ plan: newPlan });
    alert(`Votre abonnement a été mis à jour vers la formule "${newPlan}" !`);
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
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Paramètres & Formule d&apos;Abonnement</h2>
        <p className="text-xs text-slate-500 mt-1">
          Configurez votre formule d&apos;abonnement SaaS, vos informations officielles et votre numéro Mobile Money.
        </p>
      </div>

      {/* SUBSCRIPTION PLAN SELECTION SECTION */}
      <div className="p-6 lg:p-8 bg-zinc-950 text-white rounded-3xl border border-zinc-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Formule Active :</span>
              <h3 className="text-lg font-black text-white">{currentPlan}</h3>
            </div>
          </div>
          <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold rounded-full">
            {currentPlan === 'Business' ? '15 000 FCFA/mois' : currentPlan === 'Pro' ? '5 000 FCFA/mois' : '0 FCFA/mois'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Plan Gratuit */}
          <div
            onClick={() => handlePlanSwitch('Gratuit')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 relative ${
              currentPlan === 'Gratuit'
                ? 'bg-orange-950/60 border-orange-500 ring-2 ring-orange-500/30'
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-extrabold text-white text-sm">Plan Gratuit</p>
                <p className="text-orange-400 font-mono font-bold">0 FCFA / mois</p>
              </div>
              {currentPlan === 'Gratuit' && <Check className="w-5 h-5 text-emerald-400" />}
            </div>
            <ul className="text-[11px] text-zinc-400 space-y-1.5 pt-2 border-t border-zinc-800">
              <li>• Max 5 factures par mois</li>
              <li>• Max 5 clients dans le répertoire</li>
              <li>• Calcul automatique TVA 18%</li>
              <li>• Export PDF standard</li>
            </ul>
          </div>

          {/* Plan Pro */}
          <div
            onClick={() => handlePlanSwitch('Pro')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 relative ${
              currentPlan === 'Pro'
                ? 'bg-orange-950/60 border-orange-500 ring-2 ring-orange-500/30'
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-extrabold text-white text-sm">Plan Pro ⚡</p>
                <p className="text-orange-400 font-mono font-bold">5 000 FCFA / mois</p>
              </div>
              {currentPlan === 'Pro' && <Check className="w-5 h-5 text-emerald-400" />}
            </div>
            <ul className="text-[11px] text-zinc-400 space-y-1.5 pt-2 border-t border-zinc-800">
              <li>• Factures & Devis <strong>Illimités</strong></li>
              <li>• Clients <strong>Illimités</strong></li>
              <li>• Compte Contribuable (NCC)</li>
              <li>• Suivi encaissements Wave / MoMo</li>
              <li>• Support prioritaire 7j/7</li>
            </ul>
          </div>

          {/* Plan Business */}
          <div
            onClick={() => handlePlanSwitch('Business')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 relative ${
              currentPlan === 'Business'
                ? 'bg-orange-950/60 border-orange-500 ring-2 ring-orange-500/30'
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-extrabold text-white text-sm">Plan Business 🚀</p>
                <p className="text-orange-400 font-mono font-bold">15 000 FCFA / mois</p>
              </div>
              {currentPlan === 'Business' && <Check className="w-5 h-5 text-emerald-400" />}
            </div>
            <ul className="text-[11px] text-zinc-400 space-y-1.5 pt-2 border-t border-zinc-800">
              <li>• Tout le contenu du Plan Pro</li>
              <li>• Multi-utilisateurs (Comptables)</li>
              <li>• Multi-entreprises (Filiales)</li>
              <li>• Relances SMS & Email automatiques</li>
              <li>• Export comptable Excel / CSV</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-8">
        {saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Paramètres et clés d&apos;encaissement enregistrés avec succès !</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload Section */}
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

          {/* General Company Information */}
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

          {/* CINETPAY & MOBILE MONEY PAYOUT CONFIGURATION SECTION */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <CreditCard className="w-5 h-5 text-orange-600" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider">
                Configuration Agrégateur de Paiement (CinetPay & Mobile Money)
              </h3>
            </div>

            <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-2xl space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-bold text-orange-900">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
                <span>Mode Sandbox Active & Encaissement Direct Mobile Money 🇨🇮</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Les règlements effectués par vos clients sur leurs factures (Wave, Orange Money, MTN MoMo, Moov ou Carte) seront crédités directement sur votre numéro Mobile Money ci-dessous.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Numéro Mobile Money de Réception (Wave / OM / MTN) *
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={org.mobileMoneyPhone}
                    onChange={(e) => setOrg({ ...org, mobileMoneyPhone: e.target.value })}
                    placeholder="+225 07 08 09 10 11"
                    className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  CinetPay Site ID
                </label>
                <input
                  type="text"
                  value={org.cinetpaySiteId}
                  onChange={(e) => setOrg({ ...org, cinetpaySiteId: e.target.value })}
                  placeholder="ex: 587421"
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 font-mono"
                />
              </div>
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
