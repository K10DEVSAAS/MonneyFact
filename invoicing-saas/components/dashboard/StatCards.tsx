import React from 'react';
import { FileText, BadgeCheck, Clock4, AlertOctagon, TrendingUp } from 'lucide-react';
import { DashboardStats } from '@/lib/types/invoice';
import { formatFCFA } from '@/lib/utils/formatters';

interface StatCardsProps {
  stats: DashboardStats;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Total Facturé',
      value: stats.totalInvoiced,
      subtitle: `${stats.invoiceCounts.total} facture(s) émise(s)`,
      icon: FileText,
      iconBg: 'bg-orange-500/10 text-orange-600 border border-orange-500/20',
      badge: stats.invoiceCounts.total > 0 ? '+14.2% ce mois' : '0 FCFA initialisé',
      badgeClass: 'bg-orange-50 text-orange-700 border-orange-200/60',
    },
    {
      title: 'Montant Encaissé',
      value: stats.totalPaid,
      subtitle: `${stats.invoiceCounts.paid} facture(s) payée(s)`,
      icon: BadgeCheck,
      iconBg: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
      badge: stats.totalInvoiced > 0 ? `${Math.round((stats.totalPaid / stats.totalInvoiced) * 100)}% encaissé` : '0 FCFA encaissé',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    },
    {
      title: 'En Attente de Paiement',
      value: stats.totalPending,
      subtitle: `${stats.invoiceCounts.sent} facture(s) envoyée(s)`,
      icon: Clock4,
      iconBg: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
      badge: 'Échéance 30j',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/60',
    },
    {
      title: 'Factures en Retard',
      value: stats.totalOverdue,
      subtitle: `${stats.invoiceCounts.overdue} facture(s) urgente(s)`,
      icon: AlertOctagon,
      iconBg: 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
      badge: stats.invoiceCounts.overdue > 0 ? 'Relance requise' : 'Aucun retard',
      badgeClass: stats.invoiceCounts.overdue > 0 ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold' : 'bg-slate-100 text-slate-600 border-slate-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;

        return (
          <div
            key={idx}
            className="group relative p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
          >
            {/* Top row: Icon & Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${card.badgeClass}`}>
                {card.badge}
              </span>
            </div>

            {/* Label */}
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              {card.title}
            </p>

            {/* Formatted FCFA Value */}
            <h2 className="text-2xl font-extrabold text-slate-900 font-mono-numbers tracking-tight mb-2 group-hover:text-orange-600 transition-colors">
              {formatFCFA(card.value)}
            </h2>

            {/* Subtitle */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              <span>{card.subtitle}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
