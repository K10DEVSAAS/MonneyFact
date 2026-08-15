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
  Sparkles,
  Users,
  Settings,
  HelpCircle,
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
    { name: 'Cockpit Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Gestion Entreprises', href: '/admin/companies', icon: Building2, badge: countCompanies > 0 ? `${countCompanies}` : undefined },
    { name: 'Volume & Transactions', href: '/admin/subscriptions', icon: CreditCard },
    { name: 'Historique & Sécurité', href: '/admin/logs', icon: Activity },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0B0F17] text-slate-300 flex flex-col border-r border-slate-800/60 shadow-2xl transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Branding Header inspired by Profitize */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800/40">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-all">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl text-white tracking-tight font-sans">MonneyFact</span>
              </div>
              <p className="text-[10px] text-indigo-400 font-extrabold tracking-widest uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Super Admin
              </p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl lg:hidden hover:bg-slate-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          <div>
            <p className="px-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">
              Supervision Platform
            </p>
            <div className="space-y-1.5">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => onClose()}
                    className={`group relative flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
                          isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <p className="px-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">
              Système & Support
            </p>
            <div className="space-y-1.5">
              <Link
                href="/admin/settings"
                className={`group flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                  pathname === '/admin/settings'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 group-hover:text-indigo-400" />
                  <span>Configuration Système</span>
                </div>
              </Link>
            </div>
          </div>
        </nav>

        {/* Footer Profile Pill */}
        <div className="p-4 border-t border-slate-800/40 bg-[#0B0F17]">
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/60">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center shadow-md shrink-0">
                SA
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white truncate">Super Admin</p>
                <p className="text-[10px] text-slate-400 truncate">admin@monneyfact.ci</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors shrink-0"
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
