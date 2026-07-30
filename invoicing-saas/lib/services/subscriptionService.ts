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
  action: 'suspend' | 'reactivate' | 'cancel' | 'upgrade' | 'renew';
  targetCompany: string;
  reason: string;
  timestamp: string;
}

export const PLAN_PRICES: Record<PlanType, number> = {
  Découverte: 0,
  Pro: 5000,
  Business: 15000,
};

export const PLAN_LIMITS = {
  Découverte: {
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

  // Calculate days remaining before expiration
  calculateDaysRemaining(expiresAt?: string): number {
    if (!expiresAt) return 30;
    const now = new Date();
    const exp = new Date(expiresAt);
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  },

  // Check if subscription is expired
  isSubscriptionExpired(expiresAt?: string, plan: PlanType = 'Pro'): boolean {
    if (plan === 'Découverte') return false; // Plan Découverte ne s'expire jamais
    if (!expiresAt) return false;
    const now = new Date();
    return new Date(expiresAt) < now;
  },

  // Process automatic expirations and downgrade expired subscriptions to Découverte
  processExpirations(companies: SubscriptionRecord[]): { updated: SubscriptionRecord[]; expiredCount: number } {
    const now = new Date();
    let expiredCount = 0;

    const updated = companies.map((c) => {
      if (c.status === 'active' && c.expiresAt) {
        const expDate = new Date(c.expiresAt);
        if (expDate < now && c.plan !== 'Découverte') {
          expiredCount++;
          return {
            ...c,
            plan: 'Découverte' as PlanType,
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
