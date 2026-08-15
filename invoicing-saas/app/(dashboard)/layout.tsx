'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useAuth } from '@/lib/auth/authContext';
import { useAppStore } from '@/lib/store/appStore';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isAuthenticated, isLoadingSession, user } = useAuth();
  const { organization } = useAppStore();

  // LOGS DIAGNOSTIC EXPLICITES DEMANDÉS (ÉTAPE 2)
  console.log('[DASHBOARD] LAYOUT');
  console.log('[DASHBOARD] AUTH STATE', { isAuthenticated, isLoadingSession, user });
  console.log('[AUTH-GUARD] START');
  console.log('[AUTH-GUARD] isLoadingSession=', isLoadingSession);
  console.log('[AUTH-GUARD] isAuthenticated=', isAuthenticated);
  console.log('[AUTH-GUARD] user=', user);
  console.log('[AUTH-GUARD] ACTIVE_USER=', typeof window !== 'undefined' ? localStorage.getItem('monneyfact_active_user') : null);

  // 1. STRICT SECURITY PROTECTION: Block unauthenticated access to /dashboard
  useEffect(() => {
    if (!isLoadingSession && !isAuthenticated) {
      console.log('[AUTH-GUARD] DECISION = REDIRECT /login (Non authentifié)');
      router.push('/login');
    } else if (!isLoadingSession && isAuthenticated) {
      console.log('[AUTH-GUARD] DECISION = AUTORISE ACCES DASHBOARD');
    }
  }, [isAuthenticated, isLoadingSession, router]);



  // Show loading screen while validating session
  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-white">
        <div className="flex items-center gap-3 bg-zinc-900 px-6 py-4 rounded-2xl border border-zinc-800 shadow-xl">
          <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
          <span className="text-xs font-bold text-zinc-300">Vérification de la session sécurisée...</span>
        </div>
      </div>
    );
  }

  // Block unauthenticated guests and redirect to /login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-white">
        <div className="flex items-center gap-3 bg-zinc-900 px-6 py-4 rounded-2xl border border-zinc-800 shadow-xl text-xs font-semibold">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
          <span>Accès protégé. Redirection vers la connexion...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex text-slate-900 font-sans print:bg-white print:p-0">
      {/* Navigation Sidebar - HIDDEN IN PRINT MODE */}
      <div className="print:hidden">
        <Sidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area WITH lg:pl-64 TO PREVENT OVERLAPPING WITH FIXED SIDEBAR */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 print:pl-0 print:p-0 transition-all">
        {/* Topbar Navigation - HIDDEN IN PRINT MODE */}
        <div className="print:hidden">
          <Topbar onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        </div>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto print:p-0 print:overflow-visible">
          <div className="max-w-7xl mx-auto print:max-w-none print:w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
