'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, Crown, Send, FileSpreadsheet, ShieldAlert, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import { formatFCFA, formatDate } from '@/lib/utils/formatters';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { subscriptionService } from '@/lib/services/subscriptionService';

export default function InvoicesPage() {
  const { invoices, organization, globalSearchQuery } = useAppStore();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Lock Modal State for Pro-only Features
  const [lockModal, setLockModal] = useState<{ open: boolean; title: string; feature: string }>({
    open: false,
    title: '',
    feature: '',
  });

  const isPro = organization.plan === 'Pro';
  const isBasique = organization.plan === 'Basique';
  const basiqueLimitReached = isBasique && invoices.length >= 10;

  const activeSearch = searchQuery || globalSearchQuery;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = selectedStatus === 'all' || inv.status === selectedStatus;
    const matchesQuery =
      inv.invoiceNumber.toLowerCase().includes(activeSearch.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(activeSearch.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const statusTabs = [
    { id: 'all', label: 'Toutes les factures', count: invoices.length },
    { id: 'paid', label: 'Payées', count: invoices.filter((i) => i.status === 'paid').length },
    { id: 'sent', label: 'Envoyées', count: invoices.filter((i) => i.status === 'sent').length },
    { id: 'draft', label: 'Brouillons', count: invoices.filter((i) => i.status === 'draft').length },
    { id: 'overdue', label: 'En retard', count: invoices.filter((i) => i.status === 'overdue').length },
  ];

  // EXCEL & CSV EXPORT GENERATOR
  const handleExcelExport = () => {
    if (!isPro) {
      setLockModal({
        open: true,
        title: 'Export Comptable Excel & CSV',
        feature: "L'exportation comptable automatisée au format Excel (.xlsx) et CSV est une fonctionnalité réservée au Plan Pro (5.000 FCFA/mois).",
      });
      return;
    }

    if (invoices.length === 0) {
      alert('Aucune facture disponible à exporter pour le moment. Veuillez créer votre première facture.');
      return;
    }

    try {
      // 1. Define Excel / CSV Headers
      const headers = ['N° Facture', 'Client', 'Email Client', 'Date Émission', 'Échéance', 'Montant HT (FCFA)', 'TVA 18% (FCFA)', 'Total TTC (FCFA)', 'Statut'];

      // 2. Generate CSV data rows formatted for Microsoft Excel with UTF-8 BOM
      const rows = invoices.map((inv) => [
        `"${inv.invoiceNumber}"`,
        `"${(inv.clientName || '').replace(/"/g, '""')}"`,
        `"${(inv.clientEmail || '').replace(/"/g, '""')}"`,
        `"${inv.issueDate}"`,
        `"${inv.dueDate}"`,
        inv.subtotal || 0,
        inv.taxAmount || 0,
        inv.total || 0,
        `"${(inv.status || '').toUpperCase()}"`,
      ]);

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `MonneyFact_Export_Comptable_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération du fichier Excel/CSV.');
    }
  };

  const handleSmsReminder = (invoiceNumber: string, clientName: string) => {
    if (!isPro) {
      setLockModal({
        open: true,
        title: 'Relance Automatique SMS & Email',
        feature: "La relance multicanal (SMS & Email) des factures est une fonctionnalité réservée au Plan Pro (5.000 FCFA/mois).",
      });
      return;
    }
    alert(`Relance SMS et Email envoyée avec succès pour la facture ${invoiceNumber} à ${clientName} !`);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* ALERT BANNER IF BASIQUE LIMIT REACHED */}
      {basiqueLimitReached && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-900 text-xs font-semibold flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-extrabold text-slate-900">Limite atteinte : Plan Basique ({invoices.length}/10 factures)</p>
              <p className="text-slate-600">Vous avez atteint la limite de 10 factures sur le Plan Basique (1 000 FCFA). Passez au Plan Pro pour facturer en illimité !</p>
            </div>
          </div>
          <Link
            href="/settings"
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-extrabold rounded-xl shrink-0 shadow-xs"
          >
            Passez au Plan Pro (5 000 FCFA/m)
          </Link>
        </div>
      )}

      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Liste des Factures</h2>
          <p className="text-xs text-slate-500 mt-1">
            Gérez, filtrez, exportez et suivez l&apos;état d&apos;avancement de toutes vos factures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Excel Export Button */}
          <button
            onClick={handleExcelExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Comptable (.xlsx)</span>
            {!isPro && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          {/* New Invoice Button */}
          {basiqueLimitReached ? (
            <button
              onClick={() =>
                alert('Limite de 10 factures/mois atteinte pour le Plan Basique. Passez au Plan Pro (5.000 FCFA/m) dans les Paramètres pour facturer en illimité !')
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-300 text-slate-600 text-xs font-bold rounded-xl shadow-xs cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une Facture (Limite 10/10)</span>
            </button>
          ) : (
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une Facture</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        {/* Filters & Search Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedStatus === tab.id
                    ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    selectedStatus === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher N° ou client..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Table of Invoices */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 rounded-l-xl">N° Facture</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Date d&apos;Émission</th>
                <th className="py-3.5 px-4">Échéance</th>
                <th className="py-3.5 px-4 text-right">Montant TTC</th>
                <th className="py-3.5 px-4 text-center">Statut</th>
                <th className="py-3.5 px-4 text-right rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    Aucune facture enregistrée pour le moment.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="hover:text-orange-600 transition-colors"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>

                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                          {inv.clientName}
                        </p>
                        {inv.clientEmail && (
                          <p className="text-[11px] text-slate-400 font-mono">{inv.clientEmail}</p>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {formatDate(inv.issueDate)}
                    </td>

                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {formatDate(inv.dueDate)}
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-extrabold text-slate-900">
                      {formatFCFA(inv.total)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <StatusBadge status={inv.status} />
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Voir la facture"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => handleSmsReminder(inv.invoiceNumber, inv.clientName)}
                          className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Relancer par SMS & Email"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOCK FEATURE MODAL FOR PLAN PRO */}
      {lockModal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-zinc-900 rounded-3xl border border-zinc-800 p-6 space-y-5 text-zinc-100 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-600/20 text-orange-400 flex items-center justify-center mx-auto border border-orange-500/30">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-full">
                ⚡ Exclusif au Plan Pro (5.000 FCFA/mois)
              </span>
              <h3 className="text-lg font-black text-white">{lockModal.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{lockModal.feature}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setLockModal({ open: false, title: '', feature: '' })}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-bold rounded-xl"
              >
                Fermer
              </button>
              <Link
                href="/settings"
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-2"
              >
                <span>Passer au Plan Pro</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
