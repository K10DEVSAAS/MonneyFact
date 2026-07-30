'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useAuth } from '@/lib/auth/authContext';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isAuthenticated, isLoadingSession } = useAuth();

  // STRICT SECURITY PROTECTION: Block unauthenticated access to /dashboard
  useEffect(() => {
    if (!isLoadingSession && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoadingSession, router]);

  // 1. Show loading screen while validating session
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

  // 2. Block unauthenticated guests and redirect to /login
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
    <div className="min-h-screen bg-slate-100 flex text-slate-900 font-sans">
      {/* Navigation Sidebar */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area WITH lg:pl-64 TO PREVENT OVERLAPPING WITH FIXED SIDEBAR */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all">
        <Topbar onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
