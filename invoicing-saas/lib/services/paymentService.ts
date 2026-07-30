export type PaymentChannel = 'wave' | 'orange_money' | 'mtn_momo' | 'moov' | 'card';

export interface PaymentRequest {
  amount: number;
  currency: string;
  customerEmail: string;
  customerPhone?: string;
  planName: string;
  channel: PaymentChannel;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  channel: PaymentChannel;
  timestamp: string;
  message: string;
}

/**
 * Interface standard pour tout agrégateur de paiement (Siposive, Genius Pay, CinetPay, etc.)
 */
export interface PaymentProvider {
  initiatePayment(request: PaymentRequest): Promise<PaymentResult>;
  verifyPayment(transactionId: string): Promise<boolean>;
}

/**
 * Implémentation du Guichet de Simulation de Paiement
 * (Cette classe sera facilement remplacée par SiposiveGeniusPayProvider lors de l'intégration réelle)
 */
export class SimulatedPaymentProvider implements PaymentProvider {
  async initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
    // Simuler un délai réseau réaliste (800ms)
    await new Promise((resolve) => setTimeout(resolve, 800));

    const transactionId = `SIM-TX-${Date.now()}`;
    const result: PaymentResult = {
      success: true,
      transactionId,
      amount: request.amount,
      channel: request.channel,
      timestamp: new Date().toISOString(),
      message: `Paiement simulé de ${request.amount.toLocaleString()} FCFA par ${request.channel.toUpperCase()} réussi.`,
    };

    // Consigner la transaction dans l'historique local pour le Super Admin
    try {
      const existingStr = localStorage.getItem('monneyfact_simulated_payments');
      const history = existingStr ? JSON.parse(existingStr) : [];
      history.unshift({
        ...result,
        customerEmail: request.customerEmail,
        planName: request.planName,
      });
      localStorage.setItem('monneyfact_simulated_payments', JSON.stringify(history));
    } catch (e) {
      console.error('Error saving simulated payment log:', e);
    }

    return result;
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    return transactionId.startsWith('SIM-TX-');
  }
}

// Instance globale exportée
export const paymentProvider: PaymentProvider = new SimulatedPaymentProvider();
