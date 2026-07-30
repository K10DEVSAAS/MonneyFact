export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export type PaymentChannel = 'wave' | 'orange_money' | 'mtn_momo' | 'moov' | 'card';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  organizationId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  status: InvoiceStatus;
  issueDate: string; // ISO String DD/MM/YYYY
  dueDate: string;   // ISO String DD/MM/YYYY
  subtotal: number;  // en FCFA (Hors Taxe)
  taxRate: number;   // 18% par défaut en Côte d'Ivoire
  taxAmount: number; // Montant de la TVA 18%
  total: number;     // Montant TTC en FCFA
  notes?: string;    // Notes de règlement
  observations?: string; // Champ Détails ou Observations complémentaires
  signatureUrl?: string; // URL / Base64 de la signature numérique
  paymentToken?: string; // Identifiant unique et sécurisé pour le lien de paiement public
  paymentMethod?: PaymentChannel;
  paymentTransactionId?: string; // Identifiant de transaction SynePay / Agrégateur
  paidAt?: string;
  items: InvoiceItem[];
  createdAt: string;
}

export interface Client {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  createdAt: string;
  totalInvoiced: number;
  unpaidBalance: number;
}

export interface Organization {
  id: string;
  name: string;
  address: string;
  phone: string;
  logoUrl?: string;
  taxId?: string; // Numéro Compte Contribuable (NNE/NCC)
  createdAt: string;
}

export interface DashboardStats {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  invoiceCounts: {
    total: number;
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
  };
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}
