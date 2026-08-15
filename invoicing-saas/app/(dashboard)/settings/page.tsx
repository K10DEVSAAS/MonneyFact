'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Save,
  Building,
  Phone,
  MapPin,
  FileCheck,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  User,
  Mail,
  ShieldCheck,
  Check,
  Sparkles,
  Percent,
  Coins,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import { useAuth } from '@/lib/auth/authContext';
import { dbService } from '@/lib/services/dbService';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { organization, updateOrganization, addCompanyNotif } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State for Organization
  const [org, setOrg] = useState({
    name: organization.name || '',
    address: organization.address || '',
    phone: organization.phone || '',
    taxId: organization.taxId || '',
    currency: organization.currency || 'FCFA',
    defaultTaxRate: organization.defaultTaxRate !== undefined ? organization.defaultTaxRate : 18,
  });

  // Form State for Profile
  const [profile, setProfile] = useState({
    fullName: user?.name || organization.name || 'Gestionnaire',
    email: user?.email || organization.email || '',
  });

  useEffect(() => {
    setOrg({
      name: organization.name || '',
      address: organization.address || '',
      phone: organization.phone || '',
      taxId: organization.taxId || '',
      currency: organization.currency || 'FCFA',
      defaultTaxRate: organization.defaultTaxRate !== undefined ? organization.defaultTaxRate : 18,
    });
    if (user) {
      setProfile({
        fullName: user.name || '',
        email: user.email || '',
      });
    }
  }, [organization, user]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("La taille de l'image ne doit pas dépasser 3 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      updateOrganization({ logoUrl: base64String });

      // Direct DB update if organization ID exists
      if (organization.id) {
        await dbService.updateOrganizationById(organization.id, { logoUrl: base64String });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    updateOrganization({ logoUrl: '' });
    if (organization.id) {
      await dbService.updateOrganizationById(organization.id, { logoUrl: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Local App Store Update
      updateOrganization({
        name: org.name,
        address: org.address,
        phone: org.phone,
        taxId: org.taxId,
        defaultTaxRate: org.defaultTaxRate,
        currency: org.currency,
      });

      // 2. PostgreSQL Server Database Update
      if (organization.id) {
        await dbService.updateOrganizationById(organization.id, {
          name: org.name,
          address: org.address,
          phone: org.phone,
          taxId: org.taxId,
          defaultTaxRate: org.defaultTaxRate,
          currency: org.currency,
        });
      }

      if (user?.id) {
        await dbService.updateUserProfile(user.id, {
          fullName: profile.fullName,
          email: profile.email,
        });
      }

      addCompanyNotif(
        'Paramètres Enregistrés',
        "Vos informations d'entreprise et de profil ont été mises à jour avec succès.",
        'success'
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des paramètres:', err);
      alert('Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in text-slate-900 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Profil & Paramètres d&apos;Entreprise
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gérez vos informations légales, votre logo officiel et les préférences de facturation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-4 py-2 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-bold rounded-2xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>MonneyFact V1 — Service Gratuit Illimité</span>
          </span>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Vos paramètres ont été enregistrés et synchronisés sur le serveur avec succès.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: PROFIL UTILISATEUR */}
        <div className="p-6 lg:p-8 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Profil de l&apos;Utilisateur</h3>
              <p className="text-xs text-slate-500">Coordonnées du compte administrateur connecté</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Nom Complet de l&apos;Utilisateur *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Adresse E-mail de Connexion
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  readOnly
                  value={profile.email}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: INFORMATIONS DE L'ENTREPRISE */}
        <div className="p-6 lg:p-8 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-8">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Informations Légales de l&apos;Entreprise</h3>
              <p className="text-xs text-slate-500">Ces informations figureront sur l&apos;en-tête de vos factures et devis</p>
            </div>
          </div>

          {/* LOGO SELECTION */}
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Logo Officiel de l&apos;Entreprise
            </label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative group">
                {organization.logoUrl ? (
                  /* eslint-disable-next-html-element-suppression */
                  <img
                    src={organization.logoUrl}
                    alt="Logo Entreprise"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-orange-600 font-bold text-xs">
                    <ImageIcon className="w-6 h-6 mb-1 text-orange-500" />
                    <span>AUCUN LOGO</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{organization.logoUrl ? 'Changer le logo' : 'Téléverser votre logo'}</span>
                  </button>

                  {organization.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Supprimer le logo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">Formats supportés : PNG, JPG, SVG (max 3 Mo).</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Nom de l&apos;Entreprise / Raison Sociale *
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={org.name}
                  onChange={(e) => setOrg({ ...org, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Numéro Compte Contribuable (NCC) / IFU / RCCM
              </label>
              <div className="relative">
                <FileCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={org.taxId}
                  onChange={(e) => setOrg({ ...org, taxId: e.target.value })}
                  placeholder="ex: NCC 2108945 Z / RCCM CI-ABJ-01-2024"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Téléphone Professionnel
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={org.phone}
                  onChange={(e) => setOrg({ ...org, phone: e.target.value })}
                  placeholder="+225 07 00 00 00 00"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Devise de Facturation
              </label>
              <div className="relative">
                <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  readOnly
                  value="FCFA (XOF)"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Taux de TVA par Défaut (%)
              </label>
              <div className="relative max-w-xs">
                <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  value={org.defaultTaxRate}
                  onChange={(e) => setOrg({ ...org, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 font-bold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Adresse du Siège Social (Côte d&apos;Ivoire)
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <textarea
                rows={2}
                value={org.address}
                onChange={(e) => setOrg({ ...org, address: e.target.value })}
                placeholder="ex: Boulevard Latrille, Cocody, Abidjan, Côte d'Ivoire"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 active:scale-95 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Enregistrement en cours...' : 'Enregistrer les modifications'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
