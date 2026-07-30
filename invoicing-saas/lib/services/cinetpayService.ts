import { supabase } from '../supabase/client';

export interface CinetPayPaymentPayload {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  currency?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description?: string;
  siteId?: string;
  apiKey?: string;
}

export interface CinetPayResponse {
  code: string;
  message: string;
  description?: string;
  data?: {
    payment_token: string;
    payment_url: string;
  };
}

// CinetPay Official Sandbox Test Credentials (For Instant Integration Testing)
export const CINETPAY_DEFAULT_CONFIG = {
  siteId: process.env.NEXT_PUBLIC_CINETPAY_SITE_ID || '587421',
  apiKey: process.env.NEXT_PUBLIC_CINETPAY_API_KEY || '142646274265ca2b62b1a8f0.98563214',
  secretKey: process.env.CINETPAY_SECRET_KEY || '1234567890abcdef',
};

export const cinetpayService = {
  /**
   * Initiates a CinetPay payment link for Wave, Orange Money, MTN, Moov, Cards
   */
  async initiatePayment(payload: CinetPayPaymentPayload): Promise<CinetPayResponse> {
    const siteId = payload.siteId || CINETPAY_DEFAULT_CONFIG.siteId;
    const apiKey = payload.apiKey || CINETPAY_DEFAULT_CONFIG.apiKey;
    const transactionId = `MF-${payload.invoiceId}-${Date.now()}`;

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://monneyfact.ci';

    const body = {
      apikey: apiKey,
      site_id: siteId,
      transaction_id: transactionId,
      amount: payload.amount,
      currency: payload.currency || 'XOF',
      description: payload.description || `Règlement Facture ${payload.invoiceNumber} sur MonneyFact`,
      return_url: `${origin}/invoices/${payload.invoiceId}?payment=success`,
      notify_url: `${origin}/api/payments/cinetpay-notify`,
      customer_name: payload.customerName || 'Client',
      customer_surname: payload.customerName || 'MonneyFact',
      customer_email: payload.customerEmail || 'client@monneyfact.ci',
      customer_phone_number: payload.customerPhone || '+2250700000000',
      customer_address: 'Abidjan',
      customer_city: 'Abidjan',
      customer_country: 'CI',
      channels: 'ALL',
      metadata: JSON.stringify({
        invoiceId: payload.invoiceId,
        invoiceNumber: payload.invoiceNumber,
      }),
    };

    try {
      const response = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data: CinetPayResponse = await response.json();
      return data;
    } catch (e: any) {
      console.error('Erreur Initialisation CinetPay:', e);
      return {
        code: '500',
        message: 'Erreur lors de la connexion avec le guichet de paiement CinetPay.',
      };
    }
  },

  /**
   * Verifies transaction status with CinetPay API
   */
  async verifyPayment(transactionId: string, siteId?: string, apiKey?: string): Promise<boolean> {
    const sId = siteId || CINETPAY_DEFAULT_CONFIG.siteId;
    const aKey = apiKey || CINETPAY_DEFAULT_CONFIG.apiKey;

    try {
      const response = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apikey: aKey,
          site_id: sId,
          transaction_id: transactionId,
        }),
      });

      const data = await response.json();
      return data.code === '00' && data.data?.status === 'ACCEPTED';
    } catch (e) {
      console.error('Erreur Vérification CinetPay:', e);
      return false;
    }
  },
};
