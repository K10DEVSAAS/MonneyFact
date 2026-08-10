'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Invoice, Client, Organization, DashboardStats, AppNotification, PlanType, Subsidiary, CompanyDashboardResult, MainCompanyDashboardResult } from '../types/invoice';
import { mockOrganization } from '../data/mockData';
import { RegisteredCompany } from '../data/mockAdminData';
import { supabase } from '../supabase/client';
import { PLAN_PRICES } from '../services/subscriptionService';
import { dbService } from '../services/dbService';
import { companyDashboardService } from '../services/companyDashboardService';

const DEFAULT_ORG_UUID = 'e8b8c2a1-94f3-4e67-b8a9-0d1e2f3a4b5c';

function getDeterministicUserOrgId(email?: string): string {
  if (!email || email === 'guest' || email === 'guest@monneyfact.ci') return 'guest-org';
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail === 'admin@monneyfact.ci') return DEFAULT_ORG_UUID;

  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < cleanEmail.length; i++) {
    const ch = cleanEmail.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const p1 = Math.abs(h1).toString(16).padStart(8, '0');
  const p2 = Math.abs(h2).toString(16).padStart(4, '0');
  const p3 = Math.abs(h1 ^ h2).toString(16).padStart(4, '0');
  const p4 = Math.abs(h1 + h2).toString(16).padStart(4, '0');
  const p5 = (Math.abs(h2) * 10007).toString(16).padStart(12, '0').substring(0, 12);

  return `${p1}-${p2}-4${p3.substring(1)}-a${p4.substring(1)}-${p5}`;
}

const getValidUuid = (id?: string, email?: string) => {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) && id !== DEFAULT_ORG_UUID) {
    return id;
  }
  if (email && email !== 'admin@monneyfact.ci') {
    return getDeterministicUserOrgId(email);
  }
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return getDeterministicUserOrgId(email || `usr-${Date.now()}`);
};

export type CompanyContext = 
  | { type: 'main'; mainCompanyId: string }
  | { type: 'subcompany'; mainCompanyId: string; subCompanyId: string; subCompanyName?: string };

