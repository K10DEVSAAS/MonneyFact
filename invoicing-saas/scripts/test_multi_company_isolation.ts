import { companyDashboardService } from '../lib/services/companyDashboardService';
import { Invoice, Client, Subsidiary } from '../lib/types/invoice';

/**
 * MANDATORY TEST SUITE - SECTION 12
 * Multi-Company Tenant Isolation & Consolidated Dashboard Verification Test
 */
async function runMultiCompanyIsolationTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING MANDATORY MULTI-COMPANY ISOLATION TESTS');
  console.log('====================================================\n');

  const mainCompanyId = 'org-abc-group-test';
  const mainCompanyName = 'ABC GROUP';

  // 1. Setup Test Sub-companies
  const subCocody: Subsidiary = {
    id: 'sub-cocody-uuid-001',
    organizationId: mainCompanyId,
    name: 'ABC GROUP — Agence Cocody',
    type: 'Agence Régionale',
    city: 'Abidjan',
    address: 'Cocody Riviera 3',
    phone: '+225 07 01 01 01 01',
    email: 'cocody@abcgroup.ci',
    createdAt: new Date().toISOString(),
  };

  const subYopougon: Subsidiary = {
    id: 'sub-yopougon-uuid-002',
    organizationId: mainCompanyId,
    name: 'ABC GROUP — Agence Yopougon',
    type: 'Agence Régionale',
    city: 'Abidjan',
    address: 'Yopougon Selmer',
    phone: '+225 07 02 02 02 02',
    email: 'yopougon@abcgroup.ci',
    createdAt: new Date().toISOString(),
  };

  const subMarcory: Subsidiary = {
    id: 'sub-marcory-uuid-003',
    organizationId: mainCompanyId,
    name: 'ABC GROUP — Agence Marcory',
    type: 'Agence Régionale',
    city: 'Abidjan',
    address: 'Marcory Zone 4',
    phone: '+225 07 03 03 03 03',
    email: 'marcory@abcgroup.ci',
    createdAt: new Date().toISOString(),
  };

  const subsidiariesList: Subsidiary[] = [subCocody, subYopougon, subMarcory];

  // 2. Setup Initial Invoices
  // Cocody: 3 invoices = 1 000 000 FCFA (300k + 300k + 400k)
  const invoicesCocody: Invoice[] = [
    {
      id: 'inv-coc-1',
      invoiceNumber: 'FAC-COC-001',
      organizationId: mainCompanyId,
      subsidiaryId: subCocody.id,
      subsidiaryName: subCocody.name,
      clientId: 'cli-1',
      clientName: 'Client Cocody A',
      status: 'paid',
      issueDate: '2026-08-01',
      dueDate: '2026-08-30',
      subtotal: 300000,
      taxRate: 0,
      taxAmount: 0,
      total: 300000,
      items: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inv-coc-2',
      invoiceNumber: 'FAC-COC-002',
      organizationId: mainCompanyId,
      subsidiaryId: subCocody.id,
      subsidiaryName: subCocody.name,
      clientId: 'cli-1',
      clientName: 'Client Cocody A',
      status: 'sent',
      issueDate: '2026-08-02',
      dueDate: '2026-08-30',
      subtotal: 300000,
      taxRate: 0,
      taxAmount: 0,
      total: 300000,
      items: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inv-coc-3',
      invoiceNumber: 'FAC-COC-003',
      organizationId: mainCompanyId,
      subsidiaryId: subCocody.id,
      subsidiaryName: subCocody.name,
      clientId: 'cli-2',
      clientName: 'Client Cocody B',
      status: 'sent',
      issueDate: '2026-08-03',
      dueDate: '2026-08-30',
      subtotal: 400000,
      taxRate: 0,
      taxAmount: 0,
      total: 400000,
      items: [],
      createdAt: new Date().toISOString(),
    },
  ];

  // Yopougon: 2 invoices = 500 000 FCFA (250k + 250k)
  const invoicesYopougon: Invoice[] = [
    {
      id: 'inv-yop-1',
      invoiceNumber: 'FAC-YOP-001',
      organizationId: mainCompanyId,
      subsidiaryId: subYopougon.id,
      subsidiaryName: subYopougon.name,
      clientId: 'cli-3',
      clientName: 'Client Yopougon',
      status: 'paid',
      issueDate: '2026-08-01',
      dueDate: '2026-08-30',
      subtotal: 250000,
      taxRate: 0,
      taxAmount: 0,
      total: 250000,
      items: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inv-yop-2',
      invoiceNumber: 'FAC-YOP-002',
      organizationId: mainCompanyId,
      subsidiaryId: subYopougon.id,
      subsidiaryName: subYopougon.name,
      clientId: 'cli-3',
      clientName: 'Client Yopougon',
      status: 'sent',
      issueDate: '2026-08-02',
      dueDate: '2026-08-30',
      subtotal: 250000,
      taxRate: 0,
      taxAmount: 0,
      total: 250000,
      items: [],
      createdAt: new Date().toISOString(),
    },
  ];

  // Marcory: 4 invoices = 2 000 000 FCFA (500k x 4)
  const invoicesMarcory: Invoice[] = [
    {
      id: 'inv-mar-1',
      invoiceNumber: 'FAC-MAR-001',
      organizationId: mainCompanyId,
      subsidiaryId: subMarcory.id,
      subsidiaryName: subMarcory.name,
      clientId: 'cli-4',
      clientName: 'Client Marcory',
      status: 'paid',
      issueDate: '2026-08-01',
      dueDate: '2026-08-30',
      subtotal: 500000,
      taxRate: 0,
      taxAmount: 0,
      total: 500000,
      items: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inv-mar-2',
      invoiceNumber: 'FAC-MAR-002',
      organizationId: mainCompanyId,
      subsidiaryId: subMarcory.id,
      subsidiaryName: subMarcory.name,
      clientId: 'cli-4',
      clientName: 'Client Marcory',
      status: 'sent',
      issueDate: '2026-08-02',
      dueDate: '2026-08-30',
      subtotal: 500000,
      taxRate: 0,
      taxAmount: 0,
      total: 500000,
      items: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inv-mar-3',
      invoiceNumber: 'FAC-MAR-003',
      organizationId: mainCompanyId,
      subsidiaryId: subMarcory.id,
      subsidiaryName: subMarcory.name,
      clientId: 'cli-4',
      clientName: 'Client Marcory',
      status: 'sent',
      issueDate: '2026-08-03',
      dueDate: '2026-08-30',
      subtotal: 500000,
      taxRate: 0,
      taxAmount: 0,
      total: 500000,
      items: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inv-mar-4',
      invoiceNumber: 'FAC-MAR-004',
      organizationId: mainCompanyId,
      subsidiaryId: subMarcory.id,
      subsidiaryName: subMarcory.name,
      clientId: 'cli-4',
      clientName: 'Client Marcory',
      status: 'sent',
      issueDate: '2026-08-04',
      dueDate: '2026-08-30',
      subtotal: 500000,
      taxRate: 0,
      taxAmount: 0,
      total: 500000,
      items: [],
      createdAt: new Date().toISOString(),
    },
  ];

  let allInvoices: Invoice[] = [...invoicesCocody, ...invoicesYopougon, ...invoicesMarcory];
  const allClients: Client[] = [];

  // TEST PHASE 1: Isolated Sub-company Dashboards & Global Dashboard
  console.log('--- TEST PHASE 1: Initial Dashboards Verification ---');

  const dashCocody = await companyDashboardService.getCompanyDashboard(subCocody.id, mainCompanyId, allInvoices, allClients, subsidiariesList);
  console.log(`📍 Dashboard Cocody: ${dashCocody.totalInvoices} factures | Total Revenue: ${dashCocody.totalRevenue} FCFA`);
  if (dashCocody.totalInvoices !== 3 || dashCocody.totalRevenue !== 1000000) {
    throw new Error(`❌ FAIL: Cocody Dashboard unexpected values! Expected 3 / 1,000,000. Got ${dashCocody.totalInvoices} / ${dashCocody.totalRevenue}`);
  }
  console.log('✅ TEST PASSED: Dashboard Cocody strictly isolated (3 factures, 1 000 000 FCFA)');

  const dashYopougon = await companyDashboardService.getCompanyDashboard(subYopougon.id, mainCompanyId, allInvoices, allClients, subsidiariesList);
  console.log(`📍 Dashboard Yopougon: ${dashYopougon.totalInvoices} factures | Total Revenue: ${dashYopougon.totalRevenue} FCFA`);
  if (dashYopougon.totalInvoices !== 2 || dashYopougon.totalRevenue !== 500000) {
    throw new Error(`❌ FAIL: Yopougon Dashboard unexpected values! Expected 2 / 500,000. Got ${dashYopougon.totalInvoices} / ${dashYopougon.totalRevenue}`);
  }
  console.log('✅ TEST PASSED: Dashboard Yopougon strictly isolated (2 factures, 500 000 FCFA)');

  const dashMarcory = await companyDashboardService.getCompanyDashboard(subMarcory.id, mainCompanyId, allInvoices, allClients, subsidiariesList);
  console.log(`📍 Dashboard Marcory: ${dashMarcory.totalInvoices} factures | Total Revenue: ${dashMarcory.totalRevenue} FCFA`);
  if (dashMarcory.totalInvoices !== 4 || dashMarcory.totalRevenue !== 2000000) {
    throw new Error(`❌ FAIL: Marcory Dashboard unexpected values! Expected 4 / 2,000,000. Got ${dashMarcory.totalInvoices} / ${dashMarcory.totalRevenue}`);
  }
  console.log('✅ TEST PASSED: Dashboard Marcory strictly isolated (4 factures, 2 000 000 FCFA)');

  const dashMain = await companyDashboardService.getMainCompanyDashboard(mainCompanyId, allInvoices, allClients, subsidiariesList);
  console.log(`🏢 Dashboard ABC GROUP (Global): ${dashMain.totalInvoices} factures | Total Revenue: ${dashMain.totalRevenue} FCFA`);
  if (dashMain.totalInvoices !== 9 || dashMain.totalRevenue !== 3500000) {
    throw new Error(`❌ FAIL: Main Dashboard unexpected values! Expected 9 / 3,500,000. Got ${dashMain.totalInvoices} / ${dashMain.totalRevenue}`);
  }
  console.log('✅ TEST PASSED: Dashboard ABC GROUP aggregated correctly (9 factures, 3 500 000 FCFA)');

  // TEST PHASE 2: Dynamic Addition of 1 New Invoice to Cocody (500 000 FCFA)
  console.log('\n--- TEST PHASE 2: Dynamic Invoice Addition to Cocody ---');
  const newInvoiceCocody: Invoice = {
    id: 'inv-coc-4-new',
    invoiceNumber: 'FAC-COC-004',
    organizationId: mainCompanyId,
    subsidiaryId: subCocody.id,
    subsidiaryName: subCocody.name,
    clientId: 'cli-1',
    clientName: 'Client Cocody A',
    status: 'paid',
    issueDate: '2026-08-09',
    dueDate: '2026-08-30',
    subtotal: 500000,
    taxRate: 0,
    taxAmount: 0,
    total: 500000,
    items: [],
    createdAt: new Date().toISOString(),
  };

  allInvoices = [newInvoiceCocody, ...allInvoices];

  // Re-verify Cocody Dashboard (Should become 4 invoices, 1 500 000 FCFA)
  const dashCocodyAfter = await companyDashboardService.getCompanyDashboard(subCocody.id, mainCompanyId, allInvoices, allClients, subsidiariesList);
  console.log(`📍 Dashboard Cocody After New Invoice: ${dashCocodyAfter.totalInvoices} factures | Total Revenue: ${dashCocodyAfter.totalRevenue} FCFA`);
  if (dashCocodyAfter.totalInvoices !== 4 || dashCocodyAfter.totalRevenue !== 1500000) {
    throw new Error(`❌ FAIL: Cocody Dashboard after addition unexpected! Expected 4 / 1,500,000. Got ${dashCocodyAfter.totalInvoices} / ${dashCocodyAfter.totalRevenue}`);
  }
  console.log('✅ TEST PASSED: Dashboard Cocody updated immediately (4 factures, 1 500 000 FCFA)');

  // Re-verify Main Dashboard (Should become 10 invoices, 4 000 000 FCFA)
  const dashMainAfter = await companyDashboardService.getMainCompanyDashboard(mainCompanyId, allInvoices, allClients, subsidiariesList);
  console.log(`🏢 Dashboard ABC GROUP After New Invoice: ${dashMainAfter.totalInvoices} factures | Total Revenue: ${dashMainAfter.totalRevenue} FCFA`);
  if (dashMainAfter.totalInvoices !== 10 || dashMainAfter.totalRevenue !== 4000000) {
    throw new Error(`❌ FAIL: Main Dashboard after addition unexpected! Expected 10 / 4,000,000. Got ${dashMainAfter.totalInvoices} / ${dashMainAfter.totalRevenue}`);
  }
  console.log('✅ TEST PASSED: Dashboard ABC GROUP aggregated updated immediately (10 factures, 4 000 000 FCFA)');

  // Re-verify Yopougon and Marcory (MUST REMAIN UNCHANGED!)
  const dashYopAfter = await companyDashboardService.getCompanyDashboard(subYopougon.id, mainCompanyId, allInvoices, allClients, subsidiariesList);
  const dashMarAfter = await companyDashboardService.getCompanyDashboard(subMarcory.id, mainCompanyId, allInvoices, allClients, subsidiariesList);

  if (dashYopAfter.totalInvoices !== 2 || dashYopAfter.totalRevenue !== 500000) {
    throw new Error('❌ FAIL: Yopougon Dashboard changed after Cocody addition!');
  }
  if (dashMarAfter.totalInvoices !== 4 || dashMarAfter.totalRevenue !== 2000000) {
    throw new Error('❌ FAIL: Marcory Dashboard changed after Cocody addition!');
  }

  console.log('✅ TEST PASSED: Yopougon (2 factures) and Marcory (4 factures) REMAINED 100% UNCHANGED AND UNPOLLUTED!');

  // TEST PHASE 3: Security Cross-Tenant Access Violation Test
  console.log('\n--- TEST PHASE 3: Security Cross-Tenant Access Check ---');
  try {
    await companyDashboardService.getCompanyDashboard(subCocody.id, 'other-fake-tenant-id', allInvoices, allClients, subsidiariesList);
    throw new Error('❌ FAIL: Security check failed to throw UnauthorizedCompanyAccessError!');
  } catch (err: any) {
    if (err.name === 'UnauthorizedCompanyAccessError' || err.message.includes('non autorisée')) {
      console.log('✅ TEST PASSED: Cross-tenant access attempt DENIED with UnauthorizedCompanyAccessError!');
    } else {
      throw err;
    }
  }

  console.log('\n====================================================');
  console.log('🎉 ALL MULTI-COMPANY ISOLATION TESTS PASSED 100%!');
  console.log('====================================================');
}

runMultiCompanyIsolationTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
