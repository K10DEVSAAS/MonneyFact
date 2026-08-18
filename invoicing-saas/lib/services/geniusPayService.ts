import crypto from 'crypto';

export const geniusPayService = {
  /**
   * Calculates HMAC-SHA256 signature for GeniusPay webhook.
   * Format: HMAC-SHA256(secretKey, `${timestamp}.${rawBody}`)
   */
  calculateWebhookSignature(timestamp: string, rawBody: string, secretKey: string): string {
    const dataToSign = `${timestamp}.${rawBody}`;
    return crypto
      .createHmac('sha256', secretKey)
      .update(dataToSign, 'utf8')
      .digest('hex');
  },

  /**
   * Timing-safe verification of GeniusPay webhook signature.
   */
  verifyWebhookSignature(timestamp: string, rawBody: string, signature: string, secretKey: string): boolean {
    if (!signature || !timestamp || !secretKey || !rawBody) {
      return false;
    }

    try {
      const expectedSignature = this.calculateWebhookSignature(timestamp, rawBody, secretKey);
      
      const sigBuffer = Buffer.from(signature.trim().toLowerCase());
      const expectedBuffer = Buffer.from(expectedSignature.trim().toLowerCase());

      if (sigBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch (e) {
      console.error('Error verifying GeniusPay signature:', e);
      return false;
    }
  },
};
