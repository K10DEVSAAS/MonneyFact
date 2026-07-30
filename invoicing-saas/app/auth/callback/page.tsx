'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, Loader2, CheckCircle2 } from 'lucide-react';
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

    const handleOAuthCallback = async () => {
      try {
        // 1. Get current session from Supabase SDK (handles #access_token and ?code)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Erreur Callback OAuth:', error.message);
          router.push('/login');
          return;
        }

        if (session && session.user) {
          const user = session.user;
          const email = user.email || '';
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0] || 'Entreprise Google';

          setStatusMessage('Création et sécurisation de votre espace entreprise...');

          // Check if Super Admin
          if (email.toLowerCase() === 'admin@monneyfact.ci') {
            loginAsAdmin();
            return;
          }

          // Check if profile exists in database
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();

          const companyName = fullName.includes(' ')
            ? `${fullName.split(' ')[0]} Enterprise`
            : `${fullName} SARL`;

          if (!existingProfile) {
            // Create organization at 0 FCFA in store & database
            initializeZeroAccount(companyName, email);

            // Create Supabase DB entries
            const { data: newOrg } = await supabase
              .from('organizations')
              .insert({
                name: companyName,
                email,
                address: 'Abidjan, Côte d\'Ivoire',
                phone: '+225 07 00 00 00 00',
                currency: 'FCFA',
                default_tax_rate: 18,
              })
              .select('*')
              .single();

            if (newOrg) {
              await supabase.from('profiles').insert({
                id: user.id,
                email,
                full_name: fullName,
                role: 'client',
                organization_id: newOrg.id,
                plan: 'Pro',
              });
            }
          }

          // Complete login and navigate to dashboard
          loginAsClient(email);
          return;
        }

        // If no session found yet, listen to AuthStateChange
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (!isSubscribed) return;

          if (currentSession && currentSession.user) {
            const user = currentSession.user;
            const email = user.email || '';
            if (email.toLowerCase() === 'admin@monneyfact.ci') {
              loginAsAdmin();
            } else {
              loginAsClient(email);
            }
          } else if (event === 'SIGNED_OUT') {
            router.push('/login');
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Erreur Callback OAuth:', err);
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
