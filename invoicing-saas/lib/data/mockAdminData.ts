export interface CompanyCollaborator {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Actif' | 'Invitation Envoyée' | 'Inactif';
  createdAt: string;
}

export interface CompanySubsidiary {
  id: string;
  name: string;
  type: string;
  city: string;
  managerName: string;
  phone?: string;
  status: 'actif' | 'inactif';
}

export interface RegisteredCompany {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  city: string;
  plan: 'Basique' | 'Pro';
  status: 'active' | 'overdue' | 'suspended';
  registeredAt: string;
  totalInvoiced: number; // Volume facturé sur MonneyFact
  monthlySubscription: number; // En FCFA
  subCompaniesCount?: number;
  collaboratorsCount?: number;
  collaborators?: CompanyCollaborator[];
  subsidiaries?: CompanySubsidiary[];
}

export interface AdminDashboardStats {
  totalCompanies: number;
  activeCompanies: number;
  mrr: number; // Monthly Recurring Revenue FCFA
  totalPlatformVolume: number; // FCFA total facturé sur le SaaS
  conversionRate: number; // %
}

// ABSOLUTE ZERO DATA AT STARTUP FOR SUPER ADMIN
export const mockAdminStats: AdminDashboardStats = {
  totalCompanies: 0,
  activeCompanies: 0,
  mrr: 0,
  totalPlatformVolume: 0,
  conversionRate: 0,
};

export const mockRegisteredCompanies: RegisteredCompany[] = [];
