import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { transaction_reference, status, metadata, channel } = payload;

    if (!transaction_reference || status !== 'SUCCESS') {
      return NextResponse.json({ status: 'IGNORED', message: 'Statut non valide' }, { status: 400 });
    }

    const invoiceId = metadata?.invoice_id;

    if (invoiceId) {
      // 1. Fetch exact Invoice from PostgreSQL DB
      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .select('id, total, status')
        .eq('id', invoiceId)
        .single();

      if (invErr || !inv) {
        console.error('[WEBHOOK SYNEPAY] Invoice not found in DB:', invoiceId);
        return NextResponse.json({ error: 'Facture inconnue' }, { status: 404 });
      }

      // 2. IDEMPOTENCY CHECK: If already paid, return OK without duplicating operations
      if (inv.status === 'paid') {
        console.log(`[WEBHOOK SYNEPAY] Facture ${invoiceId} déjà marquée 'paid'. Notif ignorée (Idempotence OK).`);
        return NextResponse.json({ status: 'OK', message: 'Facture déjà traitée (Idempotent)' });
      }

      const paidAmount = Number(inv.total);

      // 3. Insert Idempotent Payment Record in public.payments table
      await supabase.from('payments').insert({
        invoice_id: inv.id,
        amount: paidAmount,
        currency: 'FCFA',
        provider: 'synepay',
        provider_transaction_id: transaction_reference,
        status: 'paid',
        paid_at: new Date().toISOString(),
        metadata: payload,
      });

      // 4. Update Invoice Status to 'paid' in PostgreSQL
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_method: channel || 'wave',
          payment_transaction_id: transaction_reference,
          paid_at: new Date().toISOString(),
        })
        .eq('id', inv.id);

      console.log(`✅ [WEBHOOK SYNEPAY] Facture ${inv.id} mise à jour 'paid' avec succès (Tx: ${transaction_reference}).`);
    }

    return NextResponse.json({
      status: 'OK',
      message: 'Notification Webhook SynePay traitée avec succès',
    });
  } catch (error: any) {
    console.error('Erreur Webhook SynePay:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
