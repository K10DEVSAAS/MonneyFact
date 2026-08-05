'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Activity,
  ShieldCheck,
  Mail,
  CheckCircle2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Search,
  Calendar,
  Filter,
  CheckSquare,
  Square,
  X,
  Lock,
  User,
  Globe,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import { EmailLogEntry } from '@/lib/services/emailService';

export interface AuditLogEntry {
  id: string;
  action: 'delete_company' | 'delete_user' | 'plan_change' | 'security_alert' | 'admin_action' | 'session_revoke';
  title: string;
  details: string;
  companyName?: string;
  adminIdentity?: string;
  ipAddress?: string;
  timestamp: string;
  dateKey: string;
}

export default function AdminLogsPage() {
  const { globalSearchQuery } = useAppStore();
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const activeSearch = searchQuery || globalSearchQuery;
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [clearModalOpen, setClearModalOpen] = useState(false);

  const todayKey = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // 1. Load Email Logs
    try {
      const savedEmail = localStorage.getItem('monneyfact_email_logs');
      if (savedEmail) {
        setEmailLogs(JSON.parse(savedEmail));
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Load Audit Logs
    try {
      const savedAudit = localStorage.getItem('monneyfact_audit_logs');
      if (savedAudit) {
        const parsed: AuditLogEntry[] = JSON.parse(savedAudit);
        if (parsed.length > 0) {
          setAuditLogs(parsed);
        } else {
          setAuditLogs(getDefaultLogs());
        }
      } else {
        const defaults = getDefaultLogs();
        setAuditLogs(defaults);
        localStorage.setItem('monneyfact_audit_logs', JSON.stringify(defaults));
      }
    } catch (e) {
      console.error(e);
    }
  }, [todayKey]);

  const getDefaultLogs = (): AuditLogEntry[] => [
    {
      id: `audit-${Date.now()}-1`,
      action: 'admin_action',
      title: 'Initialisation du Journal Super Admin',
      details: 'Super Admin connecté — Surveillance active des actions et de la sécurité.',
      companyName: 'Système MonneyFact',
      adminIdentity: 'Fondateur MonneyFact (admin@monneyfact.ci)',
      ipAddress: '197.234.221.15',
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      dateKey: todayKey,
    },
    {
      id: `audit-${Date.now()}-2`,
      action: 'plan_change',
      title: 'Contrôle des Abonnements',
      details: 'Vérification automatique des formules et des renouvellements.',
      companyName: 'Toutes Entreprises',
      adminIdentity: 'Fondateur MonneyFact (admin@monneyfact.ci)',
      ipAddress: '197.234.221.15',
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      dateKey: todayKey,
    },
  ];

  // Search & Filter Logic
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.title.toLowerCase().includes(activeSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(activeSearch.toLowerCase()) ||
      (log.companyName && log.companyName.toLowerCase().includes(activeSearch.toLowerCase())) ||
      (log.adminIdentity && log.adminIdentity.toLowerCase().includes(activeSearch.toLowerCase()));

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  // Bulk Selection Handlers
  const toggleSelectLog = (id: string) => {
    setSelectedLogIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLogIds.length === filteredAuditLogs.length) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(filteredAuditLogs.map((l) => l.id));
    }
  };

  // Delete Selected Logs
  const handleDeleteSelected = () => {
    if (selectedLogIds.length === 0) return;
    const updated = auditLogs.filter((l) => !selectedLogIds.includes(l.id));
    setAuditLogs(updated);
    setSelectedLogIds([]);
    try {
      localStorage.setItem('monneyfact_audit_logs', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Single Log
  const handleDeleteSingleLog = (id: string) => {
    const updated = auditLogs.filter((l) => l.id !== id);
    setAuditLogs(updated);
    setSelectedLogIds((prev) => prev.filter((item) => item !== id));
    try {
      localStorage.setItem('monneyfact_audit_logs', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Clear Entire History
  const handleClearEntireAuditLog = () => {
    setAuditLogs([]);
    setSelectedLogIds([]);
    try {
      localStorage.setItem('monneyfact_audit_logs', JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }
    setClearModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-100 font-sans pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au Cockpit</span>
          </Link>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Historique des Actions Super Admin</span>
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-extrabold">
              {auditLogs.length} Entrée(s)
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Journal de sécurité des suppressions d&apos;entreprises, invalidations de session et actions administrateur.
          </p>
        </div>
      </div>

      {/* AUDIT LOGS MAIN CARD */}
      <div className="p-6 lg:p-8 bg-[#0E131F] rounded-3xl border border-slate-800/80 shadow-xl space-y-6">
        
        {/* Controls Bar: Search, Filters & Bulk Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher action, entreprise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Action Filter Dropdown */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full sm:w-48 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Toutes les Actions</option>
              <option value="delete_company">Suppression Entreprise</option>
              <option value="plan_change">Modification Plan</option>
              <option value="admin_action">Actions Administrateur</option>
              <option value="session_revoke">Invalidation Session</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {selectedLogIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-black rounded-2xl transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer la sélection ({selectedLogIds.length})</span>
              </button>
            )}

            <button
              onClick={() => setClearModalOpen(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-rose-400 text-xs font-black rounded-2xl transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Vider l&apos;historique</span>
            </button>
          </div>
        </div>

        {/* Audit Logs Table */}
        {filteredAuditLogs.length === 0 ? (
          <div className="py-16 text-center space-y-3 text-xs text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto" />
            <p className="font-bold text-slate-300 text-sm">Le journal d&apos;historique est vide</p>
            <p>Aucune action enregistrée ne correspond à vos critères de recherche.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/60 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3 w-10">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                      {selectedLogIds.length === filteredAuditLogs.length ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                  </th>
                  <th className="pb-3 px-3">Date & Heure</th>
                  <th className="pb-3 px-3">Action</th>
                  <th className="pb-3 px-3">Événement & Détails</th>
                  <th className="pb-3 px-3">Entreprise</th>
                  <th className="pb-3 px-3">Super Admin & IP</th>
                  <th className="pb-3 px-3 text-right">Supprimer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs">
                {filteredAuditLogs.map((log) => {
                  const isSelected = selectedLogIds.includes(log.id);
                  return (
                    <tr key={log.id} className={`hover:bg-slate-900/40 transition-colors ${isSelected ? 'bg-indigo-500/5' : ''}`}>
                      
                      {/* Checkbox */}
                      <td className="py-4 px-3">
                        <button onClick={() => toggleSelectLog(log.id)} className="text-slate-400 hover:text-white">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                      </td>

                      {/* Date & Time */}
                      <td className="py-4 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {log.timestamp} <br />
                        <span className="text-[10px] text-slate-500">{log.dateKey}</span>
                      </td>

                      {/* Action Tag */}
                      <td className="py-4 px-3 font-bold text-white whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            log.action === 'delete_company'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : log.action === 'plan_change'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {log.action.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Event & Details */}
                      <td className="py-4 px-3">
                        <p className="font-extrabold text-white">{log.title}</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{log.details}</p>
                      </td>

                      {/* Targeted Company */}
                      <td className="py-4 px-3 font-bold text-slate-200 whitespace-nowrap">
                        {log.companyName || 'Non spécifiée'}
                      </td>

                      {/* Admin Identity & IP */}
                      <td className="py-4 px-3 text-slate-400 text-[11px]">
                        <div className="flex items-center gap-1.5 font-bold text-slate-300">
                          <User className="w-3 h-3 text-indigo-400" />
                          <span>{log.adminIdentity || 'Super Admin'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 mt-0.5">
                          <Globe className="w-3 h-3 text-slate-600" />
                          <span>IP: {log.ipAddress || '197.234.221.15'}</span>
                        </div>
                      </td>

                      {/* Delete Single Action */}
                      <td className="py-4 px-3 text-right">
                        <button
                          onClick={() => handleDeleteSingleLog(log.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                          title="Supprimer cette entrée de l'historique"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRM CLEAR ENTIRE HISTORY MODAL */}
      {clearModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-md w-full bg-[#0E131F] rounded-3xl border border-slate-800 p-6 lg:p-8 space-y-6 text-slate-100 shadow-2xl text-center">
            
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Vider tout l&apos;Historique des Actions ?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer définitivement toutes les entrées du journal d&apos;audit Super Admin ? <br />
                <strong className="text-emerald-400">Remarque : Cette action n&apos;impacte pas vos entreprises enregistrées ni la comptabilité.</strong>
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setClearModalOpen(false)}
                className="px-4 py-2.5 bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs font-bold rounded-2xl border border-slate-800"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleClearEntireAuditLog}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-2xl shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmer le Vidage</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
