'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  Receipt,
  Mail,
  MessageCircle,
  CreditCard,
  RefreshCw,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import { formatFCFA, formatDate } from '@/lib/utils/formatters';
import { useRouter } from 'next/navigation';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { invoices, updateInvoiceStatus, organization } = useAppStore();
  const [paying, setPaying] = useState(false);

  const invoice = invoices.find((inv) => inv.id === id);

  if (!invoice) {
    return (
      <div className="p-12 text-center space-y-4">
        <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Facture introuvable</h2>
        <p className="text-xs text-slate-500">La facture demandée n&apos;existe pas ou a été supprimée.</p>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl"
        >
          Retour aux factures
        </Link>
      </div>
    );
  }

  const paymentUrl = typeof window !== 'undefined' ? `${window.location.origin}/pay/${invoice.id}` : `/pay/${invoice.id}`;

  // DIRECT PAYOUT / PUBLIC CHECKOUT REDIRECT
  const handleOpenPaymentPage = () => {
    router.push(`/pay/${invoice.id}`);
  };

  // DIRECT PDF DOWNLOAD / PRINT
  const handleDownloadPDF = () => {
    const originalTitle = document.title;
    document.title = `Facture_${invoice.invoiceNumber}_${invoice.clientName.replace(/\s+/g, '_')}`;
    window.print();
    document.title = originalTitle;
  };

  // WHATSAPP SHARE GENERATOR WITH PUBLIC SYNEPAY LINK
  const handleWhatsAppShare = () => {
    const text = `Bonjour ${invoice.clientName},\n\nVoici votre facture officielle *${invoice.invoiceNumber}* émise par *${organization.name}* :\n\n- Montant Total TTC : *${formatFCFA(invoice.total)}*\n- Date d'Échéance : ${formatDate(invoice.dueDate)}\n\nVous pouvez la consulter et la régler en ligne par Wave / Mobile Money ici :\n${paymentUrl}\n\nCordialement.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  // EMAIL SHARE GENERATOR WITH PUBLIC SYNEPAY LINK
  const handleEmailShare = () => {
    const subject = `Facture ${invoice.invoiceNumber} - ${organization.name}`;
    const body = `Bonjour ${invoice.clientName},\n\nVeuillez trouver ci-joint les détails de votre facture ${invoice.invoiceNumber} d'un montant de ${formatFCFA(invoice.total)}.\n\nLien de règlement en ligne Wave / Mobile Money :\n${paymentUrl}\n\nMerci de votre confiance.\n\n${organization.name}`;
    const mailtoUrl = `mailto:${invoice.clientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in text-slate-900">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux factures</span>
        </Link>

        {/* Share & Download Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger (PDF)</span>
          </button>

          {/* WhatsApp Share Button */}
          <button
            onClick={handleWhatsAppShare}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          {/* Email Share Button */}
          <button
            onClick={handleEmailShare}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all"
          >
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </button>

          {/* Mark Paid Toggle */}
          {invoice.status !== 'paid' && (
            <button
              onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Marquer Payée</span>
            </button>
          )}
        </div>
      </div>

      {/* PROMINENT SYNEPAY PUBLIC PAYMENT LINK BANNER */}
      {invoice.status !== 'paid' && (
        <div className="p-6 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-extrabold backdrop-blur-xs">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Lien Public de Paiement Sécurisé (SynePay Ready)</span>
            </div>
            <h3 className="text-lg font-black tracking-tight text-white">
              Guichet de Règlement Client : Wave, Orange, MTN, Moov & Carte
            </h3>
            <p className="text-xs text-orange-100 max-w-lg font-medium">
              Ce lien sécurisé est généré automatiquement et transmis à votre client sur WhatsApp sans aucune connexion requise.
            </p>
          </div>

          <button
            onClick={handleOpenPaymentPage}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-950 hover:bg-zinc-900 active:scale-95 text-white text-xs font-extrabold rounded-2xl shadow-2xl transition-all shrink-0 border border-orange-400/30"
          >
            <CreditCard className="w-4 h-4 text-orange-400" />
            <span>Ouvrir la Page de Paiement ({formatFCFA(invoice.total)})</span>
            <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
          </button>
        </div>
      )}

      {/* Official Clean Commercial Invoice Document */}
      <div id="printable-invoice" className="p-8 lg:p-12 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-10 print:border-none print:shadow-none print:p-0">
        {/* Header Branding */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-slate-200">
          <div className="space-y-3">
            {organization.logoUrl ? (
              /* eslint-disable-next-html-element-suppression */
              <div className="h-16 w-auto max-w-[200px]">
                <img src={organization.logoUrl} alt="Logo Entreprise" className="h-full w-auto object-contain" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white font-bold flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-xl text-slate-900">{organization.name}</span>
              </div>
            )}
            <div className="text-xs text-slate-600 space-y-0.5 font-medium">
              <p className="font-bold text-slate-900">{organization.name}</p>
              <p>{organization.address || 'Abidjan, Côte d\'Ivoire'}</p>
              <p>{organization.phone || '+225 07 00 00 00 00'}</p>
              {organization.taxId && <p className="font-mono text-orange-600 font-bold">{organization.taxId}</p>}
            </div>
          </div>

          <div className="text-left sm:text-right space-y-2">
            <span className="inline-block text-xs font-black uppercase tracking-wider text-orange-600 px-3 py-1 bg-orange-50 border border-orange-200 rounded-full">
              FACTURE OFFICIELLE
            </span>
            <h2 className="text-2xl font-black font-mono text-slate-900 tracking-tight">{invoice.invoiceNumber}</h2>
            <div className="text-xs text-slate-500 font-medium space-y-0.5">
              <p>Émise le : <span className="font-bold text-slate-900">{formatDate(invoice.issueDate)}</span></p>
              <p>Échéance : <span className="font-bold text-orange-600">{formatDate(invoice.dueDate)}</span></p>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Facturé à :</span>
            <h3 className="text-sm font-extrabold text-slate-900">{invoice.clientName}</h3>
            <p className="text-xs text-slate-600 font-medium">{invoice.clientEmail}</p>
          </div>
          <div className="text-left sm:text-right space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Statut du Règlement :</span>
            <div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  invoice.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : invoice.status === 'overdue'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {invoice.status === 'paid' ? 'PAYÉE (ENCAISSÉE)' : invoice.status === 'overdue' ? 'EN RETARD' : 'EN ATTENTE DE PAIEMENT'}
              </span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 rounded-l-xl">Description du Service / Produit</th>
                <th className="py-3 px-4 text-center">Qté</th>
                <th className="py-3 px-4 text-right">Prix Unitaire HT</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Total HT FCFA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{item.description}</td>
                  <td className="py-3.5 px-4 text-center font-mono-numbers">{item.quantity}</td>
                  <td className="py-3.5 px-4 text-right font-mono-numbers">{formatFCFA(item.unitPrice)}</td>
                  <td className="py-3.5 px-4 text-right font-mono-numbers font-bold text-slate-900">
                    {formatFCFA(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Breakdown & Totals */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-6 border-t border-slate-200">
          <div className="space-y-3 max-w-md">
            <p className="text-xs font-bold text-slate-700">Instructions de Règlement :</p>
            <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              {invoice.notes}
            </p>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs font-mono-numbers">
            <div className="flex justify-between text-slate-600">
              <span>Sous-total HT :</span>
              <span>{formatFCFA(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-orange-600 font-bold">
              <span>TVA ({invoice.taxRate}%) :</span>
              <span>{formatFCFA(invoice.taxAmount)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-black text-slate-900">
              <span>TOTAL TTC FCFA :</span>
              <span className="text-orange-600">{formatFCFA(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Observations Field (If Present) */}
        {invoice.observations && (
          <div className="pt-6 border-t border-slate-200 space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Détails ou Observations :</p>
            <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-wrap">
              {invoice.observations}
            </p>
          </div>
        )}

        {/* Digital Signature Render (If Present) */}
        {invoice.signatureUrl && (
          <div className="pt-6 border-t border-slate-200 flex justify-end">
            <div className="text-center space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Signature Électronique Apposée :</p>
              {/* eslint-disable-next-html-element-suppression */}
              <div className="h-20 w-48 border border-slate-200 rounded-xl bg-slate-50 p-1 flex items-center justify-center">
                <img src={invoice.signatureUrl} alt="Signature Numérique" className="h-full w-full object-contain" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
