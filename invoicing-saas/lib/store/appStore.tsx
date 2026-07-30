'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Invoice, Client, Organization, DashboardStats, AppNotification } from '../types/invoice';
import { mockInvoices, mockClients, mockOrganization } from '../data/mockData';
import { RegisteredCompany } from '../data/mockAdminData';
import { supabase } from '../supabase/client';

const DEFAULT_ORG_UUID = 'e8b8c2a1-94f3-4e67-b8a9-0d1e2f3a4b5c';

const getValidUuid = (id?: string) => {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  return DEFAULT_ORG_UUID;
};

interface AppStoreType {
  organization: Organization;
  invoices: Invoice[];
  clients: Client[];
  stats: DashboardStats;
  companyNotifications: AppNotification[];
  adminNotifications: AppNotification[];
  registeredCompanies: RegisteredCompany[];
  unreadCompanyNotifCount: number;
  unreadAdminNotifCount: number;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => void;
  deleteInvoice: (id: string) => void;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  deleteClient: (id: string) => void;
  updateOrganization: (orgData: Partial<Organization>) => void;
  initializeZeroAccount: (companyName: string, email: string) => void;
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
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [clients, setClients] = useState<Client[]>(mockClients);

  const [companyNotifications, setCompanyNotifications] = useState<AppNotification[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<AppNotification[]>([]);
  const [registeredCompanies, setRegisteredCompanies] = useState<RegisteredCompany[]>([]);

  // Helper to ensure Organization exists in Supabase DB
  const ensureOrganizationInDb = async (org: Organization) => {
    const validOrgId = getValidUuid(org.id);
    try {
      await supabase.from('organizations').upsert({
        id: validOrgId,
        name: org.name || 'Mon Entreprise',
        email: org.email || `${validOrgId}@monneyfact.ci`,
        phone: org.phone || '+225 07 00 00 00 00',
        address: org.address || 'Abidjan, Côte d\'Ivoire',
        tax_id: org.taxId || 'NCC Non Renseigné',
      }, { onConflict: 'id' });
    } catch (err) {
      console.warn('Organization upsert warning:', err);
    }
    return validOrgId;
  };

  // Restore state from localStorage & Supabase DB on mount
  useEffect(() => {
    let isSubscribed = true;

    const loadData = async () => {
      try {
        const savedOrg = localStorage.getItem('monneyfact_org_data');
        let currentOrg = mockOrganization;
        if (savedOrg) {
          currentOrg = JSON.parse(savedOrg);
          if (isSubscribed) setOrganization(currentOrg);
        }

        const validOrgId = await ensureOrganizationInDb(currentOrg);

        const savedInvoices = localStorage.getItem('monneyfact_invoices');
        if (savedInvoices) {
          const parsed = JSON.parse(savedInvoices);
          if (isSubscribed) setInvoices(parsed);

          for (const inv of parsed) {
            try {
              await supabase.from('invoices').upsert({
                id: inv.id,
                invoice_number: inv.invoiceNumber,
                organization_id: validOrgId,
                client_name: inv.clientName,
                client_email: inv.clientEmail,
                status: inv.status,
                issue_date: inv.issueDate,
                due_date: inv.dueDate,
                subtotal: inv.subtotal,
                tax_rate: inv.taxRate || 18,
                tax_amount: inv.taxAmount,
                total: inv.total,
                notes: inv.notes,
                observations: inv.observations || '',
                signature_url: inv.signatureUrl || '',
                payment_token: inv.id,
              }, { onConflict: 'id' });
            } catch (syncErr) {
              console.warn('Sync invoice error:', syncErr);
            }
          }
        }

        const savedClients = localStorage.getItem('monneyfact_clients');
        if (savedClients && isSubscribed) setClients(JSON.parse(savedClients));

        const orgNotifKey = `monneyfact_notifs_${currentOrg.id}`;
        const savedCompanyNotifs = localStorage.getItem(orgNotifKey);
        if (savedCompanyNotifs && isSubscribed) {
          setCompanyNotifications(JSON.parse(savedCompanyNotifs));
        } else if (isSubscribed) {
          setCompanyNotifications([]);
        }

        const savedAdminNotifs = localStorage.getItem('monneyfact_admin_notifs');
        if (savedAdminNotifs && isSubscribed) setAdminNotifications(JSON.parse(savedAdminNotifs));

        const savedCompList = localStorage.getItem('monneyfact_companies_list');
        if (savedCompList && isSubscribed) setRegisteredCompanies(JSON.parse(savedCompList));
      } catch (e) {
        console.error(e);
      }
    };

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, [organization.id]);

  const saveCompanyNotifs = (list: AppNotification[], orgId: string = organization.id) => {
    setCompanyNotifications(list);
    try {
      localStorage.setItem(`monneyfact_notifs_${orgId}`, JSON.stringify(list));
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

  const addCompanyNotif = (title: string, message: string, type: AppNotification['type'] = 'info', orgId: string = organization.id) => {
    const notif: AppNotification = {
      id: `cnotif-${Date.now()}`,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    saveCompanyNotifs([notif, ...companyNotifications], orgId);
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

  const stats: DashboardStats = {
    totalInvoiced: invoices.reduce((sum, inv) => sum + inv.total, 0),
    totalPaid: invoices.filter((i) => i.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
    totalPending: invoices.filter((i) => i.status === 'sent').reduce((sum, inv) => sum + inv.total, 0),
    totalOverdue: invoices.filter((i) => i.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0),
    invoiceCounts: {
      total: invoices.length,
      draft: invoices.filter((i) => i.status === 'draft').length,
      sent: invoices.filter((i) => i.status === 'sent').length,
      paid: invoices.filter((i) => i.status === 'paid').length,
      overdue: invoices.filter((i) => i.status === 'overdue').length,
    },
  };

  const unreadCompanyNotifCount = companyNotifications.filter((n) => !n.read).length;
  const unreadAdminNotifCount = adminNotifications.filter((n) => !n.read).length;

  // --- ACTIONS WITH STRICT UUID SUPABASE SYNC ---
  const addInvoice = async (newInv: Omit<Invoice, 'id' | 'createdAt'>) => {
    const created: Invoice = {
      ...newInv,
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [created, ...invoices];
    setInvoices(updated);
    try {
      localStorage.setItem('monneyfact_invoices', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    // 1. Ensure valid Organization UUID exists in Supabase DB first
    const validOrgId = await ensureOrganizationInDb(organization);

    // 2. Direct Sync to Supabase DB public.invoices with valid UUID
    try {
      const { error: invErr } = await supabase.from('invoices').upsert({
        id: created.id,
        invoice_number: created.invoiceNumber,
        organization_id: validOrgId,
        client_name: created.clientName,
        client_email: created.clientEmail,
        status: created.status,
        issue_date: created.issueDate,
        due_date: created.dueDate,
        subtotal: created.subtotal,
        tax_rate: created.taxRate,
        tax_amount: created.taxAmount,
        total: created.total,
        notes: created.notes,
        observations: created.observations || '',
        signature_url: created.signatureUrl || '',
        payment_token: created.id,
      }, { onConflict: 'id' });

      if (invErr) {
        console.error('Supabase invoice insert error:', invErr);
      }

      if (created.items && created.items.length > 0) {
        const itemRows = created.items.map((item) => ({
          invoice_id: created.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          line_total: item.lineTotal,
        }));
        await supabase.from('invoice_items').insert(itemRows);
      }
    } catch (dbErr) {
      console.error('Database sync error:', dbErr);
    }

    addCompanyNotif(
      'Nouvelle Facture Créée',
      `Facture ${created.invoiceNumber} (${created.total.toLocaleString()} FCFA) générée pour ${created.clientName}.`,
      'success'
    );
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    const target = invoices.find((i) => i.id === id);
    const updated = invoices.map((inv) => (inv.id === id ? { ...inv, status } : inv));
    setInvoices(updated);
    try {
      localStorage.setItem('monneyfact_invoices', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    try {
      await supabase
        .from('invoices')
        .update({ status, paid_at: status === 'paid' ? new Date().toISOString() : null })
        .eq('id', id);
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
    setInvoices(updated);
    try {
      localStorage.setItem('monneyfact_invoices', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    try {
      await supabase.from('invoices').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete error:', err);
    }

    if (target) {
      addCompanyNotif('Facture Supprimée', `La facture ${target.invoiceNumber} a été retirée.`, 'warning');
    }
  };

  const addClient = (newCli: Omit<Client, 'id' | 'createdAt'>) => {
    const created: Client = {
      ...newCli,
      id: `cli-${Date.now()}`,
      createdAt: new Date().toISOString(),
      totalInvoiced: 0,
      unpaidBalance: 0,
    };
    const updated = [created, ...clients];
    setClients(updated);
    try {
      localStorage.setItem('monneyfact_clients', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    addCompanyNotif('Nouveau Client Enregistré', `Le client "${created.name}" a été ajouté à votre répertoire.`, 'success');
  };

  const deleteClient = (id: string) => {
    const target = clients.find((c) => c.id === id);
    const updated = clients.filter((c) => c.id !== id);
    setClients(updated);
    try {
      localStorage.setItem('monneyfact_clients', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    if (target) {
      addCompanyNotif('Client Supprimé', `Le client "${target.name}" a été retiré.`, 'warning');
    }
  };

  const updateOrganization = (orgData: Partial<Organization>) => {
    setOrganization((prev) => {
      const updated = { ...prev, ...orgData };
      try {
        localStorage.setItem('monneyfact_org_data', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    addCompanyNotif('Profil Mis à Jour', 'Les informations officielles de votre entreprise ont été mises à jour.', 'info');
  };

  const initializeZeroAccount = (companyName: string, email: string) => {
    const newOrgId = DEFAULT_ORG_UUID;
    const newOrg: Organization = {
      id: newOrgId,
      name: companyName,
      address: 'Abidjan, Côte d\'Ivoire',
      phone: '+225 07 00 00 00 00',
      logoUrl: '',
      taxId: 'NCC Non Renseigné',
      createdAt: new Date().toISOString(),
    };
    setOrganization(newOrg);
    setInvoices([]);
    setClients([]);

    const newCompany: RegisteredCompany = {
      id: `comp-${Date.now()}`,
      name: companyName,
      ownerName: companyName,
      ownerEmail: email,
      city: 'Abidjan',
      plan: 'Pro',
      status: 'active',
      registeredAt: new Date().toISOString().split('T')[0],
      totalInvoiced: 0,
      monthlySubscription: 5000,
    };
    const updatedCompanies = [newCompany, ...registeredCompanies];
    setRegisteredCompanies(updatedCompanies);

    const welcomeNotif: AppNotification = {
      id: `cnotif-${Date.now()}`,
      title: 'Bienvenue sur MonneyFact !',
      message: `Votre compte entreprise "${companyName}" est prêt et initialisé à 0.`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString(),
    };

    const newCompanyNotifs = [welcomeNotif];
    setCompanyNotifications(newCompanyNotifs);

    try {
      localStorage.setItem('monneyfact_org_data', JSON.stringify(newOrg));
      localStorage.setItem('monneyfact_invoices', JSON.stringify([]));
      localStorage.setItem('monneyfact_clients', JSON.stringify([]));
      localStorage.setItem(`monneyfact_notifs_${newOrgId}`, JSON.stringify(newCompanyNotifs));
      localStorage.setItem('monneyfact_companies_list', JSON.stringify(updatedCompanies));
    } catch (e) {
      console.error(e);
    }

    addAdminNotif(
      'Nouvelle Entreprise Inscrite 🚀',
      `L'entreprise "${companyName}" (${email}) vient de s'inscrire sur le SaaS MonneyFact.`,
      'success'
    );
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
        invoices,
        clients,
        stats,
        companyNotifications,
        adminNotifications,
        registeredCompanies,
        unreadCompanyNotifCount,
        unreadAdminNotifCount,
        addInvoice,
        updateInvoiceStatus,
        deleteInvoice,
        addClient,
        deleteClient,
        updateOrganization,
        initializeZeroAccount,
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
