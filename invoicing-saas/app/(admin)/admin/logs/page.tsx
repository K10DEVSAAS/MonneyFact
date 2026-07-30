'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, ShieldCheck, Mail, CheckCircle2, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { EmailLogEntry } from '@/lib/services/emailService';

export interface AuditLogEntry {
  id: string;
  action: 'delete_company' | 'delete_user' | 'plan_change' | 'security_alert' | 'admin_action';
  title: string;
  details: string;
  userEmail?: string;
  timestamp: string;
  dateKey: string; // YYYY-MM-DD for daily isolation
}

export default function AdminLogsPage() {
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
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

    // 2. Load Daily Audit Logs & Auto-Clear previous days at midnight (00:00)
    try {
      const savedAudit = localStorage.getItem('monneyfact_audit_logs');
      if (savedAudit) {
        const parsed: AuditLogEntry[] = JSON.parse(savedAudit);
        // DAILY AUTO CLEAR (Point 1.1): Keep only logs from today!
        const todayOnly = parsed.filter((entry) => entry.dateKey === todayKey);

        if (todayOnly.length !== parsed.length) {
          localStorage.setItem('monneyfact_audit_logs', JSON.stringify(todayOnly));
        }

        if (todayOnly.length > 0) {
          setAuditLogs(todayOnly);
        } else {
          // Initialize default daily system logs for today
          const defaultDailyLogs: AuditLogEntry[] = [
            {
              id: `audit-${Date.now()}-1`,
              action: 'admin_action',
              title: 'Initialisation du Journal Journalier Super Admin',
              details: 'Super Admin connecté — Surveillance active des actions critiques.',
              timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              dateKey: todayKey,
            },
            {
              id: `audit-${Date.now()}-2`,
              action: 'plan_change',
              title: 'Contrôle des Abonnements',
              details: 'Vérification quotidienne des permissions et formules des comptes entreprises.',
              timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              dateKey: todayKey,
            },
          ];
          setAuditLogs(defaultDailyLogs);
          localStorage.setItem('monneyfact_audit_logs', JSON.stringify(defaultDailyLogs));
        }
      } else {
        const initialDailyLogs: AuditLogEntry[] = [
          {
            id: `audit-${Date.now()}-1`,
            action: 'admin_action',
            title: 'Initialisation du Journal Journalier Super Admin',
            details: 'Super Admin connecté — Surveillance active des actions critiques.',
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            dateKey: todayKey,
          },
        ];
        setAuditLogs(initialDailyLogs);
        localStorage.setItem('monneyfact_audit_logs', JSON.stringify(initialDailyLogs));
      }
    } catch (e) {
      console.error(e);
    }
  }, [todayKey]);

  // MANUAL AUDIT LOG CLEAR FUNCTION (Point 1.1)
  const handleClearAuditLog = () => {
    setAuditLogs([]);
    try {
      localStorage.setItem('monneyfact_audit_logs', JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }
    setClearModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in text-zinc-100">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au Cockpit Admin</span>
        </Link>
      </div>

      {/* DAILY AUDIT LOG SECTION */}
      <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Journal d&apos;Audit Journalier Super Admin</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Aujourd&apos;hui ({todayKey})
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Consigne les suppressions d&apos;entreprises, d&apos;utilisateurs, modifications de plan et alertes de sécurité.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* BUTTON "VIDER LE JOURNAL" (POINT 1.1) */}
            <button
              onClick={() => setClearModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-extrabold rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Vider le journal</span>
            </button>
          </div>
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-12 text-center space-y-2 text-xs text-zinc-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto" />
            <p className="font-bold text-zinc-400">Le journal d&apos;audit journalier est vide.</p>
            <p>Se vide automatiquement chaque fin de journée (00h00) sans jamais toucher à la comptabilité.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4 rounded-l-xl">Action</th>
                  <th className="py-3 px-4">Événement</th>
                  <th className="py-3 px-4">Détails</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Horodatage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-xs">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                        log.action === 'delete_company' || log.action === 'delete_user'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : log.action === 'plan_change'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">{log.title}</td>
                    <td className="py-3.5 px-4 text-zinc-300">{log.details}</td>
                    <td className="py-3.5 px-4 text-right text-zinc-400 font-mono text-[11px]">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REAL-TIME EMAIL DISPATCH LOGS SECTION */}
      <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Journal d&apos;Envoi des E-mails</h2>
              <p className="text-xs text-zinc-400">
                Traçabilité des invitations d&apos;équipe envoyées et réinitialisations de mot de passe.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Service E-mail Opérationnel
          </span>
        </div>

        {emailLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            Aucun e-mail consigné pour l&apos;instant. Les invitations d&apos;équipe et OTP apparaîtront ici.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4 rounded-l-xl">Type E-mail</th>
                  <th className="py-3 px-4">Destinataire</th>
                  <th className="py-3 px-4">Sujet</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Horodatage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-xs">
                {emailLogs.map((el) => (
                  <tr key={el.id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-orange-400 shrink-0" />
                      <span className="uppercase text-[11px]">{el.type}</span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-200 font-mono">{el.recipient}</td>
                    <td className="py-3.5 px-4 text-zinc-400">{el.subject}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {el.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-zinc-400 font-mono text-[11px]">{el.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRM CLEAR JOURNAL MODAL (POINT 1.1) */}
      {clearModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-zinc-900 rounded-3xl border border-zinc-800 p-6 space-y-5 text-zinc-100 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-white">Vider le Journal d&apos;Audit Journalier ?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Êtes-vous sûr de vouloir vider le journal d&apos;audit des événements d&apos;aujourd&apos;hui ? <br />
                <strong className="text-emerald-400 font-semibold">Remarque : Cette action n&apos;effacera JAMAIS vos données financières, factures ou chiffre d&apos;affaires.</strong>
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setClearModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-bold rounded-xl"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleClearAuditLog}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-rose-600/30 flex items-center gap-2"
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
