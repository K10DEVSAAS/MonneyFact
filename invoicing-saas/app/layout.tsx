import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/authContext';
import { AppStoreProvider } from '@/lib/store/appStore';

export const metadata: Metadata = {
  title: 'MonneyFact — Facturation simple pour entrepreneurs en Côte d\'Ivoire',
  description: 'Application SaaS de facturation professionnelle avec TVA 18%, Compte Contribuable (NCC), gestion multi-devises FCFA et abonnements.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50">
        <AuthProvider>
          <AppStoreProvider>{children}</AppStoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
