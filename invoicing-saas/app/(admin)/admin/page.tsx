'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  Search,
  Crown,
  CheckCircle2,
  BarChart3,
  RefreshCw,
  Ban,
  Play,
  Clock,
  History,
  AlertCircle,
  Trash2,
  ArrowUpRight,
  ChevronDown,
  Calendar,
  MoreVertical,
  Users,
  Activity,
  Zap,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import { dbService } from '@/lib/services/dbService';
import { subscriptionService, PLAN_PRICES } from '@/lib/services/subscriptionService';
import { formatFCFA } from '@/lib/utils/formatters';
import { supabase } from '@/lib/supabase/client';

export default function AdminCockpitPage() {
  const { registeredCompanies } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [liveCompanies, setLiveCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('Jan 08 - Aug 08');
  const [activeHoverMonth, setActiveHoverMonth] = useState<string | null>('May');

  useEffect(() => {
    let isMounted = true;

    const fetchCompanies = async () => {
      setLoading(true);
      try {
        const savedListStr = localStorage.getItem('monneyfact_companies_list');
        const localList: any[] = savedListStr ? JSON.parse(savedListStr) : registeredCompanies;

        const dbCompanies = await dbService.getAllRegisteredCompanies();
        const mergedMap = new Map();

        localList.forEach((c) => {
          const planName = c.plan === 'Pro' ? 'Pro' : 'Basique';
          const price = PLAN_PRICES[planName as keyof typeof PLAN_PRICES] || 5000;
          const daysLeft = subscriptionService.calculateDaysRemaining(c.expiresAt);

          mergedMap.set(c.ownerEmail || c.name, {
            id: c.id,
            name: c.name,
            ownerName: c.ownerName || c.name,
            ownerEmail: c.ownerEmail,
            city: c.city || 'Abidjan',
            plan: planName,
            status: c.status || 'active',
            registeredAt: c.registeredAt || new Date().toISOString().split('T')[0],
            expiresAt: c.expiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
            daysRemaining: daysLeft,
            totalInvoiced: c.totalInvoiced || 0,
            monthlySubscription: price,
            subCompaniesCount: c.subCompaniesCount || 0,
            collaboratorsCount: c.collaboratorsCount || 1,
          });
        });

        if (dbCompanies && dbCompanies.length > 0) {
          dbCompanies.forEach((c) => {
            const key = c.email || c.name;
            if (!mergedMap.has(key)) {
              mergedMap.set(key, {
                id: c.id,
                name: c.name,
                ownerName: c.name,
                ownerEmail: c.email || 'contact@entreprise.ci',
                city: 'Abidjan',
                plan: 'Pro',
                status: 'active',
                registeredAt: new Date(c.created_at || Date.now()).toISOString().split('T')[0],
                expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
                daysRemaining: 30,
                totalInvoiced: 0,
                monthlySubscription: 5000,
                subCompaniesCount: 0,
                collaboratorsCount: 1,
              });
            }
          });
        }

        const mergedArray = Array.from(mergedMap.values());
        const savedAuditLogs = localStorage.getItem('monneyfact_audit_logs');

        if (isMounted) {
          setLiveCompanies(mergedArray);
          if (savedAuditLogs) {
            setAuditLogs(JSON.parse(savedAuditLogs));
          } else {
            setAuditLogs([
              {
                id: 'act-1',
                title: 'Jenny Wilson (TechIvoire)',
                action: 'Nouveau Client',
                orderNumber: '#0038160',
                timeAgo: 'il y a 2 min',
                amount: '50 000 FCFA',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
              },
              {
                id: 'act-2',
                title: 'Guy Hawkins (Sipim S.A)',
                action: 'Formule Pro Activée',
                orderNumber: '#0038159',
                timeAgo: 'il y a 15 min',
                amount: '150 000 FCFA',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
              },
              {
                id: 'act-3',
                title: 'Ralph Edwards (Kouassi Distrib)',
                action: 'Création Sous-entreprise',
                orderNumber: '#0038158',
                timeAgo: 'il y a 45 min',
                amount: '25 000 FCFA',
                avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
              },
            ]);
          }
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setLiveCompanies(registeredCompanies);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCompanies();
    return () => {
      isMounted = false;
    };
  }, [registeredCompanies]);

  const displayList = liveCompanies.length > 0 ? liveCompanies : registeredCompanies;

  const totalInvoicedPlatform = displayList.reduce((sum, c) => sum + (c.totalInvoiced || 0), 0);
  const totalMRR = displayList.reduce((sum, c) => sum + (c.monthlySubscription !== undefined ? c.monthlySubscription : 5000), 0);
  const activeCount = displayList.filter((c) => c.status === 'active').length;
  const retentionRate = displayList.length > 0 ? Math.round((activeCount / displayList.length) * 10000) / 100 : 100;

  // Monthly Growth Chart Dummy/Calculated Bar Data
  const monthlyData = [
    { month: 'Jan', y2025: 38, y2026: 48 },
    { month: 'Feb', y2025: 45, y2026: 62 },
    { month: 'Mar', y2025: 36, y2026: 42 },
    { month: 'Apr', y2025: 42, y2026: 44 },
    { month: 'May', y2025: 28, y2026: 48, val2025: '25 591 FCFA', val2026: '47 921 FCFA' },
    { month: 'Jun', y2025: 35, y2026: 42 },
    { month: 'Jul', y2025: 46, y2026: 52 },
    { month: 'Aug', y2025: 34, y2026: 46 },
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans text-slate-100 pb-12">
      {/* Top Header Bar inspired by Dribbble Profitize */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Overview</span>
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
              Super Admin SaaS
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supervision globale de la plateforme MonneyFact, abonnements et entreprises clientes.
          </p>
        </div>

        {/* Action Controls & Date Picker */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une entreprise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-64 pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs font-bold text-slate-300 shadow-sm cursor-pointer hover:border-slate-700 transition-all">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>{selectedPeriod}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </div>
        </div>
      </div>

      {/* Main Grid Layout: Left Column (KPIs & Analytics Donut) + Right Column (Bar Chart & Activity Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: KPIs & Donut Analytics (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Section KPIs Title */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white tracking-tight">KPIs</h2>
            <button className="text-slate-400 hover:text-white p-1 rounded-lg">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {/* KPI Card 1: Current MRR */}
          <div className="p-6 bg-[#0E131F] rounded-3xl border border-slate-800/80 shadow-xl space-y-3 relative group hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Current MRR</span>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3" />
                16%
              </span>
            </div>
            <div className="text-3xl font-black text-white tracking-tight">
              {totalMRR > 0 ? formatFCFA(totalMRR) : '855.4k FCFA'}
            </div>
            <p className="text-[11px] text-slate-500">Revenu récurrent mensuel des abonnements</p>
          </div>

          {/* KPI Card 2: Current Customers */}
          <div className="p-6 bg-[#0E131F] rounded-3xl border border-slate-800/80 shadow-xl space-y-3 relative group hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Entreprises Enregistrées</span>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3" />
                17%
              </span>
            </div>
            <div className="text-3xl font-black text-white tracking-tight">
              {displayList.length.toLocaleString('fr-FR')}
            </div>
            <p className="text-[11px] text-slate-500">Comptes entreprises actifs sur la plateforme</p>
          </div>

          {/* KPI Card 3: Active Rate */}
          <div className="p-6 bg-[#0E131F] rounded-3xl border border-slate-800/80 shadow-xl space-y-3 relative group hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Taux d&apos;Activité</span>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3" />
                21%
              </span>
            </div>
            <div className="text-3xl font-black text-white tracking-tight">
              {retentionRate}%
            </div>
            <p className="text-[11px] text-slate-500">Ratio des abonnements actifs sans retard</p>
          </div>

          {/* Donut Chart / Analytics Section */}
          <div className="p-6 bg-[#0E131F] rounded-3xl border border-slate-800/80 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white tracking-tight">Analytics</h3>
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </div>

            {/* SVG Donut Chart */}
            <div className="flex items-center justify-center relative py-4">
              <svg className="w-44 h-44 transform -rotate-90">
                <circle cx="88" cy="88" r="65" stroke="#1E293B" strokeWidth="22" fill="transparent" />
                {/* Segment 1: 55.5% (Violet / Indigo) */}
                <circle
                  cx="88"
                  cy="88"
                  r="65"
                  stroke="#6366F1"
                  strokeWidth="22"
                  strokeDasharray="408"
                  strokeDashoffset="181"
                  fill="transparent"
                  className="transition-all duration-1000"
                />
                {/* Segment 2: 33.5% (Emerald) */}
                <circle
                  cx="88"
                  cy="88"
                  r="65"
                  stroke="#10B981"
                  strokeWidth="22"
                  strokeDasharray="408"
                  strokeDashoffset="271"
                  fill="transparent"
                  className="transition-all duration-1000"
                />
                {/* Segment 3: 11% (Slate / Dark) */}
                <circle
                  cx="88"
                  cy="88"
                  r="65"
                  stroke="#334155"
                  strokeWidth="22"
                  strokeDasharray="408"
                  strokeDashoffset="363"
                  fill="transparent"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-white">55.5%</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Offre Pro</span>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-center">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
                  <span>Formule Pro</span>
                </div>
                <p className="text-xs font-black text-white">55.5%</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Basique</span>
                </div>
                <p className="text-xs font-black text-white">33.5%</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block"></span>
                  <span>Essai</span>
                </div>
                <p className="text-xs font-black text-white">11%</p>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Growth Chart & Recent Activity (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Growth Interactive Bar Chart Card */}
          <div className="p-6 lg:p-8 bg-[#0E131F] rounded-3xl border border-slate-800/80 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">This Year Growth</h3>
                <p className="text-xs text-slate-400 mt-0.5">Évolution comparative des souscriptions et revenus</p>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>{selectedPeriod}</span>
                <ChevronDown className="w-3 h-3 text-slate-500 ml-1" />
              </div>
            </div>

            {/* Interactive SVG / Bar Chart Representation */}
            <div className="relative pt-8 pb-4">
              
              {/* Popover Tooltip for "May" */}
              {activeHoverMonth === 'May' && (
                <div className="absolute left-[54%] top-0 -translate-x-1/2 bg-white text-slate-900 rounded-2xl px-4 py-3 shadow-2xl z-20 space-y-1 border border-slate-100 animate-scale-in text-xs font-sans">
                  <p className="font-extrabold text-slate-900 border-b border-slate-100 pb-1">May</p>
                  <div className="flex items-center justify-between gap-4 text-[11px]">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-xs bg-slate-900 inline-block"></span>
                      2025
                    </span>
                    <span className="font-bold font-mono">25,591.00 FCFA</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-[11px]">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-xs bg-indigo-500 inline-block"></span>
                      2026
                    </span>
                    <span className="font-bold font-mono text-indigo-600">47,921.00 FCFA</span>
                  </div>
                </div>
              )}

              {/* Bars Container */}
              <div className="h-64 flex items-end justify-between gap-3 px-4 border-b border-slate-800/60 pb-2">
                {monthlyData.map((d) => {
                  const isMay = d.month === 'May';
                  return (
                    <div
                      key={d.month}
                      onMouseEnter={() => setActiveHoverMonth(d.month)}
                      className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                    >
                      <div className="w-full flex items-end justify-center gap-1.5 h-48 relative">
                        {/* 2025 Bar (Solid Dark Slate) */}
                        <div
                          style={{ height: `${d.y2025}%` }}
                          className="w-4 sm:w-5 bg-slate-800 rounded-t-md transition-all group-hover:bg-slate-700"
                        />
                        {/* 2026 Bar (Pattern / Indigo Accent) */}
                        <div
                          style={{ height: `${d.y2026}%` }}
                          className={`w-4 sm:w-5 rounded-t-md transition-all ${
                            isMay
                              ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-lg shadow-indigo-600/40'
                              : 'bg-indigo-500/40 group-hover:bg-indigo-500'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-extrabold ${isMay ? 'text-white font-black' : 'text-slate-500'}`}>
                        {d.month}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Y-Axis Labels */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-3 px-2 font-mono">
                <span>0 FCFA</span>
                <span>30k FCFA</span>
                <span>40k FCFA</span>
                <span>50k FCFA</span>
                <span>70k FCFA</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Table / Feed Card */}
          <div className="p-6 lg:p-8 bg-[#0E131F] rounded-3xl border border-slate-800/80 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Recent Activity</h3>
                <p className="text-xs text-slate-400 mt-0.5">Historique en temps réel des actions Super Admin et inscriptions</p>
              </div>

              <Link
                href="/admin/logs"
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-extrabold text-indigo-400 hover:text-indigo-300 rounded-xl transition-all flex items-center gap-1.5"
              >
                <span>Voir tout l&apos;historique</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Activity Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/60 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-3">Customer</th>
                    <th className="pb-3 px-3">Status / Action</th>
                    <th className="pb-3 px-3">Order Number</th>
                    <th className="pb-3 px-3">Retained</th>
                    <th className="pb-3 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {auditLogs.slice(0, 5).map((act, idx) => (
                    <tr key={act.id || idx} className="hover:bg-slate-900/40 transition-colors group">
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={act.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(act.title || 'Client')}`}
                            alt="Avatar"
                            className="w-9 h-9 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <p className="font-extrabold text-white group-hover:text-indigo-400 transition-colors">
                              {act.title || act.companyName || 'Entreprise Cliente'}
                            </p>
                            <p className="text-[10px] text-slate-500">{act.userEmail || 'compte.verifie@monneyfact.ci'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-3 font-semibold">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-slate-900 border border-slate-800 text-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          {act.action || act.details || 'New Customer'}
                        </span>
                      </td>

                      <td className="py-4 px-3 font-mono text-slate-400 text-xs">
                        {act.orderNumber || `#00381${60 - idx}`}
                      </td>

                      <td className="py-4 px-3 text-slate-400 text-xs">
                        {act.timeAgo || act.timestamp || 'Récemment'}
                      </td>

                      <td className="py-4 px-3 text-right font-mono font-bold text-white">
                        {act.amount || '50 000 FCFA'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
