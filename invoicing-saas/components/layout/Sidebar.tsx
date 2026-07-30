'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  X,
  Receipt,
  Building2,
  LogOut,
  UserCheck,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { useAppStore } from '@/lib/store/appStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { organization, invoices, clients } = useAppStore();

  const isBusinessPlan = organization.plan === 'Business';

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Factures', href: '/invoices', icon: FileText, badge: invoices.length > 0 ? invoices.length.toString() : undefined },
    { name: 'Clients', href: '/clients', icon: Users, badge: clients.length > 0 ? clients.length.toString() : undefined },
    { name: 'Équipe & Comptables', href: '/team', icon: UserCheck, crownBadge: !isBusinessPlan },
    { name: 'Multi-Entreprises', href: '/subsidiaries', icon: Building2, crownBadge: !isBusinessPlan },
    { name: 'Paramètres', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-zinc-950 text-zinc-300 flex flex-col border-r border-zinc-800 transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding */}
        <div className="p-5 flex items-center justify-between border-b border-zinc-800/80">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            {organization.logoUrl ? (
              /* eslint-disable-next-html-element-suppression */
              <div className="w-10 h-10 rounded-xl bg-white p-1 border border-zinc-800 flex items-center justify-center shrink-0">
                <img src={organization.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30 group-hover:scale-105 transition-transform font-bold">
                <Receipt className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-white tracking-tight">MonneyFact</span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">Facturation 🇨🇮</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Organization Card Switcher */}
        <div className="px-4 py-3 border-b border-zinc-800/60">
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{organization.name}</p>
                <p className="text-[10px] text-orange-400 font-bold font-mono">Plan {organization.plan || 'Pro'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Menu Principal</p>
          </div>

          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose()}
                className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
                  <span>{item.name}</span>
                </div>

                {item.crownBadge ? (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>Business</span>
                  </span>
                ) : item.badge ? (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-900 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user?.name?.substring(0, 2).toUpperCase() || 'US'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Utilisateur'}</p>
                <p className="text-[11px] text-zinc-400 truncate">{user?.email || 'contact@monneyfact.ci'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Déconnexion"
              className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
