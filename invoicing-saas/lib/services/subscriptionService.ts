import { PlanType, Organization } from '../types/invoice';
import { supabase } from '../supabase/client';

export interface SubscriptionRecord {
  companyId: string;
  companyName: string;
  plan: PlanType;
  status: 'active' | 'expired' | 'suspended';
  activatedAt: string;
  expiresAt: string;
  billingCycle: 'monthly' | 'annual';
  amount: number;
}

export interface AdminAuditLog {
  id: string;
  adminEmail: string;
  action: 'suspend' | 'reactivate' | 'cancel' | 'upgrade';
  targetCompany: string;
  reason: string;
  timestamp: string;
}

export const PLAN_LIMITS = {
  Gratuit: {
    maxInvoicesPerMonth: 5,
    maxClients: 5,
    customLogo: false,
    multiUser: false,
    multiCompany: false,
    excelExport: false,
    smsReminders: false,
  },
  Pro: {
    maxInvoicesPerMonth: Infinity,
    maxClients: Infinity,
    customLogo: true,
    multiUser: false,
    multiCompany: false,
    excelExport: false,
    smsReminders: false,
  },
  Business: {
    maxInvoicesPerMonth: Infinity,
    maxClients: Infinity,
    customLogo: true,
    multiUser: true,
    multiCompany: true,
    excelExport: true,
    smsReminders: true,
  },
};

export const subscriptionService = {
  // Check if invoice creation is allowed under current plan limits
  canCreateInvoice(plan: PlanType = 'Pro', monthlyInvoiceCount: number): { allowed: boolean; reason?: string } {
    const limit = PLAN_LIMITS[plan]?.maxInvoicesPerMonth || Infinity;
    if (monthlyInvoiceCount >= limit) {
      return {
        allowed: false,
        reason: `Limite de ${limit} factures/mois atteinte pour le Plan ${plan}. Passez au Plan Pro (5.000 FCFA) pour débloquer la facturation illimitée !`,
      };
    }
    return { allowed: true };
  },

  // Check if client creation is allowed under current plan limits
  canCreateClient(plan: PlanType = 'Pro', currentClientCount: number): { allowed: boolean; reason?: string } {
    const limit = PLAN_LIMITS[plan]?.maxClients || Infinity;
    if (currentClientCount >= limit) {
      return {
        allowed: false,
        reason: `Limite de ${limit} clients atteinte pour le Plan ${plan}. Passez au Plan Pro pour ajouter des clients en illimité !`,
      };
    }
    return { allowed: true };
  },

  // Calculate Expiration Date (30 days for monthly, 365 days for annual)
  calculateExpirationDate(billingCycle: 'monthly' | 'annual' = 'monthly'): string {
    const now = new Date();
    const days = billingCycle === 'annual' ? 365 : 30;
    const expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return expires.toISOString();
  },

  // Process automatic expirations and downgrade expired subscriptions to Gratuit
  processExpirations(companies: SubscriptionRecord[]): { updated: SubscriptionRecord[]; expiredCount: number } {
    const now = new Date();
    let expiredCount = 0;

    const updated = companies.map((c) => {
      if (c.status === 'active' && c.expiresAt) {
        const expDate = new Date(c.expiresAt);
        if (expDate < now && c.plan !== 'Gratuit') {
          expiredCount++;
          return {
            ...c,
            plan: 'Gratuit' as PlanType,
            status: 'expired' as const,
            amount: 0,
          };
        }
      }
      return c;
    });

    return { updated, expiredCount };
  },
};
