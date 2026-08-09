'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  FileEdit,
  ArrowRight,
  MoreVertical,
  Download,
  Filter,
  Search,
} from 'lucide-react';
import { Invoice, InvoiceStatus } from '@/lib/types/invoice';
import { formatFCFA, formatDate } from '@/lib/utils/formatters';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface RecentInvoicesProps {
  invoices: Invoice[];
}

export const RecentInvoices: React.FC<RecentInvoicesProps> = ({ invoices }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter invoices based on status tab and search query
  const filteredInvoices = invoices.filter((inv) => {
    const matchesFilter =
      selectedFilter === 'all' || inv.status === selectedFilter;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterTabs: { id: string; label: string }[] = [
    { id: 'all', label: `Toutes (${invoices.length})` },
    { id: 'paid', label: `Payées (${invoices.filter((i) => i.status === 'paid').length})` },
    { id: 'sent', label: `Envoyées (${invoices.filter((i) => i.status === 'sent').length})` },
    { id: 'draft', label: `Brouillons (${invoices.filter((i) => i.status === 'draft').length})` },
    { id: 'overdue', label: `En retard (${invoices.filter((i) => i.status === 'overdue').length})` },
  ];

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      {/* Table Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">Dernières Factures</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Aperçu en temps réel des transactions récentes
          </p>
        </div>

        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 group self-start sm:self-auto"
        >
          <span>Voir toutes les factures</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Filter Tabs & Quick Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                selectedFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Local Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer client ou N°..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/60 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 rounded-l-xl">N° Facture</th>
              <th className="py-3 px-4">Client</th>
              <th className="py-3 px-4">Date d&apos;Émission</th>
              <th className="py-3 px-4">Échéance</th>
              <th className="py-3 px-4 text-right">Montant TTC</th>
              <th className="py-3 px-4 text-center">Statut</th>
              <th className="py-3 px-4 text-right rounded-r-xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                  Aucune facture ne correspond à votre filtre.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="group hover:bg-slate-50/80 transition-colors"
                >
                  {/* Invoice Number */}
                  <td className="py-3.5 px-4 font-mono-numbers font-bold text-slate-900">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="hover:text-indigo-600 transition-colors"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>

                  {/* Client Info */}
                  <td className="py-3.5 px-4">
                    <div>
                      <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {inv.clientName}
                      </p>
                      {inv.clientEmail && (
                        <p className="text-[11px] text-slate-400">{inv.clientEmail}</p>
                      )}
                    </div>
                  </td>

                  {/* Issue Date */}
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {formatDate(inv.issueDate)}
                  </td>

                  {/* Due Date */}
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {formatDate(inv.dueDate)}
                  </td>

                  {/* Amount in FCFA */}
                  <td className="py-3.5 px-4 text-right font-mono-numbers font-extrabold text-slate-900">
                    {formatFCFA(inv.total)}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={inv.status} />
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
                        title="Voir la facture"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Télécharger PDF"
                      >
                        <Download className="w-4 h-4" />
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
  );
};
