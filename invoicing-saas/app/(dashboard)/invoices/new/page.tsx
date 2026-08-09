'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Building,
  User,
  Calendar,
  FileText,
  Percent,
  Receipt,
  CheckCircle2,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import { formatFCFA } from '@/lib/utils/formatters';
import { SignatureCanvas } from '@/components/invoices/SignatureCanvas';
import { Subsidiary } from '@/lib/types/invoice';

import { usePermissions } from '@/lib/hooks/usePermissions';
import { Lock } from 'lucide-react';

export default function NewInvoicePage() {
  const router = useRouter();
  const { clients, invoices, addInvoice, organization, activeSubsidiaryId, subsidiaries } = useAppStore();
  const { hasPermission } = usePermissions();

  const canCreateInvoices = hasPermission('create_invoices');
  const userEmail = organization.email ? organization.email.toLowerCase() : 'guest';

  const subsidiariesList = (subsidiaries || []).filter(
    (s) => !['sub-main', 'sub-2', 'sub-3'].includes(s.id)
  );

  const [selectedSubsidiaryId, setSelectedSubsidiaryId] = useState(
    activeSubsidiaryId !== 'global' ? activeSubsidiaryId : ''
  );

  const isProPlan = organization.plan === 'Pro';

  if (!canCreateInvoices) {
    return (
      <div className="p-12 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-4 max-w-lg mx-auto my-12 text-slate-900">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Accès Refusé : Création de Facture</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Votre rôle collaborateur ne dispose pas de la permission &quot;Créer des Factures & Devis&quot;. Contactez l&apos;administrateur de l&apos;entreprise pour obtenir cette autorisation.
        </p>
        <div className="pt-2">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-md"
          >
            <span>Retour à la liste des factures</span>
          </Link>
        </div>
      </div>
    );
  }

  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const dueDateStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [issueDate, setIssueDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(dueDateStr);
  const [taxRate, setTaxRate] = useState(18); // Default 18% TVA Côte d'Ivoire
  const [notes, setNotes] = useState('Paiement sous 30 jours par virement bancaire ou Mobile Money (Wave, Orange Money, MTN MoMo).');
  const [observations, setObservations] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');

  const [items, setItems] = useState([
    { id: '1', description: 'Prestation de services / Conseil', quantity: 1, unitPrice: 250000 },
  ]);

  // Handle Client Selection Dropdown
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) {
      setClientName('');
      setClientEmail('');
      return;
    }
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setClientName(found.name);
      setClientEmail(found.email);
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: 'description' | 'quantity' | 'unitPrice', value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          return updated;
        }
        return item;
      })
    );
  };

  // Compute Totals with TVA 18%
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const total = subtotal + taxAmount;

  // ASYNC SUBMIT: AWAIT SUPABASE INVOICE INSERT BEFORE NAVIGATING TO PREVENT REQUEST CANCELLATION
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('Veuillez sélectionner ou saisir le nom du client.');
      return;
    }
    if (items.some((i) => !i.description.trim() || i.unitPrice <= 0)) {
      alert('Veuillez remplir correctement toutes les lignes de prestation.');
      return;
    }

    setIsSubmitting(true);

    try {
      const currentYear = new Date().getFullYear();
      const seqNumber = (invoices.length + 1).toString().padStart(4, '0');
      const generatedNumber = `FAC-${currentYear}-${seqNumber}`;

      const subToUseId = isProPlan
        ? (selectedSubsidiaryId || (activeSubsidiaryId !== 'global' ? activeSubsidiaryId : undefined))
        : undefined;

      const chosenSub = subToUseId
        ? subsidiariesList.find((s) => s.id === subToUseId)
        : undefined;

      await addInvoice({
        invoiceNumber: generatedNumber,
        organizationId: organization.id,
        subsidiaryId: subToUseId,
        subsidiaryName: chosenSub?.name || undefined,
        clientId: selectedClientId || `cli-temp-${Date.now()}`,
        clientName,
        clientEmail: clientEmail || 'client@entreprise.ci',
        status: 'sent',
        issueDate,
        dueDate,
        subtotal,
        taxRate,
        taxAmount,
        total,
        notes,
        observations,
        signatureUrl,
        items: items.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          lineTotal: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
        })),
      });

      router.push('/invoices');
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue lors de l\'enregistrement de la facture.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in text-slate-900">
      <div className="flex items-center justify-between">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux factures</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="p-6 lg:p-8 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600 px-3 py-1 bg-orange-50 border border-orange-200 rounded-full">
                Nouvelle Facture Officielle
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-2">Création de Facture</h2>
              <p className="text-xs text-slate-500">Calcul automatique de la TVA 18% et devises en FCFA</p>
            </div>

            {/* Issuer Branch / Sub-company Selector - ONLY RENDERED FOR BUSINESS PLAN WITH > 0 REGISTERED SUB-COMPANIES */}
            {isProPlan && subsidiariesList.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Établissement Émetteur</label>
                <select
                  value={selectedSubsidiaryId}
                  onChange={(e) => setSelectedSubsidiaryId(e.target.value)}
                  className="text-xs font-extrabold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus:border-orange-500"
                >
                  <option value="">{organization.name} (Siège Social)</option>
                  {subsidiariesList.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.city})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Client Selection Dropdown & Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Sélectionner un Client Enregistré
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 font-semibold"
              >
                <option value="">-- Choisir un client dans la liste --</option>
                {clients.map((cli) => (
                  <option key={cli.id} value={cli.id}>
                    {cli.name} ({cli.city})
                  </option>
                ))}
              </select>

              <div className="pt-2 space-y-2">
                <input
                  type="text"
                  required
                  placeholder="Nom du Client / Raison Sociale *"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 text-slate-900 font-semibold"
                />
                <input
                  type="email"
                  placeholder="Email du Client"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 text-slate-900 font-medium"
                />
              </div>
            </div>

            {/* Dates & Tax */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Date d&apos;Émission</label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Date d&apos;Échéance</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Taux de TVA (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold font-mono"
                  />
                  <span className="text-xs text-slate-500 font-semibold">% (Standard 18% DGI CI)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Prestations & Articles</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une ligne</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      required
                      placeholder="Description de la prestation..."
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-orange-500 font-semibold text-slate-900"
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-center font-bold text-slate-900"
                    />
                  </div>
                  <div className="w-36">
                    <input
                      type="number"
                      placeholder="Prix Unitaire FCFA"
                      value={item.unitPrice || ''}
                      onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold font-mono text-slate-900"
                    />
                  </div>
                  <div className="w-32 text-right font-mono font-extrabold text-xs text-slate-900">
                    {formatFCFA((item.quantity || 1) * (item.unitPrice || 0))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Observations & Calculations Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
            {/* Left: Observations textarea */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Détails ou Observations Complémentaires
                </label>
                <textarea
                  rows={3}
                  placeholder="Remarques particulières, référence de contrat, conditions de livraison..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 text-slate-900 font-medium"
                />
              </div>

              {/* Digital Signature Component */}
              <SignatureCanvas
                onSaveSignature={(dataUrl) => setSignatureUrl(dataUrl)}
              />
            </div>

            {/* Right: Totals summary */}
            <div className="p-6 bg-slate-950 text-white rounded-2xl space-y-3 font-mono">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Sous-total HT :</span>
                <span>{formatFCFA(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-orange-400 font-bold">
                <span>TVA ({taxRate}%) :</span>
                <span>{formatFCFA(taxAmount)}</span>
              </div>
              <div className="pt-3 border-t border-zinc-800 flex justify-between text-lg font-black text-white">
                <span>Total TTC FCFA :</span>
                <span className="text-orange-500">{formatFCFA(total)}</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/invoices"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 active:scale-95 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/20 transition-all"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enregistrement en cours...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Générer et valider la facture</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
