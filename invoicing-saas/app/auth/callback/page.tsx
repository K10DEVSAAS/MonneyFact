'use client';

import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    let isSubscribed = true;

    const processUserBinding = async (session: any) => {
      if (!session || !session.user) return false;

      const user = session.user;
      const email = (user.email || '').toLowerCase().trim();

      if (!email) {
        console.error('[OAuth Callback Error]: Email manquant dans la session utilisateur.');
        router.push('/login');
        return false;
      }

      setStatusMessage('Création et sécurisation de votre espace entreprise...');

      // SUPER ADMIN EXCEPTION
      if (email === 'admin@monneyfact.ci') {
        loginAsAdmin();
        return true;
      }

      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0] || 'Entreprise';

      // ÉTAPE 2 : Recherche principale du profil par user.id (identifiant Auth)
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('[OAuth Callback Error] Erreur récupération profil:', profileError.message);
        router.push('/login');
        return false;
      }

      // ÉTAPE 3 : Recherche principale de l'organisation par email normalisé
      const { data: existingOrg, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (orgError) {
        console.error('[OAuth Callback Error] Erreur récupération organisation:', orgError.message);
        router.push('/login');
        return false;
      }

      let resolvedOrgId: string | null = null;
      let resolvedOrgName: string | null = null;

      // CAS 1 : Utilisateur authentifié + profil inexistant + organisation inexistante
      if (!existingProfile && !existingOrg) {
        const companyName = fullName.includes(' ')
          ? `${fullName.split(' ')[0]} Enterprise`
          : `${fullName} SARL`;

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
          console.error('[OAuth Callback Error] Échec création organisation (CAS 1):', createOrgErr?.message);
          router.push('/login');
          return false;
        }

        resolvedOrgId = newOrg.id;
        resolvedOrgName = newOrg.name;

        const { error: createProfErr } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email,
            full_name: fullName,
            role: 'client',
            organization_id: newOrg.id,
            plan: 'Pro',
          });

        if (createProfErr) {
          console.error('[OAuth Callback Error] Échec création profil (CAS 1):', createProfErr.message);
          router.push('/login');
          return false;
        }
      }
      // CAS 2 : Utilisateur authentifié + profil inexistant + organisation existante
      else if (!existingProfile && existingOrg) {
        resolvedOrgId = existingOrg.id;
        resolvedOrgName = existingOrg.name;

        const { error: createProfErr } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email,
            full_name: fullName,
            role: 'client',
            organization_id: existingOrg.id,
            plan: existingOrg.plan || 'Pro',
          });

        if (createProfErr) {
          console.error('[OAuth Callback Error] Échec création profil (CAS 2):', createProfErr.message);
          router.push('/login');
          return false;
        }
      }
      // CAS 3 : Utilisateur authentifié + profil existant + organization_id = NULL
      else if (existingProfile && !existingProfile.organization_id) {
        if (existingOrg) {
          resolvedOrgId = existingOrg.id;
          resolvedOrgName = existingOrg.name;
        } else {
          const companyName = fullName.includes(' ')
            ? `${fullName.split(' ')[0]} Enterprise`
            : `${fullName} SARL`;

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
            console.error('[OAuth Callback Error] Échec création organisation (CAS 3):', createOrgErr?.message);
            router.push('/login');
            return false;
          }

          resolvedOrgId = newOrg.id;
          resolvedOrgName = newOrg.name;
        }

        const { error: updateProfErr } = await supabase
          .from('profiles')
          .update({ organization_id: resolvedOrgId })
          .eq('id', user.id);

        if (updateProfErr) {
          console.error('[OAuth Callback Error] Échec rattachement profil (CAS 3):', updateProfErr.message);
          router.push('/login');
          return false;
        }
      }
      // CAS 4 : Utilisateur authentifié + profil existant + organization_id déjà renseigné
      else if (existingProfile && existingProfile.organization_id) {
        resolvedOrgId = existingProfile.organization_id;
        resolvedOrgName = existingOrg?.name || `${fullName} Enterprise`;
      }

      // VÉRIFICATION DE COHÉRENCE FINALE AVANT REDIRECTION VERS DASHBOARD
      const { data: finalProfile, error: finalProfileError } = await supabase
        .from('profiles')
        .select('id, email, role, organization_id, plan')
        .eq('id', user.id)
        .maybeSingle();

      if (finalProfileError || !finalProfile) {
        console.error('[OAuth Callback Error] Échec de la vérification du profil final:', finalProfileError?.message);
        setStatusMessage('Erreur de validation de la session utilisateur.');
        router.push('/login');
        return false;
      }

      if (finalProfile.role !== 'super_admin' && !finalProfile.organization_id) {
        console.error('[OAuth Callback Error] Le profil utilisateur est sans organization_id.');
        setStatusMessage("Votre compte n'est associé à aucune organisation.");
        router.push('/login');
        return false;
      }

      if (resolvedOrgName) {
        initializeZeroAccount(resolvedOrgName, email);
      }

      loginAsClient(email);
      return true;
    };

    const handleOAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[OAuth Callback Error]:', error.message);
          router.push('/login');
          return;
        }

        if (session && session.user) {
          await processUserBinding(session);
          return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (!isSubscribed) return;

          if (currentSession && currentSession.user) {
            await processUserBinding(currentSession);
          } else if (event === 'SIGNED_OUT') {
            router.push('/login');
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('[OAuth Callback Error]:', err);
        router.push('/login');
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
