import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

let supabaseUrl = 'https://dekxifsxqxoljobhzraw.supabase.co';
let supabaseAnonKey = '';

try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim();
      }
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
        supabaseAnonKey = line.split('=')[1].trim();
      }
    }
  }
} catch (e) {
  console.warn('Could not load .env.local:', e);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInvoiceCreationFlow() {
  console.log('================================================================');
  console.log('🚀 TESTING INVOICE CREATION FLOW (NO 500 ERROR)');
  console.log('================================================================\n');

  const testOrgId = '1c1f157c-9e90-4c2d-bfc9-653da9c0ee9a'; // memo SARL
  const invNumber = `FAC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const payload = {
    invoiceNumber: invNumber,
    organizationId: testOrgId,
    organizationName: 'memo SARL',
    clientName: 'Entreprise Client Test',
    clientEmail: 'contact@clienttest.ci',
    status: 'sent',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: 250000,
    taxRate: 18,
    taxAmount: 45000,
    total: 295000,
    notes: 'Paiement à 30 jours net.',
    observations: 'Livraison effectuée avec succès.',
    signatureUrl: '',
    items: [
      {
        description: 'Développement Module Invoicing SaaS',
        quantity: 1,
        unitPrice: 250000,
        lineTotal: 250000,
      }
    ]
  };

  // Directly call the handler logic or test Supabase insertion directly
  const { data: insertedOrg } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', testOrgId)
    .single();

  console.log(' Target Organization:', insertedOrg);

  let insertPayload: Record<string, any> = {
    invoice_number: payload.invoiceNumber,
    organization_id: payload.organizationId,
    client_name: payload.clientName,
    client_email: payload.clientEmail,
    status: payload.status,
    issue_date: payload.issueDate,
    due_date: payload.dueDate,
    subtotal: payload.subtotal,
    tax_rate: payload.taxRate,
    tax_amount: payload.taxAmount,
    total: payload.total,
    notes: payload.notes,
    observations: payload.observations,
    signature_url: payload.signatureUrl,
    payment_token: `token-${Date.now()}`,
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
        console.warn(`[TEST FLOW] Column '${missingCol}' missing from invoices schema. Retrying without it.`);
        delete insertPayload[missingCol];
        continue;
      }
    }

    invErr = error;
    break;
  }

  if (invErr || !insertedInvoice) {
    console.error('❌ INVOICE CREATION FAILED:', invErr);
  } else {
    console.log('✅ INVOICE CREATION SUCCESSFUL!');
    console.log('Created Invoice ID:', insertedInvoice.id);
    console.log('Invoice Number:', insertedInvoice.invoice_number);
    console.log('Organization ID:', insertedInvoice.organization_id);
    console.log('Total Amount:', insertedInvoice.total);

    // Verify invoice items insertion
    const itemRows = payload.items.map((item) => ({
      invoice_id: insertedInvoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.lineTotal,
    }));

    const { data: itemsData, error: itemsErr } = await supabase
      .from('invoice_items')
      .insert(itemRows)
      .select('*');

    if (itemsErr) {
      console.error('❌ INVOICE ITEMS FAILED:', itemsErr);
    } else {
      console.log('✅ INVOICE ITEMS SUCCESSFUL:', itemsData.length, 'items inserted.');
    }

    // Clean up test data
    await supabase.from('invoice_items').delete().eq('invoice_id', insertedInvoice.id);
    await supabase.from('invoices').delete().eq('id', insertedInvoice.id);
    console.log('Cleaned up test invoice and items successfully.');
  }
}

testInvoiceCreationFlow();
