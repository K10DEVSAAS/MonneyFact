'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, TrendingUp, Sparkles, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { formatFCFA, formatDate } from '@/lib/utils/formatters';

export interface PaymentTransaction {
  id: string;
  companyName: string;
  companyEmail: string;
  plan: 'Basique' | 'Pro';
  amount: number;
  channel: string;
  status: 'completed' | 'refunded';
  date: string;
}

export default function SubscriptionsAdminPage() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetTxId, setTargetTxId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('monneyfact_admin_payment_history');
      if (saved) {
        setTransactions(JSON.parse(saved));
      } else {
        const initialTxList: PaymentTransaction[] = [
          {
            id: 'TX-2026-901',
            companyName: 'Chrome Digital SARL',
            companyEmail: 'contact@chrome.ci',
            plan: 'Pro',
            amount: 5000,
            channel: 'Wave 🌊',
            status: 'completed',
            date: new Date().toISOString(),
          },
          {
            id: 'TX-2026-902',
            companyName: 'San-Pedro Transport',
            companyEmail: 'direction@sanpedro-transit.ci',
            plan: 'Basique',
            amount: 1000,
            channel: 'Orange Money 🟧',
            status: 'completed',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'TX-2026-903',
            companyName: 'Lagunes Agro-alimentaire',
            companyEmail: 'contact@lagunes-agro.ci',
            plan: 'Pro',
            amount: 5000,
            channel: 'MTN MoMo 🟨',
            status: 'completed',
            date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          },
        ];
        setTransactions(initialTxList);
        localStorage.setItem('monneyfact_admin_payment_history', JSON.stringify(initialTxList));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Calculate MRR and total financial revenue (COMPTABILITÉ INTANGIBLE - POINT 1.4)
  const totalRevenue = transactions.reduce((acc, tx) => acc + tx.amount, 0);
  const proCount = transactions.filter((tx) => tx.plan === 'Pro').length;
  const basiqueCount = transactions.filter((tx) => tx.plan === 'Basique').length;

  const handleConfirmDeleteTransaction = () => {
    if (!targetTxId) return;
    const updated = transactions.filter((tx) => tx.id !== targetTxId);
    setTransactions(updated);
    try {
      localStorage.setItem('monneyfact_admin_payment_history', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setDeleteModalOpen(false);
    setTargetTxId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au Cockpit Admin</span>
        </Link>
      </div>

      {/* ACCOUNTING PRESERVATION BANNER (POINT 1.4) */}
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <p className="font-extrabold text-white">Archives Comptables Inviolables</p>
          <p className="text-emerald-200/80">
            Conformément aux normes financières, la suppression d&apos;une entreprise cliente conserve intégralement ses transactions d&apos;abonnement dans le chiffre d&apos;affaires global.
          </p>
        </div>
      </div>

      {/* REVENUE KPI CARDS (2 PLANS) */}
      <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-white">Analyse Financière & Historique des Paiements</h2>
          <p className="text-xs text-slate-400 mt-1">
            Chiffre d&apos;affaires d&apos;abonnements et traçabilité des règlements Mobile Money / Carte.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-400">Total Chiffre d&apos;Affaires d&apos;Abonnements</span>
            <h3 className="text-2xl font-extrabold text-white font-mono">{formatFCFA(totalRevenue)}</h3>
            <p className="text-xs text-slate-500">Comptabilité financière permanente</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-orange-950/60 to-slate-900 rounded-2xl border border-orange-500/40 space-y-3">
            <span className="text-xs font-bold text-orange-300">Plan Basique (1 000 FCFA/m)</span>
            <h3 className="text-2xl font-extrabold text-white font-mono">{formatFCFA(basiqueCount * 1000)} /m</h3>
            <p className="text-xs text-orange-400 font-semibold">{basiqueCount} Entreprise(s) abonnée(s)</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-amber-950/60 to-slate-900 rounded-2xl border border-amber-500/40 space-y-3">
            <span className="text-xs font-bold text-amber-300">Plan Pro ⚡ (5 000 FCFA/m)</span>
            <h3 className="text-2xl font-extrabold text-white font-mono">{formatFCFA(proCount * 5000)} /m</h3>
            <p className="text-xs text-amber-400 font-semibold">{proCount} Entreprise(s) abonnée(s)</p>
          </div>
        </div>
      </div>

      {/* PERMANENT PAYMENTS LOG WITH INDIVIDUAL TRASH ICON (POINT 1.2) */}
      <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Registre Permanent des Transactions ({transactions.length})</h3>
              <p className="text-xs text-slate-400">
                Vous pouvez supprimer manuellement une ligne d&apos;historique via l&apos;icône de corbeille (confirmation requise).
              </p>
            </div>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Aucune transaction enregistrée dans l&apos;historique des paiements.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 rounded-l-xl">ID Transaction</th>
                  <th className="py-3 px-4">Entreprise Cliente</th>
                  <th className="py-3 px-4">Formule</th>
                  <th className="py-3 px-4">Canal</th>
                  <th className="py-3 px-4 text-right">Montant</th>
                  <th className="py-3 px-4 text-right">Horodatage</th>
                  <th className="py-3 px-4 text-center rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{tx.id}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white">{tx.companyName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{tx.companyEmail}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {tx.plan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">{tx.channel}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-orange-400">
                      {formatFCFA(tx.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          setTargetTxId(tx.id);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Supprimer cette transaction de l'historique"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRM INDIVIDUAL TRANSACTION DELETION MODAL (POINT 1.2) */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-5 text-slate-100 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-white">Supprimer cette transaction ?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer la transaction <strong className="text-white font-mono">{targetTxId}</strong> de l&apos;historique financier ?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setTargetTxId(null);
                }}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold rounded-xl"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTransaction}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-rose-600/30 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmer la Suppression</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
