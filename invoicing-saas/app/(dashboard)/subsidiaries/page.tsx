'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  Lock,
  Crown,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  TrendingUp,
  FileCheck,
  Search,
  Filter,
  X,
  Store,
  Building,
  ArrowRight,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import { Subsidiary, SubsidiaryType } from '@/lib/types/invoice';
import { formatFCFA } from '@/lib/utils/formatters';

export default function SubsidiariesPage() {
  const router = useRouter();
  const { organization, invoices, setActiveSubsidiaryId, activeSubsidiaryId } = useAppStore();
  const isProPlan = organization.plan === 'Pro';

  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Default clean initial state: 0 pre-populated sub-agencies!
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);

  useEffect(() => {
    const savedStr = localStorage.getItem('monneyfact_subsidiaries_list');
    if (savedStr) {
      try {
        setSubsidiaries(JSON.parse(savedStr));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveSubsidiaries = (list: Subsidiary[]) => {
    setSubsidiaries(list);
    try {
      localStorage.setItem('monneyfact_subsidiaries_list', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Sub-Company Feature
  const handleDeleteSubsidiary = (id: string, name: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la sous-entreprise "${name}" ? Cette action retirera cet établissement.`)) {
      const updated = subsidiaries.filter((s) => s.id !== id);
      saveSubsidiaries(updated);

      // If active context was this subsidiary, reset to global / main company
      if (activeSubsidiaryId === id) {
        setActiveSubsidiaryId('global');
      }
    }
  };

  // Switch context to specific subsidiary & go to dashboard
  const handleSwitchContext = (subId: string) => {
    setActiveSubsidiaryId(subId);
    router.push('/dashboard');
  };

  // Form State for Adding Établissement
  const [formData, setFormData] = useState({
    name: '',
    type: 'Agence Régionale' as SubsidiaryType,
    city: 'San-Pedro',
    address: '',
    phone: '+225 07 00 00 00 00',
    email: '',
    managerName: '',
    rccmNumber: '',
    taxId: '',
  });

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const created: Subsidiary = {
      id: `sub-${Date.now()}`,
      organizationId: organization.id,
      name: formData.name,
      type: formData.type,
      city: formData.city,
      address: formData.address || `${formData.city}, Côte d'Ivoire`,
      phone: formData.phone,
      email: formData.email || `agence.${formData.city.toLowerCase()}@entreprise.ci`,
      managerName: formData.managerName || 'Responsable d\'Agence',
      rccmNumber: formData.rccmNumber || 'CI-ABJ-2026-B-0000',
      taxId: formData.taxId || 'NCC Non Renseigné',
      status: 'actif',
      totalInvoiced: 0,
      invoiceCount: 0,
      memberCount: 1,
      createdAt: new Date().toISOString(),
    };

    saveSubsidiaries([created, ...subsidiaries]);
    setFormData({
      name: '',
      type: 'Agence Régionale',
      city: 'San-Pedro',
      address: '',
      phone: '+225 07 00 00 00 00',
      email: '',
      managerName: '',
      rccmNumber: '',
      taxId: '',
    });
    setIsAddModalOpen(false);
  };

  const filteredSubsidiaries = subsidiaries.filter((sub) => {
    const matchesType = selectedTypeFilter === 'all' || sub.type === selectedTypeFilter;
    const matchesSearch =
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.managerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const grandTotalInvoiced = subsidiaries.reduce((sum, s) => sum + s.totalInvoiced, 0);

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Gestion des Sous-Entreprises & Agences
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Pilotez le Siège Social, les Agences Régionales, Boutiques et Filiales sous un compte unique.
        </p>
      </div>

      {/* LOCK HERO BANNER IF NOT BUSINESS PLAN */}
      {!isProPlan ? (
        <div className="p-8 bg-zinc-950 text-white rounded-3xl border border-zinc-800 shadow-2xl space-y-6 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-orange-600/20 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-orange-500" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold rounded-full">
              👑 Exclusif au Plan Business (15.000 FCFA/mois)
            </span>
            <h3 className="text-2xl font-black text-white">Débloquez la Gestion Multi-Établissements & Filiales</h3>
            <p className="text-xs text-zinc-400">
              Votre formule actuelle (<strong className="text-white">{organization.plan || 'Pro'}</strong>) est limitée à un seul établissement. Passez au Plan Business pour créer et piloter des agences régionales, boutiques et filiales autonomes.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-orange-600/30 transition-all"
            >
              <span>Passer au Plan Business (15.000 FCFA/m)</span>
              <Crown className="w-4 h-4 text-amber-300" />
            </Link>
          </div>
        </div>
      ) : (
        /* FULL BUSINESS FEATURE CONTENT */
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {subsidiaries.length === 0 ? 'Aucune agence secondaire enregistrée' : `${subsidiaries.length} Sous-Entreprise(s) & Agence(s)`}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {subsidiaries.length === 0
                    ? 'Votre compte fonctionne actuellement en établissement unique.'
                    : 'Sélectionnez une agence pour basculer la facturation ou supprimez-la si nécessaire.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-all shrink-0 self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une Agence / Filiale</span>
            </button>
          </div>

          {/* CLEAN ELEGANT ZERO-STATE IF NO SUB-AGENCIES */}
          {subsidiaries.length === 0 ? (
            <div className="p-10 bg-white rounded-3xl border border-slate-200 shadow-xs text-center space-y-4 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900">Établissement Unique (Siège Social)</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                  Aucune sous-agence ou filiale n&apos;est enregistrée pour l&apos;instant. Toutes vos factures et statistiques sont émises au nom du Siège Social <strong>({organization.name})</strong>.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Enregistrer ma Première Agence Régionale ou Boutique</span>
                </button>
              </div>
            </div>
          ) : (
            /* LIST OF SUB-AGENCIES WHEN CREATED */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSubsidiaries.map((sub) => (
                <div
                  key={sub.id}
                  className={`p-6 bg-white rounded-2xl border transition-all space-y-4 flex flex-col justify-between ${
                    activeSubsidiaryId === sub.id
                      ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-md'
                      : 'border-slate-200 shadow-xs hover:shadow-md'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center font-bold shrink-0">
                          {sub.type === 'Siège Social' ? (
                            <Building className="w-6 h-6" />
                          ) : sub.type === 'Boutique / Point de Vente' ? (
                            <Store className="w-6 h-6" />
                          ) : (
                            <Building2 className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 leading-tight">{sub.name}</h3>
                          <span className="text-[10px] font-extrabold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full inline-block mt-1">
                            {sub.type}
                          </span>
                        </div>
                      </div>

                      {/* Delete Sub-Company Button */}
                      <button
                        onClick={() => handleDeleteSubsidiary(sub.id, sub.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Supprimer la sous-entreprise"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">{sub.address} ({sub.city})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Responsable : <strong>{sub.managerName}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{sub.phone}</span>
                      </div>
                      {sub.rccmNumber && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <FileCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>RCCM : {sub.rccmNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Facturé</span>
                        <span className="font-mono font-extrabold text-slate-900 text-sm">{formatFCFA(sub.totalInvoiced)}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {sub.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Switch Context Button */}
                    <button
                      onClick={() => handleSwitchContext(sub.id)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        activeSubsidiaryId === sub.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                      }`}
                    >
                      <span>{activeSubsidiaryId === sub.id ? '✓ Contexte Actif' : '⚡ Basculer le Dashboard sur cette filiale'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Subsidiary Modal */}
          {isAddModalOpen && (
            <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in text-slate-900 relative">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-900">Enregistrer une Sous-Entreprise / Agence</h3>
                  <p className="text-xs text-slate-500">
                    Configurez une nouvelle filiale ou agence régionale pour l&apos;émission de factures.
                  </p>
                </div>

                <form onSubmit={handleCreateBranch} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Nom de la Sous-Entreprise *</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: MonneyFact Agence San-Pedro Transit"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 text-slate-900 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Type d&apos;Établissement</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as SubsidiaryType })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white"
                      >
                        <option value="Agence Régionale">Agence Régionale</option>
                        <option value="Boutique / Point de Vente">Boutique / Point de Vente</option>
                        <option value="Filiale Autonome">Filiale Autonome</option>
                        <option value="Succursale">Succursale</option>
                        <option value="Siège Social">Siège Social</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Ville (Côte d&apos;Ivoire)</label>
                      <input
                        type="text"
                        required
                        placeholder="ex: San-Pedro, Bouaké..."
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 text-slate-900 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Responsable / Directeur d&apos;Agence</label>
                      <input
                        type="text"
                        placeholder="ex: Kouassi Kouame"
                        value={formData.managerName}
                        onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 text-slate-900 font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Téléphone de l&apos;Agence</label>
                      <input
                        type="text"
                        placeholder="+225 07 00 00 00 00"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 text-slate-900 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Numéro RCCM</label>
                      <input
                        type="text"
                        placeholder="ex: CI-SAS-2026-B-4819"
                        value={formData.rccmNumber}
                        onChange={(e) => setFormData({ ...formData, rccmNumber: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 text-slate-900 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Numéro Compte Contribuable (NCC)</label>
                      <input
                        type="text"
                        placeholder="ex: NCC 2108945 Z-01"
                        value={formData.taxId}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold rounded-xl shadow-md shadow-orange-600/20 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Enregistrer la Sous-Entreprise</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
