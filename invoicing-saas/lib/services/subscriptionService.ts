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
  Basique: 0,
  Pro: 0,
};

export const PLAN_LIMITS = {
  Basique: {
    maxInvoicesPerMonth: Infinity,
    maxClients: Infinity,
    customLogo: true,
    advancedQuotes: true,
    advancedAnalytics: true,
    paymentTracking: true,
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
  // Check if invoice creation is allowed under current plan limits (V1: Always allowed)
  canCreateInvoice(_plan: PlanType = 'Pro', _monthlyInvoiceCount: number = 0): { allowed: boolean; reason?: string } {
    return { allowed: true };
  },

  // Check if client creation is allowed under current plan limits (V1: Always allowed)
  canCreateClient(_plan: PlanType = 'Pro', _currentClientCount: number = 0): { allowed: boolean; reason?: string } {
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
