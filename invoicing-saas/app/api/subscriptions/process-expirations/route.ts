import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const nowIso = new Date().toISOString();
    console.log('[API AUTOMATED EXPIRATIONS] Processing expirations at:', nowIso);

    // 1. Query all active subscriptions that have passed their expiration date
    const { data: expiredOrgs, error } = await supabase
      .from('organizations')
      .select('*')
      .neq('plan', 'Gratuit')
      .lt('expires_at', nowIso);

    if (error) {
      console.warn('[API AUTOMATED EXPIRATIONS] Query error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    let processedCount = 0;

    if (expiredOrgs && expiredOrgs.length > 0) {
      for (const org of expiredOrgs) {
        // Downgrade to Gratuit
        await supabase
          .from('organizations')
          .update({ plan: 'Gratuit' })
          .eq('id', org.id);

        // Insert notification
        await supabase.from('notifications').insert({
          organization_id: org.id,
          title: 'Abonnement Expiré ⚠️',
          message: `Votre abonnement MonneyFact ${org.plan} a expiré. Votre compte est repassé au Plan Gratuit. Reconnectez-vous pour renouveler.`,
          type: 'warning',
          read: false,
        });

        processedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processedCount,
      timestamp: nowIso,
      message: `${processedCount} abonnement(s) expiré(s) rétrogradé(s) automatiquement vers le Plan Gratuit.`,
    });
  } catch (err: any) {
    console.error('[API AUTOMATED EXPIRATIONS] Exception:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
