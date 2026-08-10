'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth, UserSession } from '@/lib/auth/authContext';
import { useAppStore } from '@/lib/store/appStore';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { syncOAuthUser, loginAsAdmin } = useAuth();
  const { initializeZeroAccount } = useAppStore();
  const [statusMessage, setStatusMessage] = useState('Validation de votre authentification Google...');
  const processingRef = useRef(false);

  useEffect(() => {
    let isSubscribed = true;

    // TIMEOUT DE SÉCURITÉ GLOBAL DE 10 SECONDES
    const globalTimeoutId = setTimeout(() => {
      if (!isSubscribed) return;
      console.error('[OAUTH] TIMEOUT 10S EXPIRED : Le serveur d\'authentification ne répond pas.');
      setStatusMessage('Le serveur d’authentification ne répond pas. Veuillez réessayer.');
      processingRef.current = false;
      setTimeout(() => router.replace('/login'), 3000);
    }, 10000);

    const processOAuthFlow = async () => {
      if (processingRef.current) return;
      processingRef.current = true;

      console.log('[OAUTH][TIME] SESSION_START', Date.now());
      console.log('[OAUTH] START');

      try {
        // 1. RECUPERATION DE SESSION SUPABASE AUTH (SOURCE UNIQUE DE VERITE)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          clearTimeout(globalTimeoutId);
          console.error('[OAUTH] ERREUR SESSION:', sessionError);
          setStatusMessage(`Erreur session : ${sessionError.message}`);
          processingRef.current = false;
          setTimeout(() => router.replace('/login'), 3000);
          return;
        }

        if (!session?.user) {
          clearTimeout(globalTimeoutId);
          console.error('[OAUTH] Aucune session utilisateur Google disponible');
          setStatusMessage('Aucune session Google valide.');
          processingRef.current = false;
          setTimeout(() => router.replace('/login'), 3000);
          return;
        }

        const user = session.user;
        const userId = user.id;
        const email = (user.email || '').trim().toLowerCase();

        console.log('[OAUTH] SESSION', { session });
        console.log('[OAUTH] USER', { userId, email });
        console.log('[IDENTITY] AUTH USER ID:', userId);
        console.log('[IDENTITY] AUTH EMAIL:', email);
        console.log('[OAUTH] SESSION_OK', { userId, email });

        if (!email) {
          clearTimeout(globalTimeoutId);
          console.error('[OAUTH] Email manquant dans la session');
          setStatusMessage('Impossible de récupérer votre adresse email Google.');
          processingRef.current = false;
          setTimeout(() => router.replace('/login'), 3000);
          return;
        }

        // SUPER ADMIN EXCEPTION
        if (email === 'admin@monneyfact.ci') {
          clearTimeout(globalTimeoutId);
          console.log('[OAUTH] SUPER ADMIN DETECTED');
          loginAsAdmin();
          router.replace('/admin');
          return;
        }

        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0] || 'Entreprise';

        // ETAPE 2 — RECHERCHE EXCLUSIVE DU PROFIL PAR session.user.id
        console.log('[OAUTH][TIME] PROFILE_START', Date.now());
        console.log('[OAUTH] PROFILE_QUERY_START');

        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        console.log('[OAUTH][TIME] PROFILE_END', Date.now());
        console.log('[OAUTH] PROFILE', existingProfile);
        console.log('[OAUTH] PROFILE_QUERY_END', { found: !!existingProfile, organizationId: existingProfile?.organization_id });

        console.log('[IDENTITY] PROFILE ID:', existingProfile?.id);
        console.log('[IDENTITY] PROFILE EMAIL:', existingProfile?.email);
        console.log('[IDENTITY] PROFILE ORGANIZATION ID:', existingProfile?.organization_id);
        console.log('[IDENTITY] PROFILE FULL NAME:', existingProfile?.full_name);

        if (profileError) {
          clearTimeout(globalTimeoutId);
          console.error('[OAUTH] ERREUR PROFILE:', profileError);
          setStatusMessage(`Erreur profil : ${profileError.message}`);
          processingRef.current = false;
          setTimeout(() => router.replace('/login'), 3000);
          return;
        }

        // ETAPE 5 — VERIFICATION DE COHERENCE D'IDENTITE
        if (existingProfile) {
          if (existingProfile.id !== userId) {
            clearTimeout(globalTimeoutId);
            console.error('[IDENTITY] CRITICAL MISMATCH AUTH USER ID != PROFILE ID', { userId, profileId: existingProfile.id });
            setStatusMessage("Erreur de correspondance du compte Google. Votre session n'a pas été ouverte afin de protéger vos données.");
            processingRef.current = false;
            setTimeout(() => router.replace('/login'), 3000);
            return;
          }
          if (existingProfile.email?.toLowerCase().trim() !== email) {
            clearTimeout(globalTimeoutId);
            console.error('[IDENTITY] CRITICAL MISMATCH EMAIL', { authEmail: email, profileEmail: existingProfile.email });
            setStatusMessage("Erreur de correspondance du compte Google. Votre session n'a pas été ouverte afin de protéger vos données.");
            processingRef.current = false;
            setTimeout(() => router.replace('/login'), 3000);
            return;
          }
        }

        // ETAPE 6 — DETERMINATION DE L'ORGANISATION PAR PROFILE.ORGANIZATION_ID OU EMAIL
        console.log('[OAUTH][TIME] ORGANIZATION_START', Date.now());
        console.log('[OAUTH] ORGANIZATION_QUERY_START');

        let targetOrg: any = null;

        if (existingProfile?.organization_id) {
          const { data: orgById } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', existingProfile.organization_id)
            .maybeSingle();

          if (orgById) targetOrg = orgById;
        }

        if (!targetOrg) {
          const { data: orgByEmail, error: orgErr } = await supabase
            .from('organizations')
            .select('*')
            .eq('email', email)
            .maybeSingle();

          if (orgErr) {
            clearTimeout(globalTimeoutId);
            console.error('[OAUTH] ERREUR ORGANIZATION:', orgErr);
            setStatusMessage(`Erreur organisation : ${orgErr.message}`);
            processingRef.current = false;
            setTimeout(() => router.replace('/login'), 3000);
            return;
          }

          if (orgByEmail) targetOrg = orgByEmail;
        }

        console.log('[OAUTH][TIME] ORGANIZATION_END', Date.now());
        console.log('[OAUTH] ORGANIZATION_QUERY_END', { found: !!targetOrg, orgId: targetOrg?.id });
        console.log('[IDENTITY] ORGANIZATION ID:', targetOrg?.id);
        console.log('[IDENTITY] ORGANIZATION NAME:', targetOrg?.name);

        let resolvedOrgId: string | null = targetOrg?.id || null;
        let resolvedOrgName: string | null = targetOrg?.name || null;

        // CAS RATTACHEMENT & CREATION SI ABSENTE
        if (existingProfile && !existingProfile.organization_id) {
          if (targetOrg) {
            resolvedOrgId = targetOrg.id;
            resolvedOrgName = targetOrg.name;

            const { error: updateProfErr } = await supabase
              .from('profiles')
              .update({ organization_id: targetOrg.id })
              .eq('id', userId);

            if (updateProfErr) {
              clearTimeout(globalTimeoutId);
              console.error('[OAUTH] ERREUR RATTACHEMENT PROFIL:', updateProfErr);
              setStatusMessage(`Erreur rattachement organisation : ${updateProfErr.message}`);
              processingRef.current = false;
              setTimeout(() => router.replace('/login'), 3000);
              return;
            }
          } else {
            const companyName = fullName.includes(' ') ? `${fullName.split(' ')[0]} Enterprise` : `${fullName} SARL`;
            const { data: newOrg, error: createOrgErr } = await supabase
              .from('organizations')
              .insert({
                name: companyName,
                email,
                address: "Abidjan, Côte d'Ivoire",
                phone: "+225 07 00 00 00 00",
                currency: "FCFA",
                default_tax_rate: 18,
                plan: "Pro",
                status: "active",
                activated_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              })
              .select('*')
              .single();

            if (createOrgErr || !newOrg) {
              clearTimeout(globalTimeoutId);
              console.error('[OAUTH] ERREUR CRÉATION ORGANISATION:', createOrgErr);
              setStatusMessage(`Erreur création organisation : ${createOrgErr?.message}`);
              processingRef.current = false;
              setTimeout(() => router.replace('/login'), 3000);
              return;
            }

            targetOrg = newOrg;
            resolvedOrgId = newOrg.id;
            resolvedOrgName = newOrg.name;

            const { error: updateProfErr } = await supabase
              .from('profiles')
              .update({ organization_id: newOrg.id })
              .eq('id', userId);

            if (updateProfErr) {
              clearTimeout(globalTimeoutId);
              console.error('[OAUTH] ERREUR RATTACHEMENT PROFIL:', updateProfErr);
              setStatusMessage(`Erreur rattachement organisation : ${updateProfErr.message}`);
              processingRef.current = false;
              setTimeout(() => router.replace('/login'), 3000);
              return;
            }
          }
        }
        else if (!existingProfile && targetOrg) {
          resolvedOrgId = targetOrg.id;
          resolvedOrgName = targetOrg.name;

          const { error: createProfErr } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email,
              full_name: fullName,
              role: 'client',
              organization_id: targetOrg.id,
              plan: targetOrg.plan ?? 'Pro',
            });

          if (createProfErr) {
            clearTimeout(globalTimeoutId);
            console.error('[OAUTH] ERREUR CRÉATION PROFIL:', createProfErr);
            setStatusMessage(`Erreur création profil : ${createProfErr.message}`);
            processingRef.current = false;
            setTimeout(() => router.replace('/login'), 3000);
            return;
          }
        }
        else if (!existingProfile && !targetOrg) {
          const companyName = fullName.includes(' ') ? `${fullName.split(' ')[0]} Enterprise` : `${fullName} SARL`;
          const { data: newOrg, error: createOrgErr } = await supabase
            .from('organizations')
            .insert({
              name: companyName,
              email,
              address: "Abidjan, Côte d'Ivoire",
              phone: "+225 07 00 00 00 00",
              currency: "FCFA",
              default_tax_rate: 18,
              plan: "Pro",
              status: "active",
              activated_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .select('*')
            .single();

          if (createOrgErr || !newOrg) {
            clearTimeout(globalTimeoutId);
            console.error('[OAUTH] ERREUR CRÉATION ORGANISATION:', createOrgErr);
            setStatusMessage(`Erreur création organisation : ${createOrgErr?.message}`);
            processingRef.current = false;
            setTimeout(() => router.replace('/login'), 3000);
            return;
          }

          targetOrg = newOrg;
          resolvedOrgId = newOrg.id;
          resolvedOrgName = newOrg.name;

          const { error: createProfErr } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email,
              full_name: fullName,
              role: 'client',
              organization_id: newOrg.id,
              plan: 'Pro',
            });

          if (createProfErr) {
            clearTimeout(globalTimeoutId);
            console.error('[OAUTH] ERREUR CRÉATION PROFIL:', createProfErr);
            setStatusMessage(`Erreur création profil : ${createProfErr.message}`);
            processingRef.current = false;
            setTimeout(() => router.replace('/login'), 3000);
            return;
          }
        }

        console.log('[OAUTH] BINDING_COMPLETE', { resolvedOrgId, resolvedOrgName });

        // 4. VÉRIFICATION DU PROFIL FINAL
        const { data: finalProfile, error: finalProfileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, organization_id, plan')
          .eq('id', userId)
          .single();

        if (finalProfileError || !finalProfile) {
          clearTimeout(globalTimeoutId);
          console.error('[OAUTH] ERREUR FINAL PROFILE:', finalProfileError);
          setStatusMessage(`Erreur validation profil : ${finalProfileError?.message}`);
          processingRef.current = false;
          setTimeout(() => router.replace('/login'), 3000);
          return;
        }

        // ETAPE 10 — VALIDATION DE SECURITE ANTI-COMPTE CROISE
        if (finalProfile.id !== userId) {
          throw new Error('SECURITY: profile does not belong to authenticated Google user');
        }

        if (finalProfile.email?.toLowerCase().trim() !== email) {
          throw new Error('SECURITY: profile email does not match authenticated Google email');
        }

        if (finalProfile.role !== 'super_admin' && !finalProfile.organization_id) {
          clearTimeout(globalTimeoutId);
          console.error('[OAUTH] PROFIL ORPHELIN DETECTE');
          setStatusMessage('Votre compte n’est associé à aucune entreprise.');
          processingRef.current = false;
          setTimeout(() => router.replace('/login'), 3000);
          return;
        }

        console.log('[OAUTH] FINAL_PROFILE_OK', { finalProfile });

        // ETAPE 7 & 8 — NETTOYAGE STRICT DU CONTEXTE ET REMPLACEMENT EN MEMOIRE
        console.log('[OAUTH][TIME] SYNC_START', Date.now());
        localStorage.removeItem('monneyfact_active_user');

        if (resolvedOrgName) {
          initializeZeroAccount(resolvedOrgName, email);
        }

        const activeUser: UserSession = {
          id: userId,
          name: finalProfile.full_name || fullName,
          email,
          role: 'client',
          organizationId: resolvedOrgId || undefined,
          companyName: resolvedOrgName || `${fullName} Enterprise`,
          plan: (finalProfile.plan as any) || 'Pro',
        };

        console.log('[OAUTH] SYNC USER', activeUser);
        syncOAuthUser(activeUser);
        console.log('[OAUTH][TIME] SYNC_END', Date.now());

        clearTimeout(globalTimeoutId);
        console.log('[OAUTH][TIME] REDIRECT', Date.now());
        console.log('[OAUTH] REDIRECT');
        console.log('[OAUTH] REDIRECT_DASHBOARD');

        router.replace('/dashboard');
      } catch (err) {
        clearTimeout(globalTimeoutId);
        console.error('[OAUTH] ERREUR FATALE:', err);
        setStatusMessage(err instanceof Error ? err.message : 'Une erreur est survenue pendant la connexion Google.');
        processingRef.current = false;
        setTimeout(() => router.replace('/login'), 3000);
      }
    };

    const handleOAuthCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          clearTimeout(globalTimeoutId);
          console.error('[OAUTH] getSession error:', sessionError.message);
          setStatusMessage(`Erreur session : ${sessionError.message}`);
          setTimeout(() => router.replace('/login'), 3000);
          return;
        }

        if (session && session.user) {
          await processOAuthFlow();
          return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (!isSubscribed) return;

          if (currentSession && currentSession.user) {
            await processOAuthFlow();
          } else if (event === 'SIGNED_OUT') {
            clearTimeout(globalTimeoutId);
            router.replace('/login');
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        clearTimeout(globalTimeoutId);
        console.error('[OAUTH] ERREUR HANDLER:', err);
        setStatusMessage(err instanceof Error ? err.message : 'Une erreur est survenue pendant la connexion.');
        setTimeout(() => router.replace('/login'), 3000);
      }
    };

    handleOAuthCallback();

    return () => {
      isSubscribed = false;
      clearTimeout(globalTimeoutId);
    };
  }, [router, syncOAuthUser, loginAsAdmin, initializeZeroAccount]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-sm bg-zinc-900 rounded-3xl border border-zinc-800 p-8 shadow-2xl text-center space-y-6 animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white font-bold mx-auto shadow-lg shadow-orange-600/30">
          <Receipt className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-extrabold text-white">Connexion MonneyFact</h2>
          <p className="text-xs text-zinc-400 font-medium">{statusMessage}</p>
        </div>

        <div className="flex items-center justify-center gap-2 text-orange-400 py-2">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>

        <p className="text-[10px] text-zinc-500 font-mono">
          Veuillez patienter pendant la finalisation de votre session sécurisée.
        </p>
      </div>
    </div>
  );
}
