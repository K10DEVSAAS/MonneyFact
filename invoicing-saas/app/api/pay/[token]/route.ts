import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    console.log('[API PUBLIC PAY] Fetching invoice for token:', token);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);

    let query = supabase.from('invoices').select(`
      *,
      invoice_items (*),
      organizations (name, logo_url)
    `);

    if (isUuid) {
      query = query.or(`id.eq.${token},payment_token.eq.${token}`);
    } else {
      query = query.or(`payment_token.eq.${token},invoice_number.eq.${token}`);
    }

    const { data: dbInv, error } = await query.maybeSingle();

    if (error) {
      console.warn('[API PUBLIC PAY] Query error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    if (!dbInv) {
      return NextResponse.json({ success: false, error: 'Facture introuvable' }, { status: 404 });
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
