'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabase/client';
import { PlanType, RoleType, PermissionKey } from '../types/invoice';
import {
  hashPassword,
  verifyPassword,
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
} from './passwordUtils';

export type UserRole = 'guest' | 'client' | 'super_admin';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  companyName?: string;
  plan?: PlanType;
  avatarUrl?: string;
  isCollaborator?: boolean;
  hostCompanyName?: string;
  hostCompanyEmail?: string;
  memberRole?: RoleType;
  permissions?: PermissionKey[];
  accessScope?: 'global' | 'limited';
  allowedSubsidiaryIds?: string[];
  collaboratorTimeMinutes?: number;
  sessionEndTime?: number;
}

export interface StoredUserAccount {
  email: string;
  companyName: string;
  plan: PlanType;
  hash: string;
  salt: string;
  createdAt: string;
}

interface AuthContextType {
  user: UserSession | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoadingSession: boolean;
  loginAsClient: (email?: string, password?: string, isOAuth?: boolean) => Promise<{ success: boolean; error?: string }>;
  syncOAuthUser: (userSession: UserSession) => void;
  loginAsAdmin: () => void;
  loginAsCollaborator: (
    name: string,
    email: string,
    hostCompanyName: string,
    plan: PlanType,
    timeMinutes?: number,
    hostCompanyEmail?: string,
    permissions?: PermissionKey[],
    accessScope?: 'global' | 'limited',
    allowedSubsidiaryIds?: string[],
    memberRole?: RoleType
  ) => void;
  registerClient: (companyName: string, email: string, plan: PlanType, password?: string) => Promise<void>;
  updateUserPassword: (email: string, newPassword: string) => Promise<boolean>;
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

// Helper function to resolve stored plan for an email
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

// Helper to get stored account credentials record
function getStoredAccount(email: string): StoredUserAccount | null {
  try {
    const accountsStr = localStorage.getItem('monneyfact_user_accounts');
    if (accountsStr) {
      const accounts: StoredUserAccount[] = JSON.parse(accountsStr);
      const found = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
      if (found) return found;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

// Helper to save or update stored account
function saveStoredAccount(account: StoredUserAccount): void {
  try {
    const accountsStr = localStorage.getItem('monneyfact_user_accounts');
    const accounts: StoredUserAccount[] = accountsStr ? JSON.parse(accountsStr) : [];
    const filtered = accounts.filter((a) => a.email.toLowerCase() !== account.email.toLowerCase());
    localStorage.setItem('monneyfact_user_accounts', JSON.stringify([account, ...filtered]));
  } catch (e) {
    console.error(e);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);

  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);

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

          let companyName = isSuperAdmin ? 'MonneyFact Inc. Côte d\'Ivoire' : `${name} Enterprise`;
          const savedStr = localStorage.getItem('monneyfact_active_user');
          if (savedStr) {
            try {
              const parsed = JSON.parse(savedStr);
              if (parsed.email?.toLowerCase() === email.toLowerCase() && parsed.companyName) {
                companyName = parsed.companyName;
              }
            } catch (e) {}
          }

          const activeUser: UserSession = {
            id: session.user.id,
            name: isSuperAdmin ? 'Fondateur MonneyFact' : name,
            email,
            role,
            companyName,
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

  const loginAsClient = async (email?: string, password?: string, isOAuth: boolean = false): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = (email || '').toLowerCase().trim();

    if (!normalizedEmail) {
      return { success: false, error: 'Veuillez saisir votre adresse email.' };
    }

    if (!isOAuth && (!password || !password.trim())) {
      return { success: false, error: 'Veuillez saisir votre mot de passe.' };
    }

    // 1. Check Rate Limiting (Brute-Force Protection)
    if (!isOAuth) {
      const rateLimit = checkRateLimit(normalizedEmail);
      if (!rateLimit.allowed) {
        return {
          success: false,
          error: `Accès temporairement bloqué suite à de trop nombreuses tentatives échouées. Veuillez réessayer dans ${rateLimit.remainingSeconds} secondes.`,
        };
      }
    }

    if (checkAccountDeleted(normalizedEmail)) {
      return {
        success: false,
        error: "Ce compte entreprise a été supprimé de la base de données par le Super Administrateur. Votre email et mot de passe ne sont plus reconnus. Veuillez vous réinscrire.",
      };
    }

    const isSuperAdmin = normalizedEmail === 'admin@monneyfact.ci';

    if (!isOAuth) {
      // 2. DATABASE EXISTENCE CHECK: Reject non-existent accounts for password logins
      let isRegistered = false;
      try {
        const savedStr = localStorage.getItem('monneyfact_companies_list');
        if (savedStr) {
          const companies: any[] = JSON.parse(savedStr);
          isRegistered = companies.some(
            (c) =>
              (c.ownerEmail && c.ownerEmail.toLowerCase() === normalizedEmail) ||
              (c.email && c.email.toLowerCase() === normalizedEmail)
          );
        }

        if (!isRegistered) {
          const userOrg = localStorage.getItem(`monneyfact_org_${normalizedEmail}`);
          if (userOrg) isRegistered = true;
        }

        if (!isRegistered && getStoredAccount(normalizedEmail)) {
          isRegistered = true;
        }
      } catch (e) {
        console.error(e);
      }

      if (!isSuperAdmin && !isRegistered) {
        recordFailedAttempt(normalizedEmail);
        return {
          success: false,
          error: "Accès refusé : Aucun compte n'est enregistré avec cet e-mail dans notre base de données. Veuillez créer votre compte entreprise via le formulaire d'inscription.",
        };
      }

      // 3. PASSWORD VERIFICATION
      let storedAccount = getStoredAccount(normalizedEmail);

      // Initial setup fallback for accounts registered before password hashing update or admin demo
      if (!storedAccount && (isSuperAdmin || isRegistered)) {
        const defaultPass = isSuperAdmin ? 'Admin1234' : (password || '');
        const initialHash = await hashPassword(defaultPass);
        storedAccount = {
          email: normalizedEmail,
          companyName: isSuperAdmin ? 'MonneyFact Inc. Côte d\'Ivoire' : normalizedEmail.split('@')[0],
          plan: resolveUserPlan(normalizedEmail),
          hash: initialHash.hash,
          salt: initialHash.salt,
          createdAt: new Date().toISOString(),
        };
        saveStoredAccount(storedAccount);
      }

      if (storedAccount && password) {
        const isValidPassword = await verifyPassword(password, storedAccount.hash, storedAccount.salt);
        if (!isValidPassword) {
          const failedResult = recordFailedAttempt(normalizedEmail);
          const attemptsLeftText = failedResult.attemptsLeft !== undefined && failedResult.attemptsLeft > 0
            ? ` (${failedResult.attemptsLeft} essai(s) restant(s))`
            : '';
          return {
            success: false,
            error: `Identifiants invalides : Le mot de passe saisi est incorrect${attemptsLeftText}.`,
          };
        }
      }

      // Attempt Supabase auth login in background if available
      try {
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: password || '',
        });
      } catch (sbErr) {
        console.warn('Supabase login notice:', sbErr);
      }
    }

    // Successful login -> Clear rate limits
    clearRateLimit(normalizedEmail);

    const actualPlan = resolveUserPlan(normalizedEmail);
    let foundCompanyName = isSuperAdmin ? 'MonneyFact Inc. Côte d\'Ivoire' : (normalizedEmail ? normalizedEmail.split('@')[0] : 'Mon Entreprise');
    let foundUserId = isSuperAdmin ? 'usr-admin-99' : `usr-${Date.now()}`;

    if (!isSuperAdmin) {
      try {
        const savedOrgStr = localStorage.getItem(`monneyfact_org_${normalizedEmail}`);
        if (savedOrgStr) {
          const savedOrg = JSON.parse(savedOrgStr);
          if (savedOrg.name) foundCompanyName = savedOrg.name;
          if (savedOrg.id) foundUserId = savedOrg.id;
        } else {
          const savedListStr = localStorage.getItem('monneyfact_companies_list');
          if (savedListStr) {
            const list: any[] = JSON.parse(savedListStr);
            const found = list.find((c) =>
              (c.ownerEmail && c.ownerEmail.toLowerCase() === normalizedEmail) ||
              (c.email && c.email.toLowerCase() === normalizedEmail)
            );
            if (found) {
              foundCompanyName = found.name || found.ownerName || foundCompanyName;
              if (found.id) foundUserId = found.id;
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    const loggedInUser: UserSession = {
      id: foundUserId,
      name: isSuperAdmin ? 'Fondateur MonneyFact' : foundCompanyName,
      email: normalizedEmail,
      role: isSuperAdmin ? 'super_admin' : 'client',
      companyName: foundCompanyName,
      plan: actualPlan,
    };

    setUser(loggedInUser);
    setIsLoadingSession(false);
    localStorage.setItem('monneyfact_active_user', JSON.stringify(loggedInUser));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('monneyfact_auth_change'));
    }

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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('monneyfact_auth_change'));
    }
    router.push('/admin');
  };

  const loginAsCollaborator = (
    name: string,
    email: string,
    hostCompanyName: string,
    plan: PlanType,
    timeMinutes: number = 30,
    hostCompanyEmail?: string,
    permissions?: PermissionKey[],
    accessScope?: 'global' | 'limited',
    allowedSubsidiaryIds?: string[],
    memberRole?: RoleType
  ) => {
    const sessionEndTime = Date.now() + timeMinutes * 60 * 1000;
    const colUser: UserSession = {
      id: `collab-${Date.now()}`,
      name,
      email,
      role: 'client',
      companyName: hostCompanyName,
      hostCompanyName,
      hostCompanyEmail,
      memberRole,
      permissions: permissions || ['create_invoices', 'send_invoices', 'manage_clients', 'view_analytics', 'manage_payments'],
      accessScope: accessScope || 'global',
      allowedSubsidiaryIds: allowedSubsidiaryIds || [],
      plan,
      isCollaborator: true,
      collaboratorTimeMinutes: timeMinutes,
      sessionEndTime,
    };

    setUser(colUser);
    setIsLoadingSession(false);
    localStorage.setItem('monneyfact_active_user', JSON.stringify(colUser));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('monneyfact_auth_change'));
    }
    router.push('/dashboard');
  };

