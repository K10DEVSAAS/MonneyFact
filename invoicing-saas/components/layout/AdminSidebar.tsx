'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  Building2,
  CreditCard,
  Activity,
  LogOut,
  X,
  Crown,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { useAppStore } from '@/lib/store/appStore';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { registeredCompanies } = useAppStore();

  const countCompanies = registeredCompanies.length;

  const navigation = [
    { name: 'Cockpit Global', href: '/admin', icon: LayoutDashboard },
    { name: 'Entreprises Inscrites', href: '/admin/companies', icon: Building2, badge: `${countCompanies}` },
    { name: 'Abonnements & MRR', href: '/admin/subscriptions', icon: CreditCard },
    { name: 'Sécurité & Logs', href: '/admin/logs', icon: Activity },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/70 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-zinc-950 text-zinc-300 flex flex-col border-r border-orange-900/30 transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Branding Header */}
        <div className="p-5 flex items-center justify-between border-b border-orange-900/20 bg-zinc-950">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/30 group-hover:scale-105 transition-transform font-bold">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-white tracking-tight">MonneyFact</span>
              </div>
              <p className="text-[11px] text-orange-400 font-bold tracking-wider uppercase">Super Admin</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Super Admin Status Banner */}
        <div className="px-4 py-3 border-b border-zinc-800/60">
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-orange-300 truncate">Fondateur MonneyFact</p>
              <p className="text-[10px] text-orange-400/80 truncate">
                {countCompanies} entreprise(s) cliente(s)
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Supervision SaaS</p>
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose()}
                className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-orange-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Profile */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between p-2 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
                SA
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Fondateur MonneyFact</p>
                <p className="text-[10px] text-zinc-400 truncate">admin@monneyfact.ci</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
