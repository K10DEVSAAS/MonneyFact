'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Invoice, Client, Organization, DashboardStats, AppNotification } from '../types/invoice';
import { mockInvoices, mockClients, mockOrganization } from '../data/mockData';
import { RegisteredCompany } from '../data/mockAdminData';
import { supabase } from '../supabase/client';

interface AppStoreType {
  organization: Organization;
  invoices: Invoice[];
  clients: Client[];
  stats: DashboardStats;
  // Strictly Isolated Notifications
  companyNotifications: AppNotification[];
  adminNotifications: AppNotification[];
  registeredCompanies: RegisteredCompany[];
  unreadCompanyNotifCount: number;
  unreadAdminNotifCount: number;
  // Invoice & Client Actions
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => void;
  deleteInvoice: (id: string) => void;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  deleteClient: (id: string) => void;
  updateOrganization: (orgData: Partial<Organization>) => void;
  initializeZeroAccount: (companyName: string, email: string) => void;
  // Isolated Notification Controls
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

  // ISOLATED NOTIFICATION LISTS & REGISTERED COMPANIES
  const [companyNotifications, setCompanyNotifications] = useState<AppNotification[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<AppNotification[]>([]);
  const [registeredCompanies, setRegisteredCompanies] = useState<RegisteredCompany[]>([]);

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

        const savedInvoices = localStorage.getItem('monneyfact_invoices');
        if (savedInvoices) {
          const parsed = JSON.parse(savedInvoices);
          if (isSubscribed) setInvoices(parsed);

          // Seed / Sync local invoices to Supabase DB so public links work for guest clients
          for (const inv of parsed) {
            try {
              await supabase.from('invoices').upsert({
                id: inv.id,
                invoice_number: inv.invoiceNumber,
                organization_id: currentOrg.id,
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

              if (inv.items && inv.items.length > 0) {
                const itemRows = inv.items.map((item: any) => ({
                  invoice_id: inv.id,
                  description: item.description,
                  quantity: item.quantity,
                  unit_price: item.unitPrice,
                  line_total: item.lineTotal,
                }));
                await supabase.from('invoice_items').upsert(itemRows, { onConflict: 'id' });
              }
            } catch (syncErr) {
              console.warn('Sync invoice error:', syncErr);
            }
          }
        } else {
          // Sync mockInvoices to Supabase DB
          for (const inv of mockInvoices) {
            try {
              await supabase.from('invoices').upsert({
                id: inv.id,
                invoice_number: inv.invoiceNumber,
                organization_id: currentOrg.id,
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
            } catch (err) {
              // ignore
            }
          }
        }

        const savedClients = localStorage.getItem('monneyfact_clients');
        if (savedClients && isSubscribed) setClients(JSON.parse(savedClients));

        // NOTIFICATION ISOLATION
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

  // Helper to persist company notifications STRICTLY SCOPED TO THIS ORGANIZATION ID
  const saveCompanyNotifs = (list: AppNotification[], orgId: string = organization.id) => {
    setCompanyNotifications(list);
    try {
      localStorage.setItem(`monneyfact_notifs_${orgId}`, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to persist admin notifications
  const saveAdminNotifs = (list: AppNotification[]) => {
    setAdminNotifications(list);
    try {
      localStorage.setItem('monneyfact_admin_notifs', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  // Add Company Notification
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

  // Add Admin Notification
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

  // Compute live dashboard stats for enterprise
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

  // --- ACTIONS WITH SUPABASE DB SYNC ---
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

    // DIRECT SYNC TO SUPABASE DB PUBLIC.INVOICES FOR WHATSAPP PUBLIC GUEST LINKS
    try {
      const { error: invErr } = await supabase.from('invoices').upsert({
        id: created.id,
        invoice_number: created.invoiceNumber,
        organization_id: created.organizationId || organization.id,
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
        console.warn('Supabase invoice insert warning:', invErr);
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

    // SYNC STATUS TO SUPABASE DB
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

  // Called when a brand new enterprise registers -> PURGES NOTIFICATIONS TO ZERO & NOTIFIES SUPER ADMIN
  const initializeZeroAccount = (companyName: string, email: string) => {
    const newOrgId = `org-${Date.now()}`;
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

    // Add company to Super Admin directory
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

    // CRITICAL SECURITY FIX: EXPLICITLY CREATE 1 SINGLE WELCOME NOTIFICATION ONLY FOR THIS NEW COMPANY
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

    // Add Super Admin Notification (AUTOMATIC INCREMENT)
    addAdminNotif(
      'Nouvelle Entreprise Inscrite 🚀',
      `L'entreprise "${companyName}" (${email}) vient de s'inscrire sur le SaaS MonneyFact.`,
      'success'
    );
  };

  // ISOLATED COMPANY NOTIFICATION CONTROLS
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

  // ISOLATED ADMIN NOTIFICATION CONTROLS
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