  const registerClient = async (companyName: string, email: string, plan: PlanType, password?: string) => {
    const cleanEmail = email.toLowerCase().trim();

    // If re-registering after deletion, remove from deleted list
    try {
      const deletedStr = localStorage.getItem('monneyfact_deleted_companies');
      if (deletedStr) {
        const deleted: string[] = JSON.parse(deletedStr);
        const updated = deleted.filter((e) => e.toLowerCase() !== cleanEmail);
        localStorage.setItem('monneyfact_deleted_companies', JSON.stringify(updated));
      }
    } catch (e) {
      console.error(e);
    }

    // Hash password and store in user credentials database
    if (password && password.trim()) {
      const hashRes = await hashPassword(password);
      const newAccount: StoredUserAccount = {
        email: cleanEmail,
        companyName,
        plan,
        hash: hashRes.hash,
        salt: hashRes.salt,
        createdAt: new Date().toISOString(),
      };
      saveStoredAccount(newAccount);
    }

    // Try Supabase auth registration
    if (password && password.trim()) {
      try {
        await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: { company_name: companyName },
          },
        });
      } catch (sbErr) {
        console.warn('Supabase signup notice:', sbErr);
      }
    }

    const newUser: UserSession = {
      id: `usr-${Date.now()}`,
      name: companyName,
      email: cleanEmail,
      role: 'client',
      companyName,
      plan,
    };

    setUser(newUser);
    setIsLoadingSession(false);
    localStorage.setItem('monneyfact_active_user', JSON.stringify(newUser));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('monneyfact_auth_change'));
    }

    try {
      const savedStr = localStorage.getItem('monneyfact_companies_list');
      const companies: any[] = savedStr ? JSON.parse(savedStr) : [];
      const newCompany = {
        id: `org-${Date.now()}`,
        name: companyName,
        ownerName: companyName,
        ownerEmail: cleanEmail,
        city: 'Abidjan',
        plan: plan,
        status: 'active',
        registeredAt: new Date().toISOString().split('T')[0],
        totalInvoiced: 0,
        monthlySubscription: plan === 'Pro' ? 5000 : 1000,
      };
      localStorage.setItem('monneyfact_companies_list', JSON.stringify([newCompany, ...companies.filter((c) => c.ownerEmail !== cleanEmail)]));
    } catch (e) {
      console.error(e);
    }

    router.push('/dashboard');
  };

  const updateUserPassword = async (email: string, newPassword: string): Promise<boolean> => {
    const cleanEmail = email.toLowerCase().trim();
    if (!newPassword || newPassword.length < 6) return false;

    try {
      const hashRes = await hashPassword(newPassword);
      const existingAccount = getStoredAccount(cleanEmail);
      const updatedAccount: StoredUserAccount = {
        email: cleanEmail,
        companyName: existingAccount?.companyName || cleanEmail.split('@')[0],
        plan: existingAccount?.plan || 'Pro',
        hash: hashRes.hash,
        salt: hashRes.salt,
        createdAt: existingAccount?.createdAt || new Date().toISOString(),
      };
      saveStoredAccount(updatedAccount);
      clearRateLimit(cleanEmail);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
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
      await loginAsClient('compte.google@gmail.com', 'GoogleOAuthFallbackPass123!');
    }
  };

  const syncOAuthUser = (userSession: UserSession) => {
    console.log('[AUTH] syncOAuthUser START');
    console.log('[AUTH] syncOAuthUser USER', userSession);
    setUser(userSession);
    setIsLoadingSession(false);
    localStorage.setItem('monneyfact_active_user', JSON.stringify(userSession));
    console.log('[AUTH] syncOAuthUser isAuthenticated=true');
    console.log('[AUTH] syncOAuthUser isLoadingSession=false');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('monneyfact_auth_change'));
    }
    console.log('[AUTH] syncOAuthUser END');
  };

  const logout = async () => {
    setUser(null);
    setIsLoadingSession(false);
    localStorage.removeItem('monneyfact_active_user');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('monneyfact_auth_change'));
    }
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
        syncOAuthUser,
        loginAsAdmin,
        loginAsCollaborator,
        registerClient,
        updateUserPassword,
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


