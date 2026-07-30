import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[API INVOICE CREATE] Received payload:', body);

    const {
      invoiceNumber,
      organizationId,
      clientName,
      clientEmail,
      status,
      issueDate,
      dueDate,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes,
      observations,
      signatureUrl,
      items,
      paymentToken,
    } = body;

    const token = paymentToken || body.id || `inv-${Date.now()}`;
    const validOrgId = organizationId && /^[0-9a-f-]{36}$/i.test(organizationId)
      ? organizationId
      : 'e8b8c2a1-94f3-4e67-b8a9-0d1e2f3a4b5c';

    // 1. Ensure Organization exists in DB
    const { error: orgErr } = await supabase.from('organizations').upsert({
      id: validOrgId,
      name: body.organizationName || 'Mon Entreprise',
      email: `${validOrgId}@monneyfact.ci`,
      phone: '+225 07 00 00 00 00',
      address: 'Abidjan, Côte d\'Ivoire',
      tax_id: 'NCC Non Renseigné',
    }, { onConflict: 'id' });

    if (orgErr) {
      console.warn('[API INVOICE CREATE] Org upsert warning:', orgErr);
    }

    // 2. Insert Invoice (Standard Insert Without Invalid ON CONFLICT)
    const { data: insertedInvoice, error: invErr } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        organization_id: validOrgId,
        client_name: clientName,
        client_email: clientEmail || 'client@entreprise.ci',
        status: status || 'sent',
        issue_date: issueDate,
        due_date: dueDate,
        subtotal: Number(subtotal),
        tax_rate: Number(taxRate || 18),
        tax_amount: Number(taxAmount),
        total: Number(total),
        notes: notes || '',
        observations: observations || '',
        signature_url: signatureUrl || '',
        payment_token: token,
      })
      .select('*')
      .single();

    if (invErr) {
      console.error('[API INVOICE CREATE] Invoice insert error:', invErr);
      return NextResponse.json({ success: false, error: invErr.message }, { status: 500 });
    }

    // 3. Insert Items
    if (insertedInvoice && items && items.length > 0) {
      const itemRows = items.map((item: any) => ({
        invoice_id: insertedInvoice.id,
        description: item.description,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unitPrice) || 0,
        line_total: Number(item.lineTotal) || 0,
      }));

      await supabase.from('invoice_items').insert(itemRows);
    }

    return NextResponse.json({
      success: true,
      invoice: insertedInvoice,
      token,
    });
  } catch (err: any) {
    console.error('[API INVOICE CREATE] Server Exception:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
