import React from 'react';
import { BrandSplashLoader } from '@/components/ui/BrandSplashLoader';

export default function GlobalLoading() {
  return (
    <BrandSplashLoader
      message="Chargement de MoneyFact..."
      submessage="Plateforme de facturation SaaS certifiée 🇨🇮"
      fullScreen={true}
    />
  );
}
