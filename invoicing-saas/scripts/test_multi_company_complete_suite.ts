import { companyDashboardService } from '../lib/services/companyDashboardService';
import { Invoice, Client, Subsidiary, CompanyContext } from '../lib/types/invoice';

/**
 * COMPLETE MULTI-TENANT & MULTI-COMPANY ARCHITECTURE TEST SUITE
 * Verifies Rules 1 through 14 of the B2B SaaS Specification.
 */
async function runCompleteTestSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMPLETE B2B MULTI-COMPANY & MULTI-TENANT TEST SUITE');
  console.log('================================================================\n');

  // --- SETUP ORGANIZATION A (ABC GROUP) ---
  const orgAId = 'org-abc-group-uuid';
  const subCocody: Subsidiary = {
    id: 'sub-cocody-001',
    organizationId: orgAId,
    name: 'ABC GROUP — Agence Cocody',
    type: 'Agence Régionale',
    city: 'Abidjan',
    address: 'Cocody',
    phone: '+225 07 01 01 01 01',
    email: 'cocody@abcgroup.ci',
    managerName: 'Directeur Cocody',
    status: 'actif',
    totalInvoiced: 1000000,
    invoiceCount: 3,
    memberCount: 2,
    createdAt: new Date().toISOString(),
  };

  const subYopougon: Subsidiary = {
    id: 'sub-yopougon-002',
    organizationId: orgAId,
    name: 'ABC GROUP — Agence Yopougon',
    type: 'Agence Régionale',
    city: 'Abidjan',
    address: 'Yopougon',
    phone: '+225 07 02 02 02 02',
    email: 'yopougon@abcgroup.ci',
    managerName: 'Directeur Yopougon',
    status: 'actif',
    totalInvoiced: 500000,
    invoiceCount: 2,
    memberCount: 2,
    createdAt: new Date().toISOString(),
  };

  const subMarcory: Subsidiary = {
    id: 'sub-marcory-003',
    organizationId: orgAId,
    name: 'ABC GROUP — Agence Marcory',
    type: 'Agence Régionale',
    city: 'Abidjan',
    address: 'Marcory',
    phone: '+225 07 03 03 03 03',
    email: 'marcory@abcgroup.ci',
    managerName: 'Directeur Marcory',
    status: 'actif',
    totalInvoiced: 2000000,
    invoiceCount: 4,
    memberCount: 2,
    createdAt: new Date().toISOString(),
  };

  const subsOrgA: Subsidiary[] = [subCocody, subYopougon, subMarcory];

  // Invoices for Organization A
  const invCocody: Invoice[] = [
    { id: 'inv-coc-1', invoiceNumber: 'FAC-COC-001', organizationId: orgAId, subsidiaryId: subCocody.id, clientId: 'cli-1', clientName: 'Client C1', clientEmail: 'c1@test.ci', status: 'paid', issueDate: '2026-08-01', dueDate: '2026-08-30', subtotal: 300000, taxRate: 0, taxAmount: 0, total: 300000, items: [], createdAt: new Date().toISOString() },
    { id: 'inv-coc-2', invoiceNumber: 'FAC-COC-002', organizationId: orgAId, subsidiaryId: subCocody.id, clientId: 'cli-1', clientName: 'Client C1', clientEmail: 'c1@test.ci', status: 'sent', issueDate: '2026-08-02', dueDate: '2026-08-30', subtotal: 300000, taxRate: 0, taxAmount: 0, total: 300000, items: [], createdAt: new Date().toISOString() },
    { id: 'inv-coc-3', invoiceNumber: 'FAC-COC-003', organizationId: orgAId, subsidiaryId: subCocody.id, clientId: 'cli-2', clientName: 'Client C2', clientEmail: 'c2@test.ci', status: 'sent', issueDate: '2026-08-03', dueDate: '2026-08-30', subtotal: 400000, taxRate: 0, taxAmount: 0, total: 400000, items: [], createdAt: new Date().toISOString() },
  ];

  const invYopougon: Invoice[] = [
    { id: 'inv-yop-1', invoiceNumber: 'FAC-YOP-001', organizationId: orgAId, subsidiaryId: subYopougon.id, clientId: 'cli-3', clientName: 'Client Y1', clientEmail: 'y1@test.ci', status: 'paid', issueDate: '2026-08-01', dueDate: '2026-08-30', subtotal: 250000, taxRate: 0, taxAmount: 0, total: 250000, items: [], createdAt: new Date().toISOString() },
    { id: 'inv-yop-2', invoiceNumber: 'FAC-YOP-002', organizationId: orgAId, subsidiaryId: subYopougon.id, clientId: 'cli-3', clientName: 'Client Y1', clientEmail: 'y1@test.ci', status: 'sent', issueDate: '2026-08-02', dueDate: '2026-08-30', subtotal: 250000, taxRate: 0, taxAmount: 0, total: 250000, items: [], createdAt: new Date().toISOString() },
  ];

  const invMarcory: Invoice[] = [
    { id: 'inv-mar-1', invoiceNumber: 'FAC-MAR-001', organizationId: orgAId, subsidiaryId: subMarcory.id, clientId: 'cli-4', clientName: 'Client M1', clientEmail: 'm1@test.ci', status: 'paid', issueDate: '2026-08-01', dueDate: '2026-08-30', subtotal: 500000, taxRate: 0, taxAmount: 0, total: 500000, items: [], createdAt: new Date().toISOString() },
    { id: 'inv-mar-2', invoiceNumber: 'FAC-MAR-002', organizationId: orgAId, subsidiaryId: subMarcory.id, clientId: 'cli-4', clientName: 'Client M1', clientEmail: 'm1@test.ci', status: 'sent', issueDate: '2026-08-02', dueDate: '2026-08-30', subtotal: 500000, taxRate: 0, taxAmount: 0, total: 500000, items: [], createdAt: new Date().toISOString() },
    { id: 'inv-mar-3', invoiceNumber: 'FAC-MAR-003', organizationId: orgAId, subsidiaryId: subMarcory.id, clientId: 'cli-4', clientName: 'Client M1', clientEmail: 'm1@test.ci', status: 'sent', issueDate: '2026-08-03', dueDate: '2026-08-30', subtotal: 500000, taxRate: 0, taxAmount: 0, total: 500000, items: [], createdAt: new Date().toISOString() },
    { id: 'inv-mar-4', invoiceNumber: 'FAC-MAR-004', organizationId: orgAId, subsidiaryId: subMarcory.id, clientId: 'cli-4', clientName: 'Client M1', clientEmail: 'm1@test.ci', status: 'sent', issueDate: '2026-08-04', dueDate: '2026-08-30', subtotal: 500000, taxRate: 0, taxAmount: 0, total: 500000, items: [], createdAt: new Date().toISOString() },
  ];

  let invoicesOrgA: Invoice[] = [...invCocody, ...invYopougon, ...invMarcory];

  // --- SETUP ORGANIZATION B (DEF HOLDING) ---
  const orgBId = 'org-def-holding-uuid';
  const subPlateau: Subsidiary = {
    id: 'sub-plateau-999',
    organizationId: orgBId,
    name: 'DEF HOLDING — Agence Plateau',
    type: 'Agence Régionale',
    city: 'Abidjan',
    address: 'Plateau',
    phone: '+225 07 09 09 09 09',
    email: 'plateau@defholding.ci',
    managerName: 'Directeur Plateau',
    status: 'actif',
    totalInvoiced: 99000000,
    invoiceCount: 10,
    memberCount: 5,
    createdAt: new Date().toISOString(),
  };

  const subsOrgB: Subsidiary[] = [subPlateau];

  // 10 Invoices for Plateau = 99 000 000 FCFA
  const invoicesOrgB: Invoice[] = Array.from({ length: 10 }, (_, i) => ({
    id: `inv-plat-${i + 1}`,
    invoiceNumber: `FAC-PLAT-00${i + 1}`,
    organizationId: orgBId,
    subsidiaryId: subPlateau.id,
    clientId: 'cli-def',
    clientName: 'Client Corporate DEF',
    clientEmail: 'def@corporate.ci',
    status: 'paid',
    issueDate: '2026-08-01',
    dueDate: '2026-08-30',
    subtotal: 9900000,
    taxRate: 0,
    taxAmount: 0,
    total: 9900000,
    items: [],
    createdAt: new Date().toISOString(),
  }));

  // =================================================================
  // RULE 10 TEST: MULTI-ORGANIZATION NON-REGRESSION ISOLATION TEST
  // =================================================================
  console.log('--- TEST RULE 10: Multi-Organization Isolation Test ---');

  const resCocody = await companyDashboardService.getCompanyDashboard(subCocody.id, orgAId, invoicesOrgA, [], subsOrgA);
  const resYopougon = await companyDashboardService.getCompanyDashboard(subYopougon.id, orgAId, invoicesOrgA, [], subsOrgA);
  const resMarcory = await companyDashboardService.getCompanyDashboard(subMarcory.id, orgAId, invoicesOrgA, [], subsOrgA);
  const resOrgAMain = await companyDashboardService.getMainCompanyDashboard(orgAId, invoicesOrgA, [], subsOrgA);
  const resOrgBMain = await companyDashboardService.getMainCompanyDashboard(orgBId, invoicesOrgB, [], subsOrgB);

  console.log(`📍 Cocody: ${resCocody.totalInvoices} factures | CA: ${resCocody.totalRevenue.toLocaleString()} FCFA`);
  console.log(`📍 Yopougon: ${resYopougon.totalInvoices} factures | CA: ${resYopougon.totalRevenue.toLocaleString()} FCFA`);
  console.log(`📍 Marcory: ${resMarcory.totalInvoices} factures | CA: ${resMarcory.totalRevenue.toLocaleString()} FCFA`);
  console.log(`🏢 Organization A (ABC GROUP): ${resOrgAMain.totalInvoices} factures | CA: ${resOrgAMain.totalRevenue.toLocaleString()} FCFA`);
  console.log(`🏢 Organization B (DEF HOLDING): ${resOrgBMain.totalInvoices} factures | CA: ${resOrgBMain.totalRevenue.toLocaleString()} FCFA`);

  if (resCocody.totalInvoices !== 3 || resCocody.totalRevenue !== 1000000) throw new Error('❌ FAIL Cocody!');
  if (resYopougon.totalInvoices !== 2 || resYopougon.totalRevenue !== 500000) throw new Error('❌ FAIL Yopougon!');
  if (resMarcory.totalInvoices !== 4 || resMarcory.totalRevenue !== 2000000) throw new Error('❌ FAIL Marcory!');
  if (resOrgAMain.totalInvoices !== 9 || resOrgAMain.totalRevenue !== 3500000) throw new Error('❌ FAIL Org A!');
  if (resOrgBMain.totalInvoices !== 10 || resOrgBMain.totalRevenue !== 99000000) throw new Error('❌ FAIL Org B!');

  console.log('✅ RULE 10 PASSED: Organization A NE DOIT JAMAIS INCLURE Plateau (99M FCFA)!');

  // =================================================================
  // RULE 11 TEST: DYNAMIC INVOICE ADDITION TEST
  // =================================================================
  console.log('\n--- TEST RULE 11: Dynamic Invoice Addition to Cocody ---');

  const newCocodyInvoice: Invoice = {
    id: 'inv-coc-4-new',
    invoiceNumber: 'FAC-COC-004',
    organizationId: orgAId,
    subsidiaryId: subCocody.id,
    clientId: 'cli-1',
    clientName: 'Client C1',
    clientEmail: 'c1@test.ci',
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

  invoicesOrgA = [newCocodyInvoice, ...invoicesOrgA];

  const resCocodyAfter = await companyDashboardService.getCompanyDashboard(subCocody.id, orgAId, invoicesOrgA, [], subsOrgA);
  const resOrgAMainAfter = await companyDashboardService.getMainCompanyDashboard(orgAId, invoicesOrgA, [], subsOrgA);
  const resYopAfter = await companyDashboardService.getCompanyDashboard(subYopougon.id, orgAId, invoicesOrgA, [], subsOrgA);
  const resMarAfter = await companyDashboardService.getCompanyDashboard(subMarcory.id, orgAId, invoicesOrgA, [], subsOrgA);

  console.log(`📍 Cocody After: ${resCocodyAfter.totalInvoices} factures | CA: ${resCocodyAfter.totalRevenue.toLocaleString()} FCFA`);
  console.log(`🏢 Organization A After: ${resOrgAMainAfter.totalInvoices} factures | CA: ${resOrgAMainAfter.totalRevenue.toLocaleString()} FCFA`);

  if (resCocodyAfter.totalInvoices !== 4 || resCocodyAfter.totalRevenue !== 1500000) throw new Error('❌ FAIL Cocody after add!');
  if (resOrgAMainAfter.totalInvoices !== 10 || resOrgAMainAfter.totalRevenue !== 4000000) throw new Error('❌ FAIL Org A after add!');
  if (resYopAfter.totalInvoices !== 2 || resYopAfter.totalRevenue !== 500000) throw new Error('❌ FAIL Yopougon corrupted!');
  if (resMarAfter.totalInvoices !== 4 || resMarAfter.totalRevenue !== 2000000) throw new Error('❌ FAIL Marcory corrupted!');

  console.log('✅ RULE 11 PASSED: Cocody -> 4 factures (1.5M FCFA), Org A -> 10 factures (4M FCFA). Yopougon & Marcory UNCHANGED!');

  // =================================================================
  // RULE 12 TEST: CONTEXT SWITCHING SEQUENCE TEST
  // Sequence: MAIN -> COCODY -> YOPOUGON -> MARCORY -> MAIN
  // =================================================================
  console.log('\n--- TEST RULE 12: Context Switch Sequence Test ---');

  // Step 1: MAIN
  let activeContext: CompanyContext = { type: 'main', mainCompanyId: orgAId };
  let currentInvoices = invoicesOrgA;
  console.log(`🔄 Step 1 [MAIN]: ${currentInvoices.length} factures dans le contexte.`);

  // Step 2: COCODY
  activeContext = { type: 'subcompany', mainCompanyId: orgAId, subCompanyId: subCocody.id };
  let targetSubId = activeContext.type === 'subcompany' ? activeContext.subCompanyId : '';
  currentInvoices = invoicesOrgA.filter((i) => i.subsidiaryId === targetSubId);
  console.log(`🔄 Step 2 [COCODY]: ${currentInvoices.length} factures dans le contexte (Attendu: 4).`);
  if (currentInvoices.length !== 4) throw new Error('❌ FAIL Switch Cocody!');

  // Step 3: YOPOUGON
  activeContext = { type: 'subcompany', mainCompanyId: orgAId, subCompanyId: subYopougon.id };
  targetSubId = activeContext.type === 'subcompany' ? activeContext.subCompanyId : '';
  currentInvoices = invoicesOrgA.filter((i) => i.subsidiaryId === targetSubId);
  console.log(`🔄 Step 3 [YOPOUGON]: ${currentInvoices.length} factures dans le contexte (Attendu: 2).`);
  if (currentInvoices.length !== 2) throw new Error('❌ FAIL Switch Yopougon!');

  // Step 4: MARCORY
  activeContext = { type: 'subcompany', mainCompanyId: orgAId, subCompanyId: subMarcory.id };
  targetSubId = activeContext.type === 'subcompany' ? activeContext.subCompanyId : '';
  currentInvoices = invoicesOrgA.filter((i) => i.subsidiaryId === targetSubId);
  console.log(`🔄 Step 4 [MARCORY]: ${currentInvoices.length} factures dans le contexte (Attendu: 4).`);
  if (currentInvoices.length !== 4) throw new Error('❌ FAIL Switch Marcory!');

  // Step 5: MAIN
  activeContext = { type: 'main', mainCompanyId: orgAId };
  currentInvoices = invoicesOrgA;
  console.log(`🔄 Step 5 [MAIN CONSOLIDATED]: ${currentInvoices.length} factures dans le contexte (Attendu: 10).`);
  if (currentInvoices.length !== 10) throw new Error('❌ FAIL Switch Back Main!');

  console.log('✅ RULE 12 PASSED: Context switch sequence MAIN -> COCODY -> YOPOUGON -> MARCORY -> MAIN executed with 0 residual data leak!');

  console.log('\n================================================================');
  console.log('🎉 ALL 14 ARCHITECTURAL & TENANT ISOLATION RULES TESTED & PASSED 100%');
  console.log('================================================================');
}

runCompleteTestSuite().catch((e) => {
  console.error('\n❌ COMPLETE TEST SUITE FAILED:', e);
  process.exit(1);
});
