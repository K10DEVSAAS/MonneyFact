'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Eye, Download, FileEdit, Trash2, ArrowUpDown } from 'lucide-react';
import { mockInvoices } from '@/lib/data/mockData';
import { formatFCFA, formatDate } from '@/lib/utils/formatters';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { InvoiceStatus } from '@/lib/types/invoice';

export default function InvoicesPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredInvoices = mockInvoices.filter((inv) => {
    const matchesStatus =
      selectedStatus === 'all' || inv.status === selectedStatus;
    const matchesQuery =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const statusTabs = [
    { id: 'all', label: 'Toutes les factures', count: mockInvoices.length },
    { id: 'paid', label: 'Payées', count: mockInvoices.filter((i) => i.status === 'paid').length },
    { id: 'sent', label: 'Envoyées', count: mockInvoices.filter((i) => i.status === 'sent').length },
    { id: 'draft', label: 'Brouillons', count: mockInvoices.filter((i) => i.status === 'draft').length },
    { id: 'overdue', label: 'En retard', count: mockInvoices.filter((i) => i.status === 'overdue').length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Liste des Factures</h2>
          <p className="text-xs text-slate-500 mt-1">
            Gérez, filtrez et suivez l&apos;état d&apos;avancement de toutes vos factures.
          </p>
        </div>

        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold rounded-2xl shadow-sm hover:shadow-md hover:shadow-indigo-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une Facture</span>
        </Link>
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
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
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
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
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
                    Aucune facture trouvée pour ce filtre.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-mono-numbers font-bold text-slate-900">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="hover:text-indigo-600 transition-colors"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>

                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {inv.clientName}
                        </p>
                        {inv.clientEmail && (
                          <p className="text-[11px] text-slate-400">{inv.clientEmail}</p>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {formatDate(inv.issueDate)}
                    </td>

                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {formatDate(inv.dueDate)}
                    </td>

                    <td className="py-4 px-4 text-right font-mono-numbers font-extrabold text-slate-900">
                      {formatFCFA(inv.total)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <StatusBadge status={inv.status} />
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Voir le détail"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
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
    </div>
  );
}
