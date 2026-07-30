'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabase/client';

export type UserRole = 'guest' | 'client' | 'super_admin';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string;
  plan?: 'Gratuit' | 'Pro' | 'Business';
  avatarUrl?: string;
}

interface AuthContextType {
  user: UserSession | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoadingSession: boolean;
  loginAsClient: (email?: string) => void;
  loginAsAdmin: () => void;
  registerClient: (companyName: string, email: string, plan: 'Gratuit' | 'Pro' | 'Business') => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ADMIN: UserSession = {
  id: 'usr-admin-99',
  name: 'Fondateur MonneyFact',
  email: 'admin@monneyfact.ci',
  role: 'super_admin',
  companyName: 'MonneyFact Inc. Côte d\'Ivoire',
  plan: 'Business',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);

  // OPTIMIZATION: Default to false if user is stored locally, making page load INSTANT (0ms delay)
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('monneyfact_active_user');
      return !savedUser;
    }
    return false;
  });

  // Restore & Listen to Supabase Auth State in Background
  useEffect(() => {
    let isMounted = true;

    // 1. Instant local restoration (0ms)
    try {
      const savedUser = localStorage.getItem('monneyfact_active_user');
      if (savedUser && isMounted) {
        setUser(JSON.parse(savedUser));
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
          const name = session.user.user_metadata?.full_name || email.split('@')[0];
          const isSuperAdmin = email.toLowerCase() === 'admin@monneyfact.ci';
          const role: UserRole = isSuperAdmin ? 'super_admin' : 'client';

          const activeUser: UserSession = {
            id: session.user.id,
            name: isSuperAdmin ? 'Fondateur MonneyFact' : name,
            email,
            role,
            companyName: isSuperAdmin ? 'MonneyFact Inc. Côte d\'Ivoire' : `${name} Enterprise`,
            plan: 'Business',
          };

          setUser(activeUser);
          localStorage.setItem('monneyfact_active_user', JSON.stringify(activeUser));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setIsLoadingSession(false);
      }
    };

    restoreSession();

    // 3. Listen to OAuth Sign-in & Refresh Events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && session.user && isMounted) {
        const email = session.user.email || '';
        const name = session.user.user_metadata?.full_name || email.split('@')[0];
        const isSuperAdmin = email.toLowerCase() === 'admin@monneyfact.ci';
        const role: UserRole = isSuperAdmin ? 'super_admin' : 'client';

        const activeUser: UserSession = {
          id: session.user.id,
          name: isSuperAdmin ? 'Fondateur MonneyFact' : name,
          email,
          role,
          companyName: isSuperAdmin ? 'MonneyFact Inc. Côte d\'Ivoire' : `${name} Enterprise`,
          plan: 'Business',
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

  const loginAsClient = (email?: string) => {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const isSuperAdmin = normalizedEmail === 'admin@monneyfact.ci';

    const loggedInUser: UserSession = {
      id: isSuperAdmin ? 'usr-admin-99' : `usr-${Date.now()}`,
      name: isSuperAdmin ? 'Fondateur MonneyFact' : (email ? email.split('@')[0] : 'Entreprise Cliente'),
      email: email || 'contact@entreprise.ci',
      role: isSuperAdmin ? 'super_admin' : 'client',
      companyName: isSuperAdmin ? 'MonneyFact Inc. Côte d\'Ivoire' : (email ? email.split('@')[0] : 'Mon Entreprise'),
      plan: 'Business',
    };

    setUser(loggedInUser);
    setIsLoadingSession(false);
    localStorage.setItem('monneyfact_active_user', JSON.stringify(loggedInUser));

    if (isSuperAdmin) {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const loginAsAdmin = () => {
    setUser(DEMO_ADMIN);
    setIsLoadingSession(false);
    localStorage.setItem('monneyfact_active_user', JSON.stringify(DEMO_ADMIN));
    router.push('/admin');
  };

  const registerClient = (companyName: string, email: string, plan: 'Gratuit' | 'Pro' | 'Business') => {
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
    router.push('/dashboard');
  };

  // OFFICIAL GOOGLE OAUTH 2.0 REDIRECT
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
        registerClient,
        loginWithGoogle,
        logout,
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
