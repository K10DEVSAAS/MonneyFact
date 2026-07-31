'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabase/client';
import { PlanType } from '../types/invoice';

export type UserRole = 'guest' | 'client' | 'super_admin';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string;
  plan?: PlanType;
  avatarUrl?: string;
  isCollaborator?: boolean;
  hostCompanyName?: string;
  collaboratorTimeMinutes?: number;
  sessionEndTime?: number;
}

interface AuthContextType {
  user: UserSession | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoadingSession: boolean;
  loginAsClient: (email?: string) => { success: boolean; error?: string };
  loginAsAdmin: () => void;
  loginAsCollaborator: (name: string, email: string, hostCompanyName: string, plan: PlanType, timeMinutes?: number) => void;
  registerClient: (companyName: string, email: string, plan: PlanType) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  isAccountDeleted: (email: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ADMIN: UserSession = {
  id: 'usr-admin-99',
  name: 'Fondateur MonneyFact',
  email: 'admin@monneyfact.ci',
  role: 'super_admin',
  companyName: 'MonneyFact Inc. Côte d\'Ivoire',
  plan: 'Pro',
};

// Check if an email is registered under a deleted company
function checkAccountDeleted(email?: string): boolean {
  if (!email) return false;
  try {
    const deletedStr = localStorage.getItem('monneyfact_deleted_companies');
    if (deletedStr) {
      const deletedEmails: string[] = JSON.parse(deletedStr);
      return deletedEmails.map((e) => e.toLowerCase()).includes(email.toLowerCase());
    }
  } catch (e) {
    console.error(e);
  }
  return false;
}

// Helper function to resolve stored plan for an email (Default to 'Basique' or 'Pro')
function resolveUserPlan(email?: string): PlanType {
  if (!email) return 'Basique';
  if (email.toLowerCase() === 'admin@monneyfact.ci') return 'Pro';

  try {
    const savedStr = localStorage.getItem('monneyfact_companies_list');
    if (savedStr) {
      const companies: any[] = JSON.parse(savedStr);
      const found = companies.find(
        (c) => (c.ownerEmail && c.ownerEmail.toLowerCase() === email.toLowerCase()) ||
               (c.email && c.email.toLowerCase() === email.toLowerCase()) ||
               (c.name && c.name.toLowerCase() === email.toLowerCase())
      );
      if (found && found.plan) {
        return found.plan === 'Pro' ? 'Pro' : 'Basique';
      }
    }
  } catch (e) {
    console.error(e);
  }
  return 'Pro';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);

  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('monneyfact_active_user');
      return !savedUser;
    }
    return false;
  });

  useEffect(() => {
    let isMounted = true;

    // 1. Instant local restoration
    try {
      const savedUser = localStorage.getItem('monneyfact_active_user');
      if (savedUser && isMounted) {
        const parsed: UserSession = JSON.parse(savedUser);
        if (checkAccountDeleted(parsed.email)) {
          localStorage.removeItem('monneyfact_active_user');
          setUser(null);
          setIsLoadingSession(false);
          return;
        }

        parsed.plan = resolveUserPlan(parsed.email);
        setUser(parsed);
        setIsLoadingSession(false);
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Background verification with Supabase SDK
    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user && isMounted) {
          const email = session.user.email || '';

          if (checkAccountDeleted(email)) {
            await supabase.auth.signOut();
            localStorage.removeItem('monneyfact_active_user');
            setUser(null);
            return;
          }

          const name = session.user.user_metadata?.full_name || email.split('@')[0];
          const isSuperAdmin = email.toLowerCase() === 'admin@monneyfact.ci';
          const role: UserRole = isSuperAdmin ? 'super_admin' : 'client';
          const actualPlan = resolveUserPlan(email);

          const activeUser: UserSession = {
            id: session.user.id,
            name: isSuperAdmin ? 'Fondateur MonneyFact' : name,
            email,
            role,
            companyName: isSuperAdmin ? 'MonneyFact Inc. Côte d\'Ivoire' : `${name} Enterprise`,
            plan: actualPlan,
          };

          setUser(activeUser);
          localStorage.setItem('monneyfact_active_user', JSON.stringify(activeUser));
        }
      } finally {
        if (isMounted) setIsLoadingSession(false);
      }
    };

    restoreSession();

    // 3. Listen to OAuth Sign-in & Refresh Events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && session.user && isMounted) {
        const email = session.user.email || '';

        if (checkAccountDeleted(email)) {
          supabase.auth.signOut();
          localStorage.removeItem('monneyfact_active_user');
          setUser(null);
          return;
        }

        const name = session.user.user_metadata?.full_name || email.split('@')[0];
        const isSuperAdmin = email.toLowerCase() === 'admin@monneyfact.ci';
        const role: UserRole = isSuperAdmin ? 'super_admin' : 'client';
        const actualPlan = resolveUserPlan(email);

        const activeUser: UserSession = {
          id: session.user.id,
          name: isSuperAdmin ? 'Fondateur MonneyFact' : name,
          email,
          role,
          companyName: isSuperAdmin ? 'MonneyFact Inc. Côte d\'Ivoire' : `${name} Enterprise`,
          plan: actualPlan,
        };

        setUser(activeUser);
        localStorage.setItem('monneyfact_active_user', JSON.stringify(activeUser));
      } else if (event === 'SIGNED_OUT' && isMounted) {
        setUser(null);
        localStorage.removeItem('monneyfact_active_user');
      }
      if (isMounted) setIsLoadingSession(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loginAsClient = (email?: string): { success: boolean; error?: string } => {
    const normalizedEmail = (email || '').toLowerCase().trim();

    if (checkAccountDeleted(normalizedEmail)) {
      return {
        success: false,
        error: "Ce compte entreprise a été supprimé de la base de données par le Super Administrateur. Votre email et mot de passe ne sont plus reconnus. Veuillez vous réinscrire.",
      };
    }

    const isSuperAdmin = normalizedEmail === 'admin@monneyfact.ci';
    const actualPlan = resolveUserPlan(email);

    const loggedInUser: UserSession = {
      id: isSuperAdmin ? 'usr-admin-99' : `usr-${Date.now()}`,
      name: isSuperAdmin ? 'Fondateur MonneyFact' : (email ? email.split('@')[0] : 'Entreprise Cliente'),
      email: email || 'contact@entreprise.ci',
      role: isSuperAdmin ? 'super_admin' : 'client',
      companyName: isSuperAdmin ? 'MonneyFact Inc. Côte d\'Ivoire' : (email ? email.split('@')[0] : 'Mon Entreprise'),
      plan: actualPlan,
    };

    setUser(loggedInUser);
    setIsLoadingSession(false);
    localStorage.setItem('monneyfact_active_user', JSON.stringify(loggedInUser));

    if (isSuperAdmin) {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }

    return { success: true };
  };

  const loginAsAdmin = () => {
    setUser(DEMO_ADMIN);
    setIsLoadingSession(false);
    localStorage.setItem('monneyfact_active_user', JSON.stringify(DEMO_ADMIN));
    router.push('/admin');
  };

  const loginAsCollaborator = (
    name: string,
    email: string,
    hostCompanyName: string,
    plan: PlanType,
    timeMinutes: number = 30
  ) => {
    const sessionEndTime = Date.now() + timeMinutes * 60 * 1000;
    const colUser: UserSession = {
      id: `collab-${Date.now()}`,
      name,
      email,
      role: 'client',
      companyName: hostCompanyName,
      hostCompanyName,
      plan,
      isCollaborator: true,
      collaboratorTimeMinutes: timeMinutes,
      sessionEndTime,
    };

    setUser(colUser);
    setIsLoadingSession(false);
    localStorage.setItem('monneyfact_active_user', JSON.stringify(colUser));
    router.push('/dashboard');
  };

  const registerClient = (companyName: string, email: string, plan: PlanType) => {
    // If re-registering after deletion, remove from deleted list
    try {
      const deletedStr = localStorage.getItem('monneyfact_deleted_companies');
      if (deletedStr) {
        const deleted: string[] = JSON.parse(deletedStr);
        const updated = deleted.filter((e) => e.toLowerCase() !== email.toLowerCase());
        localStorage.setItem('monneyfact_deleted_companies', JSON.stringify(updated));
      }
    } catch (e) {
      console.error(e);
    }

    const newUser: UserSession = {
      id: `usr-${Date.now()}`,
      name: companyName,
      email,
      role: 'client',
      companyName,
      plan,
    };

    setUser(newUser);
    setIsLoadingSession(false);
    localStorage.setItem('monneyfact_active_user', JSON.stringify(newUser));

    try {
      const savedStr = localStorage.getItem('monneyfact_companies_list');
      const companies: any[] = savedStr ? JSON.parse(savedStr) : [];
      const newCompany = {
        id: `org-${Date.now()}`,
        name: companyName,
        ownerName: companyName,
        ownerEmail: email,
        city: 'Abidjan',
        plan: plan,
        status: 'active',
        registeredAt: new Date().toISOString().split('T')[0],
        totalInvoiced: 0,
        monthlySubscription: plan === 'Pro' ? 5000 : 1000,
      };
      localStorage.setItem('monneyfact_companies_list', JSON.stringify([newCompany, ...companies.filter((c) => c.ownerEmail !== email)]));
    } catch (e) {
      console.error(e);
    }

    router.push('/dashboard');
  };

  const loginWithGoogle = async () => {
    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error('Erreur Google OAuth:', error.message);
      loginAsClient('compte.google@gmail.com');
    }
  };

  const logout = async () => {
    setUser(null);
    setIsLoadingSession(false);
    localStorage.removeItem('monneyfact_active_user');
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    router.push('/login');
  };

  const role: UserRole = user ? user.role : 'guest';
  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoadingSession,
        loginAsClient,
        loginAsAdmin,
        loginAsCollaborator,
        registerClient,
        loginWithGoogle,
        logout,
        isAccountDeleted: checkAccountDeleted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