interface AppStoreType {
  organization: Organization;
  invoices: Invoice[];
  clients: Client[];
  subsidiaries: Subsidiary[];
  stats: DashboardStats;
  mainCompanyDashboard: MainCompanyDashboardResult;
  currentContext: CompanyContext;
  switchContext: (context: CompanyContext) => void;
  getCompanyDashboard: (companyId?: string) => Promise<CompanyDashboardResult>;
  getMainCompanyDashboard: () => Promise<MainCompanyDashboardResult>;
  companyNotifications: AppNotification[];
  adminNotifications: AppNotification[];
  registeredCompanies: RegisteredCompany[];
  unreadCompanyNotifCount: number;
  unreadAdminNotifCount: number;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  activeSubsidiaryId: string;
  setActiveSubsidiaryId: (id: string) => void;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Promise<void>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => void;
  deleteInvoice: (id: string) => void;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  deleteClient: (id: string) => void;
  addSubsidiary: (sub: Omit<Subsidiary, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  deleteSubsidiary: (id: string) => Promise<void>;
  updateOrganization: (orgData: Partial<Organization>) => void;
  initializeZeroAccount: (companyName: string, email: string, plan?: PlanType) => void;
  purgeAllDatabaseRecords: () => void;
  purgeAllCompanies: () => Promise<void>;
  addCompanyNotif: (title: string, message: string, type?: AppNotification['type']) => void;
  addAdminNotif: (title: string, message: string, type?: AppNotification['type']) => void;
  markCompanyNotifAsRead: (id: string) => void;
  markAllCompanyNotifsAsRead: () => void;
  deleteCompanyNotif: (id: string) => void;
  clearAllCompanyNotifs: () => void;
  markAdminNotifAsRead: (id: string) => void;
  markAllAdminNotifsAsRead: () => void;
  deleteAdminNotif: (id: string) => void;
  clearAllAdminNotifs: () => void;
}

const AppStoreContext = createContext<AppStoreType | undefined>(undefined);

export const AppStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organization, setOrganization] = useState<Organization>(mockOrganization);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [activeSubsidiaryId, setActiveSubsidiaryId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('monneyfact_active_sub_id') || 'global';
    }
    return 'global';
  });
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

  const [companyNotifications, setCompanyNotifications] = useState<AppNotification[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<AppNotification[]>([]);
  const [registeredCompanies, setRegisteredCompanies] = useState<RegisteredCompany[]>([]);

  // Restore & sync state isolated per logged-in user email
  useEffect(() => {
    let isSubscribed = true;

    const loadData = async () => {
      try {
        const savedUser = localStorage.getItem('monneyfact_active_user');
        let userEmail = '';
        let currentOrg = mockOrganization;

        if (!savedUser) {
          if (isSubscribed) {
            setInvoices([]);
            setClients([]);
            setCompanyNotifications([]);
            setOrganization({
              ...mockOrganization,
              id: 'guest-org',
              name: 'Mon Entreprise',
              email: 'guest@monneyfact.ci',
            });
          }
          return;
        }

        const u = JSON.parse(savedUser);
        const isCollab = !!u.isCollaborator;
        if (isCollab && u.hostCompanyEmail) {
          userEmail = u.hostCompanyEmail.toLowerCase();
        } else {
          userEmail = u.email ? u.email.toLowerCase() : '';
        }

        const uniqueUserOrgId = getDeterministicUserOrgId(userEmail);
        const targetOrgId = u.organizationId || ((isCollab || !u.id || u.id === DEFAULT_ORG_UUID || u.id.startsWith('collab-')) ? uniqueUserOrgId : u.id);

        currentOrg = {
          ...mockOrganization,
          id: targetOrgId,
          name: u.hostCompanyName || u.companyName || u.name || mockOrganization.name,
          email: userEmail || u.email || mockOrganization.email,
          plan: u.plan || 'Pro',
        };

        // Try restoring user-specific organization data if not explicitly set by OAuth
        if (userEmail && !u.organizationId) {
          const userOrgKey = `monneyfact_org_${userEmail}`;
          const savedOrg = localStorage.getItem(userOrgKey);
          if (savedOrg) {
            const parsedOrg = JSON.parse(savedOrg);
            currentOrg = {
              ...parsedOrg,
              id: (parsedOrg.id && parsedOrg.id !== DEFAULT_ORG_UUID) ? parsedOrg.id : targetOrgId,
            };
          } else {
            const savedCompList = localStorage.getItem('monneyfact_companies_list');
            if (savedCompList) {
              const compList: any[] = JSON.parse(savedCompList);
              const found = compList.find(
                (c) => (c.ownerEmail && c.ownerEmail.toLowerCase() === userEmail) ||
                       (c.email && c.email.toLowerCase() === userEmail)
              );
              if (found) {
                currentOrg = {
                  ...mockOrganization,
                  id: (found.id && found.id !== DEFAULT_ORG_UUID) ? found.id : targetOrgId,
                  name: found.name || found.ownerName || mockOrganization.name,
                  email: userEmail,
                  plan: found.plan || 'Pro',
                };
              }
            }
          }
        }

        if (isSubscribed) setOrganization(currentOrg);

        // Load isolated user invoices
        let invoiceKey = userEmail ? `monneyfact_invoices_${userEmail}` : 'monneyfact_invoices_guest';
        let savedInvoices = localStorage.getItem(invoiceKey);
        if ((!savedInvoices || savedInvoices === '[]') && userEmail) {
          const altInvoices = localStorage.getItem(`monneyfact_invoices_${userEmail.trim().toLowerCase()}`);
          if (altInvoices && altInvoices !== '[]') savedInvoices = altInvoices;
        }

        if (savedInvoices && isSubscribed) {
          setInvoices(JSON.parse(savedInvoices));
        } else if (isSubscribed) {
          setInvoices([]);
        }

        // Load isolated user clients
        let clientKey = userEmail ? `monneyfact_clients_${userEmail}` : 'monneyfact_clients_guest';
        let savedClients = localStorage.getItem(clientKey);
        if ((!savedClients || savedClients === '[]') && userEmail) {
          const altClients = localStorage.getItem(`monneyfact_clients_${userEmail.trim().toLowerCase()}`);
          if (altClients && altClients !== '[]') savedClients = altClients;
        }

        if (savedClients && isSubscribed) {
          setClients(JSON.parse(savedClients));
        } else if (isSubscribed) {
          setClients([]);
        }

        // Load isolated user subsidiaries
        let subKey = userEmail ? `monneyfact_subsidiaries_${userEmail}` : 'monneyfact_subsidiaries_guest';
        let savedSubs = localStorage.getItem(subKey);
        if ((!savedSubs || savedSubs === '[]') && userEmail) {
          const altSubs = localStorage.getItem('monneyfact_subsidiaries_list');
          if (altSubs && altSubs !== '[]') savedSubs = altSubs;
        }

        if (savedSubs && isSubscribed) {
          setSubsidiaries(JSON.parse(savedSubs));
        } else if (isSubscribed) {
          setSubsidiaries([]);
        }

        const subIdKey = userEmail ? `monneyfact_active_sub_id_${userEmail}` : 'monneyfact_active_sub_id';
        const savedSubId = localStorage.getItem(subIdKey) || localStorage.getItem('monneyfact_active_sub_id');
        if (savedSubId && isSubscribed) setActiveSubsidiaryId(savedSubId);

        const orgNotifKey = `monneyfact_notifs_${userEmail || currentOrg.id}`;
        const savedCompanyNotifs = localStorage.getItem(orgNotifKey);
        if (savedCompanyNotifs && isSubscribed) {
          setCompanyNotifications(JSON.parse(savedCompanyNotifs));
        } else if (isSubscribed) {
          setCompanyNotifications([]);
        }

        const savedAdminNotifs = localStorage.getItem('monneyfact_admin_notifs');
        if (savedAdminNotifs && isSubscribed) setAdminNotifications(JSON.parse(savedAdminNotifs));

        const savedCompList = localStorage.getItem('monneyfact_companies_list');
        if (savedCompList && isSubscribed) {
          setRegisteredCompanies(JSON.parse(savedCompList));
        }

        // Restore from Supabase DB asynchronously for 100% data durability on re-login
        if (userEmail) {
          try {
            const dbOrg = await dbService.getOrganization(userEmail);
            if (dbOrg && isSubscribed) {
              currentOrg = { ...currentOrg, ...dbOrg, id: (dbOrg.id && dbOrg.id !== DEFAULT_ORG_UUID) ? dbOrg.id : uniqueUserOrgId };
              setOrganization(currentOrg);
              localStorage.setItem(`monneyfact_org_${userEmail}`, JSON.stringify(currentOrg));
            }
          } catch (dbErr) {
            console.warn('Supabase org load warning:', dbErr);
          }
        }

        if (currentOrg.id && currentOrg.id !== 'guest-org' && currentOrg.id !== DEFAULT_ORG_UUID && isSubscribed) {
          try {
            const [dbInvoices, dbClients, dbNotifs, dbSubs] = await Promise.all([
              dbService.getInvoices(currentOrg.id),
              dbService.getClients(currentOrg.id),
              dbService.getCompanyNotifications(currentOrg.id),
              dbService.getSubsidiaries(currentOrg.id),
            ]);

            if (isSubscribed) {
              if (dbSubs && dbSubs.length > 0) {
                setSubsidiaries(dbSubs);
                if (userEmail) {
                  localStorage.setItem(`monneyfact_subsidiaries_${userEmail}`, JSON.stringify(dbSubs));
                  localStorage.setItem('monneyfact_subsidiaries_list', JSON.stringify(dbSubs));
                }
              }
              if (dbInvoices && dbInvoices.length > 0) {
                const localInvoicesArr: Invoice[] = savedInvoices ? JSON.parse(savedInvoices) : [];
                const mergedInvoices = dbInvoices.map((dbInv) => {
                  const existingLocal = localInvoicesArr.find(
                    (loc) => loc.id === dbInv.id || loc.invoiceNumber === dbInv.invoiceNumber
                  );
                  return {
                    ...dbInv,
                    subsidiaryId: dbInv.subsidiaryId || existingLocal?.subsidiaryId,
                    subsidiaryName: dbInv.subsidiaryName || existingLocal?.subsidiaryName,
                  };
                });

                const dbInvoiceIds = new Set(dbInvoices.map((i) => i.id));
                const unSyncedLocalInvoices = localInvoicesArr.filter((loc) => !dbInvoiceIds.has(loc.id));
                const finalAllInvoices = [...mergedInvoices, ...unSyncedLocalInvoices];

                setInvoices(finalAllInvoices);
                if (userEmail) localStorage.setItem(`monneyfact_invoices_${userEmail}`, JSON.stringify(finalAllInvoices));
              }
              if (dbClients && dbClients.length > 0) {
                const localClientsArr: Client[] = savedClients ? JSON.parse(savedClients) : [];
                const mergedClients = dbClients.map((dbCli) => {
                  const existingLocal = localClientsArr.find((loc) => loc.id === dbCli.id || loc.name === dbCli.name);
                  return {
                    ...dbCli,
                    subsidiaryId: dbCli.subsidiaryId || existingLocal?.subsidiaryId,
                    subsidiaryName: dbCli.subsidiaryName || existingLocal?.subsidiaryName,
                  };
                });
                setClients(mergedClients);
                if (userEmail) localStorage.setItem(`monneyfact_clients_${userEmail}`, JSON.stringify(mergedClients));
              }
              if (dbNotifs && dbNotifs.length > 0) {
                setCompanyNotifications(dbNotifs);
                if (userEmail) localStorage.setItem(`monneyfact_notifs_${userEmail}`, JSON.stringify(dbNotifs));
              }
            }
          } catch (dbErr) {
            console.warn('Supabase data restoration warning:', dbErr);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    loadData();

    const handleAuthEvent = () => {
      if (isSubscribed) {
        loadData();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('monneyfact_auth_change', handleAuthEvent);
      window.addEventListener('storage', handleAuthEvent);
    }

    return () => {
      isSubscribed = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('monneyfact_auth_change', handleAuthEvent);
        window.removeEventListener('storage', handleAuthEvent);
      }
    };
  }, []);

  const handleSetActiveSub = (subId: string) => {
    setActiveSubsidiaryId(subId);
    try {
      localStorage.setItem('monneyfact_active_sub_id', subId);
    } catch (e) {
      console.error(e);
    }
  };

  const getUserEmail = () => {
    try {
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('monneyfact_active_user') : null;
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.isCollaborator && u.hostCompanyEmail) {
          return u.hostCompanyEmail.toLowerCase();
        }
        if (u.email) return u.email.toLowerCase();
      }
    } catch (e) {
      console.error(e);
    }
    return organization.email ? organization.email.toLowerCase() : 'guest';
  };

  const saveInvoicesForUser = (invList: Invoice[]) => {
    setInvoices(invList);
    try {
      const email = getUserEmail();
      localStorage.setItem(`monneyfact_invoices_${email}`, JSON.stringify(invList));
    } catch (e) {
      console.error(e);
    }
  };

  const saveClientsForUser = (cliList: Client[]) => {
    setClients(cliList);
    try {
      const email = getUserEmail();
      localStorage.setItem(`monneyfact_clients_${email}`, JSON.stringify(cliList));
    } catch (e) {
      console.error(e);
    }
  };

  const saveSubsidiariesForUser = (subList: Subsidiary[]) => {
    setSubsidiaries(subList);
    try {
      const email = getUserEmail();
      localStorage.setItem(`monneyfact_subsidiaries_${email}`, JSON.stringify(subList));
      localStorage.setItem('monneyfact_subsidiaries_list', JSON.stringify(subList));
    } catch (e) {
      console.error(e);
    }
  };

  const addSubsidiary = async (newSub: Omit<Subsidiary, 'id' | 'createdAt'> & { id?: string }) => {
    const isValidUuid = newSub.id && /^[0-9a-f-]{36}$/i.test(newSub.id);
    const generatedId = isValidUuid
      ? newSub.id!
      : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : getDeterministicUserOrgId(`sub-${Date.now()}`));

    const created: Subsidiary = {
      ...newSub,
      id: generatedId,
      createdAt: new Date().toISOString(),
    };

    const updated = [created, ...subsidiaries];
    saveSubsidiariesForUser(updated);

    try {
      if (organization.id) {
        await dbService.createSubsidiary(created);
      }
    } catch (e) {
      console.warn('Supabase createSubsidiary warning:', e);
    }

    addCompanyNotif(
      'Sous-Entreprise Enregistrée',
      `L'établissement "${created.name}" (${created.city}) a été ajouté avec succès.`,
      'success'
    );
  };

  const deleteSubsidiary = async (id: string) => {
    const target = subsidiaries.find((s) => s.id === id);
    const updated = subsidiaries.filter((s) => s.id !== id);
    saveSubsidiariesForUser(updated);

    if (activeSubsidiaryId === id) {
      setActiveSubsidiaryId('global');
    }

    try {
      await dbService.deleteSubsidiary(id);
    } catch (e) {
      console.warn('Supabase deleteSubsidiary warning:', e);
    }

    if (target) {
      addCompanyNotif(
        'Sous-Entreprise Supprimée',
        `L'établissement "${target.name}" a été retiré.`,
        'warning'
      );
    }
  };

  const saveCompanyNotifs = (list: AppNotification[], orgId: string = organization.id) => {
    setCompanyNotifications(list);
    try {
      const email = getUserEmail();
      localStorage.setItem(`monneyfact_notifs_${email}`, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const saveAdminNotifs = (list: AppNotification[]) => {
    setAdminNotifications(list);
    try {
      localStorage.setItem('monneyfact_admin_notifs', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const addCompanyNotif = async (title: string, message: string, type: AppNotification['type'] = 'info') => {
    const notif: AppNotification = {
      id: `cnotif-${Date.now()}`,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    saveCompanyNotifs([notif, ...companyNotifications]);
    try {
      if (organization.id) {
        await dbService.createCompanyNotification(organization.id, title, message, type);
      }
    } catch (e) {
      console.warn('Supabase DB notification save error:', e);
    }
  };

  const addAdminNotif = (title: string, message: string, type: AppNotification['type'] = 'info') => {
    const notif: AppNotification = {
      id: `anotif-${Date.now()}`,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    saveAdminNotifs([notif, ...adminNotifications]);
  };

  // RULE 4 & RULE 5: Single Context Source of Truth & subsidiary_id as Single Source of Truth
  const currentContext: CompanyContext = activeSubsidiaryId === 'global'
    ? { type: 'main', mainCompanyId: organization.id }
    : {
        type: 'subcompany',
        mainCompanyId: organization.id,
        subCompanyId: activeSubsidiaryId,
        subCompanyName: (subsidiaries || []).find((s) => s.id === activeSubsidiaryId)?.name,
      };

  const switchContext = (ctx: CompanyContext) => {
    if (ctx.type === 'main') {
      setActiveSubsidiaryId('global');
    } else {
      setActiveSubsidiaryId(ctx.subCompanyId);
    }
  };

  const contextInvoices = currentContext.type === 'main'
    ? invoices
    : invoices.filter((i) => i.subsidiaryId === currentContext.subCompanyId);

  const contextClients = currentContext.type === 'main'
    ? clients
    : clients.filter((c) => c.subsidiaryId === currentContext.subCompanyId);

  const stats: DashboardStats = {
    totalInvoiced: contextInvoices.reduce((sum, inv) => sum + inv.total, 0),
    totalPaid: contextInvoices.filter((i) => i.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
    totalPending: contextInvoices.filter((i) => i.status === 'sent').reduce((sum, inv) => sum + inv.total, 0),
    totalOverdue: contextInvoices.filter((i) => i.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0),
    invoiceCounts: {
      total: contextInvoices.length,
      draft: contextInvoices.filter((i) => i.status === 'draft').length,
      sent: contextInvoices.filter((i) => i.status === 'sent').length,
      paid: contextInvoices.filter((i) => i.status === 'paid').length,
      overdue: contextInvoices.filter((i) => i.status === 'overdue').length,
    },
  };

  const getCompanyDashboard = async (targetCompanyId?: string): Promise<CompanyDashboardResult> => {
    const compId = targetCompanyId || activeSubsidiaryId;
    return await companyDashboardService.getCompanyDashboard(
      compId,
      organization.id,
      invoices,
      clients,
      subsidiaries
    );
  };

  const getMainCompanyDashboard = async (): Promise<MainCompanyDashboardResult> => {
    return await companyDashboardService.getMainCompanyDashboard(
      organization.id,
      invoices,
      clients,
      subsidiaries
    );
  };

  const mainCompanyDashboard: MainCompanyDashboardResult = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalUnpaid = invoices
      .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const monthlyRevenue = invoices
      .filter((inv) => {
        if (!inv.issueDate) return false;
        const parts = inv.issueDate.split('-');
        const y = parts.length === 3 ? parseInt(parts[0], 10) : new Date(inv.issueDate).getFullYear();
        const m = parts.length === 3 ? parseInt(parts[1], 10) - 1 : new Date(inv.issueDate).getMonth();
        return m === currentMonth && y === currentYear;
      })
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const companyBreakdown = subsidiaries.map((sub) => {
      const subInvoices = invoices.filter((i) => i.subsidiaryId === sub.id);

      return {
        companyId: sub.id,
        companyName: sub.name,
        city: sub.city,
        totalRevenue: subInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0),
        totalPaid: subInvoices.filter((i) => i.status === 'paid').reduce((acc, inv) => acc + (inv.total || 0), 0),
        totalUnpaid: subInvoices
          .filter((i) => i.status === 'sent' || i.status === 'overdue')
          .reduce((acc, inv) => acc + (inv.total || 0), 0),
        invoiceCount: subInvoices.length,
      };
    });

    const hqInvoices = invoices.filter((i) => !i.subsidiaryId && !i.subsidiaryName);
    if (hqInvoices.length > 0 || companyBreakdown.length === 0) {
      companyBreakdown.unshift({
        companyId: 'main-headquarters',
        companyName: `${organization.name} (Siège Principal)`,
        city: 'Abidjan',
        totalRevenue: hqInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0),
        totalPaid: hqInvoices.filter((i) => i.status === 'paid').reduce((acc, inv) => acc + (inv.total || 0), 0),
        totalUnpaid: hqInvoices
          .filter((i) => i.status === 'sent' || i.status === 'overdue')
          .reduce((acc, inv) => acc + (inv.total || 0), 0),
        invoiceCount: hqInvoices.length,
      });
    }

    return {
      mainCompanyId: organization.id,
      totalRevenue,
      totalPaid,
      totalUnpaid,
      totalInvoices: invoices.length,
      totalPayments: paidInvoices.length,
      monthlyRevenue,
      invoiceCounts: {
        total: invoices.length,
        draft: invoices.filter((i) => i.status === 'draft').length,
        sent: invoices.filter((i) => i.status === 'sent').length,
        paid: invoices.filter((i) => i.status === 'paid').length,
        overdue: invoices.filter((i) => i.status === 'overdue').length,
      },
      companyBreakdown,
      recentInvoices: invoices.slice(0, 10),
    };
  }, [organization.id, organization.name, invoices, subsidiaries]);

  const unreadCompanyNotifCount = companyNotifications.filter((n) => !n.read).length;
  const unreadAdminNotifCount = adminNotifications.filter((n) => !n.read).length;

  const addInvoice = async (newInv: Omit<Invoice, 'id' | 'createdAt'>) => {
    const generatedId = `inv-${Date.now()}`;
    let targetSubId = newInv.subsidiaryId || (activeSubsidiaryId !== 'global' ? activeSubsidiaryId : undefined);
    let targetSubName = newInv.subsidiaryName;

    if (targetSubId && !targetSubName) {
      const found = (subsidiaries || []).find((s) => s.id === targetSubId);
      if (found) targetSubName = found.name;
    } else if (!targetSubId && activeSubsidiaryId !== 'global') {
      const found = (subsidiaries || []).find((s) => s.id === activeSubsidiaryId);
      if (found) {
        targetSubId = found.id;
        targetSubName = found.name;
      }
    }

    const payload = {
      ...newInv,
      id: generatedId,
      subsidiaryId: targetSubId,
      subsidiaryName: targetSubName,
      paymentToken: generatedId,
      organizationName: organization.name,
      organizationId: organization.id,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await response.json();
      if (!response.ok || !resJson?.success) {
        const errorMsg = resJson?.error || 'Échec de l\'enregistrement en base de données Supabase.';
        console.error('[API INVOICE CREATE ERROR]', errorMsg);
        throw new Error(errorMsg);
      }

      const returnedInvoice = resJson.invoice;
      const created: Invoice = {
        ...newInv,
        id: returnedInvoice?.id || generatedId,
        subsidiaryId: targetSubId,
        subsidiaryName: targetSubName,
        paymentToken: resJson.token || generatedId,
        createdAt: returnedInvoice?.created_at || payload.createdAt,
      };

      const updated = [created, ...invoices];
      saveInvoicesForUser(updated);

      addCompanyNotif(
        'Nouvelle Facture Créée',
        `Facture ${created.invoiceNumber} (${created.total.toLocaleString()} FCFA) générée pour ${created.clientName}.`,
        'success'
      );
    } catch (apiErr) {
      console.error('[DEBUG STORE ERROR] /api/invoices/create fetch error:', apiErr);
      throw apiErr;
    }
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    const target = invoices.find((i) => i.id === id);
    const updated = invoices.map((inv) => (inv.id === id ? { ...inv, status } : inv));
    saveInvoicesForUser(updated);

    try {
      await supabase
        .from('invoices')
        .update({ status, paid_at: status === 'paid' ? new Date().toISOString() : null })
        .or(`id.eq.${id},payment_token.eq.${id}`);
    } catch (err) {
      console.warn('Supabase update error:', err);
    }

    if (target) {
      addCompanyNotif(
        'Statut Facture Mis à Jour',
        `La facture ${target.invoiceNumber} est marquée comme "${status}".`,
        status === 'paid' ? 'success' : 'info'
      );
    }
  };

  const deleteInvoice = async (id: string) => {
    const target = invoices.find((i) => i.id === id);
    const updated = invoices.filter((inv) => inv.id !== id);
    saveInvoicesForUser(updated);

    try {
      await supabase.from('invoices').delete().or(`id.eq.${id},payment_token.eq.${id}`);
    } catch (err) {
      console.warn('Supabase delete error:', err);
    }

    if (target) {
      addCompanyNotif('Facture Supprimée', `La facture ${target.invoiceNumber} a été retirée.`, 'warning');
    }
  };

  const addClient = async (newCli: Omit<Client, 'id' | 'createdAt'>) => {
    const targetSubId = newCli.subsidiaryId || (activeSubsidiaryId !== 'global' ? activeSubsidiaryId : undefined);
    let targetSubName = newCli.subsidiaryName;

    if (targetSubId && !targetSubName) {
      try {
        const uEmail = getUserEmail();
        const userSubsStr = localStorage.getItem(`monneyfact_subsidiaries_${uEmail}`);
        if (userSubsStr) {
          const subs: any[] = JSON.parse(userSubsStr);
          const found = subs.find((s) => s.id === targetSubId);
          if (found) targetSubName = found.name;
        }
      } catch (e) {
        console.error(e);
      }
    }

    const created: Client = {
      ...newCli,
      id: `cli-${Date.now()}`,
      subsidiaryId: targetSubId,
      subsidiaryName: targetSubName,
      createdAt: new Date().toISOString(),
      totalInvoiced: 0,
      unpaidBalance: 0,
    };
    const updated = [created, ...clients];
    saveClientsForUser(updated);

    try {
      if (organization.id) {
        await dbService.createClient({ ...created, organizationId: organization.id });
      }
    } catch (dbErr) {
      console.warn('Supabase create client warning:', dbErr);
    }

    addCompanyNotif('Nouveau Client Enregistré', `Le client "${created.name}" a été ajouté à votre répertoire.`, 'success');
  };

  const deleteClient = (id: string) => {
    const target = clients.find((c) => c.id === id);
    const updated = clients.filter((c) => c.id !== id);
    saveClientsForUser(updated);
    if (target) {
      addCompanyNotif('Client Supprimé', `Le client "${target.name}" a été retiré.`, 'warning');
    }
  };

  const updateOrganization = (orgData: Partial<Organization>) => {
    setOrganization((prev) => {
      const updated = { ...prev, ...orgData };
      try {
        const email = updated.email ? updated.email.toLowerCase() : 'guest';
        localStorage.setItem(`monneyfact_org_${email}`, JSON.stringify(updated));

        // Sync active user in localStorage
        const savedUserStr = localStorage.getItem('monneyfact_active_user');
        if (savedUserStr) {
          const u = JSON.parse(savedUserStr);
          u.companyName = updated.name;
          localStorage.setItem('monneyfact_active_user', JSON.stringify(u));
        }

        // Sync in registered companies list
        const savedList = localStorage.getItem('monneyfact_companies_list');
        let currentList: RegisteredCompany[] = savedList ? JSON.parse(savedList) : registeredCompanies;
        let modified = false;
        currentList = currentList.map((c) => {
          if (c.id === updated.id || (c.ownerEmail && c.ownerEmail.toLowerCase() === email)) {
            modified = true;
            return {
              ...c,
              name: updated.name || c.name,
              ownerName: updated.name || c.ownerName,
              plan: updated.plan || c.plan,
            };
          }
          return c;
        });

        if (modified) {
          setRegisteredCompanies(currentList);
          localStorage.setItem('monneyfact_companies_list', JSON.stringify(currentList));
        }
      } catch (e) {
        console.error(e);
      }

      // Sync with Supabase DB
      if (updated.email && updated.name) {
        dbService.upsertOrganization({
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          address: updated.address,
          taxId: updated.taxId,
          logoUrl: updated.logoUrl,
        }).catch((err) => console.warn('Supabase org sync warning:', err));
      }

      return updated;
    });
    addCompanyNotif('Profil Mis à Jour', `Les informations de ${orgData.name || organization.name} ont été enregistrées.`, 'info');
  };

  const initializeZeroAccount = (
    companyName: string,
    email: string,
    plan: PlanType = 'Pro'
  ) => {
    const monthlySubscription = PLAN_PRICES[plan] || (plan === 'Pro' ? 5000 : 1000);
    const cleanEmail = email.toLowerCase().trim();
    const newOrgId = getDeterministicUserOrgId(cleanEmail);
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

    const newOrg: Organization = {
      id: newOrgId,
      name: companyName,
      email: cleanEmail,
      address: 'Abidjan, Côte d\'Ivoire',
      phone: '+225 07 00 00 00 00',
      logoUrl: '',
      taxId: 'NCC Non Renseigné',
      plan,
      status: 'active',
      activatedAt: new Date().toISOString(),
      expiresAt,
      createdAt: new Date().toISOString(),
    };
    setOrganization(newOrg);
    setInvoices([]);
    setClients([]);

    const newCompany: RegisteredCompany = {
      id: `comp-${Date.now()}`,
      name: companyName,
      ownerName: companyName,
      ownerEmail: cleanEmail,
      city: 'Abidjan',
      plan: plan as any,
      status: 'active',
      registeredAt: new Date().toISOString().split('T')[0],
      totalInvoiced: 0,
      monthlySubscription,
    };

    const savedCompList = localStorage.getItem('monneyfact_companies_list');
    let currentCompanies: RegisteredCompany[] = savedCompList ? JSON.parse(savedCompList) : registeredCompanies;

    if (!currentCompanies.some((c) => c.ownerEmail?.toLowerCase() === cleanEmail || c.name === companyName)) {
      currentCompanies = [newCompany, ...currentCompanies];
    }

    setRegisteredCompanies(currentCompanies);

    const welcomeNotif: AppNotification = {
      id: `cnotif-${Date.now()}`,
      title: 'Bienvenue sur MonneyFact !',
      message: `Votre compte entreprise "${companyName}" (Formule ${plan} - ${monthlySubscription.toLocaleString()} FCFA/m) est prêt et initialisé à 0.`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString(),
    };

    const newCompanyNotifs = [welcomeNotif];
    setCompanyNotifications(newCompanyNotifs);

    try {
      localStorage.setItem(`monneyfact_org_${cleanEmail}`, JSON.stringify(newOrg));
      localStorage.setItem(`monneyfact_invoices_${cleanEmail}`, JSON.stringify([]));
      localStorage.setItem(`monneyfact_clients_${cleanEmail}`, JSON.stringify([]));
      localStorage.setItem(`monneyfact_subsidiaries_${cleanEmail}`, JSON.stringify([]));
      localStorage.setItem(`monneyfact_team_${cleanEmail}`, JSON.stringify([]));
      localStorage.setItem(`monneyfact_notifs_${cleanEmail}`, JSON.stringify(newCompanyNotifs));
      localStorage.setItem('monneyfact_companies_list', JSON.stringify(currentCompanies));
    } catch (e) {
      console.error(e);
    }

    addAdminNotif(
      'Nouvelle Entreprise Inscrite 🚀',
      `L'entreprise "${companyName}" (${cleanEmail}) vient de s'inscrire sur la formule ${plan} (${monthlySubscription.toLocaleString()} FCFA/m).`,
      'success'
    );
  };

  const purgeAllDatabaseRecords = () => {
    setInvoices([]);
    setClients([]);
    setCompanyNotifications([]);
    try {
      const email = getUserEmail();
      localStorage.removeItem(`monneyfact_invoices_${email}`);
      localStorage.removeItem(`monneyfact_clients_${email}`);
      localStorage.removeItem(`monneyfact_notifs_${email}`);
    } catch (e) {
      console.error(e);
    }
  };

  const purgeAllCompanies = async () => {
    setRegisteredCompanies([]);
    setInvoices([]);
    setClients([]);
    setCompanyNotifications([]);
    try {
      localStorage.setItem('monneyfact_companies_list', JSON.stringify([]));
      localStorage.setItem('monneyfact_user_accounts', JSON.stringify([]));
      localStorage.setItem('monneyfact_deleted_companies', JSON.stringify([]));

      if (typeof window !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.startsWith('monneyfact_org_') ||
              key.startsWith('monneyfact_invoices_') ||
              key.startsWith('monneyfact_clients_') ||
              key.startsWith('monneyfact_notifs_') ||
              key.startsWith('monneyfact_rate_limit_') ||
              key.startsWith('monneyfact_subsidiaries_') ||
              key.startsWith('monneyfact_team_'))
          ) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }

      await dbService.deleteAllOrganizationsCascade();
    } catch (e) {
      console.error('Erreur purgeAllCompanies:', e);
    }
  };

  const markCompanyNotifAsRead = (id: string) => {
    saveCompanyNotifs(companyNotifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };
  const markAllCompanyNotifsAsRead = () => {
    saveCompanyNotifs(companyNotifications.map((n) => ({ ...n, read: true })));
  };
  const deleteCompanyNotif = (id: string) => {
    saveCompanyNotifs(companyNotifications.filter((n) => n.id !== id));
  };
  const clearAllCompanyNotifs = () => {
    saveCompanyNotifs([]);
  };

  const markAdminNotifAsRead = (id: string) => {
    saveAdminNotifs(adminNotifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };
  const markAllAdminNotifsAsRead = () => {
    saveAdminNotifs(adminNotifications.map((n) => ({ ...n, read: true })));
  };
  const deleteAdminNotif = (id: string) => {
    saveAdminNotifs(adminNotifications.filter((n) => n.id !== id));
  };
  const clearAllAdminNotifs = () => {
    saveAdminNotifs([]);
  };

  return (
    <AppStoreContext.Provider
      value={{
        organization,
        invoices: contextInvoices,
        clients: contextClients,
        subsidiaries,
        stats,
        mainCompanyDashboard,
        currentContext,
        switchContext,
        getCompanyDashboard,
        getMainCompanyDashboard,
        companyNotifications,
        adminNotifications,
        registeredCompanies,
        unreadCompanyNotifCount,
        unreadAdminNotifCount,
        activeSubsidiaryId,
        setActiveSubsidiaryId: handleSetActiveSub,
        globalSearchQuery,
        setGlobalSearchQuery,
        addInvoice,
        updateInvoiceStatus,
        deleteInvoice,
        addClient,
        deleteClient,
        addSubsidiary,
        deleteSubsidiary,
        updateOrganization,
        initializeZeroAccount,
        purgeAllDatabaseRecords,
        purgeAllCompanies,
        addCompanyNotif,
        addAdminNotif,
        markCompanyNotifAsRead,
        markAllCompanyNotifsAsRead,
        deleteCompanyNotif,
        clearAllCompanyNotifs,
        markAdminNotifAsRead,
        markAllAdminNotifsAsRead,
        deleteAdminNotif,
        clearAllAdminNotifs,
      }}
    >
      {children}
    </AppStoreContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore doit être utilisé dans un AppStoreProvider');
  }
  return context;
};

