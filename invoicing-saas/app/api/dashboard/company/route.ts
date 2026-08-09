import { NextResponse } from 'next/server';
import { dbService } from '@/lib/services/dbService';
import { companyDashboardService, UnauthorizedCompanyAccessError } from '@/lib/services/companyDashboardService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const mainCompanyId = searchParams.get('mainCompanyId');

    if (!companyId || !mainCompanyId) {
      return NextResponse.json(
        { success: false, error: 'Identifiants companyId et mainCompanyId requis.' },
        { status: 400 }
      );
    }

    // 1. Fetch Organization Data from DB
    const [invoices, clients, subsidiaries] = await Promise.all([
      dbService.getInvoices(mainCompanyId),
      dbService.getClients(mainCompanyId),
      dbService.getSubsidiaries(mainCompanyId),
    ]);

    // 2. Execute Isolated Sub-Company Dashboard Service
    const dashboard = await companyDashboardService.getCompanyDashboard(
      companyId,
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
    if (err instanceof UnauthorizedCompanyAccessError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 403 });
    }
    console.error('[API DASHBOARD COMPANY ERROR]:', err);
    return NextResponse.json({ success: false, error: err.message || 'Erreur serveur.' }, { status: 500 });
  }
}
