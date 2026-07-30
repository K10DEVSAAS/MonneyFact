import { Client, Invoice, Organization, DashboardStats } from '../types/invoice';

export const mockOrganization: Organization = {
  id: 'e8b8c2a1-94f3-4e67-b8a9-0d1e2f3a4b5c',
  name: 'Mon Entreprise',
  address: 'Abidjan, Côte d\'Ivoire',
  phone: '+225 07 00 00 00 00',
  logoUrl: '',
  taxId: 'NCC Non Renseigné',
  createdAt: new Date().toISOString(),
};

// ABSOLUTE ZERO DATA AT STARTUP (NO MOCK CLIENTS, NO MOCK INVOICES)
export const mockClients: Client[] = [];

export const mockInvoices: Invoice[] = [];

export const mockDashboardStats: DashboardStats = {
  totalInvoiced: 0,
  totalPaid: 0,
  totalPending: 0,
  totalOverdue: 0,
  invoiceCounts: {
    total: 0,
    draft: 0,
    sent: 0,
    paid: 0,
    overdue: 0,
  },
};
