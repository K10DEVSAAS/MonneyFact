'use client';

import React, { useState } from 'react';
import { Users, Plus, Search, Mail, Phone, MapPin, Trash2, X, CheckCircle2, Building, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import { formatFCFA } from '@/lib/utils/formatters';
import { usePermissions } from '@/lib/hooks/usePermissions';

export default function ClientsPage() {
  const { clients, addClient, deleteClient, organization, globalSearchQuery, activeSubsidiaryId } = useAppStore();
  const { hasPermission } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const canManageClients = hasPermission('manage_clients');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Abidjan',
  });

  const activeSearch = searchQuery || globalSearchQuery;

  const filteredClients = clients.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(activeSearch.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(activeSearch.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(activeSearch.toLowerCase())
  );

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageClients) {
      alert("Accès refusé : Vous n'avez pas l'autorisation de gérer le répertoire des clients.");
      return;
    }
    if (!formData.name.trim()) {
      alert('Veuillez saisir le nom du client.');
      return;
    }

    let currentSubName: string | undefined = undefined;
    if (activeSubsidiaryId !== 'global') {
      try {
        const uEmail = organization.email ? organization.email.toLowerCase() : 'guest';
        const userSubsStr = localStorage.getItem(`monneyfact_subsidiaries_${uEmail}`);
        if (userSubsStr) {
          const subs: any[] = JSON.parse(userSubsStr);
          const found = subs.find((s) => s.id === activeSubsidiaryId);
          if (found) currentSubName = found.name;
        }
      } catch (e) {
        console.error(e);
      }
    }

    addClient({
      organizationId: organization.id,
      subsidiaryId: activeSubsidiaryId !== 'global' ? activeSubsidiaryId : undefined,
      subsidiaryName: currentSubName,
      name: formData.name.trim(),
      email: formData.email.trim() || 'client@entreprise.ci',
      phone: formData.phone.trim() || '+225 07 00 00 00 00',
      address: formData.address.trim() || 'Abidjan',
      city: formData.city.trim() || 'Abidjan',
      country: 'Côte d\'Ivoire',
      totalInvoiced: 0,
      unpaidBalance: 0,
    });

    setFormData({ name: '', email: '', phone: '', address: '', city: 'Abidjan' });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Répertoire des Clients</h2>
          <p className="text-xs text-slate-500 mt-1">
            Gérez vos clients, leurs coordonnées et leurs encours financiers en Côte d&apos;Ivoire.
          </p>
        </div>

        {canManageClients && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Client</span>
          </button>
        )}
      </div>

      {/* Search & Stats Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email, ville..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-orange-500 text-slate-900 font-semibold"
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
          <span className="px-3.5 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-orange-600" />
            <span>Total : {clients.length} client(s)</span>
          </span>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 shadow-xs text-center space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Aucun client enregistré</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Ajoutez votre premier client pour pouvoir lui émettre des factures officielles en FCFA.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter mon premier client</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{client.name}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded bg-slate-100">
                          {client.city}
                        </span>
                        {client.subsidiaryId ? (
                          <span className="text-[9px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-md">
                            📍 Agence
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                            🏢 Siège Social
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteClient(client.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Supprimer le client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Facturé :</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatFCFA(client.totalInvoiced)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
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
              <h3 className="text-lg font-extrabold text-slate-900">Enregistrer un Nouveau Client</h3>
              <p className="text-xs text-slate-500">
                Saisissez les coordonnées de votre client. Il sera immédiatement disponible lors de la création de factures.
              </p>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nom du Client / Raison Sociale *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: San-Pedro Transit SARL"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Adresse Email</label>
                  <input
                    type="email"
                    placeholder="contact@client.ci"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Téléphone</label>
                  <input
                    type="text"
                    placeholder="+225 07 00 00 00 00"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Ville (Côte d&apos;Ivoire)</label>
                  <input
                    type="text"
                    placeholder="ex: Abidjan, San-Pedro..."
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Adresse du Siège</label>
                  <input
                    type="text"
                    placeholder="ex: Boulevard Latrille, Cocody"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 font-medium"
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
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold rounded-xl shadow-md shadow-orange-600/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enregistrer le client</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
