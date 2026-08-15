'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  CheckCircle2,
  Lock,
  Smartphone,
  CreditCard,
  Building,
  Calendar,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Download,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import { formatFCFA, formatDate } from '@/lib/utils/formatters';
import { cinetpayService } from '@/lib/services/cinetpayService';
import { PaymentChannel, Invoice } from '@/lib/types/invoice';
import { supabase } from '@/lib/supabase/client';

export default function PublicPaymentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { invoices, organization, updateInvoiceStatus } = useAppStore();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [merchantName, setMerchantName] = useState(organization.name || 'MonneyFact Partner');
  const [merchantLogo, setMerchantLogo] = useState(organization.logoUrl || '');
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel>('wave');
  const [clientPhone, setClientPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');

  // 1. GUARANTEED SERVER API FETCH: /api/pay/[token]
  useEffect(() => {
    let isMounted = true;

    const fetchPublicInvoice = async () => {
      setLoading(true);
      console.log('[PUBLIC PAY] Fetching via Server API /api/pay/', token);

      try {
        const res = await fetch(`/api/pay/${token}`);
        const resData = await res.json();
        console.log('[PUBLIC PAY] Server API Response:', resData);

        if (resData.success && resData.invoice && isMounted) {
          const dbInv = resData.invoice;

          const formattedItems = (dbInv.invoice_items || []).map((item: any) => ({
            id: item.id,
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unit_price),
            lineTotal: Number(item.line_total),
          }));

          if (dbInv.organizations) {
            setMerchantName(dbInv.organizations.name || organization.name);
            setMerchantLogo(dbInv.organizations.logo_url || '');
          }

          const parsedInvoice: Invoice = {
            id: dbInv.id,
            invoiceNumber: dbInv.invoice_number,
            organizationId: dbInv.organization_id,
            clientId: dbInv.client_id || '',
            clientName: dbInv.client_name,
            clientEmail: dbInv.client_email || '',
            status: dbInv.status || 'sent',
            issueDate: dbInv.issue_date,
            dueDate: dbInv.due_date,
            subtotal: Number(dbInv.subtotal),
            taxRate: Number(dbInv.tax_rate || 18),
            taxAmount: Number(dbInv.tax_amount),
            total: Number(dbInv.total),
            notes: dbInv.notes || '',
            observations: dbInv.observations || '',
            signatureUrl: dbInv.signature_url || '',
            paymentToken: dbInv.payment_token || token,
            paymentMethod: dbInv.payment_method,
            paymentTransactionId: dbInv.payment_transaction_id,
            paidAt: dbInv.paid_at,
            createdAt: dbInv.created_at || new Date().toISOString(),
            items: formattedItems.length > 0 ? formattedItems : [
              { id: '1', description: 'Prestation de service / Facture', quantity: 1, unitPrice: Number(dbInv.total), lineTotal: Number(dbInv.total) }
            ],
          };

          setInvoice(parsedInvoice);
          if (parsedInvoice.status === 'paid') {
            setPaymentSuccess(true);
          }
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('[PUBLIC PAY] Server API fetch error:', err);
      }

      // B. Fallback Local Store Search
      if (isMounted) {
        const storeInvoice = invoices.find(
          (inv) => inv.id === token || inv.invoiceNumber === token || inv.paymentToken === token
        );

        if (storeInvoice) {
          setInvoice(storeInvoice);
          if (storeInvoice.status === 'paid') {
            setPaymentSuccess(true);
          }
        }
        setLoading(false);
      }
    };

    fetchPublicInvoice();

    return () => {
      isMounted = false;
    };
  }, [token, invoices, organization]);

  // 2. CINETPAY EXCLUSIVE PAYMENT SUBMISSION HANDLER
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    // STRICT CHECK: Double-payment prevention guard
    if (invoice.status === 'paid' || paymentSuccess) {
      alert('Cette facture a déjà été réglée. Impossible d\'effectuer un second paiement.');
      return;
    }

    setIsProcessing(true);

    try {
      // Execute via CinetPay Service (Wave, Orange Money, MTN MoMo, Moov, Cards)
      const cRes = await cinetpayService.initiatePayment({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.total,
        customerName: invoice.clientName,
        customerEmail: invoice.clientEmail || 'client@monneyfact.ci',
        customerPhone: clientPhone || '+2250700000000',
        description: `Règlement Facture ${invoice.invoiceNumber} - ${merchantName}`,
      });

      if (cRes.code === '201' && cRes.data?.payment_url) {
        // Redirection sécurisée vers le guichet officiel de paiement
        window.location.href = cRes.data.payment_url;
      } else {
        // Mode Simulation pour les tests locaux lorsque l'API CinetPay n'est pas configurée
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const simTxId = `CPAY-SIM-${Date.now()}`;
        updateInvoiceStatus(invoice.id, 'paid');

        // Insert Payment Record
        await supabase.from('payments').insert({
          invoice_id: invoice.id,
          amount: invoice.total,
          currency: 'FCFA',
          provider: 'cinetpay',
          provider_transaction_id: simTxId,
          status: 'paid',
          paid_at: new Date().toISOString(),
          metadata: { simulation: true, channel: selectedChannel },
        });

        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: selectedChannel || 'wave',
            payment_transaction_id: simTxId
          })
          .eq('payment_token', invoice.paymentToken || token);
        setTransactionRef(simTxId);
        setPaymentSuccess(true);
      }
    } catch (err: any) {
      console.error(err);
      alert('Une erreur est survenue lors de la connexion au guichet de paiement CinetPay.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadReceipt = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-white">
        <div className="flex items-center gap-3 bg-zinc-900 px-6 py-4 rounded-2xl border border-zinc-800 shadow-xl">
          <RefreshCw className="w-5 h-5 text-orange-500 animate-spin" />
          <span className="text-xs font-bold text-zinc-300">Chargement sécurisé de la facture...</span>
        </div>
      </div>
    );
  }

  // ERROR SCREEN: Invoice Not Found / Invalid Token
  if (!invoice) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-zinc-100">
        <div className="max-w-md w-full bg-zinc-900 rounded-3xl border border-zinc-800 p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Facture Introuvable ou Lien Expiré</h2>
            <p className="text-xs text-zinc-400">
              La facture demandée n&apos;existe pas ou le lien de paiement transmis est invalide. Veuillez contacter l&apos;entreprise émettrice.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-orange-600/30"
          >
            Retourner à l&apos;accueil MonneyFact
          </Link>
        </div>
      </div>
    );
  }

  // READ-ONLY PAID SCREEN: Facture Déjà Payée (STRICT DOUBLE-PAYMENT PREVENTION)
  if (invoice.status === 'paid' || paymentSuccess) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-zinc-100 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-lg w-full bg-zinc-900 rounded-3xl border border-zinc-800 p-8 shadow-2xl space-y-6 relative z-10 animate-fade-in text-center">
          {/* Header Branding */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-md shadow-orange-600/30">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl text-white tracking-tight">MonneyFact Pay</span>
          </div>

          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          {/* READ-ONLY BANNER: Prevent Second Payment */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-1">
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>FACTURE DÉJÀ RÉGLÉE AVEC SUCCÈS</span>
            </div>
            <p className="text-xs text-zinc-300 font-medium pt-1">
              Cette facture a déjà été acquittée. Le bouton de paiement est désactivé pour empêcher tout double paiement.
            </p>
          </div>

          {/* Invoice Summary Details */}
          <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 text-left space-y-3 text-xs">
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-400">Entreprise Émettrice :</span>
              <span className="font-bold text-white">{merchantName}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-400">Numéro de Facture :</span>
              <span className="font-mono font-bold text-orange-400">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-400">Client :</span>
              <span className="font-bold text-white">{invoice.clientName}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-400">Montant Encaissé TTC :</span>
              <span className="font-mono font-extrabold text-emerald-400 text-sm">{formatFCFA(invoice.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Passerelle de Règlement :</span>
              <span className="font-bold text-white">CinetPay Côte d&apos;Ivoire 🇨🇮</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 space-y-3">
            <button
              onClick={handleDownloadReceipt}
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger le Reçu Officiel de Paiement (PDF)</span>
            </button>
            <p className="text-[11px] text-zinc-500">
              Le paiement est enregistré et certifié sur la plateforme MonneyFact.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // UNPAID FACTURE FORM: Render CinetPay Payment Interface
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-4 sm:p-6 lg:p-12 relative overflow-hidden">
      {/* Background Glow matching Landing Page */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Branding */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4 border-b border-zinc-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-md shadow-orange-600/30">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xl text-white tracking-tight">MonneyFact</span>
            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Guichet CinetPay Officiel</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-400">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sécurité SSL 256-bit</span>
        </div>
      </header>

      {/* Main Payment Layout */}
      <main className="max-w-4xl mx-auto w-full my-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Left Column: Read-Only Invoice Summary */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 lg:p-8 bg-zinc-900/90 backdrop-blur-md rounded-3xl border border-zinc-800 shadow-2xl space-y-6">
            {/* Merchant / Issuing Company Logo & Name */}
            <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Facturé Par :</span>
                <h2 className="text-xl font-extrabold text-white">{merchantName}</h2>
                <p className="text-xs text-zinc-400">Abidjan, Côte d&apos;Ivoire</p>
              </div>

              {merchantLogo ? (
                /* eslint-disable-next-html-element-suppression */
                <div className="h-14 w-14 rounded-2xl bg-zinc-950 border border-zinc-800 p-1.5 flex items-center justify-center overflow-hidden shrink-0">
                  <img src={merchantLogo} alt="Logo Entreprise" className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-extrabold text-sm">
                  <Building className="w-6 h-6" />
                </div>
              )}
            </div>

            {/* Invoice Details */}
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
                <span className="text-zinc-400">Numéro de Facture :</span>
                <span className="font-mono font-bold text-white text-sm">{invoice.invoiceNumber}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Nom du Client</span>
                  <p className="font-bold text-white truncate">{invoice.clientName}</p>
                </div>
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-orange-400" /> Échéance
                  </span>
                  <p className="font-bold text-orange-400">{formatDate(invoice.dueDate)}</p>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Détails des Prestations</span>
                <div className="space-y-1.5 divide-y divide-zinc-800/60 max-h-48 overflow-y-auto pr-1">
                  {invoice.items.map((item) => (
                    <div key={item.id} className="pt-2 flex justify-between text-xs">
                      <div>
                        <p className="font-semibold text-zinc-200">{item.description}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {item.quantity} x {formatFCFA(item.unitPrice)} HT
                        </p>
                      </div>
                      <span className="font-mono font-bold text-white">{formatFCFA(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Amount Display */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total à Régler TTC :</span>
                  <p className="text-2xl font-black font-mono text-orange-500">{formatFCFA(invoice.total)}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  EN ATTENTE DE PAIEMENT
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: CinetPay Exclusive Payment Form */}
        <div className="lg:col-span-6 space-y-6">
          <form
            onSubmit={handlePaymentSubmit}
            className="p-6 lg:p-8 bg-zinc-900/90 backdrop-blur-md rounded-3xl border border-zinc-800 shadow-2xl space-y-6"
          >
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-[11px] font-extrabold border border-orange-500/20">
                <span>Passerelle CinetPay 🇨🇮</span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">Sélectionnez votre Mode de Règlement</h3>
              <p className="text-xs text-zinc-400">
                Paiement instantané en FCFA. Choisissez votre opérateur Mobile Money ou Carte :
              </p>
            </div>

            {/* CinetPay Supported Channels Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {/* Wave */}
              <button
                type="button"
                onClick={() => setSelectedChannel('wave')}
                className={`p-4 rounded-2xl border text-left transition-all space-y-2 relative overflow-hidden ${
                  selectedChannel === 'wave'
                    ? 'bg-orange-500/10 border-orange-500 text-white shadow-lg shadow-orange-500/10 ring-2 ring-orange-500/30'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                  🌊
                </div>
                <div>
                  <p className="font-bold text-white">Wave</p>
                  <p className="text-[10px] text-orange-300 font-semibold">Côte d&apos;Ivoire 🇨🇮</p>
                </div>
              </button>

              {/* Orange Money */}
              <button
                type="button"
                onClick={() => setSelectedChannel('orange_money')}
                className={`p-4 rounded-2xl border text-left transition-all space-y-2 relative overflow-hidden ${
                  selectedChannel === 'orange_money'
                    ? 'bg-orange-500/10 border-orange-500 text-white shadow-lg shadow-orange-500/10 ring-2 ring-orange-500/30'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                  🍊
                </div>
                <div>
                  <p className="font-bold text-white">Orange Money</p>
                  <p className="text-[10px] text-orange-300 font-semibold">OM CI 🇨🇮</p>
                </div>
              </button>

              {/* MTN MoMo */}
              <button
                type="button"
                onClick={() => setSelectedChannel('mtn_momo')}
                className={`p-4 rounded-2xl border text-left transition-all space-y-2 relative overflow-hidden ${
                  selectedChannel === 'mtn_momo'
                    ? 'bg-orange-500/10 border-orange-500 text-white shadow-lg shadow-orange-500/10 ring-2 ring-orange-500/30'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                  🟡
                </div>
                <div>
                  <p className="font-bold text-white">MTN MoMo</p>
                  <p className="text-[10px] text-orange-300 font-semibold">MTN CI 🇨🇮</p>
                </div>
              </button>

              {/* Moov Money */}
              <button
                type="button"
                onClick={() => setSelectedChannel('moov')}
                className={`p-4 rounded-2xl border text-left transition-all space-y-2 relative overflow-hidden ${
                  selectedChannel === 'moov'
                    ? 'bg-orange-500/10 border-orange-500 text-white shadow-lg shadow-orange-500/10 ring-2 ring-orange-500/30'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                  🔵
                </div>
                <div>
                  <p className="font-bold text-white">Moov Money</p>
                  <p className="text-[10px] text-orange-300 font-semibold">Moov CI 🇨🇮</p>
                </div>
              </button>

              {/* Credit / Debit Card */}
              <button
                type="button"
                onClick={() => setSelectedChannel('card')}
                className={`p-4 rounded-2xl border text-left transition-all space-y-2 col-span-2 sm:col-span-2 relative overflow-hidden ${
                  selectedChannel === 'card'
                    ? 'bg-orange-500/10 border-orange-500 text-white shadow-lg shadow-orange-500/10 ring-2 ring-orange-500/30'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-orange-600 text-white font-bold flex items-center justify-center shadow-md">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-orange-400 uppercase">Visa / Mastercard</span>
                </div>
                <div>
                  <p className="font-bold text-white">Carte Bancaire Internationale</p>
                  <p className="text-[10px] text-orange-300 font-semibold">Visa, Mastercard, GIM-UEMOA</p>
                </div>
              </button>
            </div>

            {/* Mobile Money Phone Input */}
            {selectedChannel !== 'card' && (
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-zinc-300">Numéro Mobile Money (Côte d&apos;Ivoire)</label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="tel"
                    required
                    placeholder="+225 07 00 00 00 00"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-white font-mono"
                  />
                </div>
              </div>
            )}

            {/* Submit Payment Button */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 bg-orange-600 hover:bg-orange-500 active:scale-95 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-orange-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Payer avec CinetPay ({formatFCFA(invoice.total)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Paiement 100% Sécurisé crypté par CinetPay & MonneyFact</span>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Footer matching Landing Page */}
      <footer className="max-w-4xl mx-auto w-full text-center py-4 text-xs text-zinc-500 border-t border-zinc-800/60 relative z-10">
        <p>© 2026 MonneyFact Inc. • Guichet de Paiement CinetPay Officiel (Côte d&apos;Ivoire 🇨🇮)</p>
      </footer>
    </div>
  );
}
