import { supabase } from '../supabase/client';
import { Invoice, Client, Organization, AppNotification } from '../types/invoice';

export const dbService = {
  // --- PROFILES & AUTH PERSISTENCE ---
  async getProfileByEmail(email: string): Promise<any | null> {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (error || !data) return null;
      return data;
    } catch (e) {
      console.error('Erreur getProfileByEmail:', e);
      return null;
    }
  },

  async getProfileById(userId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) return null;
      return data;
    } catch (e) {
      console.error('Erreur getProfileById:', e);
      return null;
    }
  },

  async upsertProfile(profile: { id?: string; email: string; full_name?: string; role?: string; organization_id?: string }): Promise<any | null> {
    try {
      const cleanEmail = profile.email.toLowerCase().trim();
      const payload: any = {
        email: cleanEmail,
        full_name: profile.full_name || cleanEmail.split('@')[0],
        role: profile.role || 'client',
        organization_id: profile.organization_id || null,
      };
      if (profile.id) payload.id = profile.id;

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: profile.id ? 'id' : 'email' })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Erreur upsertProfile:', error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.error('Exception upsertProfile:', e);
      return null;
    }
  },

  // --- ORGANIZATIONS & ADMIN SUPERVISION ---
  async getOrganization(identifier: string): Promise<Organization | null> {
    try {
      let query = supabase.from('organizations').select('*');
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)) {
        query = query.eq('id', identifier);
      } else {
        query = query.eq('email', identifier.toLowerCase().trim());
      }

      const { data, error } = await query.maybeSingle();
      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name,
        address: data.address,
        phone: data.phone,
        taxId: data.tax_id,
        logoUrl: data.logo_url,
        createdAt: data.created_at,
        email: data.email,
        plan: data.plan || 'Pro',
      };
    } catch (e) {
      console.error('Erreur getOrganization:', e);
      return null;
    }
  },

  async deleteOrganizationCascade(orgId: string, email?: string, name?: string): Promise<boolean> {
    try {
      // 1. Delete all child records in Supabase (invoices, clients, notifications)
      if (orgId) {
        await supabase.from('invoices').delete().eq('organization_id', orgId);
        await supabase.from('clients').delete().eq('organization_id', orgId);
        await supabase.from('notifications').delete().eq('organization_id', orgId);
      }
      if (email) {
        await supabase.from('invoices').delete().eq('client_email', email);
      }

      // 2. Delete organization from Supabase
      if (orgId && /^[0-9a-f-]{36}$/i.test(orgId)) {
        await supabase.from('organizations').delete().eq('id', orgId);
      }
      if (email) {
        await supabase.from('organizations').delete().eq('email', email);
      }
      if (name) {
        await supabase.from('organizations').delete().eq('name', name);
      }

      return true;
    } catch (e) {
      console.error('Erreur suppression organisation Supabase:', e);
      return false;
    }
  },

  async deleteAllOrganizationsCascade(): Promise<boolean> {
    try {
      await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('organizations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      return true;
    } catch (e) {
      console.error('Erreur suppression intégrale des entreprises Supabase:', e);
      return false;
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
      const cleanEmail = org.email.toLowerCase().trim();
      const { data, error } = await supabase
        .from('organizations')
        .upsert(
          {
            name: org.name,
            email: cleanEmail,
            phone: org.phone || "+225 07 00 00 00 00",
            address: org.address || "Abidjan, Côte d'Ivoire",
            tax_id: org.taxId,
            logo_url: org.logoUrl,
            currency: 'FCFA',
            default_tax_rate: 18,
            plan: 'Pro',
            status: 'active',
            activated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          { onConflict: 'email' }
        )
        .select('*')
        .single();

      if (error || !data) {
        console.error('[dbService upsertOrganization error]', error?.message);
        return null;
      }

      // Check if active session user needs their profile.organization_id updated
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user && session.user.email?.toLowerCase() === cleanEmail) {
          const userId = session.user.id;
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, organization_id')
            .eq('id', userId)
            .maybeSingle();

          if (profile && !profile.organization_id) {
            await supabase
              .from('profiles')
              .update({ organization_id: data.id })
              .eq('id', userId);
          } else if (!profile) {
            await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: cleanEmail,
                full_name: org.name,
                role: 'client',
                organization_id: data.id,
                plan: 'Pro',
              });
          }
        }
      } catch (bindErr) {
        console.warn('[dbService profile binding warning]', bindErr);
      }

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

  async updateOrganizationById(orgId: string, updates: Partial<Organization>): Promise<boolean> {
    try {
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.address !== undefined) payload.address = updates.address;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.taxId !== undefined) payload.tax_id = updates.taxId;
      if (updates.logoUrl !== undefined) payload.logo_url = updates.logoUrl;
      if (updates.currency !== undefined) payload.currency = updates.currency;
      if (updates.defaultTaxRate !== undefined) payload.default_tax_rate = updates.defaultTaxRate;

      const { error } = await supabase
        .from('organizations')
        .update(payload)
        .eq('id', orgId);

      if (error) {
        console.error('[dbService updateOrganizationById error]', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('updateOrganizationById exception:', e);
      return false;
    }
  },

  async updateUserProfile(userId: string, updates: { fullName?: string; email?: string }): Promise<boolean> {
    try {
      const payload: any = {};
      if (updates.fullName !== undefined) payload.full_name = updates.fullName;
      if (updates.email !== undefined) payload.email = updates.email.toLowerCase().trim();

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId);

      if (error) {
        console.error('[dbService updateUserProfile error]', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('updateUserProfile exception:', e);
      return false;
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
        subsidiaryId: c.subsidiary_id || c.subsidiaryId || undefined,
        subsidiaryName: c.subsidiary_name || c.subsidiaryName || undefined,
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
          subsidiary_id: client.subsidiaryId || null,
          subsidiary_name: client.subsidiaryName || null,
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
        subsidiaryId: data.subsidiary_id || data.subsidiaryId || undefined,
        subsidiaryName: data.subsidiary_name || data.subsidiaryName || undefined,
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

  async updateClient(clientId: string, updates: Partial<Client>): Promise<boolean> {
    try {
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.address !== undefined) payload.address = updates.address;
      if (updates.city !== undefined) payload.city = updates.city;

      const { error } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', clientId);

      return !error;
    } catch (e) {
      console.error('dbService updateClient error:', e);
      return false;
    }
  },

  async deleteClient(clientId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      return !error;
    } catch (e) {
      console.error('dbService deleteClient error:', e);
      return false;
    }
  },

  // --- SUBSIDIARIES ---
  async getSubsidiaries(organizationId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('subsidiaries')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((s) => ({
        id: s.id,
        organizationId: s.organization_id,
        name: s.name,
        type: s.type || 'Agence Régionale',
        city: s.city || 'Abidjan',
        address: s.address || '',
        phone: s.phone || '',
        email: s.email || '',
        managerName: s.manager_name || '',
        rccmNumber: s.rccm_number || '',
        taxId: s.tax_id || '',
        status: s.status || 'actif',
        totalInvoiced: 0,
        invoiceCount: 0,
        memberCount: 1,
        createdAt: s.created_at,
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async createSubsidiary(sub: any): Promise<any | null> {
    try {
      const isValidUuid = sub.id && /^[0-9a-f-]{36}$/i.test(sub.id);
      const insertPayload: any = {
        organization_id: sub.organizationId,
        name: sub.name,
        type: sub.type || 'Agence Régionale',
        city: sub.city || 'Abidjan',
        address: sub.address || '',
        phone: sub.phone || '',
        email: sub.email || '',
        manager_name: sub.managerName || '',
        rccm_number: sub.rccmNumber || '',
        tax_id: sub.taxId || '',
        status: sub.status || 'actif',
      };
      if (isValidUuid) {
        insertPayload.id = sub.id;
      }

      const { data, error } = await supabase
        .from('subsidiaries')
        .insert(insertPayload)
        .select('*')
        .single();

      if (error || !data) {
        console.warn('Supabase createSubsidiary warning:', error);
        return null;
      }

      return {
        id: data.id,
        organizationId: data.organization_id,
        name: data.name,
        type: data.type,
        city: data.city,
        address: data.address,
        phone: data.phone,
        email: data.email,
        managerName: data.manager_name,
        rccmNumber: data.rccm_number,
        taxId: data.tax_id,
        status: data.status,
        totalInvoiced: 0,
        invoiceCount: 0,
        memberCount: 1,
        createdAt: data.created_at,
      };
    } catch (e) {
      console.error('Supabase createSubsidiary error:', e);
      return null;
    }
  },

  async deleteSubsidiary(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subsidiaries')
        .delete()
        .eq('id', id);

      return !error;
    } catch (e) {
      console.error('Supabase deleteSubsidiary error:', e);
      return false;
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
        subsidiaryId: inv.subsidiary_id || inv.subsidiaryId || undefined,
        subsidiaryName: inv.subsidiary_name || inv.subsidiaryName || undefined,
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

  /**
   * STRICT SUB-COMPANY INVOICES QUERY (SQL Server-side Filtering)
   * Runs WHERE organization_id = organizationId AND subsidiary_id = subsidiaryId
   */
  async getCompanyInvoices(organizationId: string, subsidiaryId: string): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, items:invoice_items(*)')
        .eq('organization_id', organizationId)
        .eq('subsidiary_id', subsidiaryId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        organizationId: inv.organization_id,
        subsidiaryId: inv.subsidiary_id || inv.subsidiaryId || undefined,
        subsidiaryName: inv.subsidiary_name || inv.subsidiaryName || undefined,
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
      console.error('[DB SERVICE] getCompanyInvoices error:', e);
      return [];
    }
  },

  /**
   * STRICT SUB-COMPANY CLIENTS QUERY (SQL Server-side Filtering)
   * Runs WHERE organization_id = organizationId AND subsidiary_id = subsidiaryId
   */
  async getCompanyClients(organizationId: string, subsidiaryId: string): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('subsidiary_id', subsidiaryId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((c) => ({
        id: c.id,
        organizationId: c.organization_id,
        subsidiaryId: c.subsidiary_id || c.subsidiaryId || undefined,
        subsidiaryName: c.subsidiary_name || c.subsidiaryName || undefined,
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
      console.error('[DB SERVICE] getCompanyClients error:', e);
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
