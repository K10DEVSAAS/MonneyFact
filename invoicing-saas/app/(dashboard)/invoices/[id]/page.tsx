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
  const { invoices, clients, updateInvoiceStatus, organization } = useAppStore();
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

  // WHATSAPP SHARE GENERATOR WITH REGISTERED CLIENT PHONE NUMBER IN INTERNATIONAL FORMAT (POINT 10)
  const handleWhatsAppShare = () => {
    // 1. Retrieve registered client phone number
    let rawPhone = '';
    const registeredClient = clients.find(
      (c) => c.id === invoice.clientId || c.name.toLowerCase() === invoice.clientName.toLowerCase()
    );

    if (registeredClient && registeredClient.phone) {
      rawPhone = registeredClient.phone;
    }

    // 2. Clean digits & format to international CI (+225)
    let digits = rawPhone.replace(/[^0-9]/g, '');
    if (digits.length === 10) {
      digits = `225${digits}`;
    }

    const text = `Bonjour ${invoice.clientName},\n\nVoici votre facture officielle *${invoice.invoiceNumber}* émise par *${organization.name}* :\n\n- Montant Total TTC : *${formatFCFA(invoice.total)}*\n- Date d'Échéance : ${formatDate(invoice.dueDate)}\n\nVous pouvez la consulter et la régler en ligne par Wave / Mobile Money ici :\n${paymentUrl}\n\nCordialement.`;

    const whatsappUrl = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(whatsappUrl, '_blank');
  };

  // EMAIL SHARE GENERATOR WITH PUBLIC PAYMENT LINK
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Envoyer sur WhatsApp</span>
          </button>

          {/* Email Share Button */}
          <button
            onClick={handleEmailShare}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all"
          >
            <Mail className="w-4 h-4" />
            <span>Envoyer par Email</span>
          </button>
        </div>
      </div>

      {/* Official Invoice Sheet */}
      <div className="p-8 lg:p-12 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-8 relative overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-2">
            {organization.logoUrl ? (
              /* eslint-disable-next-html-element-suppression */
              <img
                src={organization.logoUrl}
                alt={organization.name}
                className="h-14 object-contain max-w-[200px]"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold">
                  <Receipt className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-extrabold text-slate-900">{organization.name}</h1>
              </div>
            )}
            <p className="text-xs text-slate-500">{organization.address || 'Abidjan, Côte d\'Ivoire'}</p>
            {organization.taxId && (
              <p className="text-[11px] font-mono text-slate-400">Compte Contribuable : {organization.taxId}</p>
            )}
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 px-3 py-1 bg-orange-50 rounded-full border border-orange-200">
              FACTURE OFFICIELLE
            </span>
            <h2 className="text-2xl font-black text-slate-900 font-mono mt-2">{invoice.invoiceNumber}</h2>
            <p className="text-xs text-slate-500 font-medium">Émise le : {formatDate(invoice.issueDate)}</p>
            <p className="text-xs text-slate-500 font-medium">Échéance : {formatDate(invoice.dueDate)}</p>
          </div>
        </div>

        {/* Client & Issuer Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div className="space-y-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Émetteur</span>
            <p className="font-extrabold text-slate-900 text-sm">{invoice.subsidiaryName || organization.name}</p>
            {invoice.subsidiaryName && (
              <p className="text-[11px] text-orange-600 font-bold">Établissement / Filiale de : {organization.name}</p>
            )}
            <p className="text-slate-600">{organization.address || 'Abidjan, Côte d\'Ivoire'}</p>
            <p className="text-slate-600">{organization.phone || '+225 07 00 00 00 00'}</p>
          </div>

          <div className="space-y-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Facturé à (Client)</span>
            <p className="font-extrabold text-slate-900 text-sm">{invoice.clientName}</p>
            {invoice.clientEmail && <p className="text-slate-600">{invoice.clientEmail}</p>}
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 rounded-l-xl">Description de la prestation / produit</th>
                <th className="py-3 px-4 text-center">Qté</th>
                <th className="py-3 px-4 text-right">Prix Unitaire HT</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Total HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-4 px-4 font-semibold text-slate-900">{item.description}</td>
                  <td className="py-4 px-4 text-center font-mono font-bold text-slate-700">{item.quantity}</td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-slate-700">{formatFCFA(item.unitPrice)}</td>
                  <td className="py-4 px-4 text-right font-mono font-extrabold text-slate-900">{formatFCFA(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown & Signature / Observations */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-slate-200">
          <div className="space-y-4 text-xs text-slate-600 max-w-sm">
            {/* Complementary Elements & Observations */}
            <div className="space-y-1">
              <p className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Éléments Complémentaires & Observations :</p>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                {invoice.observations || invoice.notes || 'Règlement exigible selon les modalités agreed. Prestation réalisée conformément à la commande.'}
              </p>
            </div>

            {/* Signature Block */}
            <div className="pt-2">
              <p className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-1">Signature Numérique & Cachet :</p>
              {invoice.signatureUrl ? (
                /* eslint-disable-next-html-element-suppression */
                <img src={invoice.signatureUrl} alt="Signature" className="h-14 object-contain max-w-[180px] border border-slate-200 rounded-lg p-1" />
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-[11px] text-slate-500 font-mono italic">
                  Signature Électronique Certifiée • {invoice.subsidiaryName || organization.name}
                </div>
              )}
            </div>
          </div>

          <div className="w-full sm:w-72 p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Sous-total HT :</span>
              <span className="font-mono font-bold">{formatFCFA(invoice.subtotal)}</span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>TVA ({invoice.taxRate}%) :</span>
              <span className="font-mono font-bold">{formatFCFA(invoice.taxAmount)}</span>
            </div>

            <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-sm">
              <span className="text-white">Total TTC :</span>
              <span className="font-mono font-black text-orange-400">{formatFCFA(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Official MonneyFact Footer */}
        <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
          <p className="font-semibold">
            Facture officielle générée via <strong className="text-orange-600">MonneyFact</strong> — La solution SaaS n°1 de facturation en Côte d&apos;Ivoire (www.monneyfact.ci)
          </p>
        </div>

        {/* Public Checkout Link Box */}
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="space-y-1 text-xs">
            <p className="font-bold text-orange-950">Guichet de Règlement en Ligne</p>
            <p className="text-orange-800 font-mono text-[11px] truncate max-w-md">{paymentUrl}</p>
          </div>
          <button
            onClick={handleOpenPaymentPage}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-xs shrink-0 flex items-center gap-1.5"
          >
            <span>Ouvrir la page de paiement</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
