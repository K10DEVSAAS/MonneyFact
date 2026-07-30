'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, Search, Bell, Plus, Calendar, LogOut, Building2, ChevronDown, Check, Building } from 'lucide-react';
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
      if (saved) setSubsidiaries(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const today = formatDate(new Date().toISOString());
  const unreadCount = isAdmin ? unreadAdminNotifCount : unreadCompanyNotifCount;

  const activeSubName = activeSubsidiaryId === 'global'
    ? '📊 Vue Consolidée (Toutes les Agences)'
    : subsidiaries.find((s) => s.id === activeSubsidiaryId)?.name || 'Établissement Sélectionné';

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all text-slate-900">
      <div className="flex items-center justify-between gap-4">
        {/* Left Section: Mobile Menu + Title + Multi-Company Context Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 lg:hidden transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
                {isAdmin && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 border border-amber-500/30">
                    SUPER ADMIN
                  </span>
                )}
              </div>

              {/* CLEAN CONTEXT BADGE OR SWITCHER */}
              {!isAdmin && (
                <div className="relative mt-0.5">
                  {subsidiaries.length > 0 ? (
                    <>
                      <button
                        onClick={() => setIsSubDropdownOpen(!isSubDropdownOpen)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100/80 border border-orange-200 px-2.5 py-1 rounded-xl transition-all"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[200px]">{activeSubName}</span>
                        <ChevronDown className="w-3 h-3 text-orange-500 shrink-0" />
                      </button>

                      {isSubDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-fade-in space-y-1 text-xs font-semibold">
                          <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400">
                            Changer le Contexte d&apos;Entreprise
                          </div>

                          <button
                            onClick={() => {
                              setActiveSubsidiaryId('global');
                              setIsSubDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                              activeSubsidiaryId === 'global'
                                ? 'bg-orange-600 text-white font-extrabold'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span>📊 Vue Consolidée (Toutes)</span>
                            {activeSubsidiaryId === 'global' && <Check className="w-4 h-4" />}
                          </button>

                          {subsidiaries.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => {
                                setActiveSubsidiaryId(sub.id);
                                setIsSubDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                                activeSubsidiaryId === sub.id
                                  ? 'bg-orange-600 text-white font-extrabold'
                                  : 'hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <div className="truncate">
                                <p className="truncate font-bold">{sub.name}</p>
                                <p className={`text-[10px] ${activeSubsidiaryId === sub.id ? 'text-orange-100' : 'text-slate-400'}`}>
                                  {sub.type} ({sub.city})
                                </p>
                              </div>
                              {activeSubsidiaryId === sub.id && <Check className="w-4 h-4 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    /* CLEAN BADGE FOR SINGLE COMPANY STATE */
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-lg">
                      <Building className="w-3 h-3 text-orange-600" />
                      <span className="truncate">{organization.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une facture, un client..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Right Actions: Notifications & Primary CTA */}
        <div className="flex items-center gap-3 relative">
          {/* Notifications Bell Button */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-orange-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <NotificationsDrawer
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
            />
          </div>

          {/* Quick Create Invoice CTA */}
          {!isAdmin && (
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle Facture</span>
              <span className="sm:hidden">Créer</span>
            </Link>
          )}

          {/* User Logout Button */}
          {user && (
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors hidden sm:flex"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
