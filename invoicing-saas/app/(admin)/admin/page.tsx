'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  Search,
  Crown,
  CheckCircle2,
  BarChart3,
  RefreshCw,
  Ban,
  Play,
  Clock,
  History,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import { dbService } from '@/lib/services/dbService';
import { subscriptionService, PLAN_PRICES } from '@/lib/services/subscriptionService';
import { formatFCFA } from '@/lib/utils/formatters';
import { supabase } from '@/lib/supabase/client';

interface AuditEntry {
  id: string;
  adminEmail: string;
  action: 'suspend' | 'reactivate' | 'cancel' | 'renew' | 'delete';
  companyName: string;
  reason: string;
  timestamp: string;
}

export default function AdminCockpitPage() {
  const { registeredCompanies } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<'all' | 'Basique' | 'Pro'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'suspended' | 'expired'>('all');

  const [liveCompanies, setLiveCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulatedPayments, setSimulatedPayments] = useState<any[]>([]);

  // Action Modal State for Suspend / Reactivate / Cancel
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    company: any | null;
    action: 'suspend' | 'reactivate' | 'cancel';
  }>({ open: false, company: null, action: 'suspend' });

  const [auditReason, setAuditReason] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);

  // FETCH LIVE REAL-TIME ORGANIZATIONS, SIMULATED PAYMENTS & AUDIT LOGS
  useEffect(() => {
    let isMounted = true;

    const fetchCompanies = async () => {
      setLoading(true);

      try {
        const savedListStr = localStorage.getItem('monneyfact_companies_list');
        const localList: any[] = savedListStr ? JSON.parse(savedListStr) : registeredCompanies;

        const dbCompanies = await dbService.getAllRegisteredCompanies();

        const mergedMap = new Map();

        // 1. Add Local Store companies
        localList.forEach((c) => {
          const planName = c.plan === 'Pro' ? 'Pro' : 'Basique';
          const price = PLAN_PRICES[planName as keyof typeof PLAN_PRICES] || 5000;
          const daysLeft = subscriptionService.calculateDaysRemaining(c.expiresAt);

          mergedMap.set(c.ownerEmail || c.name, {
            id: c.id,
            name: c.name,
            ownerName: c.ownerName || c.name,
            ownerEmail: c.ownerEmail,
            city: c.city || 'Abidjan',
            plan: planName,
            status: c.status || 'active',
            registeredAt: c.registeredAt || new Date().toISOString().split('T')[0],
            expiresAt: c.expiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
            daysRemaining: daysLeft,
            totalInvoiced: c.totalInvoiced || 0,
            monthlySubscription: price,
          });
        });

        // 2. Add Supabase DB companies
        if (dbCompanies && dbCompanies.length > 0) {
          dbCompanies.forEach((c) => {
            const key = c.email || c.name;
            if (!mergedMap.has(key)) {
              mergedMap.set(key, {
                id: c.id,
                name: c.name,
                ownerName: c.name,
                ownerEmail: c.email || 'contact@entreprise.ci',
                city: 'Abidjan',
                plan: 'Pro',
                status: 'active',
                registeredAt: new Date(c.created_at || Date.now()).toISOString().split('T')[0],
                expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
                daysRemaining: 30,
                totalInvoiced: 0,
                monthlySubscription: 5000,
              });
            }
          });
        }

        const mergedArray = Array.from(mergedMap.values());

        const savedAuditLogs = localStorage.getItem('monneyfact_audit_logs');
        const savedPaymentsStr = localStorage.getItem('monneyfact_simulated_payments');

        if (isMounted) {
          setLiveCompanies(mergedArray);
          if (savedAuditLogs) setAuditLogs(JSON.parse(savedAuditLogs));
          if (savedPaymentsStr) setSimulatedPayments(JSON.parse(savedPaymentsStr));
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setLiveCompanies(registeredCompanies);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCompanies();

    return () => {
      isMounted = false;
    };
  }, [registeredCompanies]);

  const displayList = liveCompanies.length > 0 ? liveCompanies : registeredCompanies;

  // Multi-criteria filter
  const filteredCompanies = displayList.filter((comp) => {
    const matchesSearch =
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (comp.ownerEmail && comp.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      comp.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlan = selectedPlanFilter === 'all' || comp.plan === selectedPlanFilter;
    const matchesStatus = selectedStatusFilter === 'all' || comp.status === selectedStatusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  const totalInvoicedPlatform = displayList.reduce((sum, c) => sum + (c.totalInvoiced || 0), 0);
  const totalMRR = displayList.reduce((sum, c) => sum + (c.monthlySubscription !== undefined ? c.monthlySubscription : 5000), 0);
  const activeCount = displayList.filter((c) => c.status === 'active').length;
  const expiringSoonCount = displayList.filter((c) => c.daysRemaining > 0 && c.daysRemaining <= 5).length;

  const handleDeleteCompany = async (compId: string, compName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT le compte entreprise "${compName}" ? Cette action effacera complètement le compte du système.`)) {
      const updatedCompanies = displayList.filter((c) => c.id !== compId && c.name !== compName);
      setLiveCompanies(updatedCompanies);
      localStorage.setItem('monneyfact_companies_list', JSON.stringify(updatedCompanies));

      try {
        await supabase.from('organizations').delete().or(`id.eq.${compId},name.eq.${compName}`);
      } catch (err) {
        console.warn('Supabase delete error:', err);
      }

      // Audit Log Entry
      const newLog: AuditEntry = {
        id: `log-${Date.now()}`,
        adminEmail: 'admin@monneyfact.ci',
        action: 'delete',
        companyName: compName,
        reason: 'Suppression définitive par le Super Administrateur',
        timestamp: new Date().toLocaleString('fr-FR'),
      };

      const updatedLogs = [newLog, ...auditLogs];
      setAuditLogs(updatedLogs);
      localStorage.setItem('monneyfact_audit_logs', JSON.stringify(updatedLogs));

      alert(`Le compte entreprise "${compName}" a été supprimé avec succès.`);
    }
  };

  const handleConfirmAction = () => {
    if (!actionModal.company || !auditReason.trim()) {
      alert('Veuillez spécifier le motif de cette action administrateur.');
      return;
    }

    const updatedStatus =
      actionModal.action === 'suspend'
        ? 'suspended'
        : actionModal.action === 'reactivate'
        ? 'active'
        : 'expired';

    const updatedCompanies = liveCompanies.map((c) =>
      c.id === actionModal.company.id || c.name === actionModal.company.name
        ? { ...c, status: updatedStatus }
        : c
    );

    setLiveCompanies(updatedCompanies);
    localStorage.setItem('monneyfact_companies_list', JSON.stringify(updatedCompanies));

    // Audit Log Entry
    const newLog: AuditEntry = {
      id: `log-${Date.now()}`,
      adminEmail: 'admin@monneyfact.ci',
      action: actionModal.action,
      companyName: actionModal.company.name,
      reason: auditReason.trim(),
      timestamp: new Date().toLocaleString('fr-FR'),
    };

    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    localStorage.setItem('monneyfact_audit_logs', JSON.stringify(updatedLogs));

    setActionModal({ open: false, company: null, action: 'suspend' });
    setAuditReason('');
  };

  return (
    <div className="space-y-6 animate-fade-in text-zinc-100">
      {/* Welcome Banner */}
      <div className="p-6 lg:p-8 bg-gradient-to-r from-zinc-950 via-zinc-900 to-orange-950 rounded-3xl border border-orange-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-extrabold border border-orange-500/30">
              <Crown className="w-3.5 h-3.5 text-orange-400" />
              <span>Super Administrateur • Fondateur MonneyFact</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
              Cockpit Global de Supervision SaaS
            </h2>
            <p className="text-zinc-300 text-sm max-w-xl">
              Supervision, suspension, réactivation et suppression des comptes entreprises enregistrés.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-4 bg-zinc-900 rounded-2xl border border-orange-500/30 text-center">
              <p className="text-[10px] uppercase font-bold text-orange-400">MRR Mensuel FCFA</p>
              <p className="text-xl font-extrabold font-mono text-white">{formatFCFA(totalMRR)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Super Admin KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Entreprises Inscrites</span>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold font-mono text-white">
            {loading ? <RefreshCw className="w-6 h-6 animate-spin text-orange-500" /> : displayList.length}
          </h3>
          <p className="text-xs text-emerald-400 font-semibold">{activeCount} entreprise(s) active(s)</p>
        </div>

        <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Revenu Récurrent (MRR)</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold font-mono text-emerald-400">{formatFCFA(totalMRR)}</h3>
          <p className="text-xs text-zinc-400 font-semibold">Projeté annuel : {formatFCFA(totalMRR * 12)}</p>
        </div>

        <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Expirations Proches</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold font-mono text-amber-400">{expiringSoonCount}</h3>
          <p className="text-xs text-zinc-400 font-semibold">Expirant dans moins de 5j</p>
        </div>

        <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Paiements Simulés</span>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold font-mono text-orange-400">{simulatedPayments.length}</h3>
          <p className="text-xs text-zinc-400 font-semibold">Transactions enregistrées</p>
        </div>
      </div>

      {/* Registered Companies Table & Multi-Criteria Filtering */}
      <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">Gestion des Abonnements & Comptes Entreprises</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Supervision, suspension, réactivation et suppression des comptes clients.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-48 pl-9 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Plan Filter Dropdown */}
            <select
              value={selectedPlanFilter}
              onChange={(e) => setSelectedPlanFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-orange-500 font-bold"
            >
              <option value="all">Tous les Plans</option>
              <option value="Découverte">Plan Découverte (0 FCFA)</option>
              <option value="Pro">Plan Pro (5 000 FCFA)</option>
              <option value="Business">Plan Business (15 000 FCFA)</option>
            </select>

            {/* Status Filter Dropdown */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-orange-500 font-bold"
            >
              <option value="all">Tous les Statuts</option>
              <option value="active">Actif</option>
              <option value="suspended">Suspendu</option>
              <option value="expired">Expiré</option>
            </select>
          </div>
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Building2 className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-sm font-bold text-zinc-300">Aucune entreprise trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 rounded-l-xl">Entreprise</th>
                  <th className="py-3.5 px-4">Gérant & Contact</th>
                  <th className="py-3.5 px-4 text-center">Plan Abonnement</th>
                  <th className="py-3.5 px-4 text-center">Jours Restants</th>
                  <th className="py-3.5 px-4 text-center">Statut Compte</th>
                  <th className="py-3.5 px-4 text-right rounded-r-xl">Actions Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-xs">
                {filteredCompanies.map((comp) => (
                  <tr key={comp.id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="py-4 px-4 font-bold text-white">
                      {comp.name}
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-semibold text-zinc-200">{comp.ownerName}</p>
                      <p className="text-[11px] text-zinc-500">{comp.ownerEmail}</p>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        {comp.plan} ({formatFCFA(comp.monthlySubscription)}/m)
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center font-mono font-bold">
                      {comp.plan === 'Basique' ? (
                        <span className="text-zinc-500">Illimité</span>
                      ) : (
                        <span className={comp.daysRemaining <= 5 ? 'text-amber-400' : 'text-emerald-400'}>
                          {comp.daysRemaining} jours
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          comp.status === 'suspended'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : comp.status === 'expired'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {comp.status === 'suspended' ? 'Suspendu' : comp.status === 'expired' ? 'Expiré' : 'Actif'}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {comp.status === 'active' ? (
                          <button
                            onClick={() => setActionModal({ open: true, company: comp, action: 'suspend' })}
                            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Ban className="w-3 h-3" /> Suspendre
                          </button>
                        ) : (
                          <button
                            onClick={() => setActionModal({ open: true, company: comp, action: 'reactivate' })}
                            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" /> Réactiver
                          </button>
                        )}

                        {/* Super Admin Delete Button */}
                        <button
                          onClick={() => handleDeleteCompany(comp.id, comp.name)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Supprimer définitivement le compte entreprise"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simulated Payments Log Table */}
      {simulatedPayments.length > 0 && (
        <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-orange-500" />
            <h3 className="text-base font-bold text-white">Historique des Paiements Simulés (Pré-équipé Siposive Genius Pay)</h3>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {simulatedPayments.map((tx, idx) => (
              <div key={idx} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-white">{tx.customerEmail}</span>
                  <span className="text-zinc-400"> — Formule </span>
                  <span className="font-bold text-orange-400">{tx.planName}</span>
                  <span className="text-zinc-400"> via </span>
                  <span className="font-bold text-emerald-400 uppercase">{tx.channel}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-white">{tx.amount.toLocaleString()} FCFA</span>
                  <p className="text-[10px] text-zinc-500">{new Date(tx.timestamp).toLocaleString('fr-FR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Audit Logs Table */}
      {auditLogs.length > 0 && (
        <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <h3 className="text-base font-bold text-white">Journal d&apos;Audit des Actions Administrateur</h3>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-orange-400">{log.adminEmail}</span>
                  <span className="text-zinc-400"> a effectué l&apos;action </span>
                  <span className="font-bold text-white uppercase">{log.action}</span>
                  <span className="text-zinc-400"> sur </span>
                  <span className="font-bold text-white">{log.companyName}</span>
                  <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Motif : {log.reason}</p>
                </div>
                <span className="font-mono text-[10px] text-zinc-500 shrink-0">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADMIN ACTION REASON MODAL */}
      {actionModal.open && actionModal.company && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-zinc-900 rounded-3xl border border-zinc-800 p-6 space-y-5 text-zinc-100 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">
                {actionModal.action === 'suspend' ? 'Suspension de Compte' : 'Réactivation de Compte'}
              </h3>
              <p className="text-xs text-zinc-400">
                Action sur l&apos;entreprise : <strong className="text-orange-400">{actionModal.company.name}</strong>
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-zinc-300">Motif Administrateur (Journal d&apos;Audit Obligatoire) *</label>
              <textarea
                rows={3}
                required
                placeholder="Renseignez le motif exact (ex: Non-respect des CGU, Demande du gérant, Règlement reçu)..."
                value={auditReason}
                onChange={(e) => setAuditReason(e.target.value)}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-white font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setActionModal({ open: false, company: null, action: 'suspend' })}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-bold rounded-xl"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-md"
              >
                Confirmer l&apos;Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
