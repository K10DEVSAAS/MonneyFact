'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, Search, Bell, Plus, Calendar, LogOut, Building2, ChevronDown, Check, Building, Layers } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';
import { NotificationsDrawer } from './NotificationsDrawer';
import { useAuth } from '@/lib/auth/authContext';
import { useAppStore } from '@/lib/store/appStore';
import { Subsidiary } from '@/lib/types/invoice';

interface TopbarProps {
  onOpenMobileSidebar: () => void;
  title?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileSidebar,
  title = 'Tableau de bord',
}) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'super_admin';
  const { organization, unreadCompanyNotifCount, unreadAdminNotifCount, activeSubsidiaryId, setActiveSubsidiaryId } = useAppStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSubDropdownOpen, setIsSubDropdownOpen] = useState(false);

  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('monneyfact_subsidiaries_list');
      if (saved) {
        const all: Subsidiary[] = JSON.parse(saved);
        // STRICT DATA ISOLATION FILTER BY ORGANIZATION ID & EXCLUDE STALE MOCK IDS
        const ownSubs = all.filter(
          (s) => s.organizationId === organization.id && !['sub-main', 'sub-2', 'sub-3'].includes(s.id)
        );
        setSubsidiaries(ownSubs);
      }
    } catch (e) {
      console.error(e);
    }
  }, [organization.id]);

  const today = formatDate(new Date().toISOString());
  const unreadCount = isAdmin ? unreadAdminNotifCount : unreadCompanyNotifCount;
  const isPro = organization.plan === 'Pro';
  const hasSubCompanies = isPro && subsidiaries.length > 0;
  const isCollaborator = user?.isCollaborator;
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');

  const activeSubName = activeSubsidiaryId === 'global'
    ? `${organization.name} (Entreprise Principale)`
    : subsidiaries.find((s) => s.id === activeSubsidiaryId)?.name || 'Sous-Entreprise Sélectionnée';

  // Live Timer Countdown for Collaborators
  useEffect(() => {
    if (!isCollaborator || !user?.sessionEndTime) return;

    const interval = setInterval(() => {
      const remainingMs = user.sessionEndTime! - Date.now();
      if (remainingMs <= 0) {
        clearInterval(interval);
        alert("Le temps imparti pour votre session de travail est expiré. Redirection vers la landing page...");
        logout();
      } else {
        const mins = Math.floor(remainingMs / 60000);
        const secs = Math.floor((remainingMs % 60000) / 1000);
        setTimeLeftStr(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isCollaborator, user, logout]);

  const handleFinishCollaboratorTask = () => {
    if (confirm("Avez-vous terminé vos tâches ? Vous allez être déconnecté et redirigé vers la landing page.")) {
      logout();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all text-slate-900">
      <div className="flex items-center justify-between gap-4">
        {/* Left Section: Mobile Menu + Title + Multi-Company Context Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 lg:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <h1 className="text-lg lg:text-xl font-black text-slate-900 tracking-tight hidden sm:block">
              {title}
            </h1>

            {/* COLLABORATOR HOST COMPANY & TIME INDICATOR */}
            {isCollaborator ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 border border-orange-300 rounded-xl text-xs font-bold text-orange-950">
                <span className="font-extrabold text-orange-800">{user.hostCompanyName}</span>
                <span className="text-slate-400">•</span>
                <span className="font-semibold text-slate-700">{user.name}</span>
                <span className="px-2 py-0.5 bg-orange-600 text-white rounded-md font-mono text-[11px]">
                  ⏱ {timeLeftStr || 'Session active'}
                </span>
              </div>
            ) : (
              /* DYNAMIC SUBSIDIARY SWITCHER */
              hasSubCompanies && (
                <div className="relative">
                  <button
                    onClick={() => setIsSubDropdownOpen(!isSubDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 hover:border-orange-300 text-orange-900 text-xs font-bold rounded-xl shadow-2xs transition-all"
                  >
                    <Building2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span className="truncate max-w-[180px]">{activeSubName}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  </button>

                  {isSubDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 z-50 animate-fade-in text-xs space-y-1">
                      <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Filtrer par établissement :
                      </p>

                      <button
                        onClick={() => {
                          setActiveSubsidiaryId('global');
                          setIsSubDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition-colors ${
                          activeSubsidiaryId === 'global'
                            ? 'bg-orange-600 text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>Vue Globale Consolidée</span>
                        </div>
                        {activeSubsidiaryId === 'global' && <Check className="w-4 h-4" />}
                      </button>

                      <div className="border-t border-slate-100 my-1" />

                      {subsidiaries.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setActiveSubsidiaryId(sub.id);
                            setIsSubDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-colors ${
                            activeSubsidiaryId === sub.id
                              ? 'bg-orange-600 text-white font-bold'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{sub.name} ({sub.city})</span>
                          </div>
                          {activeSubsidiaryId === sub.id && <Check className="w-4 h-4 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une facture, un client, un montant..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100 border border-transparent rounded-2xl focus:bg-white focus:border-slate-300 focus:outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Right Section: Notification Drawer Trigger + Date + Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Create Invoice CTA */}
          <Link
            href="/invoices/new"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Facture</span>
          </Link>

          {/* Date Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{today}</span>
          </div>

          {/* Notifications Drawer Button */}
          <button
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            title="Notifications MonneyFact"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-orange-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Quick Admin Badge if Super Admin */}
          {isAdmin && (
            <Link
              href="/admin"
              className="px-2.5 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl text-[10px] font-extrabold uppercase tracking-wider"
            >
              Cockpit Super Admin
            </Link>
          )}

          {/* Collaborator Finish Button vs Standard Logout */}
          {isCollaborator ? (
            <button
              onClick={handleFinishCollaboratorTask}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              <span>FINI / TÂCHE EFFECTUÉE</span>
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Slide-over Notifications Drawer */}
      <NotificationsDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </header>
  );
};
