'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, ShieldCheck, Lock, AlertTriangle, Filter, Search, CheckCircle2 } from 'lucide-react';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([
    {
      id: 'log-101',
      event: 'Nouvelle Inscription Entreprise',
      details: 'Création du compte Chrome Digital SARL (Abidjan) par contact@chrome.ci',
      type: 'info',
      ip: '41.207.210.45',
      time: 'Il y a 5 minutes',
    },
    {
      id: 'log-102',
      event: 'Renouvellement Abonnement Pro',
      details: 'Paiement de 5 000 FCFA reçu pour Lagunes Market via Wave',
      type: 'success',
      ip: '160.154.12.88',
      time: 'Il y a 1 heure',
    },
    {
      id: 'log-103',
      event: 'Tentative de connexion échouée',
      details: '3 tentatives échouées sur le compte admin@monneyfact.ci (Sécurité OK)',
      type: 'warning',
      ip: '197.239.14.102',
      time: 'Il y a 4 heures',
    },
    {
      id: 'log-104',
      event: 'Mise à jour Norme Fiscale DGI',
      details: 'Mise à jour automatique du taux de TVA 18% et vérification des numéros NCC',
      type: 'info',
      ip: 'Système Interne',
      time: 'Hier à 09:00',
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

      <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Journal des Logs & Sécurité SaaS</h2>
              <p className="text-xs text-zinc-400">
                Surveillance en temps réel des connexions, inscriptions et événements système MonneyFact
              </p>
            </div>
          </div>

          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Système Sécurisé
          </span>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-4 rounded-l-xl">Événement</th>
                <th className="py-3 px-4">Détails de l&apos;Action</th>
                <th className="py-3 px-4">Adresse IP</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Horodatage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-xs">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-900/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    {log.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {log.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                    {log.type === 'info' && <Activity className="w-4 h-4 text-orange-400 shrink-0" />}
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
