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

    // Verify payment status with CinetPay API
    const isSuccess = await cinetpayService.verifyPayment(cpayTransId);

    if (isSuccess && cpayCustom) {
      let metadata: any = {};
      try {
        metadata = JSON.parse(cpayCustom);
      } catch (e) {
        console.error(e);
      }

      const invoiceId = metadata.invoiceId;

      if (invoiceId) {
        // Update invoice status to 'paid' with full metadata in Supabase database
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: 'cinetpay',
            payment_transaction_id: cpayTransId,
          })
          .eq('id', invoiceId);
      }
    }

    return NextResponse.json({ status: 'OK', message: 'Notification CinetPay traitée avec succès' });
  } catch (error: any) {
    console.error('Erreur Webhook CinetPay:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
