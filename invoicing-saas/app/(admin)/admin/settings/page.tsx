'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  Shield,
  User,
  Key,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  Building,
  Server,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Lock,
  Mail,
  HelpCircle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import { useAuth } from '@/lib/auth/authContext';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { addAdminNotif } = useAppStore();

  // Super Admin Profile State
  const [adminName, setAdminName] = useState('Super Administrateur MonneyFact');
  const [adminEmail, setAdminEmail] = useState('admin@monneyfact.ci');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // System Configuration State
  const [appName, setAppName] = useState('MonneyFact');
  const [defaultCurrency, setDefaultCurrency] = useState('FCFA');
  const [defaultTvaRate, setDefaultTvaRate] = useState('18');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoEmailNotifs, setAutoEmailNotifs] = useState(true);

  // Status feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Restore existing saved system config if any
    const savedConfig = localStorage.getItem('monneyfact_system_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.appName) setAppName(parsed.appName);
        if (parsed.defaultCurrency) setDefaultCurrency(parsed.defaultCurrency);
        if (parsed.defaultTvaRate) setDefaultTvaRate(parsed.defaultTvaRate);
        if (parsed.maintenanceMode !== undefined) setMaintenanceMode(parsed.maintenanceMode);
        if (parsed.autoEmailNotifs !== undefined) setAutoEmailNotifs(parsed.autoEmailNotifs);
        if (parsed.adminName) setAdminName(parsed.adminName);
        if (parsed.adminEmail) setAdminEmail(parsed.adminEmail);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaveSuccess(false);

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }

    const updatedConfig = {
      appName,
      defaultCurrency,
      defaultTvaRate,
      maintenanceMode,
      autoEmailNotifs,
      adminName,
      adminEmail,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('monneyfact_system_config', JSON.stringify(updatedConfig));
    setSaveSuccess(true);

    addAdminNotif(
      'Profil & Configuration Mis à Jour',
      `Les paramètres de MonneyFact et les informations Super Admin (${adminEmail}) ont été enregistrés avec succès.`,
      'success'
    );

    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans text-slate-100 pb-16">
      
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
            <span>Configuration Système & Profil Super Admin</span>
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-extrabold">
              MonneyFact Core
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gérer la plateforme MonneyFact, la devise, les paramètres globaux et votre profil de supervision.
          </p>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Toutes les modifications du système MonneyFact et votre profil ont été enregistrées avec succès !</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-8">
        
        {/* SECTION 1: PROFIL SUPER ADMIN */}
        <div className="p-6 lg:p-8 bg-[#0E131F] rounded-3xl border border-slate-800/80 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Informations de Profil Super Administrateur</h2>
              <p className="text-xs text-slate-400">Identifiants et accès pour la supervision globale de MonneyFact</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-300">Nom Complet du Super Admin</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500 font-medium transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-300">Adresse E-mail Officielle</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500 font-medium transition-all"
                />
              </div>
            </div>
          </div>

          {/* Password Security Update */}
          <div className="pt-4 border-t border-slate-800/40 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              Sécurité et Modification de Mot de Passe
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Mot de passe actuel</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Nouveau mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: PARAMÈTRES DU SYSTÈME MONNEYFACT */}
        <div className="p-6 lg:p-8 bg-[#0E131F] rounded-3xl border border-slate-800/80 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Paramètres de la Plateforme MonneyFact</h2>
              <p className="text-xs text-slate-400">Configuration des options globales, devises et taux par défaut</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-300">Nom Officiel du SaaS</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-black text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-300">Devise Principale du Système</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="FCFA">Franc CFA (FCFA / XOF / XAF)</option>
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dollar US ($)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-300">Taux de TVA Standard (%)</label>
              <input
                type="number"
                value={defaultTvaRate}
                onChange={(e) => setDefaultTvaRate(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-4 border-t border-slate-800/40 space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
              <div className="space-y-0.5">
                <p className="text-xs font-extrabold text-white">Mode Maintenance d&apos;Urgence MonneyFact</p>
                <p className="text-[11px] text-slate-400">
                  Affiche un écran de maintenance temporaire à toutes les entreprises clientes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {maintenanceMode ? (
                  <ToggleRight className="w-10 h-10 text-rose-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-600" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
              <div className="space-y-0.5">
                <p className="text-xs font-extrabold text-white">Notifications E-mail Automatiques lors des Inscriptions</p>
                <p className="text-[11px] text-slate-400">
                  Avertir le Super Admin par e-mail chaque fois qu&apos;une nouvelle entreprise crée un compte.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAutoEmailNotifs(!autoEmailNotifs)}
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {autoEmailNotifs ? (
                  <ToggleRight className="w-10 h-10 text-indigo-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Submit Save Button */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="submit"
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-black rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center gap-2.5 transition-all transform active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer la Configuration & Mon Profil</span>
          </button>
        </div>

      </form>

    </div>
  );
}
