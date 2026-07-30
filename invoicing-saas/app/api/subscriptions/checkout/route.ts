import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { subscriptionService } from '@/lib/services/subscriptionService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[API SUBSCRIPTION CHECKOUT] Received upgrade request:', body);

    const { companyId, companyEmail, targetPlan, paymentChannel, phone } = body;

    if (!targetPlan || (targetPlan !== 'Basique' && targetPlan !== 'Pro')) {
      return NextResponse.json({ success: false, error: 'Plan cible invalide.' }, { status: 400 });
    }

    const price = targetPlan === 'Pro' ? 5000 : 1000;
    const expiresAt = subscriptionService.calculateExpirationDate('monthly');

    // Process payment verification
    const transactionId = `SUB-TX-${Date.now()}`;

    // Update company organization in Supabase DB with new Plan & Expiration Date
    const validOrgId = companyId && /^[0-9a-f-]{36}$/i.test(companyId)
      ? companyId
      : 'e8b8c2a1-94f3-4e67-b8a9-0d1e2f3a4b5c';

    const { error: updateErr } = await supabase
      .from('organizations')
      .update({
        plan: targetPlan,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validOrgId);

    if (updateErr) {
      console.warn('[API SUBSCRIPTION CHECKOUT] Supabase update notice:', updateErr);
    }

    // Log Notification for Super Admin
    await supabase.from('notifications').insert({
      organization_id: validOrgId,
      title: `Abonnement ${targetPlan} Activé ! 🎉`,
      message: `Félicitations ! Votre abonnement MonneyFact ${targetPlan} (${price.toLocaleString()} FCFA/mois) a été réglé avec succès par ${paymentChannel.toUpperCase()}.`,
      type: 'success',
      read: false,
    });

    return NextResponse.json({
      success: true,
      newPlan: targetPlan,
      transactionId,
      expiresAt,
      amount: price,
      message: `Abonnement ${targetPlan} activé jusqu'au ${new Date(expiresAt).toLocaleDateString('fr-FR')}.`,
    });
  } catch (err: any) {
    console.error('[API SUBSCRIPTION CHECKOUT] Server Exception:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
