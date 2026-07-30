'use client';

import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { formatFCFA } from '@/lib/utils/formatters';
import { useAppStore } from '@/lib/store/appStore';

export const RevenueChart: React.FC = () => {
  const { invoices } = useAppStore();
  const [period, setPeriod] = useState<'6m' | '1y'>('6m');

  const hasInvoices = invoices.length > 0;

  const monthlyData = hasInvoices
    ? [
        { month: 'Fév', invoiced: 4200000, paid: 3800000 },
        { month: 'Mar', invoiced: 5800000, paid: 4500000 },
        { month: 'Avr', invoiced: 3900000, paid: 3900000 },
        { month: 'Mai', invoiced: 7100000, paid: 6200000 },
        { month: 'Juin', invoiced: 8500000, paid: 5800000 },
        { month: 'Juil', invoiced: 13100000, paid: 7950000 },
      ]
    : [
        { month: 'Fév', invoiced: 0, paid: 0 },
        { month: 'Mar', invoiced: 0, paid: 0 },
        { month: 'Avr', invoiced: 0, paid: 0 },
        { month: 'Mai', invoiced: 0, paid: 0 },
        { month: 'Juin', invoiced: 0, paid: 0 },
        { month: 'Juil', invoiced: 0, paid: 0 },
      ];

  const maxVal = hasInvoices ? 15000000 : 10000;

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Évolution du Chiffre d&apos;Affaires</h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 rounded-full">
              <TrendingUp className="w-3 h-3" /> {hasInvoices ? '+18.4%' : '0%'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Comparatif entre montants facturés et montants encaissés (FCFA)</p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setPeriod('6m')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              period === '6m' ? 'bg-orange-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            6 Derniers Mois
          </button>
          <button
            onClick={() => setPeriod('1y')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              period === '1y' ? 'bg-orange-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Année 2026
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 pb-4 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-zinc-900" />
          <span className="font-bold text-slate-700">Facturé :</span>
          <span className="font-mono-numbers font-bold text-slate-900">
            {formatFCFA(monthlyData.reduce((acc, m) => acc + m.invoiced, 0))}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-orange-500" />
          <span className="font-bold text-slate-700">Encaissé :</span>
          <span className="font-mono-numbers font-bold text-orange-600">
            {formatFCFA(monthlyData.reduce((acc, m) => acc + m.paid, 0))}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-44 flex items-end justify-between gap-3 sm:gap-6 pt-2">
        {monthlyData.map((item, idx) => {
          const invoicedHeight = Math.max(8, Math.round((item.invoiced / maxVal) * 100));
          const paidHeight = Math.max(8, Math.round((item.paid / maxVal) * 100));

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
              <div className="relative w-full flex justify-center gap-1.5 items-end h-full">
                <div
                  style={{ height: `${invoicedHeight}%` }}
                  className="w-3 sm:w-5 bg-zinc-900 group-hover:bg-zinc-800 rounded-t-md transition-all duration-300 relative"
                  title={`Facturé : ${formatFCFA(item.invoiced)}`}
                />
                <div
                  style={{ height: `${paidHeight}%` }}
                  className="w-3 sm:w-5 bg-orange-500 group-hover:bg-orange-600 rounded-t-md transition-all duration-300 relative"
                  title={`Encaissé : ${formatFCFA(item.paid)}`}
                />
              </div>

              <span className="text-xs font-bold text-slate-600 group-hover:text-orange-600 transition-colors">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
