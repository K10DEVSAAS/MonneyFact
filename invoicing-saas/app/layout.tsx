import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/authContext';
import { AppStoreProvider } from '@/lib/store/appStore';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://monney-fact.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'MonneyFact — Logiciel de Facturation SaaS en Côte d\'Ivoire 🇨🇮',
    template: '%s | MonneyFact',
  },
  description: 'Logiciel SaaS de facturation professionnelle certifié pour entrepreneurs et PME en Côte d\'Ivoire. Conforme TVA 18%, NCC/Compte Contribuable, FCFA et paiements Mobile Money (Wave, Orange, MTN, Moov).',
  keywords: [
    'facturation côte d\'ivoire',
    'logiciel facturation abidjan',
    'facture fcfa wave orange money',
    'saas facturation pme',
    'tva 18 côte d\'ivoire',
    'compte contribuable ncc',
    'monneyfact',
  ],
  authors: [{ name: 'MonneyFact Inc.', url: siteUrl }],
  creator: 'MonneyFact Team',
  publisher: 'MonneyFact Inc.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_CI',
    url: siteUrl,
    title: 'MonneyFact — Facturation Simple & Sécurisée en Côte d\'Ivoire',
    description: 'Créez vos factures professionnelles avec TVA 18% et recevez vos paiements par Wave, Mobile Money ou Carte.',
    siteName: 'MonneyFact',
    images: [
      {
        url: `${siteUrl}/icon.svg`,
        width: 512,
        height: 512,
        alt: 'MonneyFact SaaS Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MonneyFact — Facturation SaaS Côte d\'Ivoire',
    description: 'Facturation conforme TVA 18%, NCC et encaissement Mobile Money instantané.',
    images: [`${siteUrl}/icon.svg`],
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MonneyFact',
    operatingSystem: 'Web',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'XOF',
    },
    description: 'Logiciel de facturation SaaS professionnelle pour PME et entrepreneurs en Côte d\'Ivoire.',
  };

  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50">
        <AuthProvider>
          <AppStoreProvider>{children}</AppStoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
