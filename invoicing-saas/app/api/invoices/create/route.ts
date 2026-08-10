import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[API INVOICE CREATE] Received payload:', body);

    const {
      invoiceNumber,
      organizationId,
      subsidiaryId,
      subsidiaryName,
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
    
    function generateFallbackOrgUuid(str: string): string {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      const hex = Math.abs(hash).toString(16).padStart(12, '0');
      return `00000000-0000-4000-8000-${hex}`;
    }

    let validOrgId = organizationId;
    if (!validOrgId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validOrgId)) {
      validOrgId = generateFallbackOrgUuid(body.organizationName || clientEmail || 'default-org');
    }

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

    function toValidUuid(idStr: string | null | undefined): string | null {
      if (!idStr) return null;
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr)) {
        return idStr;
      }
      const hex = Array.from(idStr).reduce((acc, char) => acc + char.charCodeAt(0).toString(16), '').padEnd(32, '0').slice(0, 32);
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
    }

    const targetSubUuid = toValidUuid(subsidiaryId);

    // 2. Insert Invoice (Resilient schema-matching)
    let insertPayload: Record<string, any> = {
      invoice_number: invoiceNumber,
      organization_id: validOrgId,
      subsidiary_id: targetSubUuid,
      subsidiary_name: subsidiaryName || null,
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
    };

    let insertedInvoice: any = null;
    let invErr: any = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase
        .from('invoices')
        .insert(insertPayload)
        .select('*')
        .single();

      if (!error && data) {
        insertedInvoice = data;
        invErr = null;
        break;
      }

      if (error && error.code === 'PGRST204' && error.message.includes("Could not find the '")) {
        const match = error.message.match(/Could not find the '([^']+)' column/);
        if (match && match[1]) {
          const missingCol = match[1];
          console.warn(`[API INVOICE CREATE] Column '${missingCol}' missing from invoices schema. Retrying without it.`);
          delete insertPayload[missingCol];
          continue;
        }
      }

      invErr = error;
      break;
    }

    if (invErr || !insertedInvoice) {
      console.error('[API INVOICE CREATE] Invoice insert error:', invErr);
      return NextResponse.json({ success: false, error: invErr?.message || 'Erreur insertion' }, { status: 500 });
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
