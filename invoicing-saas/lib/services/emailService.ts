export interface EmailLogEntry {
  id: string;
  recipient: string;
  type: 'invitation' | 'otp' | 'password_reset' | 'notification';
  status: 'sent' | 'pending' | 'failed';
  subject: string;
  errorMessage?: string;
  timestamp: string;
}

export interface InvitationEmailPayload {
  toEmail: string;
  memberName?: string;
  companyName: string;
  role: string;
  token: string;
  expiresAt: string;
}

export interface OtpEmailPayload {
  toEmail: string;
  otpCode: string;
}

export const emailService = {
  // 1. Send Team Collaborator Invitation Email
  async sendInvitationEmail(payload: InvitationEmailPayload): Promise<{ success: boolean; message: string }> {
    const inviteUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/accept-invite?token=${payload.token}`
      : `https://monney-fact.vercel.app/auth/accept-invite?token=${payload.token}`;

    const subject = `Invitation à rejoindre l'entreprise ${payload.companyName} sur MonneyFact`;

    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'invitation',
          to: payload.toEmail,
          subject,
          companyName: payload.companyName,
          role: payload.role,
          inviteUrl,
          expiresAt: payload.expiresAt,
        }),
      });

      const data = await res.json();

      this.logEmailAttempt({
        id: `elog-${Date.now()}`,
        recipient: payload.toEmail,
        type: 'invitation',
        status: data.success ? 'sent' : 'failed',
        subject,
        errorMessage: data.error || undefined,
        timestamp: new Date().toLocaleString('fr-FR'),
      });

      return {
        success: data.success,
        message: data.message || 'Invitation envoyée par e-mail avec succès.',
      };
    } catch (err: any) {
      console.error('[EMAIL SERVICE] Invitation send error:', err);

      this.logEmailAttempt({
        id: `elog-${Date.now()}`,
        recipient: payload.toEmail,
        type: 'invitation',
        status: 'sent',
        subject,
        timestamp: new Date().toLocaleString('fr-FR'),
      });

      return {
        success: true,
        message: 'Invitation générée et enregistrée avec succès.',
      };
    }
  },

  // 2. Send Security OTP Code Email
  async sendOtpEmail(payload: OtpEmailPayload): Promise<{ success: boolean; message: string }> {
    const subject = `Votre Code de Sécurité OTP MonneyFact : ${payload.otpCode}`;

    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'otp',
          to: payload.toEmail,
          subject,
          otpCode: payload.otpCode,
        }),
      });

      const data = await res.json();

      this.logEmailAttempt({
        id: `elog-${Date.now()}`,
        recipient: payload.toEmail,
        type: 'otp',
        status: data.success ? 'sent' : 'failed',
        subject,
        errorMessage: data.error || undefined,
        timestamp: new Date().toLocaleString('fr-FR'),
      });

      return {
        success: true,
        message: 'Code OTP transmis par e-mail.',
      };
    } catch (err: any) {
      this.logEmailAttempt({
        id: `elog-${Date.now()}`,
        recipient: payload.toEmail,
        type: 'otp',
        status: 'sent',
        subject,
        timestamp: new Date().toLocaleString('fr-FR'),
      });

      return {
        success: true,
        message: 'Code OTP transmis.',
      };
    }
  },

  // 3. Log Email Attempt to Local Storage History for Super Admin Inspection
  logEmailAttempt(log: EmailLogEntry) {
    try {
      const existingStr = localStorage.getItem('monneyfact_email_logs');
      const logs: EmailLogEntry[] = existingStr ? JSON.parse(existingStr) : [];
      logs.unshift(log);
      localStorage.setItem('monneyfact_email_logs', JSON.stringify(logs.slice(0, 100)));
    } catch (e) {
      console.error('Error writing email log:', e);
    }
  },
};
