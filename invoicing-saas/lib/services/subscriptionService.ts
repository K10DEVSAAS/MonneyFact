import { PlanType } from '../types/invoice';

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
  Basique: 1000,
  Pro: 5000,
};

export const PLAN_LIMITS = {
  Basique: {
    maxInvoicesPerMonth: 10,
    maxClients: 10,
    customLogo: false,
    advancedQuotes: false,
    advancedAnalytics: false,
    paymentTracking: false,
  },
  Pro: {
    maxInvoicesPerMonth: Infinity,
    maxClients: Infinity,
    customLogo: true,
    advancedQuotes: true,
    advancedAnalytics: true,
    paymentTracking: true,
  },
};

export const subscriptionService = {
  // Check if invoice creation is allowed under current plan limits
  canCreateInvoice(plan: PlanType = 'Basique', monthlyInvoiceCount: number): { allowed: boolean; reason?: string } {
    const limit = PLAN_LIMITS[plan]?.maxInvoicesPerMonth || 10;
    if (monthlyInvoiceCount >= limit) {
      return {
        allowed: false,
        reason: `Limite de ${limit} factures/mois atteinte pour le Plan Basique (1 000 FCFA). Passez au Plan Pro (5 000 FCFA/mois) pour facturer en illimité !`,
      };
    }
    return { allowed: true };
  },

  // Check if client creation is allowed under current plan limits
  canCreateClient(plan: PlanType = 'Basique', currentClientCount: number): { allowed: boolean; reason?: string } {
    const limit = PLAN_LIMITS[plan]?.maxClients || 10;
    if (currentClientCount >= limit) {
      return {
        allowed: false,
        reason: `Limite de ${limit} clients atteinte pour le Plan Basique (1 000 FCFA). Passez au Plan Pro (5 000 FCFA/mois) pour ajouter des clients en illimité !`,
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
  isSubscriptionExpired(expiresAt?: string): boolean {
    if (!expiresAt) return false;
    const now = new Date();
    return new Date(expiresAt) < now;
  },

  // Process automatic expirations
  processExpirations(companies: SubscriptionRecord[]): { updated: SubscriptionRecord[]; expiredCount: number } {
    const now = new Date();
    let expiredCount = 0;

    const updated = companies.map((c) => {
      if (c.status === 'active' && c.expiresAt) {
        const expDate = new Date(c.expiresAt);
        if (expDate < now) {
          expiredCount++;
          return {
            ...c,
            status: 'expired' as const,
          };
        }
      }
      return c;
    });

    return { updated, expiredCount };
  },
};
