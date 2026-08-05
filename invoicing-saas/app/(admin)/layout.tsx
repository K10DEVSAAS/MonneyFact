'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useAuth } from '@/lib/auth/authContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, role } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || role !== 'super_admin') {
      router.push('/login');
    }
  }, [isAuthenticated, role, router]);

  if (!isAuthenticated || role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white text-xs">
        <span>Accès réservé au Super Administrateur. Redirection vers la connexion...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex font-sans">
      {/* Super Admin Dedicated Sidebar */}
      <AdminSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all">
        <Topbar
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          title="Cockpit Super Administrateur"
        />

        <main className="flex-1 p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
