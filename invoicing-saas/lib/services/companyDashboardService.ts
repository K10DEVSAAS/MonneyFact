import {
  Invoice,
  Client,
  Subsidiary,
  CompanyDashboardResult,
  MainCompanyDashboardResult,
  CompanyBreakdownItem,
} from '../types/invoice';
import { dbService } from './dbService';

export class UnauthorizedCompanyAccessError extends Error {
  constructor(message: string = 'Accès Refusé : La sous-entreprise demandée n\'appartient pas à votre organisation.') {
    super(message);
    this.name = 'UnauthorizedCompanyAccessError';
  }
}

export const companyDashboardService = {
  /**
   * SECURITY CHECK: Validates that a requested companyId (subsidiary) belongs to the authenticated mainCompanyId (organization).
   * Prevents privilege escalation and cross-tenant data access via URL/payload tampering.
   */
  async validateCompanyOwnership(
    companyId: string,
    mainCompanyId: string,
    subsidiariesList?: Subsidiary[]
  ): Promise<boolean> {
    if (!companyId || !mainCompanyId) return false;
    if (companyId === 'global' || companyId === mainCompanyId) return true;

    // Check in-memory list first
    if (subsidiariesList && subsidiariesList.length > 0) {
      const match = subsidiariesList.find((s) => s.id === companyId);
      if (match) {
        return !match.organizationId || match.organizationId === mainCompanyId;
      }
    }

    // Check Database directly for 100% strict verification
    try {
      const dbSubs = await dbService.getSubsidiaries(mainCompanyId);
      return dbSubs.some((s) => s.id === companyId);
    } catch (e) {
      console.error('[SECURITY] Error validating company ownership:', e);
      return false;
    }
  },

  /**
   * SUB-COMPANY DASHBOARD SERVICE: getCompanyDashboard(companyId)
   * Returns isolated metrics strictly for the active sub-company (companyId).
   * Guarantees 100% tenant isolation — no data from other sub-companies will be leaked.
   */
  async getCompanyDashboard(
    companyId: string,
    mainCompanyId: string,
    allInvoices: Invoice[],
    allClients: Client[],
    subsidiariesList: Subsidiary[] = []
  ): Promise<CompanyDashboardResult> {
    // 1. Strict Security Ownership Verification
    const isOwner = await this.validateCompanyOwnership(companyId, mainCompanyId, subsidiariesList);
    if (!isOwner) {
      throw new UnauthorizedCompanyAccessError(
        `Tentative d'accès non autorisée à la sous-entreprise ${companyId} depuis l'organisation ${mainCompanyId}.`
      );
    }

    const subMatch = subsidiariesList.find((s) => s.id === companyId);
    const companyName = subMatch?.name || 'Sous-Entreprise';
    const subNameClean = companyName.toLowerCase().trim();

    // 2. RULE 4: subsidiary_id is the Single Source of Truth
    let companyInvoices: Invoice[] = [];
    if (allInvoices && allInvoices.length > 0) {
      companyInvoices = allInvoices.filter((i) => i.subsidiaryId === companyId);
    } else {
      companyInvoices = await dbService.getCompanyInvoices(mainCompanyId, companyId);
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalRevenue = companyInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const paidInvoices = companyInvoices.filter((inv) => inv.status === 'paid');
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalUnpaid = companyInvoices
      .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const monthlyRevenue = companyInvoices
      .filter((inv) => {
        if (!inv.issueDate) return false;
        const parts = inv.issueDate.split('-');
        const y = parts.length === 3 ? parseInt(parts[0], 10) : new Date(inv.issueDate).getFullYear();
        const m = parts.length === 3 ? parseInt(parts[1], 10) - 1 : new Date(inv.issueDate).getMonth();
        return m === currentMonth && y === currentYear;
      })
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    return {
      companyId,
      companyName,
      totalRevenue,
      totalPaid,
      totalUnpaid,
      totalInvoices: companyInvoices.length,
      totalPayments: paidInvoices.length,
      monthlyRevenue,
      invoiceCounts: {
        total: companyInvoices.length,
        draft: companyInvoices.filter((i) => i.status === 'draft').length,
        sent: companyInvoices.filter((i) => i.status === 'sent').length,
        paid: companyInvoices.filter((i) => i.status === 'paid').length,
        overdue: companyInvoices.filter((i) => i.status === 'overdue').length,
      },
      recentInvoices: companyInvoices.slice(0, 10),
    };
  },

  /**
   * MAIN COMPANY DASHBOARD SERVICE: getMainCompanyDashboard(mainCompanyId)
   * Aggregates totalRevenue, totalInvoices, totalPayments, totalPaid, totalUnpaid, and monthlyRevenue
   * from ALL sub-companies and the main headquarters into a consolidated global dashboard view.
   */
  async getMainCompanyDashboard(
    mainCompanyId: string,
    allInvoices: Invoice[],
    allClients: Client[],
    subsidiariesList: Subsidiary[] = []
  ): Promise<MainCompanyDashboardResult> {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Calculate Global Consolidated Totals
    const totalRevenue = allInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const paidInvoices = allInvoices.filter((inv) => inv.status === 'paid');
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalUnpaid = allInvoices
      .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const monthlyRevenue = allInvoices
      .filter((inv) => {
        if (!inv.issueDate) return false;
        const parts = inv.issueDate.split('-');
        const y = parts.length === 3 ? parseInt(parts[0], 10) : new Date(inv.issueDate).getFullYear();
        const m = parts.length === 3 ? parseInt(parts[1], 10) - 1 : new Date(inv.issueDate).getMonth();
        return m === currentMonth && y === currentYear;
      })
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    // 2. Build Per-Subcompany Consolidated Breakdown (RULE 4: ID driven)
    const companyBreakdown: CompanyBreakdownItem[] = subsidiariesList.map((sub) => {
      const subInvoices = allInvoices.filter((i) => i.subsidiaryId === sub.id);

      const subRevenue = subInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
      const subPaid = subInvoices.filter((i) => i.status === 'paid').reduce((acc, inv) => acc + (inv.total || 0), 0);
      const subUnpaid = subInvoices
        .filter((i) => i.status === 'sent' || i.status === 'overdue')
        .reduce((acc, inv) => acc + (inv.total || 0), 0);

      return {
        companyId: sub.id,
        companyName: sub.name,
        city: sub.city,
        totalRevenue: subRevenue,
        totalPaid: subPaid,
        totalUnpaid: subUnpaid,
        invoiceCount: subInvoices.length,
      };
    });

    // Also include Headquarters (Siège Social) in breakdown if there are main invoices
    const mainHeadquartersInvoices = allInvoices.filter((i) => !i.subsidiaryId && !i.subsidiaryName);
    if (mainHeadquartersInvoices.length > 0 || companyBreakdown.length === 0) {
      const hqRevenue = mainHeadquartersInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
      const hqPaid = mainHeadquartersInvoices.filter((i) => i.status === 'paid').reduce((acc, inv) => acc + (inv.total || 0), 0);
      const hqUnpaid = mainHeadquartersInvoices
        .filter((i) => i.status === 'sent' || i.status === 'overdue')
        .reduce((acc, inv) => acc + (inv.total || 0), 0);

      companyBreakdown.unshift({
        companyId: 'main-headquarters',
        companyName: 'Siège Social (Principal)',
        city: 'Abidjan',
        totalRevenue: hqRevenue,
        totalPaid: hqPaid,
        totalUnpaid: hqUnpaid,
        invoiceCount: mainHeadquartersInvoices.length,
      });
    }

    return {
      mainCompanyId,
      totalRevenue,
      totalPaid,
      totalUnpaid,
      totalInvoices: allInvoices.length,
      totalPayments: paidInvoices.length,
      monthlyRevenue,
      invoiceCounts: {
        total: allInvoices.length,
        draft: allInvoices.filter((i) => i.status === 'draft').length,
        sent: allInvoices.filter((i) => i.status === 'sent').length,
        paid: allInvoices.filter((i) => i.status === 'paid').length,
        overdue: allInvoices.filter((i) => i.status === 'overdue').length,
      },
      companyBreakdown,
      recentInvoices: allInvoices.slice(0, 10),
    };
  },
};
