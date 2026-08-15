import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { cinetpayService } from '@/lib/services/cinetpayService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const cpayTransId = body.get('cpay_trans_id') as string;
    const cpayCustom = body.get('cpay_custom') as string;

    if (!cpayTransId) {
      return NextResponse.json({ error: 'Missing cpay_trans_id' }, { status: 400 });
    }

    // Verify payment status with CinetPay API (Server-to-Server)
    const isSuccess = await cinetpayService.verifyPayment(cpayTransId);

    if (!isSuccess) {
      console.warn(`[WEBHOOK CINETPAY] Transaction non valide ou rejetée par CinetPay: ${cpayTransId}`);
      return NextResponse.json({ error: 'Paiement non vérifié' }, { status: 400 });
    }

    if (cpayCustom) {
      let metadata: any = {};
      try {
        metadata = JSON.parse(cpayCustom);
      } catch (e) {
        console.error('Metadata JSON parse error:', e);
      }

      const invoiceId = metadata.invoiceId;

      if (invoiceId) {
        // 1. Fetch exact Invoice from PostgreSQL DB for amount verification
        const { data: inv, error: invErr } = await supabase
          .from('invoices')
          .select('id, total, status')
          .eq('id', invoiceId)
          .single();

        if (invErr || !inv) {
          console.error('[WEBHOOK CINETPAY] Invoice not found in DB:', invoiceId);
          return NextResponse.json({ error: 'Facture inconnue' }, { status: 404 });
        }

        // 2. IDEMPOTENCY CHECK: If already paid, return OK without duplicating operations
        if (inv.status === 'paid') {
          console.log(`[WEBHOOK CINETPAY] Facture ${invoiceId} déjà marquée 'paid'. Notif ignorée (Idempotence OK).`);
          return NextResponse.json({ status: 'OK', message: 'Facture déjà traitée (Idempotent)' });
        }

        const paidAmount = Number(inv.total);

        // 3. Insert Idempotent Payment Record in public.payments table
        await supabase.from('payments').insert({
          invoice_id: inv.id,
          amount: paidAmount,
          currency: 'FCFA',
          provider: 'cinetpay',
          provider_transaction_id: cpayTransId,
          status: 'paid',
          paid_at: new Date().toISOString(),
          metadata: { cpay_custom: cpayCustom, cpay_trans_id: cpayTransId },
        });

        // 4. Update Invoice Status to 'paid' in PostgreSQL
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: 'cinetpay',
            payment_transaction_id: cpayTransId,
          })
          .eq('id', inv.id);

        console.log(`✅ [WEBHOOK CINETPAY] Facture ${inv.id} mise à jour 'paid' avec succès (Tx: ${cpayTransId}).`);
      }
    }

    return NextResponse.json({ status: 'OK', message: 'Notification CinetPay traitée avec succès' });
  } catch (error: any) {
    console.error('Erreur Webhook CinetPay:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
