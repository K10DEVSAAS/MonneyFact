'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, ShieldCheck, Mail, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { EmailLogEntry } from '@/lib/services/emailService';

export default function AdminLogsPage() {
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('monneyfact_email_logs');
      if (saved) {
        setEmailLogs(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const [systemLogs] = useState([
    {
      id: 'log-101',
      event: 'Nouvelle Inscription Entreprise',
      details: 'Création du compte Chrome Digital SARL (Abidjan)',
      type: 'info',
      ip: '41.207.210.45',
      time: 'Il y a 5 minutes',
    },
    {
      id: 'log-102',
      event: 'Renouvellement Abonnement Pro',
      details: 'Paiement de 5 000 FCFA reçu pour Lagunes Market',
      type: 'success',
      ip: '160.154.12.88',
      time: 'Il y a 1 heure',
    },
  ]);

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

      {/* REAL-TIME EMAIL DISPATCH LOGS SECTION */}
      <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Journal d&apos;Audit des E-mails Envoyés</h2>
              <p className="text-xs text-zinc-400">
                Journalisation complète des invitations d&apos;équipe Business, des codes OTP et réinitialisations de mot de passe.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Service E-mail Actif
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

      {/* SYSTEM SECURITY LOGS */}
      <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-400" />
          <span>Événements Système & Sécurité</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-4 rounded-l-xl">Événement</th>
                <th className="py-3 px-4">Détails</th>
                <th className="py-3 px-4">Adresse IP</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Horodatage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-xs">
              {systemLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-900/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{log.event}</span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-300">{log.details}</td>
                  <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">{log.ip}</td>
                  <td className="py-3.5 px-4 text-right text-zinc-400 text-[11px] font-semibold">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
