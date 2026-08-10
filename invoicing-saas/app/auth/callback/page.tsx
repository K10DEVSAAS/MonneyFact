'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/authContext';
import { useAppStore } from '@/lib/store/appStore';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { loginAsClient, loginAsAdmin } = useAuth();
  const { initializeZeroAccount } = useAppStore();
  const [statusMessage, setStatusMessage] = useState('Validation de votre authentification Google...');
  const processingRef = useRef(false);

  useEffect(() => {
    let isSubscribed = true;

    const processUserBinding = async (session: any) => {
      // CORRECTION 12 — PROTECTION CONTRE DOUBLE EXÉCUTION
      if (processingRef.current) return false;
      processingRef.current = true;

      try {
        // CORRECTION 1 — getSession()
        console.log('[OAUTH] getSession terminé', {
          hasSession: !!session,
          userId: session?.user?.id,
        });

        if (!session?.user) {
          console.error('[OAUTH] Aucune session utilisateur');
          setStatusMessage('Aucune session Google valide.');
          setTimeout(() => router.replace('/login'), 3000);
          return false;
        }

        // CORRECTION 2 — Utilisateur
        const user = session.user;
        const userId = user.id;
        const email = user.email?.trim().toLowerCase() || '';

        console.log('[OAUTH] USER:', {
          userId,
          email,
        });

        if (!email) {
          console.error('[OAUTH] Email utilisateur manquant');
          setStatusMessage('Impossible de récupérer votre adresse email Google.');
          setTimeout(() => router.replace('/login'), 3000);
          return false;
        }

        setStatusMessage('Création et sécurisation de votre espace entreprise...');

        // SUPER ADMIN EXCEPTION
        if (email === 'admin@monneyfact.ci') {
          console.log('[OAUTH] SUPER ADMIN DÉTECTÉ');
          loginAsAdmin();
          return true;
        }

        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0] || 'Entreprise';

        // CORRECTION 3 — Profil
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        console.log('[OAUTH] PROFILE:', {
          found: !!existingProfile,
          error: profileError?.message,
          organizationId: existingProfile?.organization_id,
        });

        if (profileError) {
          console.error('[OAUTH] ERREUR PROFILE:', profileError);
          setStatusMessage(`Erreur profil : ${profileError.message}`);
          return false;
        }

        // CORRECTION 4 — Organisation
        const { data: existingOrg, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        console.log('[OAUTH] ORGANIZATION:', {
          found: !!existingOrg,
          error: orgError?.message,
          organizationId: existingOrg?.id,
          organizationEmail: existingOrg?.email,
        });

        if (orgError) {
          console.error('[OAUTH] ERREUR ORGANIZATION:', orgError);
          setStatusMessage(`Erreur organisation : ${orgError.message}`);
          return false;
        }

        let resolvedOrgName: string | null = existingOrg?.name || null;

        // CORRECTION 5 — CAS PROFIL EXISTANT AVEC ORGANIZATION_ID
        if (existingProfile && existingProfile.organization_id) {
          console.log('[OAUTH] CAS 4 — Profil existant déjà rattaché à organization_id:', existingProfile.organization_id);
          resolvedOrgName = existingOrg?.name || `${fullName} Enterprise`;
        }
        // CORRECTION 5 (SUITE) — CAS PROFIL EXISTANT SANS ORGANIZATION_ID
        else if (existingProfile && !existingProfile.organization_id) {
          console.log('[OAUTH] CAS 3 — Profil existant avec organization_id NULL');
          if (existingOrg) {
            const { data: updatedProfile, error: updateProfileError } = await supabase
              .from('profiles')
              .update({
                organization_id: existingOrg.id,
              })
              .eq('id', userId)
              .select('*')
              .single();

            console.log('[OAUTH] PROFILE RATTACHÉ:', {
              organizationId: updatedProfile?.organization_id,
              error: updateProfileError?.message,
            });

            if (updateProfileError) {
              console.error('[OAUTH] ERREUR RATTACHEMENT:', updateProfileError);
              setStatusMessage(`Erreur rattachement : ${updateProfileError.message}`);
              return false;
            }
            resolvedOrgName = existingOrg.name;
          } else {
            // Créer l'organisation si aucune n'existe avec cet email
            const companyName = fullName.includes(' ')
              ? `${fullName.split(' ')[0]} Enterprise`
              : `${fullName} SARL`;

            const { data: newOrg, error: createOrgError } = await supabase
              .from('organizations')
              .insert({
                name: companyName,
                email,
                address: "Abidjan, Côte d'Ivoire",
                phone: '+225 07 00 00 00 00',
                currency: 'FCFA',
                default_tax_rate: 18,
                plan: 'Pro',
                status: 'active',
                activated_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              })
              .select('*')
              .single();

            if (createOrgError) {
              console.error('[OAUTH] ERREUR CRÉATION ORGANISATION:', createOrgError);
              setStatusMessage(`Erreur création organisation : ${createOrgError.message}`);
              return false;
            }

            const { data: updatedProfile, error: updateProfileError } = await supabase
              .from('profiles')
              .update({
                organization_id: newOrg.id,
              })
              .eq('id', userId)
              .select('*')
              .single();

            if (updateProfileError) {
              console.error('[OAUTH] ERREUR RATTACHEMENT:', updateProfileError);
              setStatusMessage(`Erreur rattachement : ${updateProfileError.message}`);
              return false;
            }
            resolvedOrgName = newOrg.name;
          }
        }
        // CORRECTION 6 — PROFIL INEXISTANT + ORGANISATION EXISTANTE
        else if (!existingProfile && existingOrg) {
          console.log('[OAUTH] CAS 2 — Profil inexistant + Organisation existante par email');
          const { data: createdProfile, error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email,
              full_name: fullName,
              role: 'client',
              organization_id: existingOrg.id,
              plan: existingOrg.plan ?? 'Pro',
            })
            .select('*')
            .single();

          if (createProfileError) {
            console.error('[OAUTH] ERREUR CRÉATION PROFIL:', createProfileError);
            setStatusMessage(`Erreur création profil : ${createProfileError.message}`);
            return false;
          }
          resolvedOrgName = existingOrg.name;
        }
        // CORRECTION 7 & 8 — PROFIL INEXISTANT + ORGANISATION INEXISTANTE
        else if (!existingProfile && !existingOrg) {
          console.log('[OAUTH] CAS 1 — Profil inexistant + Organisation inexistante');
          const companyName = fullName.includes(' ')
            ? `${fullName.split(' ')[0]} Enterprise`
            : `${fullName} SARL`;

          const { data: newOrg, error: createOrgError } = await supabase
            .from('organizations')
            .insert({
              name: companyName,
              email,
              address: "Abidjan, Côte d'Ivoire",
              phone: '+225 07 00 00 00 00',
              currency: 'FCFA',
              default_tax_rate: 18,
              plan: 'Pro',
              status: 'active',
              activated_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .select('*')
            .single();

          if (createOrgError) {
            console.error('[OAUTH] ERREUR CRÉATION ORGANISATION:', createOrgError);
            setStatusMessage(`Erreur création organisation : ${createOrgError.message}`);
            return false;
          }

          const { data: createdProfile, error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email,
              full_name: fullName,
              role: 'client',
              organization_id: newOrg.id,
              plan: 'Pro',
            })
            .select('*')
            .single();

          if (createProfileError) {
            console.error('[OAUTH] ERREUR CRÉATION PROFIL:', createProfileError);
            setStatusMessage(`Erreur création profil : ${createProfileError.message}`);
            return false;
          }
          resolvedOrgName = newOrg.name;
        }

        // CORRECTION 9 — FINAL PROFILE
        const { data: finalProfile, error: finalProfileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, organization_id, plan')
          .eq('id', userId)
          .single();

        console.log('[OAUTH] FINAL PROFILE:', {
          profile: finalProfile,
          error: finalProfileError?.message,
        });

        if (finalProfileError) {
          console.error('[OAUTH] ERREUR FINAL PROFILE:', finalProfileError);
          setStatusMessage(`Erreur validation profil : ${finalProfileError.message}`);
          return false;
        }

        if (finalProfile.role !== 'super_admin' && !finalProfile.organization_id) {
          console.error('[OAUTH] PROFIL ORPHELIN');
          setStatusMessage('Votre compte n’est associé à aucune entreprise.');
          return false;
        }

        if (resolvedOrgName) {
          initializeZeroAccount(resolvedOrgName, email);
        }

        // CORRECTION 10 & 13 — LOGIN AS CLIENT ET REDIRECTION DASHBOARD
        console.log('[OAUTH] AVANT loginAsClient');
        await loginAsClient(email, undefined, true);
        console.log('[OAUTH] loginAsClient TERMINÉ');

        router.replace('/dashboard');
        return true;
      } catch (err) {
        // CORRECTION 14 — FIN D'ERREUR SANS SPINNER INFINI
        console.error('[OAUTH] ERREUR FATALE:', err);
        setStatusMessage(
          err instanceof Error
            ? err.message
            : 'Une erreur est survenue pendant la connexion.'
        );
        return false;
      }
    };

    const handleOAuthCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[OAUTH] getSession error:', sessionError.message);
          setStatusMessage(`Erreur session : ${sessionError.message}`);
          setTimeout(() => router.replace('/login'), 3000);
          return;
        }

        if (session && session.user) {
          await processUserBinding(session);
          return;
        }

        // CORRECTION 11 — ONAUTHSTATECHANGE UNIQUEMENT SI PAS DE SESSION INITIALE
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (!isSubscribed) return;

          if (currentSession && currentSession.user) {
            await processUserBinding(currentSession);
          } else if (event === 'SIGNED_OUT') {
            router.replace('/login');
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('[OAUTH] ERREUR FATALE HANDLER:', err);
        setStatusMessage(
          err instanceof Error
            ? err.message
            : 'Une erreur est survenue pendant la connexion.'
        );
      }
    };

    handleOAuthCallback();

    return () => {
      isSubscribed = false;
    };
  }, [router, loginAsClient, loginAsAdmin, initializeZeroAccount]);

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
