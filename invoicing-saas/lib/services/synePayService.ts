import { supabase } from '../supabase/client';
import { PaymentChannel } from '../types/invoice';

export interface SynePayPaymentParams {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  currency?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  paymentChannel: PaymentChannel;
  companyName: string;
  siteId?: string;
  apiKey?: string;
}

export interface SynePayPaymentResult {
  success: boolean;
  code: string;
  message: string;
  transactionId?: string;
  checkoutUrl?: string;
  isMock: boolean;
}

// TOGGLE THIS VARIABLE WHEN OFFICIAL SYNEPAY API ACCESS KEYS ARRIVE
export const IS_PRODUCTION_SYNEPAY = process.env.NEXT_PUBLIC_SYNEPAY_IS_PRODUCTION === 'true';

export const SYNEPAY_CONFIG = {
  merchantId: process.env.NEXT_PUBLIC_SYNEPAY_MERCHANT_ID || 'SYN-MERCHANT-MONNEYFACT-CI',
  apiKey: process.env.NEXT_PUBLIC_SYNEPAY_API_KEY || 'syn_live_key_998877665544332211',
  secretKey: process.env.SYNEPAY_SECRET_KEY || 'syn_sec_998877665544332211',
  apiEndpoint: 'https://api.synepay.com/v1/payments/initiate',
};

export const synePayService = {
  /**
   * Initiates payment via SynePay (or Mock simulation if API keys are pending)
   */
  async initiatePayment(params: SynePayPaymentParams): Promise<SynePayPaymentResult> {
    const transactionId = `SYN-TX-${params.invoiceId}-${Date.now()}`;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://monneyfact.ci';

    // 1. MOCK SIMULATION MODE (ACTIVE BY DEFAULT UNTIL OFFICIAL SYNEPAY KEYS ARE ADDED)
    if (!IS_PRODUCTION_SYNEPAY) {
      console.log(`[SynePay Adapter] Mode Simulation Actif pour la facture ${params.invoiceNumber} (${params.amount} FCFA par ${params.paymentChannel})`);

      // Simulate 1-second network delay for real-world user experience
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        success: true,
        code: '200',
        message: `Paiement ${params.paymentChannel.toUpperCase()} de ${params.amount.toLocaleString()} FCFA simulé avec succès via SynePay.`,
        transactionId,
        checkoutUrl: `${origin}/pay/${params.invoiceId}?synepay_tx=${transactionId}&status=success`,
        isMock: true,
      };
    }

    // 2. PRODUCTION REAL SYNEPAY API CALL (EXECUTED WHEN IS_PRODUCTION_SYNEPAY = true)
    try {
      const body = {
        merchant_id: params.siteId || SYNEPAY_CONFIG.merchantId,
        api_key: params.apiKey || SYNEPAY_CONFIG.apiKey,
        transaction_reference: transactionId,
        amount: params.amount,
        currency: params.currency || 'XOF',
        channel: params.paymentChannel,
        description: `Règlement Facture ${params.invoiceNumber} - ${params.companyName}`,
        customer: {
          name: params.clientName,
          email: params.clientEmail || 'client@monneyfact.ci',
          phone: params.clientPhone || '+2250700000000',
        },
        return_url: `${origin}/pay/${params.invoiceId}?synepay_tx=${transactionId}&status=success`,
        notify_url: `${origin}/api/payments/syne-pay-notify`,
        metadata: {
          invoice_id: params.invoiceId,
          invoice_number: params.invoiceNumber,
        },
      };

      const response = await fetch(SYNEPAY_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SYNEPAY_CONFIG.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.status === 'success' || data.code === '200') {
        return {
          success: true,
          code: '200',
          message: 'Paiement initialisé avec succès sur l\'API SynePay.',
          transactionId: data.transaction_id || transactionId,
          checkoutUrl: data.checkout_url || data.payment_url,
          isMock: false,
        };
      }

      return {
        success: false,
        code: data.code || '400',
        message: data.message || 'Erreur lors de l\'initialisation SynePay.',
        isMock: false,
      };
    } catch (e: any) {
      console.error('Erreur API SynePay Production:', e);
      return {
        success: false,
        code: '500',
        message: 'Impossible de contacter les serveurs SynePay. Mode secours activé.',
        isMock: false,
      };
    }
  },

  /**
   * Complete payment settlement on an invoice in Supabase and Store
   */
  async confirmPaymentSettlement(invoiceId: string, transactionId: string, channel: PaymentChannel) {
    try {
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_method: channel,
          payment_transaction_id: transactionId,
          paid_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
};
