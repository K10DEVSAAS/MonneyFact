import { NextResponse } from 'next/server';
import { dbService } from '@/lib/services/dbService';
import { companyDashboardService } from '@/lib/services/companyDashboardService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mainCompanyId = searchParams.get('mainCompanyId');

    if (!mainCompanyId) {
      return NextResponse.json(
        { success: false, error: 'Identifiant mainCompanyId requis.' },
        { status: 400 }
      );
    }

    // 1. Fetch Consolidated DB Data
    const [invoices, clients, subsidiaries] = await Promise.all([
      dbService.getInvoices(mainCompanyId),
      dbService.getClients(mainCompanyId),
      dbService.getSubsidiaries(mainCompanyId),
    ]);

    // 2. Execute Main Company Consolidated Aggregation Service
    const dashboard = await companyDashboardService.getMainCompanyDashboard(
      mainCompanyId,
      invoices,
      clients,
      subsidiaries
    );

    return NextResponse.json({
      success: true,
      dashboard,
    });
  } catch (err: any) {
    console.error('[API DASHBOARD MAIN ERROR]:', err);
    return NextResponse.json({ success: false, error: err.message || 'Erreur serveur.' }, { status: 500 });
  }
}
