'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, Bell, Plus, Calendar, LogOut } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';
import { NotificationsDrawer } from './NotificationsDrawer';
import { useAuth } from '@/lib/auth/authContext';
import { useAppStore } from '@/lib/store/appStore';

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
  const { organization, unreadCompanyNotifCount, unreadAdminNotifCount } = useAppStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const today = formatDate(new Date().toISOString());

  const unreadCount = isAdmin ? unreadAdminNotifCount : unreadCompanyNotifCount;

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left Section: Mobile Menu + Title + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 lg:hidden transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            {organization.logoUrl && !isAdmin && (
              /* eslint-disable-next-html-element-suppression */
              <div className="w-8 h-8 rounded-lg border border-slate-200 p-0.5 overflow-hidden shrink-0">
                <img src={organization.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
                {isAdmin && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 border border-amber-500/30">
                    SUPER ADMIN
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium hidden sm:flex">
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                <span>Aujourd&apos;hui : {today}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une facture, un client, un montant..."
              className="w-full pl-10 pr-12 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Actions: Notifications, User Profile & Primary CTA */}
        <div className="flex items-center gap-3 relative">
          {/* Notifications Bell Button */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-orange-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <NotificationsDrawer
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
            />
          </div>

          {/* Quick Create Invoice CTA (only shown for non-super-admins) */}
          {!isAdmin && (
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-md hover:shadow-orange-600/20 transition-all"
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
