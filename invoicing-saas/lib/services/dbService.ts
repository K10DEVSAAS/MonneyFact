import { supabase } from '../supabase/client';
import { Invoice, Client, Organization, AppNotification } from '../types/invoice';

export const dbService = {
  // --- ORGANIZATIONS & ADMIN SUPERVISION ---
  async getOrganization(email: string): Promise<Organization | null> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name,
        address: data.address,
        phone: data.phone,
        taxId: data.tax_id,
        logoUrl: data.logo_url,
        createdAt: data.created_at,
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  async getAllRegisteredCompanies(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data;
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async upsertOrganization(org: Partial<Organization> & { email: string; name: string }): Promise<Organization | null> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .upsert(
          {
            name: org.name,
            email: org.email,
            phone: org.phone,
            address: org.address,
            tax_id: org.taxId,
            logo_url: org.logoUrl,
          },
          { onConflict: 'email' }
        )
        .select('*')
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name,
        address: data.address,
        phone: data.phone,
        taxId: data.tax_id,
        logoUrl: data.logo_url,
        createdAt: data.created_at,
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  // --- CLIENTS ---
  async getClients(organizationId: string): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((c) => ({
        id: c.id,
        organizationId: c.organization_id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        city: c.city,
        country: c.country,
        totalInvoiced: c.total_invoiced,
        unpaidBalance: c.unpaid_balance,
        createdAt: c.created_at,
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async createClient(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          organization_id: client.organizationId,
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          city: client.city || 'Abidjan',
          country: client.country || 'Côte d\'Ivoire',
        })
        .select('*')
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        organizationId: data.organization_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
        totalInvoiced: data.total_invoiced,
        unpaidBalance: data.unpaid_balance,
        createdAt: data.created_at,
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  // --- INVOICES ---
  async getInvoices(organizationId: string): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, items:invoice_items(*)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        organizationId: inv.organization_id,
        clientId: inv.client_id,
        clientName: inv.client_name,
        clientEmail: inv.client_email,
        status: inv.status,
        issueDate: inv.issue_date,
        dueDate: inv.due_date,
        subtotal: inv.subtotal,
        taxRate: inv.tax_rate,
        taxAmount: inv.tax_amount,
        total: inv.total,
        notes: inv.notes,
        observations: inv.observations,
        signatureUrl: inv.signature_url,
        items: (inv.items || []).map((item: any) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          lineTotal: item.line_total,
        })),
        createdAt: inv.created_at,
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  // --- STRICT ISOLATED NOTIFICATIONS ---
  async getCompanyNotifications(organizationId: string): Promise<AppNotification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        createdAt: n.created_at,
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async createCompanyNotification(
    organizationId: string,
    title: string,
    message: string,
    type: AppNotification['type'] = 'info'
  ): Promise<AppNotification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          organization_id: organizationId,
          title,
          message,
          type,
          read: false,
        })
        .select('*')
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        title: data.title,
        message: data.message,
        type: data.type,
        read: data.read,
        createdAt: data.created_at,
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  async markCompanyNotificationRead(id: string, organizationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('organization_id', organizationId);

      return !error;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  async deleteCompanyNotification(id: string, organizationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId);

      return !error;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  async clearCompanyNotifications(organizationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('organization_id', organizationId);

      return !error;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
};
