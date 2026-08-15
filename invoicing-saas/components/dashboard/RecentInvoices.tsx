'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, Clock, AlertTriangle, ChevronRight, FileText } from 'lucide-react';
import { Invoice } from '@/lib/types/invoice';
import { formatFCFA, formatDate } from '@/lib/utils/formatters';

interface RecentInvoicesProps {
  invoices: Invoice[];
}

type FilterType = 'all' | 'paid' | 'pending' | 'overdue';

export const RecentInvoices: React.FC<RecentInvoicesProps> = ({ invoices }) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredInvoices = invoices.filter((inv) => {
    if (filter === 'paid') return inv.status === 'paid';
    if (filter === 'pending') return inv.status === 'sent' || inv.status === 'draft';
    if (filter === 'overdue') return inv.status === 'overdue';
    return true;
  });

  return (
    <div className="p-6 sm:p-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6 text-slate-900">
      {/* Header with Activity Feed Filter Pills (Inspired by Screen 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Activité Récente & Factures</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi en temps réel de vos opérations de facturation et encaissements.
          </p>
        </div>

        {/* Filter Pills: All, Success, Pending, Failed (Matching Screen 2) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Toutes ({invoices.length})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Payées
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            En attente
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'overdue' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            En retard
          </button>
        </div>
      </div>

      {/* Activity List (Inspired by Screen 1 & Screen 2) */}
      {filteredInvoices.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-600">Aucune activité enregistrée sous ce filtre.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.slice(0, 6).map((inv) => {
            const isPaid = inv.status === 'paid';
            const isOverdue = inv.status === 'overdue';

            return (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="group flex items-center justify-between p-4 bg-slate-50/60 hover:bg-orange-50/40 rounded-2xl border border-slate-200/60 hover:border-orange-200/80 transition-all duration-200"
              >
                {/* Left side: Status Icon & Details */}
                <div className="flex items-center gap-3.5">
                  {/* Direction Icon (↓ Payment Received, ↑ Invoice Sent, ! Overdue) */}
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs transition-transform group-hover:scale-105 ${
                      isPaid
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                        : isOverdue
                        ? 'bg-rose-50 text-rose-600 border-rose-200/60'
                        : 'bg-amber-50 text-amber-600 border-amber-200/60'
                    }`}
                  >
                    {isPaid ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : isOverdue ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-slate-900 font-mono">{inv.invoiceNumber}</p>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isOverdue
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isPaid ? 'Paiement Encaissé' : isOverdue ? 'En Retard' : 'En Attente'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-600 mt-0.5">{inv.clientName}</p>
                  </div>
                </div>

                {/* Right side: Amount, Date & Arrow */}
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p
                      className={`text-sm font-black font-mono tracking-tight ${
                        isPaid ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isPaid ? '+' : ''}
                      {formatFCFA(inv.total)}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {formatDate(inv.issueDate)}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
