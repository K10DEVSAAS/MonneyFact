import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    console.log('[API PUBLIC PAY] Fetching invoice strictly for payment_token:', token);

    if (!token || token.trim().length < 8) {
      return NextResponse.json({ success: false, error: 'Token de paiement invalide' }, { status: 400 });
    }

    const { data: dbInv, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        client_name,
        client_email,
        status,
        issue_date,
        due_date,
        subtotal,
        tax_rate,
        tax_amount,
        total,
        notes,
        observations,
        created_at,
        invoice_items (
          id,
          description,
          quantity,
          unit_price,
          line_total
        ),
        organizations (
          name,
          logo_url
        )
      `)
      .eq('id', token.trim())
      .maybeSingle();

    if (error) {
      console.warn('[API PUBLIC PAY] Query error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    if (!dbInv) {
      return NextResponse.json({ success: false, error: 'Facture introuvable pour ce lien de paiement.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      invoice: dbInv,
    });
  } catch (err: any) {
    console.error('[API PUBLIC PAY] Server Exception:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
