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
      // Update invoice to paid status in Supabase database
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_method: channel || 'wave',
          payment_transaction_id: transaction_reference,
          paid_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
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
