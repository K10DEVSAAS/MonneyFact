'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ArrowLeft, Save, Send, Calendar, User, FileText, Percent, Info } from 'lucide-react';
import { mockClients } from '@/lib/data/mockData';
import { calculateInvoiceTotals, calculateLineTotal } from '@/lib/calculations/invoice';
import { formatFCFA } from '@/lib/utils/formatters';

interface LineItemState {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export const InvoiceForm: React.FC = () => {
  const router = useRouter();

  // Form State
  const [clientId, setClientId] = useState<string>(mockClients[0]?.id || '');
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Default due date = 30 days from issue date
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 30);
  const [dueDate, setDueDate] = useState<string>(
    defaultDueDate.toISOString().split('T')[0]
  );

  const [notes, setNotes] = useState<string>(
    'Paiement par virement bancaire ou Mobile Money (Wave / Orange Money) sous 30 jours.'
  );

  // Dynamic invoice lines
  const [lines, setLines] = useState<LineItemState[]>([
    {
      id: 'line-1',
      description: 'Prestation de service / Développement Web',
      quantity: 1,
      unitPrice: 500000,
    },
    {
      id: 'line-2',
      description: 'Maintenance mensuelle et support technique',
      quantity: 1,
      unitPrice: 150000,
    },
  ]);

  // Single Source of Truth calculation from lib/calculations/invoice.ts
  const totals = calculateInvoiceTotals(lines, 18);

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length === 1) {
      alert('Une facture doit contenir au moins une ligne.');
      return;
    }
    setLines((prev) => prev.filter((line) => line.id !== id));
  };

  const handleLineChange = (
    id: string,
    field: keyof LineItemState,
    value: string | number
  ) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.id === id) {
          return { ...line, [field]: value };
        }
        return line;
      })
    );
  };

  const handleSubmit = (status: 'draft' | 'sent') => {
    if (!clientId) {
      alert('Veuillez sélectionner un client.');
      return;
    }

    if (lines.some((l) => !l.description.trim())) {
      alert('Veuillez remplir la description pour toutes les lignes.');
      return;
    }

    // In local state mode, notify and navigate back to /invoices
    const invoiceNumber = `FAC-2026-00${Math.floor(Math.random() * 90 + 10)}`;
    alert(
      `Facture ${invoiceNumber} créée avec succès en statut "${status === 'draft' ? 'Brouillon' : 'Envoyée'}" !\nMontant TTC : ${formatFCFA(totals.total)}`
    );
    router.push('/invoices');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux factures</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSubmit('draft')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Sauvegarder Brouillon</span>
          </button>
          <button
            onClick={() => handleSubmit('sent')}
            className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Envoyer la Facture</span>
          </button>
        </div>
      </div>

      {/* Main Invoice Form Card */}
      <div className="p-6 lg:p-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-8">
        <div className="border-b border-slate-100 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Créer une nouvelle facture</h2>
            <p className="text-xs text-slate-500 mt-1">Remplissez les détails ci-dessous. La TVA 18% est calculée automatiquement.</p>
          </div>
          <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-200/60 rounded-xl text-xs font-mono-numbers font-bold text-indigo-700">
            N° Auto-Généré : FAC-2026-0044
          </div>
        </div>

        {/* Client & Dates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Client Select */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Client Destinataire <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium"
              >
                {mockClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Issue Date */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Date d&apos;Émission <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium"
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Date d&apos;Échéance
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Invoice Lines Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Articles & Prestations</h3>
            <span className="text-xs text-slate-500">{lines.length} ligne(s)</span>
          </div>

          <div className="space-y-3">
            {lines.map((line, index) => {
              const lineTotal = calculateLineTotal(line.quantity, line.unitPrice);

              return (
                <div
                  key={line.id}
                  className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl grid grid-cols-12 gap-3 items-center"
                >
                  {/* Line index badge */}
                  <div className="col-span-12 sm:col-span-1 text-xs font-bold text-slate-400 flex items-center gap-1">
                    <span>#{index + 1}</span>
                  </div>

                  {/* Description */}
                  <div className="col-span-12 sm:col-span-5">
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) =>
                        handleLineChange(line.id, 'description', e.target.value)
                      }
                      placeholder="Description du produit ou service..."
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="col-span-6 sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={line.quantity}
                      onChange={(e) =>
                        handleLineChange(
                          line.id,
                          'quantity',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="Qté"
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono-numbers text-right text-slate-900"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="col-span-6 sm:col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={line.unitPrice}
                      onChange={(e) =>
                        handleLineChange(
                          line.id,
                          'unitPrice',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="Prix unitaire FCFA"
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono-numbers text-right text-slate-900"
                    />
                  </div>

                  {/* Line Total & Remove button */}
                  <div className="col-span-12 sm:col-span-2 flex items-center justify-end gap-3 pt-2 sm:pt-0">
                    <span className="font-mono-numbers font-bold text-xs sm:text-sm text-slate-900">
                      {formatFCFA(lineTotal)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(line.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Supprimer la ligne"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleAddLine}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-indigo-50 text-indigo-700 hover:border-indigo-200 border border-slate-200 text-xs font-bold rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une ligne de prestation</span>
          </button>
        </div>

        {/* Totals & VAT Breakdown Section */}
        <div className="pt-6 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Notes & Payment Terms */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Notes & Conditions de Paiement
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
            />
          </div>

          {/* Automatic Calculation Breakdown Card */}
          <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span>Sous-total HT</span>
              <span className="font-mono-numbers font-semibold text-slate-200">{formatFCFA(totals.subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1 text-amber-400">
                <Percent className="w-3.5 h-3.5" /> TVA (18%)
              </span>
              <span className="font-mono-numbers font-semibold text-amber-400">{formatFCFA(totals.taxAmount)}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-bold">Total TTC (FCFA)</span>
              <span className="text-xl font-extrabold font-mono-numbers text-indigo-400">
                {formatFCFA(totals.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
